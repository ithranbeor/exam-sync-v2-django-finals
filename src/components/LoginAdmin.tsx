// deno-lint-ignore-file no-explicit-any
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.ts';
import '../styles/loginAdmin.css';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const LoginFaculty: React.FC = () => {
  const [greeting, setGreeting] = useState(getGreeting());
  const [id, setID] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Step 1: Get email using user ID
    const { data: userData, error: lookupError } = await supabase
      .from('tbl_users')
      .select('email_address')
      .eq('user_id', id)
      .single();

    if (lookupError || !userData?.email_address) {
      setError('Invalid user ID or password.');
      return;
    }

    // Step 2: Attempt sign-in using Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userData.email_address,
      password,
    });

    if (authError || !authData.session) {
      setError('Invalid user ID or password.');
      return;
    }

    // Step 3: Fetch full user data to check status
    const { data: fullUser, error: userFetchError } = await supabase
      .from('tbl_users')
      .select('*')
      .eq('user_id', id)
      .single();

    if (userFetchError || !fullUser) {
      setError('Login succeeded, but failed to fetch user details.');
      return;
    }

    // ❌ Check if account is suspended
    if (fullUser.status?.toLowerCase() === 'suspended') {
      setError('Your account has been suspended.');
      await supabase.auth.signOut(); // Sign out immediately
      return;
    }

    // Step 4: Check for admin role
    const { data: rolesData, error: rolesError } = await supabase
      .from('tbl_user_roles')
      .select('role_id, roles:tbl_roles(role_name)')
      .eq('user_id', id);

    if (rolesError || !rolesData || rolesData.length === 0) {
      setError('Unauthorized access. No roles found.');
      return;
    }

    const isAdmin = rolesData.some((r: any) => r.roles.role_name.toLowerCase() === 'admin');

    if (!isAdmin) {
      setError('Access denied. Admins only.');
      return;
    }

    // Step 5: Store user and navigate
    if (rememberMe) {
      localStorage.setItem('user', JSON.stringify(fullUser));
    } else {
      sessionStorage.setItem('user', JSON.stringify(fullUser));
    }

    navigate('/admin-dashboard');
  };


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
            Login as <span className="faculty-text">Admin</span>
          </h2>
          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="ID">User ID</label>
              <input
                type="text"
                id="ID"
                placeholder="ID"
                value={id}
                onChange={(e) => setID(e.target.value)}
                className="login-input"
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                required
              />
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

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="login-button">
              Login
            </button>
          </form>
        </div>

        <div className="admin-login-link">
          <Link to="/">Sign in as Faculty</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginFaculty;
