import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Moon, User, Lock, CreditCard, Tag, ShieldCheck, ChevronRight, Info, Sparkles, AlertCircle } from 'lucide-react';
import { getData } from '../../../utility/LocalStorageService';
import zohoAxios from '../../../utility/axiosInstance';
import { md5 } from '../../../utility/md5';
import { COUNTRY_CODES, POPULAR_COUNTRY_ISOS } from '../../../constants/countryCodes';

const HotelCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const {
    room,
    hotelName,
    checkInDate,
    checkOutDate,
    adults,
    children,
    numRooms,
    nightCount
  } = state;

  const [formData, setFormData] = useState({
    title: 'Mr.',
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    countryCode: '+60',
    countryIso: 'MY',
    termsAccepted: false
  });

  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [promoError, setPromoError] = useState(null);
  const [appliedPromoData, setAppliedPromoData] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    loadUserData();
  }, []);

  // Auto-fill logged-in user details on name, email, phone
  const loadUserData = async () => {
    try {
      const userDetailsStr = await getData('userDetails');
      if (userDetailsStr) {
        const user = typeof userDetailsStr === 'string' ? JSON.parse(userDetailsStr) : userDetailsStr;

        let firstName = user.first_name || user.Guest_Name?.first_name || '';
        let lastName = user.last_name || user.Guest_Name?.last_name || '';
        const prefix = user.Guest_Name?.prefix || user.title || 'Mr.';

        if (!firstName && !lastName) {
          const fullName = user.Name || user.User_Name || user.Guest_Name?.display_value || '';
          const nameParts = fullName.trim().split(/\s+/);
          firstName = nameParts[0] || '';
          lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        }

        const email = user.member_email || user.Email || user.email || '';
        const rawPhone = user.Phone_Number || user.Loyalty_member_phone_no || user.phone || user.Mobile || '';

        // Extract country code if present
        let countryCode = '+60';
        let countryIso = 'MY';
        let mobile = rawPhone;
        if (typeof rawPhone === 'string') {
          const trimmedPhone = rawPhone.trim();
          // Match against known country codes, longest code first
          const sortedByLength = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
          const matchedCountry = sortedByLength.find(c => trimmedPhone.startsWith(c.code));
          if (matchedCountry) {
            countryCode = matchedCountry.code;
            countryIso = matchedCountry.iso;
            mobile = trimmedPhone.slice(matchedCountry.code.length).trim();
          } else if (trimmedPhone.startsWith('+')) {
            const match = trimmedPhone.match(/^(\+\d{1,4})(.*)$/);
            if (match) {
              countryCode = match[1];
              mobile = match[2].trim();
              const found = COUNTRY_CODES.find(c => c.code === match[1]);
              if (found) countryIso = found.iso;
            }
          }
        }

        // Also check if user object has Country field (e.g. from Zoho Creator profile)
        const userCountryName = user.Country || user.country || '';
        if (userCountryName) {
          const matchedByCountry = COUNTRY_CODES.find(c =>
            c.name.toLowerCase() === userCountryName.toLowerCase() ||
            c.iso.toLowerCase() === userCountryName.toLowerCase()
          );
          if (matchedByCountry) {
            countryIso = matchedByCountry.iso;
            countryCode = matchedByCountry.code;
          }
        }

        setFormData(prev => ({
          ...prev,
          title: prefix && (prefix.startsWith('M') || prefix.startsWith('D')) ? prefix : prev.title,
          firstName: firstName || prev.firstName,
          lastName: lastName || prev.lastName,
          email: email || prev.email,
          countryCode: countryCode,
          countryIso: countryIso,
          mobile: mobile || prev.mobile
        }));
      }
    } catch (e) {
      console.error('Failed to load user data', e);
    }
  };

  const handleCountryCodeChange = (e) => {
    const selectedIso = e.target.value;
    const country = COUNTRY_CODES.find(c => c.iso === selectedIso);
    if (country) {
      setFormData(prev => ({
        ...prev,
        countryIso: country.iso,
        countryCode: country.code
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Base pricing calculations
  const price = room?.room_rates_info?.totalprice_inclusive_all || room?.room_rates_info?.rack_rate || 0;
  const currencySign = room?.currency_sign || 'RM';
  const subtotal = (parseFloat(price) * parseInt(numRooms || 1, 10)).toFixed(2);
  const discountAmount = promoApplied && appliedPromoData ? parseFloat(appliedPromoData.discountAmount || 0) : 0;
  const totalPrice = Math.max(0, parseFloat(subtotal) - discountAmount).toFixed(2);

  // Promo Code Validation & Calculation:
  // Handles all 3 types:
  // 1. Flat Off (FLAT Rate)
  // 2. Percentage Off (Percentage)
  // 3. Night Extra (No. Of Nights)
  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    setIsApplying(true);
    setPromoError(null);

    try {
      // Fetch all promo codes directly from Promotion_Code_Online_Booking_Report
      const res = await zohoAxios.get('/zoho-api/api/v2/brandontan18/housekeeping-system/report/Promotion_Code_Online_Booking_Report');
      const promoList = (res?.data?.code === 3000 && Array.isArray(res.data.data)) ? res.data.data : [];

      const match = promoList.find(p => (p.Promo_Code || '').trim().toUpperCase() === code);

      if (!match) {
        setPromoError('Invalid coupon code. Please verify and try again.');
        setIsApplying(false);
        return;
      }

      // 1. Expiration & Validity Dates Check (From_Date, To_Date, DateExpired)
      const todayStr = new Date().toISOString().split('T')[0];
      const expiry = match.DateExpired || match.To_Date;
      if (expiry && todayStr > expiry) {
        setPromoError(`This promo code expired on ${expiry}.`);
        setIsApplying(false);
        return;
      }
      if (match.From_Date && todayStr < match.From_Date) {
        setPromoError(`This promo code is only valid starting from ${match.From_Date}.`);
        setIsApplying(false);
        return;
      }

      // 2. Minimum Stay Validation (Minimum_Required_Qty)
      const parsedNights = Math.max(1, parseInt(nightCount, 10) || 1);
      if (match.Minimum_Required_Qty) {
        const minNights = parseInt(match.Minimum_Required_Qty, 10);
        if (minNights > 0 && parsedNights < minNights) {
          setPromoError(`This promo code requires a minimum stay of ${minNights} nights (current stay: ${parsedNights} night${parsedNights > 1 ? 's' : ''}).`);
          setIsApplying(false);
          return;
        }
      }

      // 3. Property / Building Validation
      if (Array.isArray(match.Building_Name) && match.Building_Name.length > 0 && hotelName) {
        const matchesBuilding = match.Building_Name.some(b => {
          const bName = typeof b === 'object' ? b.display_value : String(b);
          return bName && (hotelName.toLowerCase().includes(bName.toLowerCase()) || bName.toLowerCase().includes(hotelName.toLowerCase()));
        });
        if (!matchesBuilding) {
          const validBuildings = match.Building_Name.map(b => (typeof b === 'object' ? b.display_value : b)).join(', ');
          setPromoError(`This promo code is only valid for: ${validBuildings}.`);
          setIsApplying(false);
          return;
        }
      }

      // 4. Calculate Discount based on Promotion_Type1:
      // - FLAT Rate
      // - Percentage
      // - No. Of Nights
      const promoType = (match.Promotion_Type1 || '').trim();
      let calculatedDiscount = 0;
      let badgeLabel = '';
      let typeLabel = '';
      let promoDesc = '';

      const numericSubtotal = parseFloat(subtotal) || 0;

      // TYPE 1: Flat Off
      if (promoType.toLowerCase().includes('flat')) {
        typeLabel = 'Flat Rate Off';
        const flatVal = parseFloat(match.Flat_Rate_Discount || 0);
        calculatedDiscount = Math.min(numericSubtotal, flatVal);
        badgeLabel = `Flat ${currencySign} ${flatVal.toFixed(2)} Off`;
        promoDesc = `Flat reduction of ${currencySign} ${flatVal.toFixed(2)} applied directly to your booking.`;
      }
      // TYPE 2: Percentage Off
      else if (promoType.toLowerCase().includes('percent')) {
        typeLabel = 'Percentage Discount';
        const pctVal = parseFloat(match.Percent_Discount || 0);
        calculatedDiscount = (numericSubtotal * pctVal) / 100;
        badgeLabel = `${pctVal}% Off Total`;
        promoDesc = `${pctVal}% discount applied across ${numRooms || 1} room(s) for ${parsedNights} night(s).`;
      }
      // TYPE 3: Night Extra / Free Night Stay
      else if (promoType.toLowerCase().includes('night')) {
        typeLabel = 'Free Night Stay';
        const freeNights = parseInt(match.Number_of_Free_Nights || 1, 10);
        const pricePerNight = numericSubtotal / parsedNights;
        const applicableFreeNights = Math.min(freeNights, parsedNights);
        calculatedDiscount = pricePerNight * applicableFreeNights;
        badgeLabel = `${applicableFreeNights} Night${applicableFreeNights > 1 ? 's' : ''} Free!`;
        promoDesc = `Get ${applicableFreeNights} complimentary night${applicableFreeNights > 1 ? 's' : ''} on your ${parsedNights}-night reservation.`;
      } else {
        typeLabel = 'Special Offer';
        calculatedDiscount = 0;
        badgeLabel = 'Offer Applied';
        promoDesc = match.Title || 'Special offer applied.';
      }

      setAppliedPromoData({
        code: match.Promo_Code || code,
        title: match.Title || badgeLabel,
        type: typeLabel,
        rawType: promoType,
        discountAmount: calculatedDiscount.toFixed(2),
        badgeLabel: badgeLabel,
        description: promoDesc,
        expiryDate: match.DateExpired || match.To_Date || '',
        fromDate: match.From_Date || '',
        fullPromo: match
      });
      setPromoApplied(true);
      setPromoError(null);
    } catch (err) {
      console.error('Failed to validate promo code:', err);
      setPromoError('Failed to validate promo code: ' + (err.message || ''));
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setPromoApplied(false);
    setAppliedPromoData(null);
    setPromoError(null);
  };

  // Complete Booking & Open Fiuu Payment Gateway
  const handleBookNow = () => {
    // 1. Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert('Please enter your first and last name.');
      return;
    }
    if (!formData.email.trim()) {
      alert('Please enter your email address.');
      return;
    }
    if (!formData.mobile.trim()) {
      alert('Please enter your phone number.');
      return;
    }
    if (!formData.termsAccepted) {
      alert('Please accept the Terms & Conditions and Privacy Policy.');
      return;
    }

    // Resolve IDs with multiple safe fallbacks (state, room, rawEzee, rawZoho, cobnb_hotel_selection)
    const savedHotelInfo = (() => {
      try {
        return JSON.parse(sessionStorage.getItem('cobnb_hotel_selection') || '{}');
      } catch (_) {
        return {};
      }
    })();

    const resolvedHotelCode = state.hotelCode
      || room?.hotelcode
      || room?.Hotel_Code
      || room?.HotelCode
      || room?.rawEzee?.hotelcode
      || savedHotelInfo.hotelCode
      || '';

    const resolvedRoomTypeId = room?.roomtypeunkid
      || room?.rawEzee?.roomtypeunkid
      || room?.rawZoho?.Ezee_Room_Type_ID
      || room?.Ezee_Room_Type_ID
      || '';

    const resolvedRateTypeId = room?.ratetypeunkid
      || room?.rawEzee?.ratetypeunkid
      || room?.Rate_Type_ID
      || '';

    const resolvedRoomRateId = room?.roomrateunkid
      || room?.rawEzee?.roomrateunkid
      || room?.Room_Rate_ID
      || '';

    const resolvedApiKey = state.apiKey
      || room?.apiKey
      || room?.rawEzee?.apiKey
      || room?.Ezee_Key
      || savedHotelInfo.apiKey
      || '';

    // 2. Prepare Booking Payload for Debug / Post-Payment Booking
    const bookingPayload = {
      hotelCode: resolvedHotelCode,
      apiKey: resolvedApiKey,
      roomTypeId: resolvedRoomTypeId,
      rateTypeId: resolvedRateTypeId,
      roomRateId: resolvedRoomRateId,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      numAdults: adults,
      numChildren: children,
      numRooms: numRooms,
      guest: {
        title: formData.title,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: `${formData.countryCode}${formData.mobile}`
      },
      appliedPromo: appliedPromoData ? {
        code: appliedPromoData.code,
        discount: appliedPromoData.discountAmount,
        type: appliedPromoData.type
      } : null,
      subtotalAmount: subtotal,
      discountAmount: discountAmount,
      totalAmount: totalPrice
    };

    /*
    ====================================================================
    BOOK ROOM API CALL (REMAINS COMMENTED OUT AS REQUESTED)
    ====================================================================
    try {
      const response = await axios.post('/ezee-api/booking/reservation_api/booking.php', bookingPayload);
      if (response.data?.success) {
        navigate('/booking-confirmation', { state: { booking: response.data } });
      }
    } catch (err) {
      console.error('Booking failed:', err);
    }
    ====================================================================
    */

    // 3. Fiuu Sandbox Credentials
    const merchantID = 'SB_cobnb';
    const verifyKey = '5fe17c396eed59f4c93aaeb419367441';
    const secretKey = 'bad8dd13835f4668e32609a50adf991b';

    const orderid = 'COBNB-' + Date.now();
    const formattedAmount = (parseFloat(totalPrice) || 0).toFixed(2);
    // vcode = md5(amount + merchantID + orderid + verify_key)
    const vcode = md5(formattedAmount + merchantID + orderid + verifyKey);

    const billName = `${formData.firstName} ${formData.lastName}`.trim() || 'CoBnb Guest';
    const cleanMobile = formData.mobile.replace(/^0+/, '');
    const billMobile = `${formData.countryCode || '+60'}${cleanMobile}`.replace(/\s+/g, '');
    const billEmail = formData.email.trim() || 'guest@cobnb.com';
    const billDesc = `${room.Room_Name || 'Room Booking'} - ${hotelName || 'CoBnb'}`.slice(0, 95);
    const returnUrl = `${window.location.origin}/payment-return`;

    // Save pending booking details and bookingPayload in sessionStorage
    try {
      sessionStorage.setItem('cobnb_pending_booking', JSON.stringify({
        orderid,
        amount: formattedAmount,
        currency: currencySign || 'MYR',
        bookingPayload,
        room: {
          ...room,
          hotelcode: resolvedHotelCode,
          apiKey: resolvedApiKey,
          roomtypeunkid: resolvedRoomTypeId,
          ratetypeunkid: resolvedRateTypeId,
          roomrateunkid: resolvedRoomRateId
        },
        hotelCode: resolvedHotelCode,
        apiKey: resolvedApiKey,
        hotelName: hotelName || savedHotelInfo.hotelName || 'CoBnb',
        checkInDate,
        checkOutDate,
        adults,
        children,
        numRooms,
        nightCount,
        formData,
        appliedPromoData,
        secretKey
      }));
    } catch (_) { }

    console.group('%c💳 Initiating Fiuu Payment Gateway', 'color: #3b82f6; font-size: 14px; font-weight: bold;');
    console.log('Merchant ID:', merchantID);
    console.log('Order ID:', orderid);
    console.log('Amount:', formattedAmount);
    console.log('vcode (MD5):', vcode);
    console.log('Return URL:', returnUrl);
    console.groupEnd();

    // 3. Open Fiuu Payment Gateway via auto-submitting POST form
    const paymentUrl = `https://sandbox-payment.fiuu.com/MOLPay/pay/${merchantID}/`;
    const form = document.createElement('form');
    form.setAttribute('method', 'POST');
    form.setAttribute('action', paymentUrl);
    form.setAttribute('style', 'display: none;');

    const fields = {
      amount: formattedAmount,
      orderid: orderid,
      bill_name: billName,
      bill_email: billEmail,
      bill_mobile: billMobile,
      bill_desc: billDesc,
      country: formData.countryIso || 'MY',
      cur: 'MYR',
      vcode: vcode,
      returnurl: returnUrl
    };

    Object.entries(fields).forEach(([key, val]) => {
      const input = document.createElement('input');
      input.setAttribute('type', 'hidden');
      input.setAttribute('name', key);
      input.setAttribute('value', String(val));
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  if (!room) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', background: 'var(--color-bg-main)' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-main)', fontSize: '20px' }}>Invalid Session</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Please select a room first before proceeding to checkout.</p>
        <button onClick={() => navigate('/hotel-availability')} style={{ padding: '10px 20px', background: 'var(--color-accent)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>Back to Search</button>
      </div>
    );
  }

  const roomImage = room.room_main_image || (Array.isArray(room.RoomImages) && room.RoomImages.length > 0 ? room.RoomImages[0].image : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');

  // Shared Styles
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-main)',
    color: 'var(--color-text-main)',
    fontSize: '14px',
    transition: 'all 0.2s',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
    fontWeight: '600',
    marginBottom: '6px',
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const cardStyle = {
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
    marginBottom: '20px',
    position: 'relative',
    overflow: 'hidden'
  };

  return (
    <div className="hotel-checkout-page" style={{ minHeight: '100vh', padding: '80px 24px 60px', background: 'var(--color-bg-main)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => navigate(-1)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <ArrowLeft size={18} color="var(--color-text-main)" />
          </button>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-main)', fontSize: '24px', margin: 0, fontWeight: 800 }}>Complete Booking</h1>
            <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0 0', fontSize: '13px' }}>Almost there! Just a few more details.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>

          {/* Left Column: Form & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>

            {/* Guest Info Card (Auto-filled from logged-in user) */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={18} />
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-main)', fontSize: '18px', margin: 0 }}>Guest Details</h2>
                </div>
                <span style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>Auto-Filled</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px' }}>
                  <div style={{ flex: '0 0 80px' }}>
                    <label style={labelStyle}>Title</label>
                    <select name="title" value={formData.title} onChange={handleInputChange} style={inputStyle}>
                      <option>Mr.</option>
                      <option>Ms.</option>
                      <option>Mrs.</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>First Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="e.g. John" style={inputStyle} />
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="e.g. Doe" style={inputStyle} />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" style={inputStyle} />
                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><Lock size={10} /> Booking confirmation will be sent here</p>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px', minWidth: '160px', maxWidth: '280px' }}>
                    <label style={labelStyle}>Country / Code</label>
                    <select
                      name="countryIso"
                      value={formData.countryIso || 'MY'}
                      onChange={handleCountryCodeChange}
                      style={{
                        ...inputStyle,
                        cursor: 'pointer',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      <optgroup label="Popular Countries">
                        {POPULAR_COUNTRY_ISOS.map(iso => {
                          const c = COUNTRY_CODES.find(item => item.iso === iso);
                          if (!c) return null;
                          return (
                            <option key={`pop-${c.iso}`} value={c.iso}>
                              {c.flag} {c.name} ({c.code})
                            </option>
                          );
                        })}
                      </optgroup>
                      <optgroup label="All Countries">
                        {COUNTRY_CODES.map(c => (
                          <option key={`all-${c.iso}`} value={c.iso}>
                            {c.flag} {c.name} ({c.code})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <div style={{ flex: '2 1 200px' }}>
                    <label style={labelStyle}>Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="123 456 7890"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Promo Code Section (Zoho Creator Promotion_Code_Online_Booking_Report) */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Tag size={18} />
                </div>
                <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-main)', fontSize: '18px', margin: 0 }}>Promo Code</h2>
              </div>

              {!promoApplied ? (
                <div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="e.g. STAY10"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        if (promoError) setPromoError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyPromo();
                        }
                      }}
                      style={{ ...inputStyle, textTransform: 'uppercase' }}
                    />
                    <button
                      onClick={handleApplyPromo}
                      disabled={isApplying || !promoCode.trim()}
                      style={{
                        padding: '0 20px',
                        background: promoCode.trim() ? 'var(--color-accent)' : 'var(--color-bg-main)',
                        color: promoCode.trim() ? '#fff' : 'var(--color-text-muted)',
                        border: promoCode.trim() ? 'none' : '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: promoCode.trim() && !isApplying ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isApplying ? 'Validating...' : 'Apply Code'}
                    </button>
                  </div>

                  {promoError && (
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '12px', background: 'rgba(239, 68, 68, 0.08)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <span>{promoError}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Attractive Promo View Below with Full Details */
                appliedPromoData && (
                  <div style={{
                    marginTop: '4px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.14) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '14px',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.08)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Decorative glow */}
                    <div style={{
                      position: 'absolute',
                      top: '-30px',
                      right: '-30px',
                      width: '100px',
                      height: '100px',
                      background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)',
                      pointerEvents: 'none'
                    }} />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          background: '#10b981',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                        }}>
                          <Sparkles size={16} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: '800', color: '#10b981', letterSpacing: '0.5px' }}>
                              {appliedPromoData.code}
                            </span>
                            <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', background: 'rgba(16, 185, 129, 0.2)', color: '#059669', padding: '2px 8px', borderRadius: '10px' }}>
                              {appliedPromoData.type}
                            </span>
                            {appliedPromoData.expiryDate && (
                              <span style={{ fontSize: '10px', fontWeight: '600', background: 'rgba(255, 255, 255, 0.5)', color: 'var(--color-text-muted)', padding: '2px 8px', borderRadius: '10px' }}>
                                Expires: {appliedPromoData.expiryDate}
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '2px 0 0 0', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                            {appliedPromoData.title}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleRemovePromo}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          fontSize: '12px',
                          fontWeight: '600',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        Remove
                      </button>
                    </div>

                    <div style={{ borderTop: '1px dashed rgba(16, 185, 129, 0.25)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                        {appliedPromoData.description}
                      </p>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Total Savings</span>
                        <strong style={{ fontSize: '16px', color: '#10b981', fontWeight: '800' }}>
                          -{currencySign} {appliedPromoData.discountAmount}
                        </strong>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Payment & Terms */}
            <div style={{ ...cardStyle, background: 'linear-gradient(145deg, var(--color-bg-secondary), var(--color-bg-main))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={18} />
                </div>
                <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-main)', fontSize: '18px', margin: 0 }}>Payment & Policies</h2>
              </div>

              <div style={{ padding: '14px', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(197, 168, 128, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CreditCard size={18} color="var(--color-accent)" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h4 style={{ margin: 0, color: 'var(--color-text-main)', fontSize: '14px', fontWeight: 700 }}>Fiuu Payment Gateway</h4>
                      <span style={{ fontSize: '10px', color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>SECURE</span>
                    </div>
                    <p style={{ margin: '3px 0 0 0', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                      Credit/Debit Cards, FPX Online Banking & E-Wallets supported
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <div style={{ padding: '3px 7px', background: 'var(--color-accent)', borderRadius: '4px', color: '#111', fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px' }}>FIUU</div>
                  <div style={{ padding: '3px 7px', background: '#005baa', borderRadius: '4px', color: '#fff', fontSize: '9px', fontWeight: 'bold' }}>FPX</div>
                  <div style={{ width: '32px', height: '18px', background: '#1a1f71', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '8px', fontWeight: 'bold' }}>VISA</div>
                  <div style={{ width: '32px', height: '18px', background: '#ff5f00', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '8px', fontWeight: 'bold' }}>MC</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '10px', borderRadius: '8px', transition: 'background 0.2s' }}>
                <div style={{ position: 'relative', top: '1px' }}>
                  <input type="checkbox" id="termsCheck" name="termsAccepted" checked={formData.termsAccepted} onChange={handleInputChange} style={{ width: '16px', height: '16px', accentColor: 'var(--color-accent)', cursor: 'pointer' }} />
                </div>
                <label htmlFor="termsCheck" style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.4', cursor: 'pointer' }}>
                  I acknowledge and agree to the <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Terms and Conditions</span> and <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Privacy Policy</span>.
                </label>
              </div>

              <button
                onClick={handleBookNow}
                disabled={!formData.termsAccepted}
                style={{
                  width: '100%',
                  padding: '14px',
                  marginTop: '24px',
                  background: formData.termsAccepted ? 'var(--color-accent)' : 'var(--color-bg-main)',
                  color: formData.termsAccepted ? '#fff' : 'var(--color-text-muted)',
                  border: formData.termsAccepted ? 'none' : '1px solid var(--color-border)',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: formData.termsAccepted ? 'pointer' : 'not-allowed',
                  boxShadow: formData.termsAccepted ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none',
                  transition: 'all 0.3s transform',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                Complete Booking <ChevronRight size={16} />
              </button>
            </div>

          </div>

          {/* Right Column: Order Summary (Sticky) */}
          <div style={{ position: 'sticky', top: '90px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ ...cardStyle, padding: 0 }}>

              <div style={{ height: '160px', backgroundImage: `url(${roomImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.9) 100%)', display: 'flex', alignItems: 'flex-end', padding: '20px' }}>
                  <div>
                    <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', color: '#fff', padding: '3px 10px', borderRadius: '16px', fontSize: '10px', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      {hotelName || 'Premium Stay'}
                    </div>
                    <h3 style={{ color: '#fff', fontSize: '20px', margin: 0, fontFamily: 'var(--font-heading)', textShadow: '0 2px 4px rgba(0,0,0,0.4)', lineHeight: 1.2 }}>
                      {room.Roomtype_Short_code || room.Roomtype_Name}
                    </h3>
                    <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', color: '#fff', padding: '3px 10px', borderRadius: '16px', fontSize: '10px', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      {room.Room_Name || room.Roomtype_Name}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px dashed var(--color-border)' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: 600 }}>Check-in</p>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-main)', margin: '0 0 2px 0', fontWeight: 600 }}>{checkInDate}</p>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>After 2:00 PM</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: 600 }}>Check-out</p>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-main)', margin: '0 0 2px 0', fontWeight: 600 }}>{checkOutDate}</p>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>Before 12:00 PM</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px dashed var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-main)', fontSize: '13px', fontWeight: 500 }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '6px', borderRadius: '6px', color: '#3b82f6' }}><Moon size={14} /></div>
                    {nightCount} Night{nightCount > 1 ? 's' : ''} Stay
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-main)', fontSize: '13px', fontWeight: 500 }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '6px', borderRadius: '6px', color: '#3b82f6' }}><User size={14} /></div>
                    {adults} Adult{adults > 1 ? 's' : ''}, {children} Child{children > 1 || children === 0 ? 'ren' : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--color-text-main)', fontWeight: 700 }}>Price Summary</h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    <span>{numRooms}x Room(s) x {nightCount} Night(s)</span>
                    <span style={{ fontWeight: 500 }}>{currencySign} {subtotal}</span>
                  </div>

                  {promoApplied && appliedPromoData && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Tag size={12} /> {appliedPromoData.badgeLabel} ({appliedPromoData.code})
                      </span>
                      <span>-{currencySign} {appliedPromoData.discountAmount}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    <span>Taxes & Fees</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>Included</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '16px', borderTop: '2px solid var(--color-bg-main)' }}>
                    <div>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-main)', display: 'block' }}>Total Price</span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Includes all taxes and discounts</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-accent)', fontFamily: 'var(--font-heading)' }}>
                        {currencySign} {totalPrice}
                      </div>
                      {discountAmount > 0 && (
                        <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                          Total saved: {currencySign} {discountAmount.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <Info size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ margin: 0, fontSize: '12px', color: '#3b82f6', lineHeight: 1.5 }}>
                <strong>Free cancellation</strong> until 48 hours before check-in. Need help? Call us at +60169352388.
              </p>
            </div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes checkoutSlideUp {
          0% {
            opacity: 0;
            transform: translateY(60px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .hotel-checkout-page {
          animation: checkoutSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform, opacity;
        }
      `}} />
    </div>
  );
};

export default HotelCheckout;
