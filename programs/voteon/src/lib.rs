use anchor_lang::prelude::*;

declare_id!("Be9tvYB3yTXbvqucYuGQQep2Cu4nE1ZXY9BsAvwguzu3");

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
