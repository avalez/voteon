use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Offer {
    pub id: u64,
    pub maker: Pubkey,
    pub token_mint: Pubkey,
    pub token_offered_amount: u64,
    pub bump: u8,
}
