import React from 'react';

const Calendar = () => {
  return (
    <div style={{ 
      position: 'fixed', 
      top: '80px', 
      left: 0, 
      right: 0, 
      bottom: 0, 
      margin: 0, 
      padding: 0, 
      backgroundColor: 'var(--color-bg-primary)', 
      zIndex: 10 
    }}>
      <iframe 
        src="https://www.cobnb.com.my/" 
        title="Calendar"
        style={{ width: '100%', height: '100%', border: 'none', margin: 0, padding: 0, display: 'block' }}
        allowFullScreen
      />
    </div>
  );
};

export default Calendar;
