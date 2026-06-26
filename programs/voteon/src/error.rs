use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Custom error message")]
    CustomError,
    #[msg("Vault has no tokens to claim")]
    EmptyVault,
    #[msg("Taker has not locked tokens yet")]
    TakerNotLocked,
    #[msg("Maker has not locked tokens yet")]
    MakerNotLocked,
    #[msg("Offer has not expired yet")]
    OfferNotExpired,
    #[msg("Incorrect amount locked")]
    IncorrectAmount,
    #[msg("Unauthorized to refund")]
    Unauthorized,
}
