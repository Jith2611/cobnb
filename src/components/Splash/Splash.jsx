import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Splash.css';

const Splash = () => {
  const navigate = useNavigate();
  const token = useSelector((state) => state.userInfo?.loginInfo);

  useEffect(() => {
    // Navigate to the welcome/home screen after 3 seconds
    const timer = setTimeout(() => {
      if (token) {
        navigate('/welcome');
      } else {
        navigate('/login');
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [navigate, token]);

  return (
    <div className="splash-container">
      <div 
        className="splash-background" 
        style={{ backgroundImage: "url('/images/splash.png')" }}
      >
        <div className="splash-overlay">
          <div className="splash-content">
            <motion.img 
              src="/images/logo.png" 
              alt="COBNB Logo" 
              className="splash-logo"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            
            <div className="splash-text-section">
              <motion.div 
                className="splash-text-container"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 1 }}
              >
                <h1 className="splash-title">MAXIMISE YOUR PROPERTY INCOME</h1>
                <p className="splash-subtitle">Leading Airbnb Management Company in Malaysia</p>
              </motion.div>

              <motion.div 
                className="splash-loader-line-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
              >
                <motion.div 
                  className="splash-loader-line"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Splash;
