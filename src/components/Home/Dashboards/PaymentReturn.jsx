import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  Code2,
  FileText,
  X,
  CreditCard,
  User,
  Calendar,
  Building2,
  RotateCcw,
  Loader2
} from 'lucide-react';

const PaymentReturn = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [paymentData, setPaymentData] = useState({});
  const [pendingBooking, setPendingBooking] = useState(null);
  const [showModal, setShowModal] = useState(true);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'json'
  const [copied, setCopied] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const hasCalledBookingRef = useRef(false);

  useEffect(() => {
    // 1. Parse URL Query Parameters from Fiuu Return
    const searchParams = new URLSearchParams(location.search);
    const data = {};
    for (const [key, value] of searchParams.entries()) {
      data[key] = value;
    }
    setPaymentData(data);

    // 2. Load pending booking details & bookingPayload from sessionStorage
    try {
      const stored = sessionStorage.getItem('cobnb_pending_booking');
      if (stored) {
        setPendingBooking(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not read pending booking from sessionStorage', e);
    }

    console.group('%c💳 Fiuu Payment Gateway Response', 'color: #3b82f6; font-size: 14px; font-weight: bold;');
    console.table(data);
    console.log('Raw Query:', location.search);
    console.groupEnd();

    // Auto-open modal on mount
    setShowModal(true);
  }, [location.search]);

  // Determine status (00 = Success, 11 = Failed, 22 = Pending)
  const status = paymentData.status;
  const isSuccess = status === '00';
  const isPending = status === '22';
  const isFailed = status === '11' || (!isSuccess && !isPending && Boolean(status));

  // Resolve IDs with robust fallbacks
  const hotelSelection = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('cobnb_hotel_selection') || '{}');
    } catch (_) {
      return {};
    }
  })();

  const rawPayload = pendingBooking?.bookingPayload || {};

  const resolvedHotelCode = rawPayload.hotelCode
    || pendingBooking?.hotelCode
    || pendingBooking?.room?.hotelcode
    || pendingBooking?.room?.rawEzee?.hotelcode
    || hotelSelection?.hotelCode
    || '';

  const resolvedRoomTypeId = rawPayload.roomTypeId
    || pendingBooking?.room?.roomtypeunkid
    || pendingBooking?.room?.rawEzee?.roomtypeunkid
    || pendingBooking?.room?.rawZoho?.Ezee_Room_Type_ID
    || '';

  const resolvedRateTypeId = rawPayload.rateTypeId
    || pendingBooking?.room?.ratetypeunkid
    || pendingBooking?.room?.rawEzee?.ratetypeunkid
    || '';

  const resolvedRoomRateId = rawPayload.roomRateId
    || pendingBooking?.room?.roomrateunkid
    || pendingBooking?.room?.rawEzee?.roomrateunkid
    || '';

  // Construct or retrieve bookingPayload
  const bookingPayload = {
    ...rawPayload,
    hotelCode: resolvedHotelCode,
    roomTypeId: resolvedRoomTypeId,
    rateTypeId: resolvedRateTypeId,
    roomRateId: resolvedRoomRateId,
    checkInDate: rawPayload.checkInDate || pendingBooking?.checkInDate || 'YYYY-MM-DD',
    checkOutDate: rawPayload.checkOutDate || pendingBooking?.checkOutDate || 'YYYY-MM-DD',
    numAdults: rawPayload.numAdults || pendingBooking?.adults || 1,
    numChildren: rawPayload.numChildren ?? pendingBooking?.children ?? 0,
    numRooms: rawPayload.numRooms || pendingBooking?.numRooms || 1,
    guest: rawPayload.guest || {
      title: pendingBooking?.formData?.title || 'Mr.',
      firstName: pendingBooking?.formData?.firstName || 'Guest',
      lastName: pendingBooking?.formData?.lastName || 'User',
      email: pendingBooking?.formData?.email || 'guest@cobnb.com',
      phone: `${pendingBooking?.formData?.countryCode || '+60'}${pendingBooking?.formData?.mobile || ''}`
    },
    appliedPromo: rawPayload.appliedPromo || (pendingBooking?.appliedPromoData ? {
      code: pendingBooking.appliedPromoData.code,
      discount: pendingBooking.appliedPromoData.discountAmount,
      type: pendingBooking.appliedPromoData.type
    } : null),
    subtotalAmount: rawPayload.subtotalAmount || pendingBooking?.amount || '0.00',
    discountAmount: rawPayload.discountAmount || 0,
    totalAmount: rawPayload.totalAmount || pendingBooking?.amount || '0.00'
  };

  const handleCopyJson = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(bookingPayload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  // Call eZee Booking API after payment success
  const callBookingApi = async (overridePayload) => {
    const payload = overridePayload || bookingPayload;
    setBookingLoading(true);
    setBookingError(null);
    try {
      console.log('🚀 Calling eZee Booking API with payload:', payload);
      const response = await axios.post('/ezee-api/booking/reservation_api/booking.php', payload);
      console.log('✅ eZee Booking API Response:', response?.data);
      setBookingLoading(false);

      const isApiSuccess =
        response?.data?.success === true ||
        response?.data?.success === 'true' ||
        Boolean(
          response?.data?.Booking_No ||
          response?.data?.ReservationNo ||
          response?.data?.reservation_no ||
          response?.data?.booking_no ||
          response?.data?.id
        ) ||
        (response?.data && !response?.data?.error && !response?.data?.Error && !response?.data?.Errors);

      if (isApiSuccess) {
        try {
          sessionStorage.removeItem('cobnb_pending_booking');
        } catch (_) {}

        navigate('/booking-confirmation', {
          state: {
            booking: response?.data,
            bookingPayload: payload,
            paymentData,
            room: pendingBooking?.room,
            hotelName: pendingBooking?.hotelName
          }
        });
      } else {
        const errDetail =
          response?.data?.error ||
          response?.data?.Error ||
          response?.data?.Errors ||
          response?.data?.message ||
          'Booking API could not confirm reservation.';
        setBookingError(typeof errDetail === 'object' ? JSON.stringify(errDetail) : String(errDetail));
      }
    } catch (err) {
      console.error('Booking failed:', err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Booking API call failed.';
      setBookingError(typeof msg === 'object' ? JSON.stringify(msg) : String(msg));
      setBookingLoading(false);
    }
  };

  const handleRetryCheckout = () => {
    if (pendingBooking?.room) {
      navigate('/hotel-checkout', {
        state: {
          room: pendingBooking.room,
          hotelCode: resolvedHotelCode,
          hotelName: pendingBooking.hotelName,
          checkInDate: pendingBooking.checkInDate,
          checkOutDate: pendingBooking.checkOutDate,
          adults: pendingBooking.adults,
          children: pendingBooking.children,
          numRooms: pendingBooking.numRooms,
          nightCount: pendingBooking.nightCount
        }
      });
    } else {
      navigate('/online-booking');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-main)', padding: '100px 24px 60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* Background Page Content */}
      <div style={{
        maxWidth: '560px',
        width: '100%',
        background: 'var(--color-bg-secondary)',
        borderRadius: '20px',
        border: '1px solid var(--color-border)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        padding: '36px',
        textAlign: 'center'
      }}>
        {/* Status Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          background: isSuccess ? 'rgba(16, 185, 129, 0.12)' : (isPending ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)')
        }}>
          {isSuccess && <CheckCircle2 size={40} color="#10b981" />}
          {isPending && <AlertTriangle size={40} color="#f59e0b" />}
          {isFailed && <XCircle size={40} color="#ef4444" />}
          {!isSuccess && !isPending && !isFailed && <ShieldCheck size={40} color="var(--color-accent)" />}
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', margin: '0 0 8px 0', color: 'var(--color-text-main)' }}>
          {isSuccess ? 'Payment Successful' : (isPending ? 'Payment Pending' : (isFailed ? 'Payment Failed' : 'Payment Response Received'))}
        </h2>

        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', margin: '0 0 24px 0', lineHeight: 1.5 }}>
          {isSuccess
            ? 'Your transaction was approved and processed by Fiuu sandbox.'
            : (isPending
              ? 'Your payment is currently pending confirmation from the payment provider.'
              : (isFailed
                ? (paymentData.error_desc || 'The payment transaction could not be completed.')
                : 'Fiuu Sandbox Gateway test response screen.'))}
        </p>

        {/* Transaction Summary Card */}
        <div style={{
          background: 'var(--color-bg-main)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          padding: '18px',
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Status</span>
            <span style={{ fontWeight: 700, color: isSuccess ? '#10b981' : (isPending ? '#f59e0b' : '#ef4444') }}>
              {isSuccess ? 'Successful (00)' : (isPending ? 'Pending (22)' : `Failed (${paymentData.status || '11'})`)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Order ID</span>
            <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{paymentData.orderid || pendingBooking?.orderid || 'N/A'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Amount</span>
            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-accent)' }}>
              {paymentData.currency || 'MYR'} {paymentData.amount || pendingBooking?.amount || '0.00'}
            </span>
          </div>

          {paymentData.tranID && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Transaction ID</span>
              <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{paymentData.tranID}</span>
            </div>
          )}

          {paymentData.channel && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Channel</span>
              <span style={{ color: 'var(--color-text-main)' }}>{paymentData.channel}</span>
            </div>
          )}
        </div>

        {/* Action Buttons on background page */}
        <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
          {isSuccess && (
            <button
              type="button"
              onClick={() => callBookingApi(bookingPayload)}
              disabled={bookingLoading}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                border: 'none',
                background: bookingError ? '#ef4444' : 'var(--color-accent)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '14px',
                cursor: bookingLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(197, 168, 128, 0.3)'
              }}
            >
              {bookingLoading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Making Booking...
                </>
              ) : bookingError ? (
                <>
                  <RotateCcw size={16} /> Retry Make Booking
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Make Booking
                </>
              )}
            </button>
          )}

          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-main)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Code2 size={18} color="var(--color-accent)" />
            {isSuccess ? 'View Booking Payload Modal' : 'View Error Modal'}
          </button>

          {isFailed && (
            <button
              onClick={handleRetryCheckout}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                border: 'none',
                background: 'var(--color-accent)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <RotateCcw size={16} /> Re-Checkout Room
            </button>
          )}

          <button
            onClick={() => navigate('/online-booking')}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <ArrowLeft size={16} /> Back to Online Booking
          </button>
        </div>

        {/* Demo switcher when opened without URL query params */}
        {!paymentData.status && (
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px dashed var(--color-border)' }}>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontWeight: 700 }}>
              Test Sandbox Return Simulation
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setPaymentData({ status: '00', orderid: 'COBNB-DEMO-SUCCESS', amount: '250.00', currency: 'MYR', channel: 'FPX_MB2U' });
                  setShowModal(true);
                }}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #10b981', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Simulate Success
              </button>
              <button
                onClick={() => {
                  setPaymentData({ status: '11', orderid: 'COBNB-DEMO-FAIL', amount: '250.00', currency: 'MYR', error_desc: 'Payment was cancelled by user', error_code: 'CANCELLED_BY_USER' });
                  setShowModal(true);
                }}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Simulate Failed
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* SUCCESS MODAL: BOOKING PAYLOAD DEBUG MODAL                 */}
      {/* ========================================================== */}
      {showModal && isSuccess && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 9999
        }}>
          <div style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '20px',
            maxWidth: '720px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            animation: 'modalPop 0.25s ease-out',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--color-bg-main)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981'
                }}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>
                    Payment Successful (Sandbox)
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Order ID: <strong>{paymentData.orderid || pendingBooking?.orderid || 'N/A'}</strong> • Amount: <strong>{paymentData.currency || 'MYR'} {paymentData.amount || pendingBooking?.amount || '0.00'}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Debug Banner */}
            <div style={{
              background: 'rgba(197, 168, 128, 0.12)',
              borderBottom: '1px solid rgba(197, 168, 128, 0.25)',
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code2 size={16} color="var(--color-accent)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-accent)' }}>
                  Booking API Payload Inspector
                </span>
                <span style={{
                  fontSize: '11px',
                  background: bookingLoading ? 'rgba(59, 130, 246, 0.2)' : (bookingError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'),
                  color: bookingLoading ? '#3b82f6' : (bookingError ? '#ef4444' : '#10b981'),
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {bookingLoading && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />}
                  {bookingLoading ? 'Executing Booking API...' : (bookingError ? 'API Error' : 'Ready for Booking')}
                </span>
              </div>
              {/* Tab Selector */}
              <div style={{ display: 'flex', gap: '4px', background: 'var(--color-bg-main)', padding: '3px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeTab === 'summary' ? 'var(--color-accent)' : 'transparent',
                    color: activeTab === 'summary' ? '#fff' : 'var(--color-text-muted)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <FileText size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                  Summary
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('json')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeTab === 'json' ? 'var(--color-accent)' : 'transparent',
                    color: activeTab === 'json' ? '#fff' : 'var(--color-text-muted)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Code2 size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                  JSON
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {/* Payment Success & Make Booking Prompt */}
              {!bookingLoading && !bookingError && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={20} color="#10b981" style={{ flexShrink: 0 }} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                        Payment Verified Successfully
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        Press the <strong>Make Booking</strong> button to execute room reservation with eZee API.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => callBookingApi(bookingPayload)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'var(--color-accent)',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <CheckCircle2 size={14} /> Make Booking
                  </button>
                </div>
              )}

              {/* API Execution Alert State */}
              {bookingLoading && (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <Loader2 size={24} color="#3b82f6" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                  <div>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 700, color: '#3b82f6' }}>
                      Executing eZee Room Booking API...
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      POST to /ezee-api/booking/reservation_api/booking.php with bookingPayload
                    </p>
                  </div>
                </div>
              )}

              {bookingError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '18px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                      <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
                          Booking API Response Error
                        </h4>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-main)', lineHeight: 1.5, wordBreak: 'break-word' }}>
                          {bookingError}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => callBookingApi(bookingPayload)}
                      disabled={bookingLoading}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <RotateCcw size={14} /> Retry API
                    </button>
                  </div>
                </div>
              )}
              {activeTab === 'summary' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Property & Room Section */}
                  <div style={{ background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      <Building2 size={14} color="var(--color-accent)" /> eZee Property & Room Identifiers
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                      <div style={{ background: 'var(--color-bg-secondary)', padding: '10px 12px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Hotel Code</span>
                        <strong style={{ fontSize: '13px', color: 'var(--color-text-main)' }}>{bookingPayload.hotelCode || 'N/A'}</strong>
                      </div>
                      <div style={{ background: 'var(--color-bg-secondary)', padding: '10px 12px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Room Type ID</span>
                        <strong style={{ fontSize: '13px', color: 'var(--color-text-main)' }}>{bookingPayload.roomTypeId || 'N/A'}</strong>
                      </div>
                      <div style={{ background: 'var(--color-bg-secondary)', padding: '10px 12px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Rate Type ID</span>
                        <strong style={{ fontSize: '13px', color: 'var(--color-text-main)' }}>{bookingPayload.rateTypeId || 'N/A'}</strong>
                      </div>
                      <div style={{ background: 'var(--color-bg-secondary)', padding: '10px 12px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Room Rate ID</span>
                        <strong style={{ fontSize: '13px', color: 'var(--color-text-main)' }}>{bookingPayload.roomRateId || 'N/A'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Dates & Guests */}
                  <div style={{ background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      <Calendar size={14} color="var(--color-accent)" /> Stay Schedule & Occupancy
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                      <div style={{ background: 'var(--color-bg-secondary)', padding: '10px 12px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Check-in</span>
                        <strong style={{ fontSize: '13px', color: 'var(--color-text-main)' }}>{bookingPayload.checkInDate}</strong>
                      </div>
                      <div style={{ background: 'var(--color-bg-secondary)', padding: '10px 12px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Check-out</span>
                        <strong style={{ fontSize: '13px', color: 'var(--color-text-main)' }}>{bookingPayload.checkOutDate}</strong>
                      </div>
                      <div style={{ background: 'var(--color-bg-secondary)', padding: '10px 12px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Guests</span>
                        <strong style={{ fontSize: '13px', color: 'var(--color-text-main)' }}>
                          {bookingPayload.numAdults} Adult(s), {bookingPayload.numChildren} Child
                        </strong>
                      </div>
                      <div style={{ background: 'var(--color-bg-secondary)', padding: '10px 12px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Rooms</span>
                        <strong style={{ fontSize: '13px', color: 'var(--color-text-main)' }}>{bookingPayload.numRooms} Room(s)</strong>
                      </div>
                    </div>
                  </div>

                  {/* Guest Information */}
                  <div style={{ background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      <User size={14} color="var(--color-accent)" /> Primary Guest Information
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                      <div style={{ background: 'var(--color-bg-secondary)', padding: '10px 12px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Full Name</span>
                        <strong style={{ fontSize: '13px', color: 'var(--color-text-main)' }}>
                          {bookingPayload.guest?.title} {bookingPayload.guest?.firstName} {bookingPayload.guest?.lastName}
                        </strong>
                      </div>
                      <div style={{ background: 'var(--color-bg-secondary)', padding: '10px 12px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Email Address</span>
                        <strong style={{ fontSize: '13px', color: 'var(--color-text-main)' }}>{bookingPayload.guest?.email}</strong>
                      </div>
                      <div style={{ background: 'var(--color-bg-secondary)', padding: '10px 12px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Phone Number</span>
                        <strong style={{ fontSize: '13px', color: 'var(--color-text-main)' }}>{bookingPayload.guest?.phone}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div style={{ background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      <CreditCard size={14} color="var(--color-accent)" /> Financial Summary
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      <span>Subtotal</span>
                      <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>MYR {bookingPayload.subtotalAmount}</span>
                    </div>
                    {bookingPayload.appliedPromo && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: '#10b981' }}>
                        <span>Promo Code ({bookingPayload.appliedPromo.code})</span>
                        <span style={{ fontWeight: 600 }}>- MYR {bookingPayload.discountAmount}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 4px', borderTop: '1px solid var(--color-border)', marginTop: '8px', fontSize: '15px', fontWeight: 800 }}>
                      <span style={{ color: 'var(--color-text-main)' }}>Total Amount</span>
                      <span style={{ color: 'var(--color-accent)' }}>MYR {bookingPayload.totalAmount}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* RAW JSON TAB */
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      Raw JSON payload for /ezee-api/booking/reservation_api/booking.php
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyJson}
                      style={{
                        padding: '6px 12px',
                        background: copied ? '#10b981' : 'var(--color-accent)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background 0.2s'
                      }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied to Clipboard' : 'Copy Payload JSON'}
                    </button>
                  </div>
                  <pre style={{
                    margin: 0,
                    padding: '16px',
                    borderRadius: '10px',
                    background: '#0b0f19',
                    color: '#38bdf8',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    overflowX: 'auto',
                    border: '1px solid #1e293b'
                  }}>
                    {JSON.stringify(bookingPayload, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--color-bg-main)',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {bookingLoading
                  ? 'Calling /ezee-api/booking/reservation_api/booking.php...'
                  : bookingError
                  ? 'Payment successful. Booking API error returned.'
                  : 'Payment successful. Press Make Booking to finalize.'}
              </span>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: 'var(--color-text-main)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Close Modal
                </button>

                {/* Make Booking Button - ONLY calls API on press */}
                <button
                  type="button"
                  id="make-booking-button"
                  onClick={() => callBookingApi(bookingPayload)}
                  disabled={bookingLoading}
                  style={{
                    padding: '11px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: bookingError ? '#ef4444' : 'var(--color-accent)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: bookingLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    boxShadow: '0 4px 14px rgba(197, 168, 128, 0.35)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Making Booking...
                    </>
                  ) : bookingError ? (
                    <>
                      <RotateCcw size={15} /> Retry Make Booking
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} /> Make Booking
                    </>
                  )}
                </button>

                {bookingError && (
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/booking-confirmation', {
                        state: {
                          booking: { success: true, Booking_No: paymentData.orderid },
                          bookingPayload,
                          paymentData,
                          room: pendingBooking?.room,
                          hotelName: pendingBooking?.hotelName
                        }
                      });
                    }}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-main)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Proceed to Confirmation
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate('/online-booking')}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: 'var(--color-text-muted)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Back to Online Booking <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* FAILED MODAL: PAYMENT FAILED MODAL                         */}
      {/* ========================================================== */}
      {showModal && isFailed && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 9999
        }}>
          <div style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '20px',
            maxWidth: '540px',
            width: '100%',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            animation: 'modalPop 0.25s ease-out',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--color-bg-main)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444'
                }}>
                  <XCircle size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>
                    Payment Failed (Sandbox)
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Order ID: <strong>{paymentData.orderid || pendingBooking?.orderid || 'N/A'}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '50%'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Error Body */}
            <div style={{ padding: '24px' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#ef4444', fontWeight: 700 }}>
                      Transaction Declined or Cancelled
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-main)', lineHeight: 1.5 }}>
                      {paymentData.error_desc || 'The payment transaction could not be authorized or was cancelled in the Fiuu sandbox gateway.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Error metadata */}
              <div style={{ background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Status Code</span>
                  <span style={{ fontWeight: 700, color: '#ef4444' }}>{paymentData.status || '11 (Failed)'}</span>
                </div>
                {paymentData.error_code && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Error Code</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{paymentData.error_code}</span>
                  </div>
                )}
                {paymentData.amount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Attempted Amount</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                      {paymentData.currency || 'MYR'} {paymentData.amount}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleRetryCheckout}
                  style={{
                    padding: '13px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--color-accent)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <RotateCcw size={16} /> Re-Checkout Room
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/online-booking')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: 'var(--color-text-muted)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <ArrowLeft size={16} /> Back to Online Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Animation Keyframes */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes modalPop {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}} />
    </div>
  );
};

export default PaymentReturn;
