import Resolver from '@forge/resolver';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

const resolver = new Resolver();

resolver.define('getBalance', async (req) => {
  console.log(req, arguments);
  const addressToCheck = req.payload.publicKey
  if (!addressToCheck) return;
  const connection = new Connection(clusterApiUrl('devnet'));
  const pubKey = new PublicKey(addressToCheck);
  const balance = await connection.getBalance(pubKey);
  const solBalance = balance / 1e9;
  return solBalance
})

export const handler = resolver.getDefinitions();
