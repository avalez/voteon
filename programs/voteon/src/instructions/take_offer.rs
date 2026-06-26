use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::Offer;

use super::transfer_tokens;

#[derive(Accounts)]
pub struct TakeOffer<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,

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
        has_one = token_mint,
        seeds = [b"offer", offer.maker.as_ref(), offer.id.to_le_bytes().as_ref()],
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

pub fn take_offer_instruction(
    context: Context<TakeOffer>,
    taker_amount: u64,
) -> Result<()> {
    // Verify offer not expired
    let clock = Clock::get()?;
    require!(
        clock.slot < context.accounts.offer.expiration,
        crate::error::ErrorCode::OfferNotExpired
    );

    // Verify taker hasn't already locked
    require!(
        !context.accounts.offer.taker_locked,
        crate::error::ErrorCode::TakerNotLocked
    );

    // Lock taker's tokens in vault
    transfer_tokens(
        &context.accounts.taker_token_account,
        &context.accounts.vault,
        &taker_amount,
        &context.accounts.token_mint,
        &context.accounts.taker,
        &context.accounts.token_program,
    )?;

    // Update offer state
    let offer = &mut context.accounts.offer;
    offer.taker = Some(context.accounts.taker.key());
    offer.taker_amount = taker_amount;
    offer.taker_locked = true;

    Ok(())
}
