// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import type { ProgramsVoteon } from './programs_voteon-types';
const VoteonIDL = require('./programs_voteon_idl.json');

// Re-export the generated IDL and type
export { ProgramsVoteon, VoteonIDL };

// The programId is imported from the program IDL.
export const BASIC_PROGRAM_ID = new PublicKey(VoteonIDL.address);

// This is a helper function to get the Basic Anchor program.
export function getBasicProgram(provider: AnchorProvider) {
  return new Program(VoteonIDL as ProgramsVoteon, provider);
} 