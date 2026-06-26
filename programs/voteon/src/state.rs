use anchor_lang::prelude::*;

#[derive(InitSpace)]
#[account]
pub struct Offer {
    pub id: u64,
    pub maker: Pubkey,
    pub taker: Option<Pubkey>,
    pub token_mint: Pubkey,
    pub maker_amount: u64,
    pub taker_amount: u64,
    pub maker_locked: bool,
    pub taker_locked: bool,
    pub expiration: i64,
    pub bump: u8,
}

pub const OFFER_EXPIRATION_SLOTS: i64 = 100; // ~40 seconds on mainnet
