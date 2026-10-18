import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAuthContract } from '../utils/wallet.js';
import { api } from '../utils/authApi.js';
import { useAuth } from '../components/AuthContext.jsx';
import '../pages/Ledger.css';

const Ledger = () => {
  const { session, loading: sessionLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState('');
  const [chainError, setChainError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const wallet = window.ethereum;
    const refresh = () => setRevision((value) => value + 1);
    wallet?.on('chainChanged', refresh);
    wallet?.on('disconnect', refresh);
    return () => {
      wallet?.removeListener('chainChanged', refresh);
      wallet?.removeListener('disconnect', refresh);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setEvents([]);
    setError('');
    if (!session) return;
    api('/api/auth/history').then((result) => {
      if (!cancelled) setEvents(result.events);
    }).catch((err) => {
      if (!cancelled) setError(err.message);
    });
    return () => { cancelled = true; };
  }, [session, revision]);

  useEffect(() => {
    let cancelled = false;
    const fetchRegistrations = async () => {
      setLoading(true);
      setChainError('');
      setRegistrations([]);
      try {
        const { provider, contract } = await getAuthContract();
        const latest = await provider.getBlockNumber();
        const parsed = [];
        const blocks = new Map();
        for (let from = 0; from <= latest; from += 1000) {
          if (cancelled) return;
          const logs = await contract.queryFilter(contract.filters.UserRegistered(), from, Math.min(from + 999, latest));
          for (const log of logs) {
            if (cancelled) return;
            if (!blocks.has(log.blockNumber)) blocks.set(log.blockNumber, await provider.getBlock(log.blockNumber));
            const block = blocks.get(log.blockNumber);
            if (!block) throw new Error('A ledger block is unavailable. Please refresh.');
            parsed.push({ user: log.args.user, timestamp: new Date(block.timestamp * 1000).toLocaleString(), txHash: log.transactionHash, logIndex: log.logIndex });
          }
        }
        if (!cancelled) setRegistrations(parsed);
      } catch (err) {
        if (!cancelled) setChainError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchRegistrations();
    return () => { cancelled = true; };
  }, [revision]);

  return (
    <div className="ledger-container">
      <h2 className="ledger-heading">Your Login History</h2>
      <button onClick={() => setRevision((value) => value + 1)}>Refresh</button>
      {sessionLoading ? <p role="status">Checking your session...</p> : !session ? <p><Link to="/login">Log in</Link> to view your private login history.</p> : (
        <>
          <p>Signed in as {session.address}</p>
          {error && <p role="alert">{error}</p>}
          <table className="ledger-table">
            <thead><tr><th>Result</th><th>Timestamp</th></tr></thead>
            <tbody>{events.map((event, index) => (
              <tr key={`${event.timestamp}-${index}`}>
                <td className={event.success ? 'success' : 'fail'}>{event.success ? 'Success' : 'Fail'}</td>
                <td>{new Date(event.timestamp).toLocaleString()}</td>
              </tr>
            ))}</tbody>
          </table>
        </>
      )}
      <h2 className="ledger-heading">Public Wallet Registrations</h2>
      {loading && <p role="status">Loading wallet registrations...</p>}
      {chainError && <p role="alert">{chainError}</p>}
      {!loading && !chainError && registrations.length === 0 && <p>No wallet registrations recorded.</p>}
      <table className="ledger-table">
        <thead><tr><th>Wallet</th><th>Timestamp</th><th>Transaction</th></tr></thead>
        <tbody>{registrations.map((event) => (
          <tr key={`${event.txHash}-${event.logIndex}`}><td>{event.user}</td><td>{event.timestamp}</td><td>{event.txHash}</td></tr>
        ))}</tbody>
      </table>
    </div>
  );
};

export default Ledger;
