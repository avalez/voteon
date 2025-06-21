import React, { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import idl from './programs_voteon_idl.json';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState("");
  const [hasWallet, setHasWallet] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [userAccount, setUserAccount] = useState("");
  const [txSig, setTxSig] = useState("");

  const getBalance = async (addressToCheck) => {
    if (!addressToCheck) return;
    setLoading(true);
    setError(null);
    setBalance(null);
    try {
      const connection = new Connection(clusterApiUrl('devnet'));
      const publicKey = new PublicKey(addressToCheck);
      const balance = await connection.getBalance(publicKey);
      const solBalance = balance / 1e9;
      setBalance(`${solBalance} SOL`);
    } catch (e) {
      setError(JSON.stringify(e));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isConnected && userAccount) {
      getBalance(userAccount);
    }
  }, [userAccount]);

  useEffect(() => {
    const checkPhantomWallet = async () => {
      const hasPhantom = window?.phantom?.solana || false;
      if (hasPhantom) {
        setHasWallet(true);
        const provider = window.phantom?.solana;
        if (!provider) return;
        try {
          const resp = await provider.connect();
          if (resp.publicKey) {
            setIsConnected(true);
            setUserAccount(resp.publicKey.toString());
          }
        } catch (err) {
          // ignore
        }
      }
    };
    checkPhantomWallet();
  }, []);

  const connectWallet = async () => {
    try {
      const provider = window?.phantom?.solana;
      if (!provider) {
        setError("Please install Phantom wallet!");
        return;
      }
      const resp = await provider.connect();
      setIsConnected(true);
      setUserAccount(resp.publicKey.toString());
    } catch (err) {
      setError("Error connecting to Phantom wallet");
    }
  };

  // Anchor initialize call
  const callInitialize = async () => {
    setLoading(true);
    setError("");
    setTxSig("");
    try {
      const provider = window.phantom?.solana;
      if (!provider || !userAccount) throw new Error('Phantom wallet not connected');
      const connection = new Connection(clusterApiUrl('devnet'));
      // Create AnchorProvider
      const anchorProvider = new AnchorProvider(connection, provider, { preflightCommitment: 'processed' });
      // Program ID from IDL
      const programId = new PublicKey(idl.address);
      // Create Program instance
      const program = new Program(idl, programId, anchorProvider);
      // Call initialize
      const tx = await program.methods.initialize().rpc();
      setTxSig(tx);
      await getBalance(userAccount);
    } catch (e) {
      setError(e.message || JSON.stringify(e));
    }
    setLoading(false);
  };

  useEffect(() => {
    invoke('getText', { example: 'my-invoke-variable' }).then(setData);
  }, []);

  return (
    <div className="container">
      <h1>Solana Wallet Balance Checker</h1>
      <div className="wallet-section">
        {!hasWallet ? (
          <p>Please install Phantom wallet</p>
        ) : !isConnected ? (
          <button onClick={connectWallet}>
            Connect Phantom Wallet
          </button>
        ) : (
          <div>
            <p>Connected to Phantom</p>
            <p>Address: {userAccount.slice(0, 6)}...{userAccount.slice(-4)}</p>
            {loading ? (
              <p>Loading balance...</p>
            ) : balance ? (
              <h2>Balance: {balance}</h2>
            ) : null}
            <button onClick={callInitialize} disabled={loading} style={{ marginTop: 16 }}>
              Call Anchor Initialize
            </button>
            {txSig && <div>Tx Signature: <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noopener noreferrer">{txSig}</a></div>}
          </div>
        )}
        {error && <div className="error">{error}</div>}
      </div>
      {!isConnected && (
        <div className="manual-check">
          <h3>Check Any Solana Address</h3>
          <label>
            <div>
              <b>Wallet address</b>
            </div>
            <input type="text" onChange={(e) => getBalance(e.target.value)} />
          </label>
          <div className="result">
            {loading && <span id="loader"></span>}
            {!isConnected && balance && <h2 id="balance">{balance}</h2>}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;