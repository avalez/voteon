import React, { useEffect, useState, Suspense } from 'react';
import { invoke } from '@forge/bridge';
import { Connection, PublicKey, clusterApiUrl, SendTransactionError } from '@solana/web3.js';
import { BASIC_PROGRAM_ID as programId, getBasicProgram} from './voteon-exports.ts';
import { SolanaProvider, WalletButton, useAnchorProvider } from './solana-provider.tsx';
import { useWallet } from '@solana/wallet-adapter-react';

function MainApp() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState("");
  const [txSig, setTxSig] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [txStatus, setTxStatus] = useState("");

  const anchorProvider = useAnchorProvider();
  const { wallet, publicKey, connected } = useWallet();

  const getBalance = async (addressToCheck) => {
    if (!addressToCheck) return;
    setLoading(true);
    setError(null);
    setBalance(null);
    try {
      const connection = new Connection(clusterApiUrl('devnet'));
      const pubKey = new PublicKey(addressToCheck);
      const balance = await connection.getBalance(pubKey);
      const solBalance = balance / 1e9;
      setBalance(`${solBalance} SOL`);
    } catch (e) {
      setError(JSON.stringify(e));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (connected && publicKey) {
      getBalance(publicKey.toBase58());
    }
  }, [connected, publicKey]);

  const callInitialize = async () => {
    setLoading(true);
    setError("");
    setTxSig("");
    try {
      if (!anchorProvider || !publicKey) throw new Error('Wallet not connected');

      // Get the program using the helper function from voteon-exports
      const program = getBasicProgram(anchorProvider);

      const tx = await program.methods.initialize().rpc();
      setTxSig(tx);
      await getBalance(publicKey.toBase58());
      
      // Show success message
      setError("");
      setTxStatus("Transaction successful! Program initialized.");
    } catch (e) {
      // Handle SendTransactionError specifically
      if (e instanceof SendTransactionError) {
        const logs = e.getLogs();
        console.error('Transaction failed with logs:', logs);

        // Check if it's a timeout error
        if (e.message.includes('not confirmed in') || e.message.includes('timeout')) {
          setError(`Transaction timeout: ${e.message}. Check the transaction signature above to verify if it succeeded.`);
          // Don't mark as initialized for timeout - let user check manually
        } else if (e.message.includes('already been processed')) {
          setIsInitialized(true);
          setError("Program has already been initialized. You can reset to try again.");
        } else {
          setError(`Transaction failed: ${e.message}. Logs: ${JSON.stringify(logs)}`);
        }
      } else {
        setError(e.message || JSON.stringify(e));
      }
    }
    setLoading(false);
  };

  const resetInitialization = () => {
    setIsInitialized(false);
    setTxSig("");
    setError("");
    setTxStatus("");
    // Add a small delay to prevent rapid successive calls
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const checkTransactionStatus = async (signature) => {
    if (!signature) return;

    setLoading(true);
    try {
      const connection = new Connection(clusterApiUrl('devnet'));
      const status = await connection.getSignatureStatus(signature);

      if (status.value) {
        if (status.value.confirmationStatus === 'confirmed' || status.value.confirmationStatus === 'finalized') {
          setTxStatus("Transaction confirmed successfully!");
          setIsInitialized(true);
          setError("Program initialized successfully!");
        } else {
          setTxStatus(`Transaction status: ${status.value.confirmationStatus}`);
        }
      } else {
        setTxStatus("Transaction not found or still pending");
      }
    } catch (e) {
      setTxStatus(`Error checking status: ${e.message}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    invoke('getText', { example: 'my-invoke-variable' }).then(setData);
  }, []);

  return (
    <div className="container">
      <Suspense fallback={<div>Loading wallet...</div>}>
        <WalletButton />
      </Suspense>
      <h1>Solana Wallet Balance Checker</h1>
      <div className="wallet-section">
        {!wallet ? (
          <p>Please select a wallet to connect.</p>
        ) : connected && publicKey ? (
          <div>
            <p>Connected Wallet: {wallet.adapter.name}</p>
            <p>Address: {publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-4)}</p>
            {loading ? (
              <p>Loading balance...</p>
            ) : balance ? (
              <h2>Balance: {balance}</h2>
            ) : null}
            <button onClick={callInitialize} disabled={loading || !publicKey} style={{ marginTop: 16 }}>
              Call Anchor Initialize
            </button>
            {txSig && <div>Tx Signature: <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noopener noreferrer">{txSig}</a></div>}
          </div>
        ) : (
          <p>Wallet not connected. Please connect using the button above.</p>
        )}
        {error && <div className="error">{error}</div>}
      </div>
      {!connected && (
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
            {!connected && balance && <h2 id="balance">{balance}</h2>}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <SolanaProvider>
      <MainApp />
    </SolanaProvider>
  );
}

export default App;