use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
    TransferChecked,
};

use crate::Offer;

#[derive(Accounts)]
pub struct ClaimOffer<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

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

pub fn release_locked_tokens(context: Context<ClaimOffer>) -> Result<()> {
    let seeds = &[
        b"offer",
        context.accounts.maker.key.as_ref(),
        &context.accounts.offer.id.to_le_bytes()[..],
        &[context.accounts.offer.bump],
    ];
    let signer_seeds = [&seeds[..]];

    let vault_amount = context.accounts.vault.amount;
    require!(vault_amount > 0, crate::error::ErrorCode::EmptyVault);

    let transfer_accounts = TransferChecked {
        from: context.accounts.vault.to_account_info(),
        to: context.accounts.maker_token_account.to_account_info(),
        mint: context.accounts.token_mint.to_account_info(),
        authority: context.accounts.offer.to_account_info(),
    };

    transfer_checked(
        CpiContext::new_with_signer(
            context.accounts.token_program.to_account_info(),
            transfer_accounts,
            &signer_seeds,
        ),
        vault_amount,
        context.accounts.token_mint.decimals,
    )?;

    close_account(CpiContext::new_with_signer(
        context.accounts.token_program.to_account_info(),
        CloseAccount {
            account: context.accounts.vault.to_account_info(),
            destination: context.accounts.maker.to_account_info(),
            authority: context.accounts.offer.to_account_info(),
        },
        &signer_seeds,
    ))
}
