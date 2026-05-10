import { Buffer as BufferPolyfill } from 'buffer';
window.Buffer = window.Buffer || BufferPolyfill;
import React, { useEffect, useState, Suspense } from 'react';
import { invoke } from '@forge/bridge';
import { Connection, PublicKey, clusterApiUrl, SendTransactionError, Keypair } from '@solana/web3.js';
import { BASIC_PROGRAM_ID as programId, getBasicProgram } from './voteon-exports.ts';
import { SolanaProvider, WalletButton, useAnchorProvider } from './solana-provider.tsx';
import { useWallet } from '@solana/wallet-adapter-react';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import { Buffer } from 'buffer';

function MainApp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState("");
  const [initialized, setIsInitialized] = useState("");
  const [txSig, setTxSig] = useState("");

  const anchorProvider = useAnchorProvider();
  const { wallet, publicKey, connected } = useWallet();

  useEffect(() => {
    if (connected && publicKey) {
      const getBalance = async () => invoke('getBalance', { publicKey: publicKey.toBase58() });
      getBalance().then(setBalance).catch(setError);
    }
  }, [connected, publicKey]);

  const callInitialize = async () => {
    setLoading(true);
    setError("");
    setTxSig("");
    try {
      if (!anchorProvider || !publicKey) throw new Error('Wallet not connected');

      // Get the program using the helper function from voteon-exports
      const program = getBasicProgram(anchorProvider);

      const tx = await program.methods.initialize().rpc();
      setTxSig(tx);
      // Show success message
      setError("");
    } catch (e) {
      // Handle SendTransactionError specifically
      if (e instanceof SendTransactionError) {
        const logs = e.getLogs();
        console.error('Transaction failed with logs:', logs);

        // Check if it's a timeout error
        if (e.message.includes('not confirmed in') || e.message.includes('timeout')) {
          setError(`Transaction timeout: ${e.message}. Check the transaction signature above to verify if it succeeded.`);
          // Don't mark as initialized for timeout - let user check manually
        } else if (e.message.includes('already been processed')) {
          setIsInitialized(true);
          setError("Program has already been initialized. You can reset to try again.");
        } else {
          setError(`Transaction failed: ${e.message}. Logs: ${JSON.stringify(logs)}`);
        }
      } else {
        setError(e.message || JSON.stringify(e));
      }
    }
    setLoading(false);
  };

  const callMakeOffer = async () => {
    setLoading(true);
    setError("");
    setTxSig("");
    try {
      if (!anchorProvider || !publicKey) throw new Error('Wallet not connected');

      const program = getBasicProgram(anchorProvider);

      // spl-token create-token
      const tokenMintA = new PublicKey('AEuDBqvAUTAayxuBU6j749SGvPLHw4Vwd59YVShS1RKB');

      const offerId = new BN(1);
      const tokenAOfferedAmount = new BN(100);

      const [offer] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("offer"),
          publicKey.toBuffer(),
          offerId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const vault = getAssociatedTokenAddressSync(
        tokenMintA,
        offer,
        true,
        TOKEN_PROGRAM_ID
      );

      const makerTokenAccountA = getAssociatedTokenAddressSync(
        tokenMintA,
        publicKey,
        false,
        TOKEN_PROGRAM_ID
      );

      const tx = await program.methods
        .makeOffer(offerId, tokenAOfferedAmount)
        .accounts({
          maker: publicKey,
          tokenMintA,
          makerTokenAccountA,
          offer,
          vault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      setTxSig(tx);
    } catch (e) {
      console.error(e);
      setError(e.message || JSON.stringify(e));
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <Suspense fallback={<div>Loading wallet...</div>}>
        <WalletButton />
      </Suspense>
      <h1>Solana Wallet Balance Checker</h1>
      <div className="wallet-section">
        {!wallet ? (
          <p>Please select a wallet to connect.</p>
        ) : connected && publicKey ? (
          <div>
            <p>Connected Wallet: {wallet.adapter.name}</p>
            <p>Address: {publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-4)}</p>
            {loading ? (
              <p>Loading balance...</p>
            ) : balance ? (
              <h2>Balance: {balance}</h2>
            ) : null}
            <button onClick={callInitialize} disabled={loading || !publicKey} style={{ marginTop: 16 }}>
              Call Anchor Initialize
            </button>
            <button onClick={callMakeOffer} disabled={loading || !publicKey} style={{ marginTop: 16, marginLeft: 8 }}>
              Call Make Offer
            </button>
            {initialized && <div>Initialized</div>}
            {txSig && <div>Tx Signature: <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noopener noreferrer">{txSig}</a></div>}
          </div>
        ) : (
          <p>Wallet not connected. Please connect using the button above.</p>
        )}
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}

function App() {
  return (
    <SolanaProvider>
      <MainApp />
    </SolanaProvider>
  );
}

export default App;