import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Calendar, MapPin, User, Mail, Phone, CreditCard, Building2, Download, Home, ArrowRight, ShieldCheck, Printer } from 'lucide-react';

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const { booking, bookingPayload, paymentData, room, hotelName } = state;

  const resNumber = booking?.Booking_No 
    || booking?.ReservationNo 
    || booking?.reservation_no 
    || booking?.booking_no 
    || booking?.id 
    || paymentData?.orderid 
    || 'COBNB-' + Date.now().toString().slice(-6);

  const guest = bookingPayload?.guest || {};
  const roomName = room?.Room_Name || room?.Roomtype_Name || 'Deluxe Room';
  const propertyName = hotelName || 'CoBnb Luxury Residence';
  const checkIn = bookingPayload?.checkInDate || 'N/A';
  const checkOut = bookingPayload?.checkOutDate || 'N/A';
  const totalAmount = bookingPayload?.totalAmount || paymentData?.amount || '0.00';
  const roomImg = room?.room_main_image || room?.RoomImages?.[0]?.image || `${import.meta.env.BASE_URL}images/bg3.jpg`;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-main)', padding: '90px 24px 60px' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        
        {/* Success Header Badge */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)'
          }}>
            <CheckCircle2 size={46} color="#10b981" />
          </div>

          <span style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: '20px',
            background: 'rgba(197, 168, 128, 0.15)',
            color: 'var(--color-accent)',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginBottom: '10px'
          }}>
            Reservation Confirmed
          </span>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '34px',
            color: 'var(--color-text-main)',
            margin: '0 0 10px 0',
            fontWeight: 700
          }}>
            Thank You For Your Booking!
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
            Your payment has been verified and your room reservation is officially confirmed. A confirmation has been prepared for your records.
          </p>
        </div>

        {/* Confirmation Number Bar */}
        <div style={{
          background: 'linear-gradient(135deg, var(--color-bg-secondary), var(--color-bg-main))',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '20px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
        }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 600 }}>
              Confirmation Reference
            </span>
            <strong style={{ fontSize: '20px', color: 'var(--color-accent)', fontFamily: 'monospace', letterSpacing: '1px' }}>
              {resNumber}
            </strong>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => window.print()}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-main)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Printer size={16} /> Print Receipt
            </button>
          </div>
        </div>

        {/* Main Details Card */}
        <div style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          marginBottom: '28px'
        }}>
          
          {/* Property Image & Title Banner */}
          <div style={{
            position: 'relative',
            height: '180px',
            backgroundImage: `url(${roomImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '24px'
            }}>
              <span style={{ color: 'var(--color-accent)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {propertyName}
              </span>
              <h2 style={{ color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '24px', margin: '4px 0 0', fontWeight: 600 }}>
                {roomName}
              </h2>
            </div>
          </div>

          <div style={{ padding: '28px' }}>
            {/* Stay Schedule */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              <div style={{ background: 'var(--color-bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>Check-in</span>
                <strong style={{ fontSize: '16px', color: 'var(--color-text-main)' }}>{checkIn}</strong>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginTop: '2px' }}>From 3:00 PM</span>
              </div>
              <div style={{ background: 'var(--color-bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>Check-out</span>
                <strong style={{ fontSize: '16px', color: 'var(--color-text-main)' }}>{checkOut}</strong>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginTop: '2px' }}>Until 11:00 AM</span>
              </div>
              <div style={{ background: 'var(--color-bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>Total Paid</span>
                <strong style={{ fontSize: '18px', color: 'var(--color-accent)' }}>MYR {totalAmount}</strong>
                <span style={{ fontSize: '11px', color: '#10b981', display: 'block', marginTop: '2px', fontWeight: 600 }}>Paid via Fiuu</span>
              </div>
            </div>

            {/* Guest Information */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)', margin: '0 0 16px 0', fontWeight: 700 }}>
                Guest Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '12px' }}>Primary Guest</span>
                  <strong style={{ color: 'var(--color-text-main)' }}>{guest.title} {guest.firstName} {guest.lastName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '12px' }}>Email</span>
                  <strong style={{ color: 'var(--color-text-main)' }}>{guest.email}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '12px' }}>Phone</span>
                  <strong style={{ color: 'var(--color-text-main)' }}>{guest.phone}</strong>
                </div>
              </div>
            </div>

            {/* Promo Info if applied */}
            {bookingPayload?.appliedPromo && (
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#10b981', fontWeight: 600, fontSize: '13px' }}>
                  Promo Applied ({bookingPayload.appliedPromo.code})
                </span>
                <span style={{ color: '#10b981', fontWeight: 700, fontSize: '13px' }}>
                  - MYR {bookingPayload.discountAmount}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/hotel-bookings', { state: { hotelCode: bookingPayload?.hotelCode } })}
            style={{
              padding: '14px 28px',
              borderRadius: '10px',
              border: 'none',
              background: 'var(--color-accent)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(197, 168, 128, 0.3)'
            }}
          >
            View Bookings <ArrowRight size={16} />
          </button>
          
          <button
            onClick={() => navigate('/welcome')}
            style={{
              padding: '14px 24px',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-main)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Home size={16} /> Return to Home
          </button>
        </div>

      </div>
    </div>
  );
};

export default BookingConfirmation;
