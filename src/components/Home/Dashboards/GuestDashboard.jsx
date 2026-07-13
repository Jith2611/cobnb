import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import zohoAxios from '../../../utility/axiosInstance';
import { 
  Search, MapPin, Star, MessageCircle, X, ChevronRight,
  Building, HeartHandshake, PaintBucket, Bed, Smartphone, Quote,
  ShieldCheck, Moon, Wifi, Tag
} from 'lucide-react';
import { getData, storeData } from '../../../utility/LocalStorageService';
import { fetchRefreshToken } from '../../../helper';
import './Dashboards.css';

const GuestDashboard = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  
  // Popup States
  const [popups, setPopups] = useState([]);
  const [activePopupIndex, setActivePopupIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  // Recently Viewed
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    loadData();
    loadRecentlyViewed();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const Id = await getData('ID');
      const refreshToken = await getData('refreshToken');
      
      if (Id) {
        const userRes = await zohoAxios.get(
          `/zoho-api/api/v2/brandontan18/housekeeping-system/report/loyalty_members_Report/${Id}`,
          { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
        );
        if (userRes?.data?.code === 3000) {
          setUserDetails(userRes.data.data);
        }
      }

      // Load Hotels
      const hotelRes = await zohoAxios.get(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/All_Building_Report?Mobile_App_Active=Active`,
        { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
      );
      if (hotelRes?.data?.code === 3000) {
        setHotels(hotelRes.data.data);
      }

      // Load Popups
      const popupRes = await zohoAxios.get(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/COBNB_App_Popups_Report`,
        { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
      );
      if (popupRes?.data?.code === 3000) {
        const activePopups = popupRes.data.data.filter(item => item.Active === 'true');
        handlePopups(activePopups);
      }

    } catch (error) {
      if (error?.response?.data?.code === 1030) {
        await fetchRefreshToken();
        loadData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePopups = async (data) => {
    const sortedData = data.sort((a, b) => {
      if (a.Type_of_Popup === 'One Time' && b.Type_of_Popup !== 'One Time') return -1;
      if (a.Type_of_Popup !== 'One Time' && b.Type_of_Popup === 'One Time') return 1;
      return 0;
    });

    setPopups(sortedData);
    const visited = await getData('onetimevisted');

    if (visited !== 'true') {
      const oneTimePopup = sortedData.find(item => item.Type_of_Popup === 'One Time');
      if (oneTimePopup) {
        setActivePopupIndex(0);
        setShowPopup(true);
        setIsFirstVisit(true);
      } else {
        showSeasonalPopups(sortedData);
      }
    } else {
      showSeasonalPopups(sortedData);
    }
  };

  const showSeasonalPopups = (sortedData) => {
    const seasonal = sortedData.filter(item => item.Type_of_Popup === 'Seasonal' && isDateInRange(item.Start_Date, item.End_Date));
    if (seasonal.length > 0) {
      setPopups(seasonal);
      setActivePopupIndex(0);
      setShowPopup(true);
    }
  };

  const isDateInRange = (startDate, endDate) => {
    const today = new Date();
    return today >= new Date(startDate) && today <= new Date(endDate);
  };

  const handleNextPopup = async () => {
    if (isFirstVisit) {
      setShowPopup(false);
      setIsFirstVisit(false);
      await storeData('onetimevisted', 'true');
      showSeasonalPopups(popups);
    } else {
      if (activePopupIndex + 1 < popups.length) {
        setActivePopupIndex(activePopupIndex + 1);
      } else {
        setShowPopup(false);
      }
    }
  };

  const handlePopupClick = (item) => {
    setShowPopup(false);
    if (item?.Redirect_To === 'Browser' && item?.Url_to_Redirect?.url) {
      window.open(item.Url_to_Redirect.url, '_blank');
    }
  };

  const loadRecentlyViewed = async () => {
    const stored = await getData('recentlyviewed');
    if (stored) {
      try {
        setRecentlyViewed(JSON.parse(stored));
      } catch (e) {
        setRecentlyViewed([]);
      }
    }
  };

  const handleBooking = (url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleWhatsApp = () => {
    const phone = "+60102715288";
    const msg = "Hello! Cobnb";
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="dashboard-wrapper luxury-dashboard">
      
      {/* Popups Modal */}
      {showPopup && popups.length > 0 && popups[activePopupIndex] && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(17, 17, 17, 0.85)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ position: 'relative', maxWidth: '420px', width: '90%', animation: 'popIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <button 
              onClick={handleNextPopup}
              style={{
                position: 'absolute', top: '-48px', right: 0,
                background: 'transparent', border: 'none',
                cursor: 'pointer', color: '#fff', padding: 0
              }}
            >
              <X size={28} strokeWidth={1.5} />
            </button>
            <img 
              src={popups[activePopupIndex]?.Image} 
              alt="Promo"
              style={{ width: '100%', borderRadius: 'var(--radius-sm)', cursor: 'pointer', boxShadow: 'var(--shadow-hover)' }}
              onClick={() => handlePopupClick(popups[activePopupIndex])}
            />
          </div>
        </div>
      )}

      {/* Floating WhatsApp Button */}
      <button 
        onClick={handleWhatsApp}
        className="whatsapp-float-btn"
      >
        <MessageCircle color="#fff" size={24} strokeWidth={1.5} />
      </button>

      {/* Hero Section Marriott Style */}
      <div className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content" style={{ width: '100%', position: 'relative', zIndex: 2 }}>
          <div className="hero-text" style={{ textAlign: 'center', margin: '0 auto', padding: '0 16px' }}>
            <h2 style={{ wordWrap: 'break-word' }}>Let Your Mind Travel</h2>
            <p style={{ margin: '0 auto', maxWidth: '90%' }}>Discover our curated luxury properties across Malaysia.</p>
            
            {userDetails && (
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-accent)' }}>
                  Welcome Back, {userDetails.first_name || userDetails.Name_field || 'Guest'} {userDetails.last_name || ''}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', fontSize: '14px', color: '#fff', backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px 24px', borderRadius: '24px', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Star size={16} fill="var(--color-accent)" color="var(--color-accent)" />
                    <span style={{ fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>{userDetails.member_level || 'MEMBER'}</span>
                  </div>
                  <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.3)' }}></div>
                  <div style={{ fontWeight: '600', fontFamily: 'var(--font-heading)' }}>
                    {userDetails.Points || userDetails.Loyalty_Points || 0} <span style={{ fontSize: '12px', fontWeight: '400', opacity: 0.8, letterSpacing: '1px' }}>PTS</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        

      </div>

      {/* Floating Booking Widget */}
      <div className="booking-widget-container" style={{ position: 'relative', bottom: 'auto', marginTop: '-40px', marginBottom: '40px', left: 0, right: 0 }}>
        <div className="booking-widget">
          <div className="booking-field" onClick={() => navigate('/search')}>
            <span className="field-label">Destination</span>
            <span className="field-value">Where to?</span>
          </div>
          <div className="booking-divider"></div>
          <div className="booking-field" onClick={() => navigate('/search')}>
            <span className="field-label">Dates</span>
            <span className="field-value">Add Dates</span>
          </div>
          <div className="booking-divider"></div>
          <div className="booking-field" onClick={() => navigate('/search')}>
            <span className="field-label">Rooms & Guests</span>
            <span className="field-value">1 Room: 2 Guests</span>
          </div>
          <button className="booking-btn" onClick={() => navigate('/search')}>
            Find Hotels
          </button>
        </div>
      </div>

      {/* Featured Properties */}
      <div className="section-container">
        <div className="section-header">
          <h3>Featured Properties</h3>
          <span className="view-all">Explore All <ChevronRight size={16} /></span>
        </div>
        
        {loading && hotels.length === 0 ? (
          <div className="loading-state">
            <div className="spinner-dark"></div>
          </div>
        ) : (
          <div className="property-grid">
            {hotels.map((item, index) => (
              <div 
                key={index} 
                className="property-card"
                onClick={() => handleBooking(item?.Booking_URL?.url)}
              >
                <div className="property-image" style={{ backgroundImage: `url(${item?.Mobile_App_Image?.value || item?.Mobile_App_Image?.url})` }}></div>
                <div className="property-info" style={{ backgroundColor: 'var(--color-secondary)' }}>
                  <div className="property-location">
                    <MapPin size={12} color="var(--color-accent)" />
                    {item?.Area || 'Malaysia'}
                  </div>
                  <h4 style={{ color: 'var(--color-primary)', fontSize: '20px', fontWeight: '600' }}>{item?.Building_Name}</h4>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Best Rates Promotional Section */}
      <div className="fade-in-up stagger-1" style={{ width: '100%', marginTop: '60px' }}>
        <div style={{ 
          position: 'relative', 
          padding: '80px 40px', 
          textAlign: 'center', 
          overflow: 'hidden',
          boxShadow: 'var(--shadow-luxury)'
        }}>
          {/* Background Image & Overlay */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `url(${import.meta.env.BASE_URL}images/bg3.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
            transform: 'scale(1.05)',
            transition: 'transform 10s ease'
          }}></div>
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(to bottom, rgba(17,17,17,0.7), rgba(17,17,17,0.85))',
            zIndex: 1
          }}></div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '42px', color: '#ffffff', margin: '0 0 20px 0', letterSpacing: '-0.5px' }}>
              The Best Rates Are Always Here
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '20px', maxWidth: '600px', margin: '0 auto 48px auto', lineHeight: '1.6' }}>
              Get the best prices plus free Wi-Fi when you become a Marriott Bonvoy member.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '60px', flexWrap: 'wrap' }}>
              <button className="hover-lift" onClick={() => navigate('/profile')} style={{ backgroundColor: 'var(--color-accent)', color: '#111111', padding: '16px 40px', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>Join for Free</button>
              <button className="hover-lift" onClick={() => navigate('/login')} style={{ backgroundColor: 'transparent', color: '#ffffff', padding: '16px 40px', border: '1px solid #ffffff', borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>Sign In</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '48px' }}>
              {[
                { label: 'BEST RATE GUARANTEE', icon: <ShieldCheck size={28} /> },
                { label: 'EARN FREE NIGHTS', icon: <Moon size={28} /> },
                { label: 'FREE WI-FI', icon: <Wifi size={28} /> },
                { label: 'MEMBER RATES', icon: <Tag size={28} /> }
              ].map((perk, idx) => (
                <div key={idx} className="hover-lift" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: '#ffffff', cursor: 'default' }}>
                  <div style={{ color: 'var(--color-accent)' }}>
                    {perk.icon}
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '13px', letterSpacing: '1.5px' }}>
                    {perk.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Our Services Section */}
      <div className="section-container fade-in-up stagger-1">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', color: 'var(--color-primary)', margin: '0 0 16px 0' }}>Our Services</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
            Cobnb is a leading Airbnb management company in Malaysia, helping property owners maximise rental income through full-service short-stay management, furnishing, and guest handling.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          {[
            { title: 'Property Management', icon: <Building size={32} color="var(--color-accent)" />, desc: 'Our experienced team handle all aspects of property management, from tenant screening to maintenance.' },
            { title: 'Co-living', icon: <HeartHandshake size={32} color="var(--color-accent)" />, desc: 'Experience the future of living with our innovative co-living spaces.' },
            { title: 'Renovation & Decoration', icon: <PaintBucket size={32} color="var(--color-accent)" />, desc: 'Transform your property with our expert renovation and decoration services.' },
            { title: 'Book A Stay', icon: <Bed size={32} color="var(--color-accent)" />, desc: 'Explore our curated selection of properties and book your dream stay with ease.' }
          ].map((service, idx) => (
            <div key={idx} className="hover-lift" style={{ backgroundColor: 'var(--color-secondary)', padding: '32px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-bg-secondary)', marginBottom: '24px' }}>
                {service.icon}
              </div>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: 'var(--color-primary)', marginBottom: '12px' }}>{service.title}</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: '1.6' }}>{service.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* App Download Banner */}
      <div className="section-container fade-in-up stagger-2">
        <div style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-md)', padding: '60px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '40px', overflow: 'hidden' }}>
          <div style={{ flex: '1 1 400px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', color: 'var(--color-secondary)', margin: '0 0 16px 0' }}>Manage Property Anytime, Anywhere</h3>
            <p style={{ color: 'var(--color-secondary)', opacity: 0.8, fontSize: '16px', lineHeight: '1.6', marginBottom: '32px', maxWidth: '480px' }}>
              Our property management mobile app allows you to stay connected to your rental business instantly. Get in touch with us now.
            </p>
            <button 
              onClick={() => window.open('https://onelink.to/w84afm', '_blank')}
              className="hover-lift"
              style={{ backgroundColor: 'var(--color-accent)', color: '#111111', border: 'none', padding: '14px 32px', borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Smartphone size={20} /> Download Now
            </button>
          </div>
          <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
            <img src="https://static.wixstatic.com/media/d145d4_162a0de3b22c4e5fb99065700cd1cc05~mv2.png/v1/crop/x_95,y_0,w_837,h_1015/fill/w_837,h_1015,al_c,q_90,enc_avif,quality_auto/d145d4_162a0de3b22c4e5fb99065700cd1cc05~mv2.png" alt="Cobnb App Screenshot" style={{ maxHeight: '400px', width: 'auto', borderRadius: '16px', objectFit: 'contain' }} />
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="section-container fade-in-up stagger-3">
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '40px', color: 'var(--color-primary)', margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>Trusted By Owners</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '16px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            Discover what our property owners have to say about their experience maximizing rental yields with Cobnb.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          {[
            { name: 'Mr Wong', title: 'Regalia Residences Owner', text: "I never thought it was possible to get a more than 8% yield in my apartment. Thank you for showing us the way and helping us to manage our investment." },
            { name: 'Andrew Lim', title: 'Novum Owner', text: "I’m so happy I chose to work with CoBnB. From the initial consultation all the way through the apartment listing, the service I received was impeccable." },
            { name: 'En. Hafiz', title: 'Arte Mont Kiara Owner', text: "CoBnB marketing is really impressive. I have been listing my own unit for 4 months and could not have the same amount of booking revenue in what CoBnB did in 1 month." }
          ].map((testimonial, idx) => (
            <div 
              key={idx} 
              className="hover-lift" 
              style={{ 
                background: 'linear-gradient(145deg, var(--color-secondary), var(--color-bg-secondary))',
                padding: '48px 40px', 
                borderRadius: '24px', 
                border: '1px solid var(--color-border)', 
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ position: 'absolute', top: '32px', right: '32px', opacity: 0.05 }}>
                <Quote size={80} fill="var(--color-primary)" color="transparent" />
              </div>
              
              <div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '32px' }}>
                  {[1,2,3,4,5].map(star => <Star key={star} size={18} color="var(--color-accent)" fill="var(--color-accent)" />)}
                </div>
                
                <p style={{ 
                  color: 'var(--color-text-main)', 
                  fontSize: '17px', 
                  lineHeight: '1.8', 
                  fontFamily: 'var(--font-heading)',
                  fontStyle: 'italic', 
                  marginBottom: '40px',
                  position: 'relative',
                  zIndex: 1
                }}>
                  "{testimonial.text}"
                </p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-bg-secondary)', border: '2px solid var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)', fontWeight: 'bold', fontSize: '18px' }}>
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontFamily: 'var(--font-heading)', fontSize: '18px', color: 'var(--color-primary)', fontWeight: '600' }}>{testimonial.name}</h4>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>{testimonial.title}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div className="section-container">
          <h3 className="section-title">Recently Viewed</h3>
          <div className="horizontal-scroll hide-scrollbar">
            {recentlyViewed.map((item, idx) => (
              <div key={idx} className="recent-card hover-lift" onClick={() => handleBooking(item?.Booking_URL?.url)}>
                <div className="recent-image" style={{ backgroundImage: `url(${item?.Mobile_App_Image?.value || item?.Mobile_App_Image?.url})`, borderRadius: 'var(--radius-sm)' }}></div>
                <div className="recent-name" style={{ color: 'var(--color-primary)', fontSize: '18px', fontWeight: '600' }}>{item?.Building_Name}</div>
                <div className="recent-city" style={{ color: 'var(--color-text-muted)' }}>{item?.City}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Footer */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <h4>Connect With Us</h4>
          <div className="social-links">
            <a href="https://www.instagram.com/cobnbmsia/#" target="_blank" rel="noopener noreferrer">Instagram</a>
            <span className="separator">/</span>
            <a href="https://www.facebook.com/cobnbmsia" target="_blank" rel="noopener noreferrer">Facebook</a>
            <span className="separator">/</span>
            <a href="https://www.youtube.com/@staywithcobnb9062" target="_blank" rel="noopener noreferrer">YouTube</a>
            <span className="separator">/</span>
            <a href="https://www.tiktok.com/@cobnb.malaysia?lang=en" target="_blank" rel="noopener noreferrer">TikTok</a>
          </div>
          <div style={{ marginBottom: '40px', color: 'inherit', opacity: 0.8, fontSize: '14px', lineHeight: '1.8', maxWidth: '400px', margin: '0 auto 40px auto' }}>
            <img 
              src="https://static.wixstatic.com/media/201a1b_b218982b63c849f98d3165723606121d~mv2_d_6796_3863_s_4_2.png/v1/crop/x_65,y_0,w_6731,h_3863/fill/w_422,h_238,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/logo%20with%20TM.png" 
              alt="COBNB Logo" 
              style={{ height: '40px', objectFit: 'contain', margin: '0 auto 20px auto', display: 'block' }}
            />
            <div>+6010-271 5288</div>
            <div>ask@cobnb.com.my</div>
            <div style={{ marginTop: '8px' }}>100 A - 100 C, Jalan Imbi, WP, 55100 Kuala Lumpur,<br/>Wilayah Persekutuan Kuala Lumpur</div>
          </div>
          <p className="copyright">&copy; {new Date().getFullYear()} Cobnb Malaysia. All rights reserved.</p>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        .luxury-dashboard {
          padding-bottom: 0 !important;
          background-color: var(--color-bg-secondary);
        }

        .hero-section {
          background-image: url('${import.meta.env.BASE_URL}images/bgnewcobnb.jpg');
          background-size: cover;
          background-position: center;
          height: 480px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: -40px -40px 60px -40px;
          padding-top: 80px;
        }

        .hero-section::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(17, 17, 17, 0.4);
        }

        .hero-content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 800px;
          text-align: center;
          padding: 0 24px;
        }

        .hero-text h2 {
          font-family: var(--font-heading);
          color: #ffffff;
          font-size: 48px;
          font-weight: 500;
          letter-spacing: 2px;
          margin: 0 0 16px 0;
          text-transform: uppercase;
          text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }

        .hero-text p {
          color: rgba(255,255,255,0.9);
          font-size: 16px;
          font-weight: 300;
          letter-spacing: 1px;
          margin: 0 0 40px 0;
          text-transform: uppercase;
        }

        .search-box {
          background: var(--color-secondary);
          padding: 16px 24px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: var(--shadow-md);
        }

        .search-box input {
          flex: 1;
          border: none;
          background: transparent;
          font-family: var(--font-body);
          font-size: 15px;
          color: var(--color-primary);
          outline: none;
        }

        .membership-card {
          position: absolute;
          top: 100px;
          right: 40px;
          z-index: 10;
          background: rgba(17, 17, 17, 0.4);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 24px;
          border-radius: 12px;
          color: var(--color-secondary);
          min-width: 260px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .membership-tier {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          color: var(--color-accent);
        }

        .membership-points {
          font-family: var(--font-heading);
          font-size: 28px;
          line-height: 1;
        }

        .membership-points span {
          font-family: var(--font-body);
          font-size: 12px;
          letter-spacing: 1px;
          font-weight: 400;
          opacity: 0.8;
        }

        .section-container {
          margin-bottom: 60px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 32px;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 16px;
        }

        .section-header h3, .section-title {
          font-family: var(--font-heading);
          font-size: 28px;
          color: var(--color-primary);
          margin: 0;
          font-weight: 500;
          letter-spacing: 1px;
        }

        .section-title {
          margin-bottom: 32px;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 16px;
        }

        .view-all {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .view-all:hover {
          color: var(--color-primary);
        }

        .property-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 32px;
        }

        .property-card {
          background: var(--color-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          overflow: hidden;
          cursor: pointer;
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
        }

        .property-info h4 {
          font-family: var(--font-heading);
          font-size: 20px;
          margin: 0 0 12px 0;
          color: var(--color-primary);
          font-weight: 500;
        }

        .property-location {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-text-muted);
          font-size: 13px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .horizontal-scroll {
          display: flex;
          overflow-x: auto;
          gap: 24px;
          padding-bottom: 24px;
          scrollbar-width: none;
        }
        
        .horizontal-scroll::-webkit-scrollbar {
          display: none;
        }

        .recent-card {
          min-width: 280px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          cursor: pointer;
          position: relative;
        }

        .recent-image {
          height: 180px;
          background-size: cover;
          background-position: center;
          transition: var(--transition-normal);
        }

        .recent-card:hover .recent-image {
          transform: scale(1.05);
        }

        .recent-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 32px 24px 24px 24px;
          background: linear-gradient(to top, rgba(17,17,17,0.9), transparent);
        }

        .recent-name {
          color: var(--color-secondary);
          font-family: var(--font-heading);
          font-size: 18px;
          margin-bottom: 4px;
        }

        .recent-city {
          color: var(--color-accent);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .dashboard-footer {
          margin: 80px -40px -40px -40px;
          background: var(--color-primary);
          padding: 60px 40px;
          color: var(--color-secondary);
          text-align: center;
        }

        .footer-content h4 {
          font-family: var(--font-heading);
          font-size: 20px;
          font-weight: 400;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin: 0 0 32px 0;
          color: var(--color-accent);
        }

        .social-links {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 24px;
          margin-bottom: 40px;
        }

        .social-links a {
          color: var(--color-secondary);
          font-size: 13px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          text-decoration: none;
          transition: var(--transition-fast);
        }

        .social-links a:hover {
          color: var(--color-accent);
        }

        .separator {
          color: rgba(255,255,255,0.2);
        }

        .copyright {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          letter-spacing: 1px;
        }

        .whatsapp-float-btn {
          position: fixed;
          bottom: 40px;
          right: 40px;
          z-index: 99;
          background: #25D366;
          border: none;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: var(--shadow-md);
          cursor: pointer;
          transition: var(--transition-normal);
        }

        .whatsapp-float-btn:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-hover);
        }

        .loading-state {
          height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinner-dark {
          border: 2px solid rgba(17,17,17,0.1);
          border-top: 2px solid var(--color-primary);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          animation: spin 1s linear infinite;
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @media (max-width: 768px) {
          .hero-section {
            margin: -20px -20px 40px -20px;
            height: 420px;
            padding-top: 70px;
          }
          .hero-text h2 {
            font-size: 32px;
          }
          .membership-card {
            top: 20px;
            right: 20px;
            padding: 12px 16px;
          }
          .property-grid {
            grid-template-columns: 1fr;
          }
          .dashboard-footer {
            margin: 40px -20px -20px -20px;
            padding: 40px 20px;
          }
          .social-links {
            flex-direction: column;
            gap: 16px;
          }
          .separator {
            display: none;
          }
        }
      `}} />
    </div>
  );
};

export default GuestDashboard;
