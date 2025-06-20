import React, { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState("");
  const [hasWallet, setHasWallet] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [userAccount, setUserAccount] = useState("");

  const getBalance = async (addressToCheck) => {
    if (!addressToCheck) return;
    
    setLoading(true);
    setError(null);
    setBalance(null);

    try {
      console.log('Fetching balance for Solana address...')
      const connection = new Connection(clusterApiUrl('devnet'))
      const publicKey = new PublicKey(addressToCheck)
      const balance = await connection.getBalance(publicKey)
      
      console.log('Response (lamports):', balance)
      const solBalance = balance / 1e9 // Convert from lamports to SOL
      console.log(`Balance: ${solBalance} SOL`)
      setBalance(`${solBalance} SOL`);
    } catch (e) {
      setError(JSON.stringify(e));
    }

    setLoading(false);
  }

  // Check balance whenever the connected account changes
  useEffect(() => {
    if (isConnected && userAccount) {
      getBalance(userAccount);
    }
  }, [userAccount]);

  // Check if Phantom wallet is installed
  useEffect(() => {
    const checkPhantomWallet = async () => {
      const hasPhantom = window?.phantom?.solana || false;
      
      if (hasPhantom) {
        setHasWallet(true);
        const provider = window.phantom?.solana;

        if (!provider) {
          console.error('Phantom provider not available');
          return;
        }

        try {
          const resp = await provider.connect();
          if (resp.publicKey) {
            setIsConnected(true);
            setUserAccount(resp.publicKey.toString());
          }
        } catch (err) {
          console.error('Error connecting to Phantom wallet:', err);
        }
      }
    };
    
    checkPhantomWallet();
  }, []);

  // Connect Phantom wallet function
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
      if (err.code === 4001) {
        setError("Please connect to Phantom wallet.");
      } else {
        setError("Error connecting to Phantom wallet");
        console.error(err);
      }
    }
  };

  useEffect(() => {
    invoke('getText', { example: 'my-invoke-variable' }).then(setData);
  }, []);

  return (
    <div className="container">
      <h1>Solana Wallet Balance Checker</h1>

      {/* Wallet Connection Section */}
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
          </div>
        )}
        {error && <div className="error">{error}</div>}
      </div>

      {/* Manual Address Check Section */}
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