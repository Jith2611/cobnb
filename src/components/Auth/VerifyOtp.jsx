import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck } from 'lucide-react';
import { getData, storeData } from '../../utility/LocalStorageService';
import { fetchRefreshToken } from '../../helper';
import { saveUserData, setIsOwner } from '../../redux/actions';
import './Login.css';

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state?.data;
  const type = location.state?.type; // 'signup' or 'forgot'
  const Id = data?.ID;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!Id) {
      navigate('/login');
    }
  }, [Id, navigate]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const verifyFunc = async (e) => {
    e.preventDefault();
    const otpInput = otp.join('');
    if (otpInput.length !== 6) {
      setErrorMsg('Please enter complete 6-digit OTP');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const refreshToken = await getData('refreshToken');
      const res = await axios.get(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/loyalty_members_Report/${Id}`,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${refreshToken}`,
          },
        }
      );

      if (res?.data?.code === 3000) {
        if (res?.data?.data?.OTP == otpInput || res?.data?.data?.OTP === otpInput) {
          if (type === 'forgot') {
            navigate('/update-password', { state: { data: { ID: Id } } });
          } else {
            updateStatus(res?.data?.data?.member_email);
          }
        } else {
          setErrorMsg('Invalid OTP! Please check the code sent to your email.');
          setLoading(false);
        }
      } else {
        setErrorMsg('Failed to fetch user record.');
        setLoading(false);
      }
    } catch (error) {
      if (error?.response?.data?.code === 1030) {
        await fetchRefreshToken();
        verifyFunc(e);
      } else {
        setErrorMsg('Something went wrong during verification.');
        setLoading(false);
      }
    }
  };

  const updateStatus = async (email) => {
    try {
      let currentDate = new Date();
      let date = currentDate.toLocaleDateString();
      let time = currentDate.toLocaleTimeString();

      let params = {
        data: {
          Verification_Status: 'Verified',
          Account_Status: 'Active',
          LastLogin: `${date} ${time}`,
        },
      };

      const refreshToken = await getData('refreshToken');
      const res = await axios.patch(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/loyalty_members_Report/${Id}`,
        params,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${refreshToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (res?.data?.code === 3000) {
        alert('Account verified successfully! Please log in.');
        navigate('/login');
      } else {
        setErrorMsg('Failed to update status.');
        setLoading(false);
      }
    } catch (error) {
      setErrorMsg('Something went wrong updating verification status.');
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
        <div className="auth-form-container" style={{ textAlign: 'center' }}>
          <ShieldCheck size={56} color="var(--color-primary)" style={{ margin: '0 auto 24px auto', display: 'block' }} />
          
          <h2 className="auth-title">Account Verification</h2>
          <p className="auth-subtitle">Please enter the 6-digit code sent to your email</p>
          
          {errorMsg && <div className="auth-error">{errorMsg}</div>}

          <form onSubmit={verifyFunc} className="auth-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', gap: '8px' }}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={digit}
                  ref={(el) => (inputRefs.current[index] = el)}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  style={{
                    width: '48px',
                    height: '56px',
                    fontSize: '24px',
                    textAlign: 'center',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-primary)',
                    fontFamily: 'var(--font-body)',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                />
              ))}
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? <div className="spinner"></div> : 'VERIFY'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
