import React, { useEffect } from 'react';

const HotelBookingLoadingOverlay = () => {
  // Lock body scroll while overlay is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div
      id="hotel-search-loading-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '22px',
        backgroundColor: 'rgba(9, 13, 22, 0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'overlayFade 0.2s ease-out'
      }}
    >
      {/* COBNB Brand Logo */}
      <img
        src={`${import.meta.env.BASE_URL}images/cobnblogonew.png`}
        alt="COBNB Logo"
        style={{
          width: '140px',
          height: 'auto',
          maxHeight: '80px',
          objectFit: 'contain',
          filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.5))'
        }}
      />

      {/* Circular Loading Indicator */}
      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          border: '3.5px solid rgba(197, 168, 128, 0.22)',
          borderTopColor: 'var(--color-accent, #c5a880)',
          borderRightColor: 'var(--color-accent, #c5a880)',
          animation: 'cobnbSpin 0.85s linear infinite'
        }}
      />

      {/* Animation Keyframes */}
      <style>{`
        @keyframes cobnbSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes overlayFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default HotelBookingLoadingOverlay;
