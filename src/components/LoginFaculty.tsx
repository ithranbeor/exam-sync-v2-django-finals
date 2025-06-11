import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/loginFaculty.css';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const LoginFaculty: React.FC = () => {
  const [rememberMe, setRememberMe] = useState(false);
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="main-container">
      <div className="left-panel">
        <div className="e-graphic"></div>
      </div>
      <div className="right-panel">
        <div className="header-section">
          <div className="greeting">
            <p>Hello!</p>
            <p className="good-morning">{greeting}</p>
          </div>
          <div className="logo">
            <img src="../src/assets/Exam.png" alt="ExamSync Logo" />
          </div>
        </div>

        <div className="login-section">
          <h2>
            Login as <span className="faculty-text">Faculty</span>
          </h2>
          <form className="login-form">
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" placeholder="Email" className="login-input" />
            </div>
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" placeholder="Password" className="login-input" />
            </div>
            <div className="remember-me-container">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            <button type="submit" className="login-button">
              <Link to="/faculty-dashboard">Login</Link> 
            </button>
          </form>
        </div>

        <div className="admin-login-link">
          <Link to="/admin-login">Sign in as Admin</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginFaculty;
