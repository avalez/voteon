use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
    TransferChecked,
};

use crate::Offer;

#[derive(Accounts)]
pub struct RefundOffer<'info> {
    pub maker: SystemAccount<'info>,

    pub taker: Option<Signer<'info>>,

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
        associated_token::authority = taker.as_ref().map(|t| t.key()).unwrap_or(Pubkey::default()),
        associated_token::token_program = token_program,
    )]
    pub taker_token_account: Option<InterfaceAccount<'info, TokenAccount>>,

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

pub fn refund_offer_instruction(context: Context<RefundOffer>) -> Result<()> {
    let offer = &context.accounts.offer;

    // Verify offer has expired
    let clock = Clock::get()?;
    require!(
        clock.slot >= offer.expiration,
        crate::error::ErrorCode::OfferNotExpired
    );

    let seeds = &[
        b"offer",
        context.accounts.maker.key.as_ref(),
        &offer.id.to_le_bytes()[..],
        &[offer.bump],
    ];
    let signer_seeds = [&seeds[..]];

    // Refund maker's tokens if locked
    if offer.maker_locked {
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
            offer.maker_amount,
            context.accounts.token_mint.decimals,
        )?;
    }

    // Refund taker's tokens if locked
    if offer.taker_locked {
        if let Some(taker_token_account) = &context.accounts.taker_token_account {
            let transfer_accounts = TransferChecked {
                from: context.accounts.vault.to_account_info(),
                to: taker_token_account.to_account_info(),
                mint: context.accounts.token_mint.to_account_info(),
                authority: context.accounts.offer.to_account_info(),
            };

            transfer_checked(
                CpiContext::new_with_signer(
                    context.accounts.token_program.to_account_info(),
                    transfer_accounts,
                    &signer_seeds,
                ),
                offer.taker_amount,
                context.accounts.token_mint.decimals,
            )?;
        }
    }

    // Close vault
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
