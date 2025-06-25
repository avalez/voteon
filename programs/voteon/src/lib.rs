use anchor_lang::prelude::*;

declare_id!("DTdGg36gheqPqJ8LFNzgsq3chmbejRHa2FNpAfCWMS6t");

#[program]
pub mod programs_voteon {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
