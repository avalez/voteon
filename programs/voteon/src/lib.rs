pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("H69FiJvdHxCCmeoN1WaXEygsvoxt3GTxZx9AqrkHJf28");

#[program]
pub mod programs_voteon {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

    /// Step 1: Maker locks tokens and creates offer
    pub fn make_offer(
        context: Context<MakeOffer>,
        id: u64,
        maker_amount: u64,
    ) -> Result<()> {
        instructions::make_offer::make_offer_instruction(context, id, maker_amount)
    }

    /// Step 2: Taker locks tokens to match the offer
    pub fn take_offer(context: Context<TakeOffer>, taker_amount: u64) -> Result<()> {
        instructions::take_offer::take_offer_instruction(context, taker_amount)
    }

    /// Step 3: Either party settles - swaps tokens atomically
    /// Only executable when both parties have locked tokens
    pub fn settle_offer(context: Context<SettleOffer>) -> Result<()> {
        instructions::settle_offer::settle_offer_instruction(context)
    }

    /// Safety: Refund all tokens if offer expires without settlement
    /// Callable by either party after expiration
    pub fn refund_offer(context: Context<RefundOffer>) -> Result<()> {
        instructions::refund_offer::refund_offer_instruction(context)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
