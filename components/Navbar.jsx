import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="Navbar">
      <Link to="/">Home</Link>
      <Link to="/register">Register</Link>
      <Link to="/login">Login</Link>
      <Link to="/faqs">FAQs</Link>
      <Link to="/ledger">Ledger</Link>
    </nav>
  );
};

export default Navbar;
