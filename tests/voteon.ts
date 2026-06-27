import { randomBytes } from "node:crypto";
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";
import type { ProgramsVoteon } from "../target/types/programs_voteon";

import {
  confirmTransaction,
} from "@solana-developers/helpers";

describe("voteon", async () => {
  // Use the cluster and the keypair from Anchor.toml
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // See https://github.com/coral-xyz/anchor/issues/3122
  const user = (provider.wallet as anchor.Wallet).payer;
  const payer = user;

  const connection = provider.connection;

  const program = anchor.workspace.ProgramsVoteon as Program<ProgramsVoteon>;

  it("Is initialized!", async () => {
    const balanceBefore = await connection.getBalance(payer.publicKey);
    console.log(`Balance before: ${balanceBefore}`);
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    await confirmTransaction(connection, tx);

    console.log("Your transaction signature", tx);
    const balanceAfter = await connection.getBalance(payer.publicKey);
    console.log(`Balance after: ${balanceAfter}`);
    assert.ok(balanceAfter < balanceBefore);
  });

  it("Can make and take an offer", async () => {
    // Generate a random offer ID
    const offerId = new BN(randomBytes(8));

    // Generate a taker keypair
    const taker = Keypair.generate();

    // Airdrop some SOL to the taker to cover transaction fees and rent
    const transferTx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: taker.publicKey,
        lamports: 100_000_000, // 0.1 SOL
      })
    );
    await anchor.web3.sendAndConfirmTransaction(connection, transferTx, [payer]);

    // Create a new Token Mint
    const mint = await Token.createMint(
      connection,
      payer,
      payer.publicKey,
      null,
      6,
      TOKEN_PROGRAM_ID
    );

    // Create Associated Token Accounts for maker (payer) and taker
    const makerTokenAccountA = await mint.createAssociatedTokenAccount(payer.publicKey);
    const takerTokenAccountA = await mint.createAssociatedTokenAccount(taker.publicKey);

    // Mint some tokens to maker and taker
    await mint.mintTo(makerTokenAccountA, payer, [], 100_000_000); // 100 tokens
    await mint.mintTo(takerTokenAccountA, payer, [], 100_000_000); // 100 tokens

    // Verify initial balances
    let makerAccountInfo = await mint.getAccountInfo(makerTokenAccountA);
    let takerAccountInfo = await mint.getAccountInfo(takerTokenAccountA);
    assert.equal(makerAccountInfo.amount.toNumber(), 100_000_000);
    assert.equal(takerAccountInfo.amount.toNumber(), 100_000_000);

    // Derive the Offer PDA
    const [offerAddress] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("offer"),
        payer.publicKey.toBuffer(),
        offerId.toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );

    // Derive the Vault ATA owned by the Offer PDA
    const vaultAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint.publicKey,
      offerAddress,
      true
    );

    const tokenOfferedAmount = new BN(10_000_000); // 10 tokens

    // Call make_offer
    console.log("Calling makeOffer...");
    const makeOfferTx = await program.methods
      .makeOffer(offerId, tokenOfferedAmount)
      .accounts({
        maker: payer.publicKey,
        tokenMint: mint.publicKey,
        makerTokenAccountA: makerTokenAccountA,
        offer: offerAddress,
        vault: vaultAddress,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      } as any)
      .signers([payer])
      .rpc();
    await confirmTransaction(connection, makeOfferTx);
    console.log(`makeOffer transaction signature: ${makeOfferTx}`);

    // Verify offer state is saved correctly
    const offerAccount = await program.account.offer.fetch(offerAddress);
    assert.equal(offerAccount.id.toString(), offerId.toString());
    assert.equal(offerAccount.maker.toBase58(), payer.publicKey.toBase58());
    assert.equal(offerAccount.tokenMint.toBase58(), mint.publicKey.toBase58());
    assert.equal(offerAccount.tokenOfferedAmount.toString(), tokenOfferedAmount.toString());

    // Verify maker balance has decreased by tokenOfferedAmount
    makerAccountInfo = await mint.getAccountInfo(makerTokenAccountA);
    assert.equal(makerAccountInfo.amount.toNumber(), 90_000_000);

    // Verify vault balance has the tokenOfferedAmount
    const vaultAccountInfo = await mint.getAccountInfo(vaultAddress);
    assert.equal(vaultAccountInfo.amount.toNumber(), 10_000_000);

    // Call take_offer
    console.log("Calling takeOffer...");
    const takeOfferTx = await program.methods
      .takeOffer()
      .accounts({
        taker: taker.publicKey,
        maker: payer.publicKey,
        tokenMint: mint.publicKey,
        takerTokenAccount: takerTokenAccountA,
        makerTokenAccount: makerTokenAccountA,
        offer: offerAddress,
        vault: vaultAddress,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      } as any)
      .signers([taker])
      .rpc();
    await confirmTransaction(connection, takeOfferTx);
    console.log(`takeOffer transaction signature: ${takeOfferTx}`);

    // Verify the offer account was closed
    const offerAccountInfo = await connection.getAccountInfo(offerAddress);
    assert.isNull(offerAccountInfo);

    // Verify the vault token account was closed
    const vaultAccountInfoAfter = await connection.getAccountInfo(vaultAddress);
    assert.isNull(vaultAccountInfoAfter);

    // Verify final balances: both should end up back with 100 tokens
    makerAccountInfo = await mint.getAccountInfo(makerTokenAccountA);
    takerAccountInfo = await mint.getAccountInfo(takerTokenAccountA);
    assert.equal(makerAccountInfo.amount.toNumber(), 100_000_000);
    assert.equal(takerAccountInfo.amount.toNumber(), 100_000_000);
    console.log("Offer made and taken successfully!");
  });
});
