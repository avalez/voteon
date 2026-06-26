use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

use crate::Offer;

#[derive(Accounts)]
pub struct SettleOffer<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    pub taker: SystemAccount<'info>,

    pub token_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = maker,
        associated_token::token_program = token_program,
    )]
    pub maker_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = taker,
        associated_token::token_program = token_program,
    )]
    pub taker_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        close = maker,
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

pub fn settle_offer_instruction(context: Context<SettleOffer>) -> Result<()> {
    let offer = &context.accounts.offer;

    // Verify both parties locked tokens
    require!(
        offer.maker_locked && offer.taker_locked,
        crate::error::ErrorCode::TakerNotLocked
    );

    // Verify taker matches
    require!(
        offer.taker == Some(context.accounts.taker.key()),
        crate::error::ErrorCode::Unauthorized
    );

    let seeds = &[
        b"offer",
        context.accounts.maker.key.as_ref(),
        &offer.id.to_le_bytes()[..],
        &[offer.bump],
    ];
    let signer_seeds = [&seeds[..]];

    // Transfer maker's locked tokens to taker
    let transfer_to_taker = TransferChecked {
        from: context.accounts.vault.to_account_info(),
        to: context.accounts.taker_token_account.to_account_info(),
        mint: context.accounts.token_mint.to_account_info(),
        authority: context.accounts.offer.to_account_info(),
    };

    transfer_checked(
        CpiContext::new_with_signer(
            context.accounts.token_program.to_account_info(),
            transfer_to_taker,
            &signer_seeds,
        ),
        offer.maker_amount,
        context.accounts.token_mint.decimals,
    )?;

    // Transfer taker's locked tokens to maker
    let transfer_to_maker = TransferChecked {
        from: context.accounts.vault.to_account_info(),
        to: context.accounts.maker_token_account.to_account_info(),
        mint: context.accounts.token_mint.to_account_info(),
        authority: context.accounts.offer.to_account_info(),
    };

    transfer_checked(
        CpiContext::new_with_signer(
            context.accounts.token_program.to_account_info(),
            transfer_to_maker,
            &signer_seeds,
        ),
        offer.taker_amount,
        context.accounts.token_mint.decimals,
    )?;

    Ok(())
}
