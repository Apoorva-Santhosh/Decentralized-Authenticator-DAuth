import React from 'react';
import './Home.css';
import backgroundImage from '../assets/background.jpg';

const Home = () => {
  return (
    <div 
      className="home-container"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh'
      }}
    >
      <div className="content">
        <h1> Welcome to Our Website </h1>
        <p> Your journey begins here </p>
      </div>
    </div>
  );
};

export default Home;
