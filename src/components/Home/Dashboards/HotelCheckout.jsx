import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Moon, User, Lock, CreditCard, Tag, ShieldCheck, ChevronRight, Info } from 'lucide-react';
import { getData } from '../../../utility/LocalStorageService';

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
    termsAccepted: false
  });

  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDetailsStr = await getData('userDetails');
      if (userDetailsStr) {
        const userDetails = JSON.parse(userDetailsStr);
        const fullName = userDetails.Name || '';
        const nameParts = fullName.split(' ');
        
        setFormData(prev => ({
          ...prev,
          firstName: nameParts[0] || '',
          lastName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : '',
          mobile: userDetails.Phone_Number || '',
          email: userDetails.Email || '',
        }));
      }
    } catch (e) {
      console.error('Failed to load user data', e);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return;
    setIsApplying(true);
    setTimeout(() => {
      setPromoApplied(true);
      setIsApplying(false);
    }, 800);
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setPromoApplied(false);
  };

  const handleBookNow = () => {
    alert("Booking API is currently disabled. This is a mockup for design purposes.");
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

  const price = room.room_rates_info?.totalprice_inclusive_all || room.room_rates_info?.rack_rate || 0;
  const currencySign = room.currency_sign || 'RM';
  const subtotal = (parseFloat(price) * parseInt(numRooms)).toFixed(2);
  const discountAmount = promoApplied ? (parseFloat(subtotal) * 0.1).toFixed(2) : 0; // 10% discount static
  const totalPrice = (parseFloat(subtotal) - discountAmount).toFixed(2);

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
    <div style={{ minHeight: '100vh', padding: '80px 24px 60px', background: 'var(--color-bg-main)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => navigate(-1)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
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
            
            {/* Guest Info Card */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={18} />
                </div>
                <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-main)', fontSize: '18px', margin: 0 }}>Guest Details</h2>
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
                    <label style={labelStyle}>First Name <span style={{color: '#ef4444'}}>*</span></label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="e.g. John" style={inputStyle} />
                  </div>
                </div>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Last Name <span style={{color: '#ef4444'}}>*</span></label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="e.g. Doe" style={inputStyle} />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Email Address <span style={{color: '#ef4444'}}>*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" style={inputStyle} />
                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><Lock size={10} /> Booking confirmation will be sent here</p>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px' }}>
                  <div style={{ flex: '0 0 100px' }}>
                    <label style={labelStyle}>Code</label>
                    <select name="countryCode" value={formData.countryCode} onChange={handleInputChange} style={inputStyle}>
                      <option value="+60">MY (+60)</option>
                      <option value="+65">SG (+65)</option>
                      <option value="+1">US (+1)</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Phone Number <span style={{color: '#ef4444'}}>*</span></label>
                    <input type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange} placeholder="123 456 7890" style={inputStyle} />
                  </div>
                </div>
              </div>
            </div>

            {/* Promo Code Section */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Tag size={18} />
                </div>
                <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-main)', fontSize: '18px', margin: 0 }}>Promo Code</h2>
              </div>
              
              {!promoApplied ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="Enter voucher code" 
                    value={promoCode} 
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    style={{ ...inputStyle, textTransform: 'uppercase' }}
                  />
                  <button 
                    onClick={handleApplyPromo}
                    disabled={isApplying || !promoCode}
                    style={{ padding: '0 20px', background: promoCode ? 'var(--color-accent)' : 'var(--color-bg-main)', color: promoCode ? '#fff' : 'var(--color-text-muted)', border: promoCode ? 'none' : '1px solid var(--color-border)', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: promoCode ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
                  >
                    {isApplying ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#10b981', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <Check size={12} />
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, color: '#10b981', display: 'block', fontSize: '13px' }}>{promoCode} Applied!</span>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>You saved {currencySign} {discountAmount}</span>
                    </div>
                  </div>
                  <button onClick={handleRemovePromo} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                </div>
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
              
              <div style={{ padding: '12px', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CreditCard size={20} color="var(--color-text-muted)" />
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--color-text-main)', fontSize: '14px' }}>Secure Online Payment</h4>
                    <p style={{ margin: '2px 0 0 0', color: 'var(--color-text-muted)', fontSize: '12px' }}>Cards, UPI, and Net Banking supported</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{ width: '32px', height: '18px', background: '#ff5f00', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '8px', fontWeight: 'bold' }}>MC</div>
                  <div style={{ width: '32px', height: '18px', background: '#1a1f71', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '8px', fontWeight: 'bold' }}>VISA</div>
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
                      {room.Room_Name || room.Roomtype_Name}
                    </h3>
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
                  
                  {promoApplied && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
                      <span>Promo Discount ({promoCode})</span>
                      <span>-{currencySign} {discountAmount}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    <span>Taxes & Fees</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>Included</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '16px', borderTop: '2px solid var(--color-bg-main)' }}>
                    <span style={{ fontSize: '16px', color: 'var(--color-text-main)', fontWeight: 800 }}>Total Payable</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '22px', color: 'var(--color-accent)', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>{currencySign} {totalPrice}</span>
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
    </div>
  );
};

export default HotelCheckout;
