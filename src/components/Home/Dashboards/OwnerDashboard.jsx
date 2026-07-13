import React, { useState, useEffect } from 'react';
import zohoAxios from '../../../utility/axiosInstance';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Home, FileText, ExternalLink, RefreshCw, Star, Building, MapPin, ChevronRight, ArrowRight } from 'lucide-react';
import { getData } from '../../../utility/LocalStorageService';
import { fetchRefreshToken } from '../../../helper';
import { setIsOwner } from '../../../redux/actions';
import './Dashboards.css';

const OwnerDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  const [checkIsAgent, setCheckIsAgent] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const storedUser = await getData('userDetails');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserDetails(user);
        await fetchProperties(user.member_email);
        checkAgent(user.member_email);
      } else {
        await fetchUserAndProperties();
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const fetchUserAndProperties = async () => {
    try {
      const Id = await getData('ID');
      const refreshToken = await getData('refreshToken');
      
      const res = await zohoAxios.get(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/loyalty_members_Report/${Id}`,
        { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
      );
      
      if (res?.data?.code === 3000) {
        const user = res.data.data;
        setUserDetails(user);
        await fetchProperties(user.member_email);
        checkAgent(user.member_email);
      }
    } catch (error) {
      if (error?.response?.data?.code === 1030) {
        await fetchRefreshToken();
        fetchUserAndProperties();
      }
      setLoading(false);
    }
  };

  const fetchProperties = async (email) => {
    try {
      const refreshToken = await getData('refreshToken');
      const encodedEmail = encodeURIComponent(email);
      const url = email === 'demo.cobnb@gmail.com' 
        ? `/zoho-api/api/v2/brandontan18/housekeeping-system/report/All_Properties?Sales_Demo_Email=${encodedEmail}`
        : `/zoho-api/api/v2/brandontan18/housekeeping-system/report/All_Properties?Owner_Email=${encodedEmail}`;
        
      const res = await zohoAxios.get(url, {
        headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` }
      });
      
      if (res?.data?.code === 3000) {
        const sortedData = [...res.data.data].sort((a, b) => {
          const nameA = a?.Listing_Name || "";
          const nameB = b?.Listing_Name || "";
          return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
        });
        setProperties(sortedData);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Failed to load properties.');
    } finally {
      setLoading(false);
    }
  };

  const checkAgent = async (email) => {
    try {
      const refreshToken = await getData('refreshToken');
      const encodedEmail = encodeURIComponent(email);
      const res = await zohoAxios.get(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/All_Properties?Agent_Email=${encodedEmail}`,
        { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
      );
      if (res?.data?.code === 3000) setCheckIsAgent(true);
    } catch (error) {
      console.log('checkAgent error', error);
    }
  };

  const handleOpenAirbnb = (url) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSwitchToAgent = () => {
    dispatch(setIsOwner(2));
    navigate('/welcome');
  };

  return (
    <div className="luxury-dashboard">
      
      {/* Hero Section */}
      <div className="hero-section" style={{ height: '400px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${import.meta.env.BASE_URL}images/bg3.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(17, 17, 17, 0.5)', zIndex: 1 }}></div>
        
        <div className="hero-content" style={{ zIndex: 2 }}>
          <div className="hero-text" style={{ textAlign: 'left', padding: '0 40px' }}>
            <h2 style={{ color: '#ffffff' }}>Your Managed Properties</h2>
            <p style={{ color: 'rgba(255,255,255,0.9)' }}>Track performance and statements for your portfolio.</p>
          </div>
        </div>

        {/* Floating Owner Pass Widget */}
        {userDetails && (
          <div className="membership-card" style={{ zIndex: 10 }}>
            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-accent)', marginBottom: '4px' }}>Welcome Back</div>
              <div style={{ fontSize: '20px', fontFamily: 'var(--font-heading)', fontWeight: '600', color: '#ffffff' }}>
                {userDetails.first_name || userDetails.Guest_Name?.display_value || 'Partner'} {userDetails.last_name || ''}
              </div>
              {userDetails.member_email && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>{userDetails.member_email}</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
              <div className="membership-tier">
                <Star size={14} fill="var(--color-accent)" color="var(--color-accent)" />
                <span>PROPERTY OWNER</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="container">
        
        {/* Agent Switch Banner */}
        {checkIsAgent && (
          <div 
            className="hover-lift fade-in-up stagger-1"
            onClick={handleSwitchToAgent}
            style={{
              backgroundColor: 'var(--color-secondary)',
              padding: '24px 32px',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              marginBottom: '40px',
              borderLeft: '4px solid var(--color-accent)'
            }}
          >
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: 'var(--color-primary)', fontSize: '18px', fontWeight: '600' }}>Agent Dashboard Available</h4>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '14px' }}>You have properties assigned as an Agent. Click here to switch views.</p>
            </div>
            <ArrowRight size={24} color="var(--color-accent)" />
          </div>
        )}

        {/* Properties Section */}
        <div className="section-container fade-in-up stagger-2">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '32px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', color: 'var(--color-primary)', margin: 0 }}>Your Properties</h3>
            <button className="hover-lift" onClick={loadData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
              <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Refresh
            </button>
          </div>

          {loading && properties.length === 0 ? (
            <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="spinner-dark"></div>
            </div>
          ) : properties.length > 0 ? (
            <div className="property-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '32px' }}>
              {properties.map((item, index) => (
                <div key={index} className="property-card hover-lift" style={{ backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
                  
                  <div style={{ padding: '24px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                      <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building size={24} color="var(--color-accent)" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px 0', fontFamily: 'var(--font-heading)', fontSize: '18px', color: 'var(--color-primary)', fontWeight: '600', lineHeight: '1.3' }}>
                          {item.Property_Name?.display_value || 'Unnamed Property'}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                          <MapPin size={12} />
                          {item?.Listing_Name}
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-border)', margin: '0 -24px 20px -24px' }}></div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Profit Sharing</span>
                      <span style={{ fontSize: '16px', color: 'var(--color-primary)', fontWeight: '700' }}>{item?.Profit_sharing_percentage || 0}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Status</span>
                      <span style={{ fontSize: '11px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '4px 10px', borderRadius: '4px', fontWeight: '600', letterSpacing: '0.5px' }}>{item?.Property_Status || 'Active'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', borderTop: '1px solid var(--color-border)' }}>
                    <button 
                      className="hover-lift"
                      onClick={() => handleOpenAirbnb(item?.Airbnb_URL_Link?.url)}
                      disabled={!item?.Airbnb_URL_Link?.url}
                      style={{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRight: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-primary)', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', opacity: !item?.Airbnb_URL_Link?.url ? 0.5 : 1 }}
                    >
                      <ExternalLink size={16} /> Airbnb
                    </button>
                    <button 
                      className="hover-lift"
                      onClick={() => navigate('/generate-statement', { state: { item, role: 1 } })}
                      style={{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: 'transparent', color: 'var(--color-primary)', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}
                    >
                      <FileText size={16} /> Statement
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '80px 20px', textAlign: 'center', backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)' }}>
              <Home size={64} color="var(--color-text-muted)" style={{ marginBottom: '24px', opacity: 0.5 }} />
              <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', margin: '0 0 16px 0', fontSize: '28px', fontWeight: '600' }}>No Properties Found</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '16px', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>You do not have any properties assigned to this owner account yet.</p>
            </div>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}} />
    </div>
  );
};

export default OwnerDashboard;
