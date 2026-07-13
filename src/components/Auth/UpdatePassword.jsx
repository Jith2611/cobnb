import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { getData } from '../../utility/LocalStorageService';
import { fetchRefreshToken } from '../../helper';
import './Login.css';

const UpdatePassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const Id = location.state?.data?.ID;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!Id) {
      navigate('/login');
    }
  }, [Id, navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }
    
    setErrorMsg('');
    setLoading(true);

    try {
      const refreshToken = await getData('refreshToken');
      const params = {
        data: {
          Key: password,
        }
      };

      const res = await axios.patch(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/loyalty_members_Report/${Id}`,
        params,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${refreshToken}`,
          },
        }
      );

      if (res?.data?.code === 3000) {
        setSuccessMsg('Password updated successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2500);
      } else {
        setErrorMsg('Failed to update password. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      if (error?.response?.data?.code === 1030) {
        await fetchRefreshToken();
        handleUpdate(e);
      } else {
        setErrorMsg('Something went wrong updating your password.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="auth-split-container">
      <div className="auth-image-panel" style={{ backgroundImage: `url('${import.meta.env.BASE_URL}images/splash.png')` }}>
        <div className="auth-image-overlay">
          <h2>MAXIMISE YOUR PROPERTY INCOME</h2>
          <p>Experience the luxury of professional Airbnb management.</p>
        </div>
      </div>
      
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="COBNB Logo" className="auth-logo" />
          
          <h2 className="auth-title">Create New Password</h2>
          <p className="auth-subtitle">Please enter your new password below</p>
          
          {errorMsg && <div className="auth-error">{errorMsg}</div>}
          {successMsg && (
            <div className="auth-error" style={{ backgroundColor: '#F6FFED', color: '#52C41A', borderColor: '#B7EB8F' }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleUpdate} className="auth-form">
            <div className="input-group">
              <Lock className="input-icon" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                required
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="input-group">
              <Lock className="input-icon" size={18} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input"
                required
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit" className="auth-button" disabled={loading || successMsg} style={{ marginTop: '16px' }}>
              {loading ? <div className="spinner"></div> : 'UPDATE PASSWORD'}
            </button>
          </form>
          
          <div className="auth-prompt">
            <Link to="/login">Back to Log In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;
