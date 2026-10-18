import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider } from './components/AuthContext.jsx';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import FAQs from './pages/FAQs';
import Ledger from './pages/Ledger';
function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/ledger" element={<Ledger />} />
        </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;
