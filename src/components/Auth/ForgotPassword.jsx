import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import axios from 'axios';
import { getData } from '../../utility/LocalStorageService';
import { fetchRefreshToken } from '../../helper';
import './Login.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email');
      return;
    }
    
    setErrorMsg('');
    setLoading(true);

    try {
      const refreshToken = await getData('refreshToken');
      const res = await axios.get(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/loyalty_members_Report?member_email=${email}`,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${refreshToken}`,
          },
        }
      );

      if (res?.data?.code === 3000) {
        if (res?.data?.data?.length > 0) {
          const UID = res.data.data[0].ID;
          updateDetails(UID);
        } else {
          setErrorMsg('User not found.');
          setLoading(false);
        }
      } else {
        setErrorMsg('User not found.');
        setLoading(false);
      }
    } catch (error) {
      if (error?.response?.data?.code === 1030) {
        await fetchRefreshToken();
        handleForgotPassword(e);
      } else {
        setErrorMsg('User not found or something went wrong.');
        setLoading(false);
      }
    }
  };

  const updateDetails = async (ID) => {
    try {
      const refreshToken = await getData('refreshToken');
      const generatedOtp = Math.floor(Math.random() * 900000) + 100000;
      
      const params = {
        data: {
          OTP: generatedOtp,
        }
      };
      
      const res = await axios.patch(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/loyalty_members_Report/${ID}`,
        params,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${refreshToken}`,
          },
        }
      );
      
      if (res?.data?.code === 3000) {
        // Success
        navigate('/verify-otp', { state: { data: { ID }, type: 'forgot' } });
      } else {
        setErrorMsg('Failed to send OTP.');
        setLoading(false);
      }
    } catch (error) {
      setErrorMsg('Failed to generate and send OTP.');
      setLoading(false);
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
          
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">We will send an OTP to your registered email</p>
          
          {errorMsg && <div className="auth-error">{errorMsg}</div>}

          <form onSubmit={handleForgotPassword} className="auth-form">
            <div className="input-group">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                required
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading} style={{ marginTop: '16px' }}>
              {loading ? <div className="spinner"></div> : 'SEND OTP'}
            </button>
          </form>

          <div className="auth-prompt">
            Remembered your password? <Link to="/login">Log In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
