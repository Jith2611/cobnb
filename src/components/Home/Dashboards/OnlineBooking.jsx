import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import zohoAxios from '../../../utility/axiosInstance';
import { getData } from '../../../utility/LocalStorageService';
import { fetchRefreshToken } from '../../../helper';
import { MapPin, Search, Building2, X } from 'lucide-react';
import './Dashboards.css';

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
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/All_Building_Report?Active=Active&Booking_Engine_Active=true`,
        { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
      );
      if (res?.data && res.data.code === 3000) {
        // Only include properties that have a configured eZee Hotel ID
        const list = (res.data.data || []).filter(
          (item) => Boolean(item?.Ezee_Hotel_ID && String(item.Ezee_Hotel_ID).trim())
        );
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
    const buildingImage = item?.Mobile_App_Image?.url ||
      item?.Mobile_App_Image?.value ||
      (typeof item?.Mobile_App_Image === 'string' ? item.Mobile_App_Image : '') ||
      '';

    if (!hotelCode || !apiKey) {
      alert(`eZee Hotel Code or API Key is not configured for ${hotelName || 'this building'}.`);
      return;
    }

    navigate('/hotel-availability', {
      state: {
        hotelCode,
        apiKey,
        hotelName,
        buildingImage,
        buildingId: item?.ID
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
            <Search size={20} className="online-booking-search-icon" />
            <input
              type="text"
              placeholder="Search by building name or area..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="online-booking-search-input"
              aria-label="Search properties by building name or area"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearch('')}
                className="online-booking-clear-btn"
                title="Clear search"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="online-booking-search-meta">
              <span className="online-booking-search-count">
                {filteredBuildings.length} {filteredBuildings.length === 1 ? 'property' : 'properties'} found
              </span>
              <button
                type="button"
                onClick={() => handleSearch('')}
                className="online-booking-reset-link"
              >
                Clear
              </button>
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
          <div className="property-grid">
            {filteredBuildings.map((item, index) => {
              const bgImg = item?.Mobile_App_Image?.value ||
                item?.Mobile_App_Image?.url ||
                (typeof item?.Mobile_App_Image === 'string' ? item.Mobile_App_Image : '');

              return (
                <div
                  key={item?.ID || index}
                  className="property-card"
                  onClick={() => handleProceed(item)}
                >
                  <div
                    className="property-image"
                    style={{
                      backgroundImage: bgImg ? `url(${bgImg})` : 'none',
                      backgroundColor: 'var(--color-bg-secondary)'
                    }}
                  ></div>
                  <div className="property-info" style={{ backgroundColor: 'var(--color-secondary)' }}>
                    <div className="property-location">
                      <MapPin size={12} color="var(--color-accent)" />
                      {item?.Area || 'Malaysia'}
                    </div>
                    <h4 style={{ color: 'var(--color-primary)', fontSize: '20px', fontWeight: '600' }}>
                      {item?.Building_Name}
                    </h4>
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
          flex-direction: column;
          gap: 10px;
          margin-bottom: 36px;
          width: 100%;
          max-width: 720px;
        }
        .online-booking-search-bar {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          box-sizing: border-box;
          box-shadow: var(--shadow-sm);
          transition: border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.25s ease;
        }
        .online-booking-search-bar:hover {
          border-color: rgba(197, 168, 128, 0.6);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
        }
        .online-booking-search-bar:focus-within {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px rgba(197, 168, 128, 0.2), 0 4px 16px rgba(0, 0, 0, 0.08);
          background: var(--color-bg-main);
        }
        .online-booking-search-icon {
          color: var(--color-text-muted);
          flex-shrink: 0;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .online-booking-search-bar:focus-within .online-booking-search-icon {
          color: var(--color-accent);
          transform: scale(1.05);
        }
        .online-booking-search-input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          min-width: 0;
          font-size: 16px;
          color: var(--color-text-main);
          font-family: var(--font-body);
          line-height: 1.4;
        }
        .online-booking-search-input::placeholder {
          color: var(--color-text-muted);
          opacity: 0.75;
        }
        .online-booking-clear-btn {
          border: none;
          background: rgba(0, 0, 0, 0.06);
          color: var(--color-text-muted);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          padding: 0;
          transition: background-color 0.2s ease, color 0.2s ease, transform 0.15s ease;
        }
        .online-booking-clear-btn:hover {
          background: rgba(0, 0, 0, 0.14);
          color: var(--color-text-main);
        }
        .online-booking-clear-btn:active {
          transform: scale(0.9);
        }
        .online-booking-search-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2px 6px;
          font-size: 13px;
        }
        .online-booking-search-count {
          color: var(--color-text-muted);
          font-weight: 500;
        }
        .online-booking-reset-link {
          background: none;
          border: none;
          color: var(--color-accent);
          font-size: 12px;
          font-weight: 600;
          text-decoration: underline;
          cursor: pointer;
          padding: 2px 4px;
          transition: color 0.2s ease;
        }
        .online-booking-reset-link:hover {
          color: var(--color-accent-hover);
        }
        .property-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 32px;
        }
        .property-card {
          background: var(--color-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          overflow: hidden;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          transition: var(--transition-normal);
        }
        .property-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: var(--color-accent);
        }
        .property-card:hover .property-image {
          transform: scale(1.05);
        }
        .property-image {
          height: 240px;
          background-size: cover;
          background-position: center;
          transition: var(--transition-normal);
        }
        .property-info {
          padding: 24px;
          background: var(--color-secondary);
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .property-info h4 {
          font-family: var(--font-heading);
          font-size: 20px;
          margin: 0;
          color: var(--color-primary);
          font-weight: 600;
          line-height: 1.3;
        }
        .property-location {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-text-muted);
          font-size: 13px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        /* Large Screens (>= 1200px) */
        @media (min-width: 1200px) {
          .online-booking-search-section {
            max-width: 760px;
          }
          .online-booking-search-bar {
            padding: 16px 22px;
            border-radius: 16px;
          }
        }

        /* Tablet Screens (641px - 1024px) */
        @media (min-width: 641px) and (max-width: 1024px) {
          .online-booking-search-section {
            max-width: 100%;
          }
          .online-booking-search-bar {
            padding: 14px 18px;
          }
        }

        /* Mobile Responsive Adjustments (<= 640px) */
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
            gap: 8px !important;
          }
          .online-booking-search-bar {
            padding: 12px 14px !important;
            border-radius: 12px !important;
            gap: 10px !important;
            min-height: 48px !important;
          }
          .online-booking-search-input {
            font-size: 16px !important; /* Prevents auto-zoom on iOS Safari */
          }
          .online-booking-clear-btn {
            width: 32px !important;
            height: 32px !important;
            min-width: 32px !important;
            min-height: 32px !important;
          }
          .online-booking-search-meta {
            padding: 0 4px !important;
            font-size: 12px !important;
          }
          .property-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
      `}} />
    </div>
  );
};

export default OnlineBooking;
