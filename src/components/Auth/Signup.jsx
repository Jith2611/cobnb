import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { getData } from '../../utility/LocalStorageService';
import { fetchRefreshToken } from '../../helper';
import './Login.css';

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const nextStep = (e) => {
    e.preventDefault();
    if (!firstName || !email || !phoneNo) {
      setErrorMsg('Please fill in all details to continue.');
      return;
    }
    setErrorMsg('');
    setStep(1);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setErrorMsg('Please enter and confirm your password.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    
    setErrorMsg('');
    setLoading(true);

    try {
      const refreshToken = await getData('refreshToken');
      
      const params = {
        data: {
          member_email: email,
          Loyalty_member_phone_no: phoneNo,
          Points: "0",
          Guest_Name: {
            first_name: firstName,
          },
          member_level: "Silver",
          Key: password,
          Verification_Status: "Pending"
        }
      };

      const res = await axios.post(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/form/loyalty_members`,
        params,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${refreshToken}`,
            Accept: 'application/json',
            "Content-Type": 'application/json'
          },
        }
      );

      if (res?.data?.code === 3000) {
        // Success
        navigate('/verify-otp', { state: { data: res?.data?.data, type: 'signup' } });
      } else if (res?.data?.code === 3002) {
        setErrorMsg('Email already exists. Please login or reset your password.');
        setLoading(false);
      } else {
        setErrorMsg('Signup failed. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      if (error?.response?.data?.code === 1030) {
        await fetchRefreshToken();
        handleSignup(e); // Retry once
      } else {
        setErrorMsg(error?.message || 'Something went wrong during signup.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="auth-split-container">
      <div className="auth-image-panel" style={{ backgroundImage: "url('/images/splash.png')" }}>
        <div className="auth-image-overlay">
          <h2>MAXIMISE YOUR PROPERTY INCOME</h2>
          <p>Experience the luxury of professional Airbnb management.</p>
        </div>
      </div>
      
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <img src="/images/logo.png" alt="COBNB Logo" className="auth-logo" />
          
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join Malaysia's premier loyalty program</p>
          
          {errorMsg && <div className="auth-error">{errorMsg}</div>}

          {step === 0 ? (
            <form onSubmit={nextStep} className="auth-form">
              <div className="input-group">
                <User className="input-icon" size={18} />
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="auth-input"
                  required
                />
              </div>

              <div className="input-group">
                <Mail className="input-icon" size={18} />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  required
                />
              </div>

              <div className="input-group">
                <Phone className="input-icon" size={18} />
                <input
                  type="tel"
                  placeholder="Phone Number (e.g. +60...)"
                  value={phoneNo}
                  onChange={(e) => setPhoneNo(e.target.value)}
                  className="auth-input"
                  required
                />
              </div>

              <button type="submit" className="auth-button">
                NEXT
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="auth-form">
              <div className="input-group">
                <Lock className="input-icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
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
                  placeholder="Confirm Password"
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

              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button 
                  type="button" 
                  className="auth-button" 
                  style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}
                  onClick={() => setStep(0)}
                >
                  BACK
                </button>
                <button type="submit" className="auth-button" style={{ flex: 2 }} disabled={loading}>
                  {loading ? <div className="spinner"></div> : 'SIGN UP'}
                </button>
              </div>
            </form>
          )}

          <div className="auth-prompt">
            Already have an account? <Link to="/login">Log In</Link>
          </div>
          
          <div className="auth-prompt" style={{ marginTop: '16px', fontSize: '13px' }}>
            Facing Issues? <Link to="/user-guide" style={{ color: 'var(--color-text-muted)', textDecoration: 'underline' }}>Read User Guide</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
