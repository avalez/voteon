use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::{Offer, ANCHOR_DISCRIMINATOR, OFFER_EXPIRATION_SLOTS};

use super::transfer_tokens;

#[derive(Accounts)]
#[instruction(id: u64, maker_amount: u64)]
pub struct MakeOffer<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    #[account(mint::token_program = token_program)]
    pub token_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = maker,
        associated_token::token_program = token_program
    )]
    pub maker_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = maker,
        space = ANCHOR_DISCRIMINATOR + Offer::INIT_SPACE,
        seeds = [b"offer", maker.key().as_ref(), id.to_le_bytes().as_ref()],
        bump
    )]
    pub offer: Account<'info, Offer>,

    #[account(
        init,
        payer = maker,
        associated_token::mint = token_mint,
        associated_token::authority = offer,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn make_offer_instruction(
    context: Context<MakeOffer>,
    id: u64,
    maker_amount: u64,
) -> Result<()> {
    // Lock maker's tokens
    transfer_tokens(
        &context.accounts.maker_token_account,
        &context.accounts.vault,
        &maker_amount,
        &context.accounts.token_mint,
        &context.accounts.maker,
        &context.accounts.token_program,
    )?;

    // Initialize offer state
    let clock = Clock::get()?;
    context.accounts.offer.set_inner(Offer {
        id,
        maker: context.accounts.maker.key(),
        taker: None,
        token_mint: context.accounts.token_mint.key(),
        maker_amount,
        taker_amount: 0,
        maker_locked: true,
        taker_locked: false,
        expiration: clock.slot + OFFER_EXPIRATION_SLOTS,
        bump: context.bumps.offer,
    });
    Ok(())
}
