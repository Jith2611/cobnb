import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';

const Booking = () => {
  const location = useLocation();
  const url = location.state?.url;

  if (!url) {
    return <Navigate to="/welcome" replace />;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: '80px', /* Below navbar */
      left: 0, 
      right: 0, 
      bottom: 0, 
      margin: 0, 
      padding: 0, 
      backgroundColor: 'var(--color-bg-primary)', 
      zIndex: 10 
    }}>
      <iframe 
        src={url} 
        style={{ width: '100%', height: '100%', border: 'none', margin: 0, padding: 0, display: 'block' }} 
        title="Cobnb Booking Page"
      />
    </div>
  );
};

export default Booking;
