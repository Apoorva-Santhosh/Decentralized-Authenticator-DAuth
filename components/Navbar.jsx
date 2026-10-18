import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

const Navbar = () => {
  const { session, logout } = useAuth();
  const [pending, setPending] = useState(false);
  const handleLogout = async () => {
    setPending(true);
    try { await logout(); }
    catch (error) { alert(error.message); }
    finally { setPending(false); }
  };
  return (
    <nav className="Navbar">
      <Link to="/">Home</Link>
      <Link to="/register">Register</Link>
      <Link to="/login">Login</Link>
      <Link to="/faqs">FAQs</Link>
      <Link to="/ledger">Ledger</Link>
      {session && <button onClick={handleLogout} disabled={pending}>Log out</button>}
    </nav>
  );
};

export default Navbar;
