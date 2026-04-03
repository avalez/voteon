use anchor_lang::prelude::*;

declare_id!("H69FiJvdHxCCmeoN1WaXEygsvoxt3GTxZx9AqrkHJf28");

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
