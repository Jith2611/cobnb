import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import zohoAxios from '../../../utility/axiosInstance';
import { getData } from '../../../utility/LocalStorageService';
import { Clock, Building, Calendar, CheckCircle, Hash } from 'lucide-react';

const OnlineBooking = () => {
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const fetchedRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchData();
      fetchedRef.current = true;
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const refreshToken = await getData('refreshToken');
      const res = await zohoAxios.get(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/All_Ezee_Sync_Schedules`,
        { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
      );
      if (res.data && res.data.code === 3000) {
        setSchedules(res.data.data || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleCardClick = (item) => {
    navigate('/hotel-availability', {
      state: {
        hotelCode: item.Hotel_Code,
        apiKey: item.API_Key,
        hotelName: item.Title
      }
    });
  };

  return (
    <div style={{ minHeight: '100vh', padding: '100px 24px 60px', position: 'relative' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-main)', marginBottom: '8px', fontSize: '28px' }}>
          Online Booking
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>
          Ezee Sync Schedules Overview
        </p>

        {loading && schedules.length === 0 ? (
          <div style={{ height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner-dark" style={{ borderTopColor: 'var(--color-accent)', border: '2px solid var(--color-border)', borderRadius: '50%', width: '32px', height: '32px', animation: 'spin 1s linear infinite' }}></div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {schedules.map((item) => (
              <div
                key={item.ID}
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                className="schedule-card"
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', color: 'var(--color-text-main)', margin: 0, lineHeight: '1.4', flex: 1 }}>
                    {item.Title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                    <CheckCircle size={14} /> {item.Status}
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <Building size={16} color="var(--color-text-muted)" style={{ marginTop: '2px' }} />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {item.Building_Name?.map((b) => (
                        <span key={b.ID} style={{ background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          {b.display_value}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                    <Hash size={16} /> Hotel Code: <strong style={{ color: 'var(--color-text-main)' }}>{item.Hotel_Code}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                    <Clock size={16} /> Last Sync: <strong style={{ color: 'var(--color-text-main)' }}>{item.Last_Schedule_Time}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                    <Calendar size={16} /> Next Sync: <strong style={{ color: 'var(--color-text-main)' }}>{item.Next_Schedule_Time}</strong>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCardClick(item); }}
                      style={{ flex: 1, padding: '10px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Check Availability
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/hotel-bookings', {
                          state: { hotelCode: item.Hotel_Code, apiKey: item.API_Key, hotelName: item.Title }
                        });
                      }}
                      style={{ flex: 1, padding: '10px', background: 'var(--color-bg-main)', color: 'var(--color-accent)', border: '1px solid var(--color-accent)', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      View Bookings
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .schedule-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          border-color: var(--color-accent) !important;
        }
      `}} />
    </div>
  );
};

export default OnlineBooking;
