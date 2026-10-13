import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import zohoAxios from '../../../utility/axiosInstance';
import { getData } from '../../../utility/LocalStorageService';
import { fetchRefreshToken } from '../../../helper';
import { MapPin, Search, ArrowRight, Building2, ExternalLink, X } from 'lucide-react';

const OnlineBooking = () => {
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [filteredBuildings, setFilteredBuildings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/All_Building_Report?Active=Active`,
        { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
      );
      if (res?.data && res.data.code === 3000) {
        const list = res.data.data || [];
        setBuildings(list);
        setFilteredBuildings(list);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching buildings:', error);
      setLoading(false);
      if (error?.response?.data?.code === 1030) {
        fetchRefreshToken(fetchData);
      }
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredBuildings(buildings);
    } else {
      const q = query.toLowerCase();
      const filtered = buildings.filter((item) => {
        const name = (item.Building_Name || '').toLowerCase();
        const area = (item.Area || '').toLowerCase();
        return name.includes(q) || area.includes(q);
      });
      setFilteredBuildings(filtered);
    }
  };

  const getMapUrl = (item) => {
    if (item?.latitude && item?.longitude && String(item.latitude).trim() && String(item.longitude).trim()) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(item.latitude).trim())},${encodeURIComponent(String(item.longitude).trim())}`;
    }
    if (item?.CII_1) {
      const match = item.CII_1.match(/https?:\/\/[^\s]+/);
      if (match) {
        const url = match[0];
        if (url.includes('google') || url.includes('maps') || url.includes('goo.gl') || url.includes('share.google')) {
          return url;
        }
      }
    }
    const locationQuery = [item?.Building_Name, item?.Area, 'Malaysia'].filter(Boolean).join(' ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`;
  };

  const handleOpenMap = (e, item) => {
    e.stopPropagation();
    const mapUrl = getMapUrl(item);
    window.open(mapUrl, '_blank', 'noopener,noreferrer');
  };

  const handleProceed = (item) => {
    const hotelCode = item?.Ezee_Hotel_ID;
    const apiKey = item?.Ezee_Key;
    const hotelName = item?.Building_Name;
    const buildingImage = item?.Mobile_App_Image?.url || item?.Mobile_App_Image?.value;

    if (!hotelCode || !apiKey) {
      alert(`eZee Hotel Code or API Key is not configured for ${hotelName || 'this building'}.`);
      return;
    }

    navigate('/hotel-availability', {
      state: {
        hotelCode,
        apiKey,
        hotelName,
        buildingImage
      }
    });
  };

  /*
  const handleViewBookings = (e, item) => {
    e.stopPropagation();
    const hotelCode = item?.Ezee_Hotel_ID;
    const apiKey = item?.Ezee_Key;
    const hotelName = item?.Building_Name;

    if (!hotelCode || !apiKey) {
      alert(`eZee Hotel Code or API Key is not configured for ${hotelName || 'this building'}.`);
      return;
    }

    navigate('/hotel-bookings', {
      state: {
        hotelCode,
        apiKey,
        hotelName
      }
    });
  };
  */

  return (
    <div className="online-booking-container">
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          <h2 className="online-booking-title" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-main)', fontSize: '32px', fontWeight: '700', margin: 0 }}>
            Online Booking
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', margin: 0 }}>
            Select a property to check real-time availability and manage bookings.
          </p>
        </div>

        {/* Responsive Search Bar */}
        <div className="online-booking-search-section">
          <div className="online-booking-search-bar">
            <Search size={19} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by building name or area..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="online-booking-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearch('')}
                className="online-booking-clear-btn"
                title="Clear search"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="online-booking-search-count">
              {filteredBuildings.length} {filteredBuildings.length === 1 ? 'property' : 'properties'} found
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {loading && buildings.length === 0 ? (
          <div style={{ height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner-dark" style={{ borderTopColor: 'var(--color-accent)', border: '3px solid var(--color-border)', borderRadius: '50%', width: '36px', height: '36px', animation: 'spin 1s linear infinite' }}></div>
          </div>
        ) : filteredBuildings.length === 0 ? (
          <div style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <Building2 size={48} color="var(--color-text-muted)" style={{ opacity: 0.4, marginBottom: '16px' }} />
            <p style={{ color: 'var(--color-text-muted)', fontSize: '16px', margin: 0 }}>
              {searchQuery ? `No properties found matching "${searchQuery}"` : 'No active properties available.'}
            </p>
          </div>
        ) : (
          <div className="online-booking-grid">
            {filteredBuildings.map((item) => {
              const imageUrl = item?.Mobile_App_Image?.url || item?.Mobile_App_Image?.value;
              const hasEzeeConfig = Boolean(item?.Ezee_Hotel_ID && item?.Ezee_Key);

              return (
                <div
                  key={item.ID}
                  className="online-booking-card"
                  onClick={() => handleProceed(item)}
                  style={{
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                    cursor: 'pointer'
                  }}
                >
                  {/* Property Image Container */}
                  <div style={{ position: 'relative', width: '100%', height: '220px', backgroundColor: 'var(--color-bg-main)' }}>
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.Building_Name || 'Property'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
                        <Building2 size={54} color="#9ca3af" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)',
                      pointerEvents: 'none'
                    }} />

                    {/* Map Icon Button on the Card Image */}
                    <button
                      type="button"
                      title="View on Google Maps"
                      onClick={(e) => handleOpenMap(e, item)}
                      className="map-button"
                      style={{
                        position: 'absolute',
                        top: '14px',
                        right: '14px',
                        background: 'rgba(255, 255, 255, 0.92)',
                        color: 'var(--color-text-main)',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: '50%',
                        width: '38px',
                        height: '38px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        transition: 'transform 0.2s ease, background-color 0.2s ease',
                        zIndex: 2
                      }}
                    >
                      <MapPin size={18} color="#e11d48" />
                    </button>

                    {/* Badge for eZee Status */}
                    <div style={{
                      position: 'absolute',
                      top: '14px',
                      left: '14px',
                      background: hasEzeeConfig ? 'rgba(34, 197, 94, 0.9)' : 'rgba(107, 114, 128, 0.9)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      letterSpacing: '0.5px',
                      backdropFilter: 'blur(4px)',
                      textTransform: 'uppercase'
                    }}>
                      {hasEzeeConfig ? 'eZee Active' : 'Offline'}
                    </div>

                    {/* Area tag on image bottom */}
                    {item.Area && (
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: '600',
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)'
                      }}>
                        <MapPin size={13} color="var(--color-accent)" />
                        <span>{item.Area}</span>
                      </div>
                    )}
                  </div>

                  {/* Property Details */}
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, gap: '14px' }}>
                    <div>
                      <h3 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '19px',
                        color: 'var(--color-text-main)',
                        margin: '0 0 6px 0',
                        fontWeight: '600',
                        lineHeight: '1.3'
                      }}>
                        {item.Building_Name}
                      </h3>
                      {item.Ezee_Hotel_ID && (
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
                          Hotel Code: <strong style={{ color: 'var(--color-text-main)' }}>{item.Ezee_Hotel_ID}</strong>
                        </p>
                      )}
                    </div>

                    {/* Map action link */}
                    <div
                      onClick={(e) => handleOpenMap(e, item)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--color-accent)',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        width: 'fit-content'
                      }}
                    >
                      <MapPin size={14} />
                      <span>View Location on Map</span>
                      <ExternalLink size={12} style={{ opacity: 0.8 }} />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProceed(item);
                        }}
                        disabled={!hasEzeeConfig}
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          background: hasEzeeConfig ? 'var(--color-accent)' : '#d1d5db',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '700',
                          cursor: hasEzeeConfig ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'background-color 0.2s ease, opacity 0.2s ease'
                        }}
                      >
                        Proceed <ArrowRight size={16} />
                      </button>

                      {/* {hasEzeeConfig && (
                        <button
                          type="button"
                          onClick={(e) => handleViewBookings(e, item)}
                          title="View Reservations"
                          style={{
                            padding: '12px 14px',
                            background: 'var(--color-bg-main)',
                            color: 'var(--color-text-main)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <Calendar size={15} /> Bookings
                        </button>
                      )} */}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .online-booking-container {
          min-height: 100vh;
          padding: 100px 24px 60px;
          position: relative;
        }
        .online-booking-search-section {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 32px;
          width: 100%;
          max-width: 580px;
        }
        .online-booking-search-bar {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          box-shadow: var(--shadow-sm);
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
        }
        .online-booking-search-bar:focus-within {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px rgba(197, 168, 128, 0.18);
          background: var(--color-bg-main);
        }
        .online-booking-search-input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 15px;
          color: var(--color-text-main);
          font-family: var(--font-body);
        }
        .online-booking-clear-btn {
          border: none;
          background: rgba(0, 0, 0, 0.06);
          color: var(--color-text-muted);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          padding: 0;
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        .online-booking-clear-btn:hover {
          background: rgba(0, 0, 0, 0.12);
          color: var(--color-text-main);
        }
        .online-booking-search-count {
          font-size: 13px;
          color: var(--color-text-muted);
          font-weight: 500;
          padding-left: 4px;
        }
        .online-booking-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 28px;
        }
        .online-booking-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0,0,0,0.12);
          border-color: var(--color-accent) !important;
        }
        .map-button:hover {
          transform: scale(1.1);
          background: #ffffff !important;
        }

        /* Mobile & Tablet Responsive Adjustments */
        @media (max-width: 640px) {
          .online-booking-container {
            padding: 85px 16px 40px !important;
          }
          .online-booking-title {
            font-size: 24px !important;
          }
          .online-booking-search-section {
            max-width: 100% !important;
            margin-bottom: 24px !important;
          }
          .online-booking-search-bar {
            padding: 10px 14px !important;
            border-radius: 10px !important;
          }
          .online-booking-search-input {
            font-size: 16px !important; /* Prevents auto-zoom on iOS Safari */
          }
          .online-booking-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
      `}} />
    </div>
  );
};

export default OnlineBooking;
