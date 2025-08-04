use anchor_lang::prelude::*;

declare_id!("4H8y2YaMGgdyQNZTkV8Z841UrZ2Yse99JWJeYFeAKFX4");

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
