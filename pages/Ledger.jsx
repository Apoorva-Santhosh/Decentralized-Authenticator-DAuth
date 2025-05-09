import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import AuthManagerABI from '../artifacts/contracts/AuthManager.sol/AuthManager.json';
import '../pages/Ledger.css'; 

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const Ledger = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, AuthManagerABI.abi, provider);

        const filter = contract.filters.LoginAttempt();
        const logs = await contract.queryFilter(filter, 0, "latest");

        const parsed = await Promise.all(
          logs.map(async (log) => {
            const block = await provider.getBlock(log.blockNumber);
            return {
              user: log.args.user,
              success: log.args.success,
              timestamp: new Date(block.timestamp * 1000).toLocaleString(),
              blockNumber: log.blockNumber,
              txHash: log.transactionHash,
            };
          })
        );

        setEvents(parsed);
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="ledger-container">
      <h2 className="ledger-heading">Login Ledger</h2>
      <table className="ledger-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Success</th>
            <th>Timestamp</th>
            <th>Tx</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e, i) => (
            <tr key={i}>
              <td>{e.user}</td>
              <td className={e.success ? 'success' : 'fail'}>
                {e.success ? "Success" : "Fail"}
              </td>
              <td>{e.timestamp}</td>
              <td>
                <a href={`https://sepolia.etherscan.io/tx/${e.txHash}`} target="_blank" rel="noreferrer">
                  View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Ledger;
