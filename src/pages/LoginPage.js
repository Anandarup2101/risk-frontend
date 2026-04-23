import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. ADD THIS IMPORT
import api from '../api';
import './LoginPage.css';

function LoginPage({ onLogin }) {
  const navigate = useNavigate(); // 2. INITIALIZE HOOK
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/login', { username, password });
      
      const { username: user, role } = response.data;
      
      localStorage.setItem('username', user);
      localStorage.setItem('role', role);
      
      onLogin();
      
      // 3. REDIRECT TO DASHBOARD
      // navigate('/dashboard'); 
      navigate('/'); 
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">RISK ANALYSIS APP</h1>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              className="form-input" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="form-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'LOGIN'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;