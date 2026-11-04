import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import zohoAxios from '../../../utility/axiosInstance';
import { getData } from '../../../utility/LocalStorageService';
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
  Loader2,
  Key
} from 'lucide-react';

const PaymentReturn = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [paymentData, setPaymentData] = useState(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const data = {};
      for (const [key, value] of searchParams.entries()) {
        data[key] = value;
      }
      return data;
    } catch (_) {
      return {};
    }
  });

  const [pendingBooking, setPendingBooking] = useState(() => {
    try {
      const stored = sessionStorage.getItem('cobnb_pending_booking');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.warn('Could not read pending booking from sessionStorage', e);
      return null;
    }
  });

  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [copied, setCopied] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const hasCalledBookingRef = useRef(false);

  useEffect(() => {
    // Parse URL Query Parameters from Fiuu Return
    const searchParams = new URLSearchParams(location.search);
    const data = {};
    for (const [key, value] of searchParams.entries()) {
      data[key] = value;
    }
    setPaymentData(data);

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

    // Only show modal if payment failed
    if (data.status && data.status !== '00' && data.status !== '22') {
      setShowModal(true);
    }
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

  const resolvedApiKey = rawPayload.apiKey
    || pendingBooking?.apiKey
    || hotelSelection?.apiKey
    || pendingBooking?.room?.apiKey
    || pendingBooking?.room?.Ezee_Key
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

  // Local overrides in case session was missing keys
  const [apiKeyOverride, setApiKeyOverride] = useState('');
  const [hotelCodeOverride, setHotelCodeOverride] = useState('');
  const [roomTypeIdOverride, setRoomTypeIdOverride] = useState('');
  const [rateTypeIdOverride, setRateTypeIdOverride] = useState('');
  const [roomRateIdOverride, setRoomRateIdOverride] = useState('');
  const [fetchingKey, setFetchingKey] = useState(false);

  const effectiveHotelCode = hotelCodeOverride || resolvedHotelCode || '';
  const effectiveApiKey = apiKeyOverride || resolvedApiKey || '';
  const effectiveRoomTypeId = roomTypeIdOverride || resolvedRoomTypeId || '';
  const effectiveRateTypeId = rateTypeIdOverride || resolvedRateTypeId || effectiveRoomTypeId || '';
  const effectiveRoomRateId = roomRateIdOverride || resolvedRoomRateId || effectiveRoomTypeId || '';

  // Auto-fetch APIKey from Zoho All_Building_Report if missing from session
  useEffect(() => {
    const autoFetchApiKey = async () => {
      if (!resolvedApiKey && effectiveHotelCode && !apiKeyOverride) {
        setFetchingKey(true);
        try {
          const refreshToken = await getData('refreshToken');
          const res = await zohoAxios.get(
            `/zoho-api/api/v2/brandontan18/housekeeping-system/report/All_Building_Report?Active=Active&Booking_Engine_Active=true`,
            { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
          );
          if (res?.data?.code === 3000 && Array.isArray(res.data.data)) {
            const match = res.data.data.find(b => String(b.Ezee_Hotel_ID).trim() === String(effectiveHotelCode).trim());
            if (match?.Ezee_Key) {
              console.log('🔑 Auto-resolved Ezee_Key from Zoho:', match.Ezee_Key);
              setApiKeyOverride(match.Ezee_Key);
            }
          }
        } catch (err) {
          console.warn('Could not auto-fetch apiKey from Zoho:', err);
        } finally {
          setFetchingKey(false);
        }
      }
    };
    autoFetchApiKey();
  }, [resolvedApiKey, effectiveHotelCode, apiKeyOverride]);

  // Construct or retrieve bookingPayload
  const bookingPayload = {
    ...rawPayload,
    hotelCode: effectiveHotelCode,
    apiKey: effectiveApiKey,
    roomTypeId: effectiveRoomTypeId,
    rateTypeId: effectiveRateTypeId,
    roomRateId: effectiveRoomRateId,
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

  // Construct official eZee BookingData JSON format per specification
  const numRoomsInt = Math.max(1, parseInt(bookingPayload.numRooms || 1, 10));
  const roomDetails = {};
  for (let i = 1; i <= numRoomsInt; i++) {
    const roomKey = `Room_${i}`;
    const rawPrice = pendingBooking?.room?.room_rates_info?.totalprice_inclusive_all
      || pendingBooking?.room?.room_rates_info?.rack_rate
      || bookingPayload.totalAmount
      || bookingPayload.subtotalAmount
      || '0';
    const perRoomBaseRate = (parseFloat(rawPrice) / numRoomsInt).toFixed(2);

    const rObj = {
      Rateplan_Id: String(effectiveRoomRateId || effectiveRoomTypeId || ''),
      Ratetype_Id: String(effectiveRateTypeId || effectiveRoomTypeId || ''),
      Roomtype_Id: String(effectiveRoomTypeId || ''),
      baserate: String(perRoomBaseRate),
      extradultrate: String(pendingBooking?.room?.room_rates_info?.extradultrate || "0"),
      extrachildrate: String(pendingBooking?.room?.room_rates_info?.extrachildrate || "0"),
      number_adults: String(bookingPayload.numAdults || 1),
      number_children: String(bookingPayload.numChildren || 0),
      ExtraChild_Age: parseInt(bookingPayload.numChildren || 0, 10) > 0 ? String(bookingPayload.extraChildAge || "5") : "",
      Title: String(bookingPayload.guest?.title || 'Mr.'),
      First_Name: String(bookingPayload.guest?.firstName || 'Guest').trim() || 'Guest',
      Last_Name: String(bookingPayload.guest?.lastName || 'User').trim() || 'User',
      Gender: '',
      SpecialRequest: ''
    };

    // Note: Only include Promotion_Details if an actual eZee Promotion_Id exists,
    // otherwise passing empty Promotion_Id triggers ParametersMissing error.
    if (bookingPayload.appliedPromo?.id && bookingPayload.appliedPromo?.code) {
      rObj.Promotion_Details = {
        Promotional_Code: String(bookingPayload.appliedPromo.code),
        Promotion_Id: String(bookingPayload.appliedPromo.id),
        Promotion_Name: String(bookingPayload.appliedPromo.name || bookingPayload.appliedPromo.code),
        Promotion_Description: String(bookingPayload.appliedPromo.type || '')
      };
    }

    roomDetails[roomKey] = rObj;
  }

  const bookingData = {
    Room_Details: roomDetails,
    check_in_date: bookingPayload.checkInDate,
    check_out_date: bookingPayload.checkOutDate,
    Booking_Payment_Mode: paymentData.channel || 'Online',
    Email_Address: String(bookingPayload.guest?.email || 'guest@cobnb.com').trim() || 'guest@cobnb.com',
    Source_Id: '',
    MobileNo: String(bookingPayload.guest?.phone || '').trim(),
    Address: '',
    State: '',
    Country: 'Malaysia',
    City: '',
    Zipcode: '',
    Fax: '',
    Device: 'DESKTOP',
    Languagekey: 'en',
    paymenttypeunkid: ''
  };

  const handleCopyJson = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(bookingData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) { }
  };

  // Call eZee InsertBooking API on Make Booking button press
  const callBookingApi = async () => {
    // 1. Mandatory validation per eZee documentation
    const missing = [];
    if (!effectiveHotelCode) missing.push('HotelCode');
    if (!effectiveApiKey) missing.push('APIKey');
    if (!effectiveRoomTypeId) missing.push('Roomtype_Id');
    if (!effectiveRateTypeId && !effectiveRoomTypeId) missing.push('Ratetype_Id');
    if (!effectiveRoomRateId && !effectiveRoomTypeId) missing.push('Rateplan_Id');
    if (!bookingPayload.checkInDate || bookingPayload.checkInDate === 'YYYY-MM-DD') missing.push('check_in_date');
    if (!bookingPayload.checkOutDate || bookingPayload.checkOutDate === 'YYYY-MM-DD') missing.push('check_out_date');

    if (missing.length > 0) {
      setBookingError(`Missing mandatory eZee parameters: ${missing.join(', ')}. Please verify or enter values below.`);
      return;
    }

    setBookingLoading(true);
    setBookingError(null);
    try {
      console.log('🚀 Calling eZee InsertBooking API:');
      console.log('HotelCode:', effectiveHotelCode);
      console.log('APIKey:', effectiveApiKey ? `${effectiveApiKey.slice(0, 4)}...${effectiveApiKey.slice(-4)}` : '(EMPTY)');
      console.log('BookingData:', bookingData);

      // eZee listing.php requires POST with application/x-www-form-urlencoded
      const formParams = new URLSearchParams();
      formParams.append('request_type', 'InsertBooking');
      formParams.append('HotelCode', String(effectiveHotelCode).trim());
      formParams.append('APIKey', String(effectiveApiKey).trim());
      formParams.append('BookingData', JSON.stringify(bookingData));

      const url = `/ezee-api/booking/reservation_api/listing.php?request_type=InsertBooking&HotelCode=${encodeURIComponent(effectiveHotelCode)}&APIKey=${encodeURIComponent(effectiveApiKey)}`;

      const response = await axios.post(url, formParams, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      console.log('✅ eZee InsertBooking API Response:', response?.data);
      setBookingLoading(false);

      const data = response?.data;
      let isError = false;
      let errDetail = '';

      if (Array.isArray(data) && data[0]?.['Error Details']) {
        isError = true;
        const eObj = data[0]['Error Details'];
        errDetail = `${eObj.Error_Code}: ${eObj.Error_Message}`;
      } else if (Array.isArray(data) && data[0]?.Error_Message) {
        isError = true;
        errDetail = data[0].Error_Message;
      } else if (data?.error || data?.Error || data?.Errors) {
        isError = true;
        errDetail = data.error || data.Error || data.Errors;
      } else if (typeof data === 'string' && (data.includes('Missing') || data.includes('Error') || data.includes('DENIED') || data.includes('UNAUTH') || data === '-1')) {
        isError = true;
        errDetail = data;
      }

      const resNumber = data?.ReservationNo ||
        (Array.isArray(data) && data[0]?.ReservationNo) ||
        data?.reservation_no ||
        data?.SubReservationNo?.[0] ||
        data?.Booking_No ||
        data?.id;

      const hasReservation = Boolean(resNumber);

      if (!isError && (hasReservation || data?.success)) {
        // When payment is captured, auto-confirm the reservation to mark it as Paid & Confirmed in eZee PMS (same as RES14735)
        let confirmedBookingData = Array.isArray(data) ? data[0] : data;
        if (resNumber && isSuccess) {
          try {
            const inventoryMode = data?.Inventory_Mode || (Array.isArray(data) && data[0]?.Inventory_Mode) || 'REGULAR';
            const processData = {
              Action: 'ConfirmBooking',
              ReservationNo: String(resNumber),
              Inventory_Mode: String(inventoryMode),
              Error_Text: ''
            };
            const processUrl = `/ezee-api/booking/reservation_api/listing.php?request_type=ProcessBooking&HotelCode=${encodeURIComponent(effectiveHotelCode)}&APIKey=${encodeURIComponent(effectiveApiKey)}&Process_Data=${encodeURIComponent(JSON.stringify(processData))}`;
            const processRes = await axios.get(processUrl);
            console.log('✅ eZee ProcessBooking (Auto-Confirmed & Paid) Response:', processRes?.data);
            confirmedBookingData = {
              ...confirmedBookingData,
              ReservationNo: resNumber,
              ReservationGuarantee: 'Confirm Booking',
              Confirmed_Type: '1',
              isPaid: true,
              paymentStatus: 'PAID'
            };
          } catch (procErr) {
            console.warn('⚠️ eZee ProcessBooking confirmation notice:', procErr);
          }
        }

        try {
          sessionStorage.removeItem('cobnb_pending_booking');
        } catch (_) { }

        navigate('/booking-confirmation', {
          state: {
            booking: confirmedBookingData,
            bookingPayload,
            bookingData,
            paymentData,
            room: pendingBooking?.room,
            hotelName: pendingBooking?.hotelName
          }
        });
      } else {
        setBookingError(typeof errDetail === 'object' ? JSON.stringify(errDetail) : String(errDetail || 'eZee reservation API could not confirm booking.'));
      }
    } catch (err) {
      console.error('Booking failed:', err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Booking API call failed.';
      setBookingError(typeof msg === 'object' ? JSON.stringify(msg) : String(msg));
      setBookingLoading(false);
    }
  };

  // Auto-call eZee InsertBooking API directly upon successful payment capture
  useEffect(() => {
    if (isSuccess && !hasCalledBookingRef.current && !fetchingKey) {
      if (effectiveHotelCode && effectiveApiKey) {
        hasCalledBookingRef.current = true;
        console.log('⚡ Direct auto-call callBookingApi triggered after payment capture');
        callBookingApi();
      } else if (!resolvedApiKey && !apiKeyOverride && effectiveHotelCode) {
        // Waiting for auto-fetch of apiKey from Zoho
      } else if (!effectiveHotelCode || !effectiveApiKey) {
        hasCalledBookingRef.current = true;
        setBookingError('Missing property credentials (HotelCode or APIKey). Please check booking details.');
      }
    }
  }, [isSuccess, fetchingKey, effectiveHotelCode, effectiveApiKey, resolvedApiKey, apiKeyOverride]);

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
          background: isSuccess
            ? (bookingLoading ? 'rgba(197, 168, 128, 0.15)' : 'rgba(16, 185, 129, 0.12)')
            : (isPending ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)')
        }}>
          {isSuccess && (
            bookingLoading
              ? <Loader2 size={38} color="var(--color-accent)" style={{ animation: 'spin 1s linear infinite' }} />
              : <CheckCircle2 size={40} color="#10b981" />
          )}
          {isPending && <AlertTriangle size={40} color="#f59e0b" />}
          {isFailed && <XCircle size={40} color="#ef4444" />}
          {!isSuccess && !isPending && !isFailed && <ShieldCheck size={40} color="var(--color-accent)" />}
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', margin: '0 0 8px 0', color: 'var(--color-text-main)' }}>
          {isSuccess
            ? (bookingLoading
                ? 'Confirming Your Reservation...'
                : (bookingError ? 'Payment Captured' : 'Payment Successful'))
            : (isPending ? 'Payment Pending' : (isFailed ? 'Payment Failed' : 'Payment Response Received'))}
        </h2>

        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', margin: '0 0 24px 0', lineHeight: 1.5 }}>
          {isSuccess
            ? (bookingLoading
                ? 'Your payment was approved! Please hold on a moment while we register and confirm your booking reservation...'
                : (bookingError
                    ? 'Your payment was captured, but there was an issue finalizing with the reservation system.'
                    : 'Your transaction was approved and processed by Fiuu.'))
            : (isPending
              ? 'Your payment is currently pending confirmation from the payment provider.'
              : (isFailed
                ? (paymentData.error_desc || 'The payment transaction could not be completed.')
                : 'Fiuu Gateway response screen.'))}
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
          {bookingLoading && (
            <div style={{
              background: 'rgba(197, 168, 128, 0.1)',
              border: '1px solid rgba(197, 168, 128, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              color: 'var(--color-accent)',
              fontSize: '14px',
              fontWeight: 600
            }}>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              Connecting to property reservation system to finalize booking...
            </div>
          )}

          {bookingError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#ef4444', fontWeight: 700 }}>
                    Booking Confirmation Notice
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-main)', lineHeight: 1.5 }}>
                    {bookingError}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => callBookingApi()}
                  disabled={bookingLoading}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--color-accent)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: bookingLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RotateCcw size={14} /> Retry Confirmation
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/booking-confirmation', {
                      state: {
                        booking: { success: true, Booking_No: paymentData.orderid, isPaid: true },
                        bookingPayload,
                        paymentData,
                        room: pendingBooking?.room,
                        hotelName: pendingBooking?.hotelName
                      }
                    });
                  }}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-main)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Proceed to Confirmation
                </button>
              </div>
            </div>
          )}

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
                    Payment Failed
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
                      {paymentData.error_desc || 'The payment transaction could not be authorized or was cancelled in the Fiuu payment gateway.'}
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
