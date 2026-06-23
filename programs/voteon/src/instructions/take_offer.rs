use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::Offer;

use super::transfer_tokens;

#[derive(Accounts)]
pub struct TakeOffer<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,

    pub maker: SystemAccount<'info>,

    pub token_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = taker,
        associated_token::token_program = token_program,
    )]
    pub taker_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        has_one = maker,
        has_one = token_mint,
        seeds = [b"offer", maker.key().as_ref(), offer.id.to_le_bytes().as_ref()],
        bump = offer.bump
    )]
    pub offer: Account<'info, Offer>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = offer,
        associated_token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn lock_tokens_in_vault(context: Context<TakeOffer>, amount: u64) -> Result<()> {
    transfer_tokens(
        &context.accounts.taker_token_account,
        &context.accounts.vault,
        &amount,
        &context.accounts.token_mint,
        &context.accounts.taker,
        &context.accounts.token_program,
    )
}
