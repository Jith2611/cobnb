import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Calendar, FileText, User, Home, Clock, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

const HotelBookings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hotelCode, apiKey, hotelName } = location.state || {};

  const [dateFilter, setDateFilter] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
    filterType: 'created' // 'created' or 'arrival'
  });

  const [loading, setLoading] = useState(false);
  const [bookingsData, setBookingsData] = useState(null);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    if (!hotelCode || !apiKey) {
      navigate('/online-booking');
    }
  }, [hotelCode, apiKey, navigate]);

  const handleFetchBookings = async () => {
    setLoading(true);
    setError(null);
    setBookingsData(null);

    try {
      let params = `request_type=BookingList&HotelCode=${hotelCode}&APIKey=${apiKey}`;
      
      if (dateFilter.filterType === 'created') {
        params += `&created_from=${dateFilter.from}&created_to=${dateFilter.to}`;
      } else {
        params += `&ArrivalFrom=${dateFilter.from}&ArrivalTo=${dateFilter.to}`;
      }

      const response = await axios.get(`/ezee-api/booking/reservation_api/listing.php?${params}`);
      
      if (response.data) {
        setBookingsData(response.data);
      } else {
        setError('No data returned from API');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch bookings. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (resNo) => {
    if (!window.confirm(`Are you sure you want to cancel reservation ${resNo}?`)) return;

    setLoading(true);
    try {
      const params = `request_type=CancelBooking&HotelCode=${hotelCode}&APIKey=${apiKey}&language=en&ResNo=${resNo}&SubNo=`;
      const response = await axios.get(`/ezee-api/booking/reservation_api/listing.php?${params}`);
      
      console.log('Cancel response:', response.data);
      alert(`Cancel request processed for ${resNo}. Check console for full response.`);
      
      // Refresh list
      handleFetchBookings();
    } catch (err) {
      console.error('Cancel booking error:', err);
      alert('Failed to cancel booking. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDateFilter(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{ minHeight: '100vh', padding: '100px 24px 60px', background: 'var(--color-bg-main)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '8px', color: 'var(--color-text-main)', fontSize: '15px', fontWeight: 600 }}>
          <ArrowLeft size={20} /> Back
        </button>

        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-main)', fontSize: '24px', marginBottom: '8px' }}>
          Hotel Bookings
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>
          {hotelName} (Code: {hotelCode})
        </p>

        {/* Filter Section */}
        <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} /> Retrieve Bookings
          </h3>
          
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ fontSize: '13px', color: 'var(--color-text-main)', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Filter By</label>
              <select 
                name="filterType" 
                value={dateFilter.filterType} 
                onChange={handleInputChange} 
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)', color: 'var(--color-text-main)' }}
              >
                <option value="created">Booking Date (Created)</option>
                <option value="arrival">Check-in Date (Arrival)</option>
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ fontSize: '13px', color: 'var(--color-text-main)', fontWeight: '600', marginBottom: '8px', display: 'block' }}>From Date</label>
              <input 
                type="date" 
                name="from" 
                value={dateFilter.from} 
                onChange={handleInputChange} 
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)', color: 'var(--color-text-main)' }} 
              />
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ fontSize: '13px', color: 'var(--color-text-main)', fontWeight: '600', marginBottom: '8px', display: 'block' }}>To Date</label>
              <input 
                type="date" 
                name="to" 
                value={dateFilter.to} 
                onChange={handleInputChange} 
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)', color: 'var(--color-text-main)' }} 
              />
            </div>

            <button 
              onClick={handleFetchBookings}
              disabled={loading}
              style={{ padding: '12px 24px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, minWidth: '150px' }}
            >
              {loading ? 'Fetching...' : 'Fetch Bookings'}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {error && (
          <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        {bookingsData && (
          <div>
            {/* Stats */}
            {bookingsData.RoomList && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', borderLeft: '4px solid var(--color-accent)' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Active Rooms</p>
                  <h3 style={{ margin: 0, fontSize: '24px', color: 'var(--color-text-main)' }}>{bookingsData.RoomList.TotalActiveRoomInHotel}</h3>
                </div>
                <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', borderLeft: '4px solid #ef4444' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Blocked Rooms</p>
                  <h3 style={{ margin: 0, fontSize: '24px', color: 'var(--color-text-main)' }}>{bookingsData.RoomList.TotalBlockRooms}</h3>
                </div>
                <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', borderLeft: '4px solid #10b981' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Occupied Rooms</p>
                  <h3 style={{ margin: 0, fontSize: '24px', color: 'var(--color-text-main)' }}>{bookingsData.RoomList.TotalOccupiedRooms}</h3>
                </div>
                <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', borderLeft: '4px solid #3b82f6' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Retrieved Bookings</p>
                  <h3 style={{ margin: 0, fontSize: '24px', color: 'var(--color-text-main)' }}>{bookingsData.BookingList?.length || 0}</h3>
                </div>
              </div>
            )}

            {/* Bookings Table */}
            {bookingsData.BookingList && bookingsData.BookingList.length > 0 ? (
              <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--color-bg-main)', borderBottom: '1px solid var(--color-border)' }}>
                      <tr>
                        <th style={{ padding: '16px', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Reservation</th>
                        <th style={{ padding: '16px', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Guest</th>
                        <th style={{ padding: '16px', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Dates</th>
                        <th style={{ padding: '16px', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Room / Source</th>
                        <th style={{ padding: '16px', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Status</th>
                        <th style={{ padding: '16px', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Amount</th>
                        <th style={{ padding: '16px', width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingsData.BookingList.map((booking, idx) => (
                        <React.Fragment key={idx}>
                          <tr 
                            onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                            style={{ 
                              borderBottom: '1px solid var(--color-border)', 
                              background: expandedRow === idx ? 'rgba(255,255,255,0.02)' : 'transparent',
                              cursor: 'pointer',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => { if (expandedRow !== idx) e.currentTarget.style.background = 'var(--color-bg-main)'; }}
                            onMouseLeave={(e) => { if (expandedRow !== idx) e.currentTarget.style.background = 'transparent'; }}
                          >
                            <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text-main)', fontWeight: 500 }}>
                              {booking.ReservationNo}<br/>
                              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 400 }}>{booking.ReservationDate}</span>
                            </td>
                            <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text-main)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                                  {booking.GuestName ? booking.GuestName.charAt(0).toUpperCase() : 'G'}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 500 }}>{booking.GuestName}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{booking.NoOfGuest} Guest(s)</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text-main)' }}>
                              <div>In: {booking.ArrivalDate}</div>
                              <div style={{ color: 'var(--color-text-muted)' }}>Out: {booking.DepartureDate}</div>
                              <div style={{ fontSize: '12px', color: 'var(--color-accent)', marginTop: '4px' }}>{booking.NoOfNights} Night(s)</div>
                            </td>
                            <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text-main)' }}>
                              <div style={{ fontWeight: 500 }}>{booking.RoomShortCode}</div>
                              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{booking.Source}</div>
                            </td>
                            <td style={{ padding: '16px' }}>
                              <span style={{ 
                                display: 'inline-block', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                                background: booking.Status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: booking.Status === 'Active' ? '#10b981' : '#ef4444'
                              }}>
                                {booking.BookingStatus}
                              </span>
                            </td>
                            <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text-main)', fontWeight: 500 }}>
                              {booking.TotalInclusiveTax}
                            </td>
                            <td style={{ padding: '16px', color: 'var(--color-text-muted)' }}>
                              {expandedRow === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </td>
                          </tr>
                          
                          {/* Expanded Details */}
                          {expandedRow === idx && (
                            <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                              <td colSpan="7" style={{ padding: '0' }}>
                                <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                                  
                                  <div>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16} /> Guest Contact</h4>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--color-text-main)' }}><strong>Email:</strong> {booking.Email || 'N/A'}</p>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--color-text-main)' }}><strong>Mobile:</strong> {booking.Mobile || 'N/A'}</p>
                                    <p style={{ margin: '0 0 0 0', fontSize: '14px', color: 'var(--color-text-main)' }}><strong>Country:</strong> {booking.Country || 'N/A'}</p>
                                  </div>
                                  
                                  <div>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}><Home size={16} /> Room & Stay</h4>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--color-text-main)' }}><strong>Room Type:</strong> {booking.Room}</p>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--color-text-main)' }}><strong>Room No:</strong> {booking.RoomNo || 'Not Assigned'}</p>
                                    <p style={{ margin: '0 0 0 0', fontSize: '14px', color: 'var(--color-text-main)' }}><strong>Adults/Children:</strong> {booking.Adult} / {booking.Child}</p>
                                  </div>

                                  <div>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}><CreditCard size={16} /> Payment Info</h4>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--color-text-main)' }}><strong>Payment Type:</strong> {booking.PaymentType || 'N/A'}</p>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--color-text-main)' }}><strong>Deposit:</strong> {booking.Deposit}</p>
                                    <p style={{ margin: '0 0 0 0', fontSize: '14px', color: 'var(--color-text-main)' }}><strong>Due Amount:</strong> <span style={{ color: booking.DueAmount > 0 ? '#ef4444' : '#10b981' }}>{booking.DueAmount}</span></p>
                                    
                                    {booking.Status !== 'Cancel' && booking.BookingStatus !== 'Cancel' && (
                                      <div style={{ marginTop: '16px' }}>
                                        <button 
                                          onClick={() => handleCancelBooking(booking.ReservationNo)} 
                                          disabled={true}
                                          style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '12px' }}
                                        >
                                          Cancel Reservation
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--color-bg-secondary)', padding: '40px', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                <Calendar size={48} color="var(--color-border)" style={{ marginBottom: '16px' }} />
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-text-main)' }}>No Bookings Found</h3>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '14px' }}>Try adjusting your date range filter.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelBookings;
