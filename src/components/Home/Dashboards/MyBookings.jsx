import React, { useEffect, useState } from 'react';
import zohoAxios from '../../../utility/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Search, ChevronRight } from 'lucide-react';
import { getData, storeData } from '../../../utility/LocalStorageService';
import { fetchRefreshToken } from '../../../helper';

const MyBookings = () => {
  const navigate = useNavigate();
  const [myTrips, setMyTrips] = useState([]);
  const [myTrips1, setMyTrips1] = useState([]);
  const [finalTrips, setFinalTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, []);

  useEffect(() => {
    const idSet = new Set();
    myTrips.forEach(obj => obj?.ID && idSet.add(obj.ID));
    myTrips1.forEach(obj => obj?.ID && idSet.add(obj.ID));

    const mergedArray = [...idSet].map(id => {
      const obj1 = myTrips.find(obj => obj.ID === id);
      const obj2 = myTrips1.find(obj => obj.ID === id);
      return obj1 ? obj1 : obj2;
    });

    setFinalTrips(mergedArray);
  }, [myTrips, myTrips1]);

  const fetchUserDetails = async () => {
    try {
      const userDetails = await getData('userDetails');
      if (userDetails != null) {
        const parsed = JSON.parse(userDetails);
        if (parsed?.member_email) fetchMyTripsByEmail(parsed?.member_email);
        if (parsed?.Loyalty_member_phone_no) {
          fetchMyTripsByPhone(
            parsed?.Loyalty_member_phone_no.replace('+', '').replace(/\s/g, ''),
          );
        }
      }
    } catch (error) {
      console.log('fetchUserDetails error', error);
    }
  };

  const fetchMyTripsByEmail = async email => {
    try {
      setLoading(true);
      const refreshToken = await getData('refreshToken');
      const res = await zohoAxios.get(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/Property_Reservation_System_Report?guest_email=${email}`,
        { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } },
      );
      setLoading(false);
      if (res?.data?.code === 3000) setMyTrips(res?.data?.data || []);
    } catch (error) {
      setLoading(false);
      if (error?.response?.data?.code === 1030) fetchRefreshToken(fetchUserDetails);
    }
  };

  const fetchMyTripsByPhone = async phone => {
    try {
      setLoading(true);
      const refreshToken = await getData('refreshToken');
      const res = await zohoAxios.get(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/Property_Reservation_System_Report?Phone_number=%2B${phone}`,
        { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } },
      );
      setLoading(false);
      if (res?.data?.code === 3000) setMyTrips1(res?.data?.data || []);
    } catch (error) {
      setLoading(false);
      if (error?.response?.data?.code === 1030) fetchRefreshToken(fetchUserDetails);
    }
  };

  const parseDateOnly = dateString => {
    if (!dateString) return null;
    try {
      const normalized = dateString.indexOf('T') === -1 && /^\d{4}-\d{2}-\d{2}$/.test(dateString)
        ? `${dateString}T00:00:00`
        : dateString;
      const d = new Date(normalized);
      if (isNaN(d.getTime())) return null;
      d.setHours(0, 0, 0, 0);
      return d;
    } catch (e) { return null; }
  };

  const todayDateOnly = () => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  };

  const getBookingStatus = item => {
    const checkIn = parseDateOnly(item?.Check_in_Date);
    const checkOut = parseDateOnly(item?.check_out);
    const today = todayDateOnly();

    if (checkOut && checkOut < today) return { label: 'Past Trip', color: '#64748B' };
    if (checkIn && checkIn.getTime() === today.getTime()) return { label: 'Check-in Today', color: '#10B981' };
    if (checkOut && checkOut.getTime() === today.getTime()) return { label: 'Checkout Today', color: '#F59E0B' };
    if (checkIn && checkIn > today) return { label: 'Upcoming', color: 'var(--color-primary)' };
    return { label: 'Active Stay', color: '#10B981' };
  };

  const formatDate = dateStr => {
    if (!dateStr) return '-';
    const d = parseDateOnly(dateStr);
    if (!d) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <div className="bookings-container" style={{ padding: '100px 20px 40px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', fontSize: '32px', margin: '0 0 8px 0' }}>Your Trips</h2>
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Manage and view all your upcoming and past bookings.</p>
        </div>
      </div>
      
      {loading ? (
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ borderTopColor: 'var(--color-accent)', border: '3px solid var(--color-border)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
        </div>
      ) : finalTrips.length < 1 ? (
        <div className="fade-in-up" style={{ padding: '120px 20px', textAlign: 'center', backgroundColor: 'var(--color-secondary)', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)' }}>
          <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px auto' }}>
            <Calendar size={32} color="var(--color-primary)" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', margin: '0 0 16px 0', fontSize: '32px', fontWeight: '600' }}>No Upcoming Trips</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '16px', maxWidth: '400px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>When you're ready to plan your next getaway, we're here to help you find the perfect stay.</p>
          <button 
            className="hover-lift"
            onClick={() => navigate('/search')}
            style={{ 
              backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)', 
              border: 'none', padding: '16px 40px', borderRadius: 'var(--radius-sm)',
              fontSize: '13px', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            Find Destinations
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {finalTrips.map(item => {
            const status = getBookingStatus(item);
            return (
              <div 
                key={item.ID || Math.random()} 
                className="hover-lift"
                onClick={() => navigate('/trip-details', { state: { item } })}
                style={{
                  display: 'flex', backgroundColor: 'var(--color-secondary)',
                  borderRadius: '16px', border: '1px solid var(--color-border)',
                  overflow: 'hidden', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  position: 'relative'
                }}
              >
                {/* Status Indicator */}
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '6px', backgroundColor: status.color }}></div>
                
                {/* Image Section */}
                <div style={{ 
                  width: '140px', 
                  backgroundImage: `url(${item?.image || 'https://static.wixstatic.com/media/201a1b_b218982b63c849f98d3165723606121d~mv2_d_6796_3863_s_4_2.png/v1/crop/x_65,y_0,w_6731,h_3863/fill/w_422,h_238,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/logo%20with%20TM.png'})`,
                  backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: '#fff',
                  display: 'none',
                }} className="trip-image-desktop"></div>
                
                <div style={{ padding: '20px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontFamily: 'var(--font-heading)', fontSize: '18px', color: 'var(--color-primary)', fontWeight: '600' }}>
                        {item?.Building_Name?.display_value || item?.Building_Name || 'To Be Assigned'}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                        <MapPin size={12} />
                        {item?.['Building_Name.Area'] || item?.Area || 'Location Pending'}
                      </div>
                    </div>
                    
                    <div style={{ backgroundColor: `${status.color}15`, color: status.color, padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      {status.label}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-bg-secondary)', padding: '12px 16px', borderRadius: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Check-In</div>
                      <div style={{ fontSize: '14px', color: 'var(--color-primary)', fontWeight: '600' }}>{formatDate(item?.Check_in_Date)}</div>
                    </div>
                    
                    <div style={{ padding: '0 16px', textAlign: 'center', position: 'relative' }}>
                      <div style={{ height: '1px', width: '30px', borderTop: '2px dashed var(--color-border)' }}></div>
                    </div>
                    
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Check-Out</div>
                      <div style={{ fontSize: '14px', color: 'var(--color-primary)', fontWeight: '600' }}>{formatDate(item?.check_out)}</div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '500' }}>
                      REF: <span style={{ color: 'var(--color-primary)', fontWeight: '700', letterSpacing: '1px' }}>{item?.Booking_Ref_No ?? 'Pending'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      View Details <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};

export default MyBookings;
