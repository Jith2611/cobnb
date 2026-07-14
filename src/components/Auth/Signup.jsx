import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { saveUserData, setIsOwner } from '../../redux/actions';
import { storeData } from '../../utility/LocalStorageService';
import zohoAxios from '../../utility/axiosInstance';
import { useGoogleLogin } from '@react-oauth/google';
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

  const checkOwnerOrAgent = async (userEmail, userPassword, user) => {
    try {
      const encodedEmail = encodeURIComponent(userEmail);
      let url = `/zoho-api/api/v2/brandontan18/housekeeping-system/report/All_Properties?Owner_Email=${encodedEmail}`;
      let url2 = `/zoho-api/api/v2/brandontan18/housekeeping-system/report/All_Properties?Sales_Demo_Email=${encodedEmail}`;
      
      const ownerRes = await zohoAxios.get(
        userEmail === 'demo.cobnb@gmail.com' && userPassword === 'ilovecobnb100' ? url2 : url
      );

      if (ownerRes?.data?.code === 3000) {
        saveUserData({ ID: user.ID });
        await storeData('ID', user.ID);
        await storeData('userDetails', JSON.stringify(user));
        setIsOwner(1);
        setLoading(false);
        navigate('/welcome');
        return;
      }
    } catch (error) {
      console.log("Not an owner", error);
    }

    try {
      const encodedEmail = encodeURIComponent(userEmail);
      let url = `/zoho-api/api/v2/brandontan18/housekeeping-system/report/All_Properties?Agent_Email=${encodedEmail}`;
      let url1 = `/zoho-api/api/v2/brandontan18/housekeeping-system/report/All_Properties?Agent_Demo_Email=${encodedEmail}`;
      
      const agentRes = await zohoAxios.get(
        userEmail === 'demo1.cobnb@gmail.com' && userPassword === 'ilovecobnb200' ? url1 : url
      );

      if (agentRes?.data?.code === 3000) {
        saveUserData({ ID: user.ID });
        await storeData('ID', user.ID);
        await storeData('userDetails', JSON.stringify(user));
        setIsOwner(2);
        setLoading(false);
        navigate('/welcome');
        return;
      }
    } catch (error) {
      console.log("Not an agent", error);
    }

    // Default: Guest
    saveUserData({ ID: user.ID });
    await storeData('ID', user.ID);
    await storeData('userDetails', JSON.stringify(user));
    setIsOwner(0);
    setLoading(false);
    navigate('/welcome');
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const userInfo = await axios.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
      );
      
      const { email, given_name } = userInfo.data;
      
      const encodedEmail = encodeURIComponent(email);
      const res = await zohoAxios.get(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/loyalty_members_Report?member_email=${encodedEmail}`
      );
      
      if (res?.data?.code === 3000 && res?.data?.data?.length > 0) {
        const user = res.data.data[0];
        if (user?.Deleted === 'Deleted') {
           setErrorMsg('Account Not Found or Account is Deleted!');
           setLoading(false);
           return;
        }
        
        if (user.Member_Type === 'Cleaners') {
          saveUserData({ ID: user.ID });
          await storeData('ID', user.ID);
          await storeData('userDetails', JSON.stringify(user));
          setIsOwner(3);
          setLoading(false);
          navigate('/welcome');
        } else if (user.Member_Type === 'Technicians') {
          saveUserData({ ID: user.ID });
          await storeData('ID', user.ID);
          await storeData('userDetails', JSON.stringify(user));
          setIsOwner(4);
          setLoading(false);
          navigate('/welcome');
        } else {
          await checkOwnerOrAgent(email, 'google', user);
        }
      } else {
        await autoSignup(email, given_name);
      }
    } catch (error) {
      console.error('Google login error', error);
      setErrorMsg('Google Login failed.');
      setLoading(false);
    }
  };

  const autoSignup = async (email, firstName) => {
    try {
      const params = {
        data: {
          member_email: email,
          Loyalty_member_phone_no: "N/A",
          Points: "0",
          Guest_Name: {
            first_name: firstName || "Guest",
          },
          member_level: "Silver",
          Key: "google",
          Verification_Status: "Verified"
        }
      };

      const res = await zohoAxios.post(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/form/loyalty_members`,
        params
      );

      if (res?.data?.code === 3000) {
        const encodedEmail = encodeURIComponent(email);
        const fetchRes = await zohoAxios.get(
          `/zoho-api/api/v2/brandontan18/housekeeping-system/report/loyalty_members_Report?member_email=${encodedEmail}`
        );
        if (fetchRes?.data?.code === 3000 && fetchRes?.data?.data?.length > 0) {
           const newUser = fetchRes.data.data[0];
           await checkOwnerOrAgent(email, 'google', newUser);
        } else {
           setErrorMsg('Signup successful but could not auto-login.');
           setLoading(false);
        }
      } else {
        setErrorMsg('Auto-signup failed.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Auto signup error', error);
      setErrorMsg('Auto-signup failed.');
      setLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: (error) => {
      console.error('Login Failed', error);
      setErrorMsg('Google Login failed.');
    }
  });

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
      <div className="auth-image-panel" style={{ backgroundImage: `url('${import.meta.env.BASE_URL}images/splash.png')` }}>
        <div className="auth-image-overlay">
          <h2>MAXIMISE YOUR PROPERTY INCOME</h2>
          <p>Experience the luxury of professional Airbnb management.</p>
        </div>
      </div>
      
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="COBNB Logo" className="auth-logo" />
          
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

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <button 
            type="button" 
            className="auth-social-btn" 
            onClick={() => loginWithGoogle()}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          
          <div className="auth-prompt" style={{ marginTop: '16px', fontSize: '13px' }}>
            Facing Issues? <Link to="/user-guide" style={{ color: 'var(--color-text-muted)', textDecoration: 'underline' }}>Read User Guide</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
