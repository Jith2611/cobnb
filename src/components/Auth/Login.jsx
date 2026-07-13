import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { saveUserData, setIsOwner } from '../../redux/actions';
import { storeData } from '../../utility/LocalStorageService';
import zohoAxios from '../../utility/axiosInstance';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter your email and password');
      return;
    }
    
    setErrorMsg('');
    setLoading(true);

    try {
      const encodedEmail = encodeURIComponent(email);
      const encodedPassword = encodeURIComponent(password);
      // zohoAxios interceptor auto-refreshes token if needed and retries
      const res = await zohoAxios.get(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/loyalty_members_Report?member_email=${encodedEmail}&Key=${encodedPassword}`
      );

      if (res?.data?.code === 3000) {
        if (res?.data?.data?.length > 0) {
          const user = res.data.data[0];
          if (user?.Deleted === 'Deleted') {
            setErrorMsg('Account Not Found or Account is Deleted!');
            setLoading(false);
          } else {
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
              await checkOwnerOrAgent(email, password, user);
            }
          }
        } else {
          setErrorMsg('User Not Found or Invalid Credentials!');
          setLoading(false);
        }
      } else {
        setErrorMsg('User Not Found or Invalid Credentials!');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMsg('User Not Found or Invalid Credentials!');
      setLoading(false);
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
          
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to your account to continue</p>
          
          {errorMsg && <div className="auth-error">{errorMsg}</div>}

          <form onSubmit={handleLogin} className="auth-form">
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

            <div className="forgot-password">
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? <div className="spinner"></div> : 'SIGN IN'}
            </button>
          </form>

          <div className="auth-prompt">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
