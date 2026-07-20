import React, { useEffect, useState } from 'react';
import zohoAxios from '../../../utility/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { LogOut, Copy, Check, Award, Shield } from 'lucide-react';
import { getData, storeData } from '../../../utility/LocalStorageService';
import { saveUserData, setIsOwner } from '../../../redux/actions';
import { useDispatch } from 'react-redux';

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    const Id = await getData('ID');
    if (Id) {
      getUserFunc(Id);
    } else {
      navigate('/login');
    }
  };

  const getUserFunc = async (id) => {
    try {
      setLoading(true);
      const refreshToken = await getData('refreshToken');
      const res = await zohoAxios.get(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/loyalty_members_Report/${id}`,
        { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
      );
      setLoading(false);
      if (res?.data?.code === 3000) {
        setUserDetails(res.data.data);
        await storeData('userDetails', JSON.stringify(res.data.data));
      }
    } catch (error) {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const logoutAction = async () => {
    dispatch(saveUserData(undefined));
    dispatch(setIsOwner(0));
    await storeData('ID', '');
    await storeData('refreshToken', '');
    await storeData('userDetails', '');
    navigate('/login');
  };

  const currentPoints = Number(userDetails?.Points) || 0;

  const TierCard = ({ title, color, requirements, active, perks }) => (
    <div 
      className="tier-card"
      style={{
        background: active ? 'var(--color-bg-secondary)' : 'var(--color-bg-main)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${active ? color : 'var(--color-border)'}`,
        borderRadius: '12px', 
        padding: '24px',
        position: 'relative', 
        display: 'flex',
        flexDirection: 'column',
        boxShadow: active ? `0 4px 20px ${color}15` : 'var(--shadow-sm)',
        transition: 'all 0.2s ease',
    }}>
      {active && (
        <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: color, color: '#fff', fontSize: '9px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Current
        </div>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={16} fill={color} color={color} />
        </div>
        <h4 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '18px', color: 'var(--color-text-main)' }}>{title}</h4>
      </div>
      <p style={{ margin: '0 0 20px 0', fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {requirements}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        {perks.map((perk, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ marginTop: '3px' }}>
              <Check size={12} color={color} />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-main)', lineHeight: '1.4' }}>{perk.text}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const tiers = [
    {
      title: "SILVER",
      color: "#94A3B8",
      requirements: "MIN 3 STAYS | RM 2,000 SPEND",
      level: 'Silver',
      perks: [
        { text: '5% off all time stay' },
        { text: '10% off for next stay' },
        { text: '10% Off BOOK and Stay on Birthday Month.' }
      ]
    },
    {
      title: "GOLD",
      color: "#D4AF37",
      requirements: "MIN 7 STAYS | RM 4,000 SPEND",
      level: 'Gold',
      perks: [
        { text: '10% for next stay' },
        { text: '10% off BOOK and Stay on Birthday Month.' },
        { text: 'RM 50 Off (x3)' },
        { text: '1 PM late checkout (subject to availability)' }
      ]
    },
    {
      title: "PLATINUM",
      color: "#C5A880", // Golden luxury accent
      requirements: "MIN 15 STAYS | RM 8,000 SPEND",
      level: 'Platinum',
      perks: [
        { text: '15% for next stay' },
        { text: '15% off BOOK and Stay on Birthday Month.' },
        { text: 'RM 100 Off (x3)' },
        { text: 'Room Upgrade (subject to availability)' }
      ]
    }
  ];

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      {/* Background Image & Overlay */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${import.meta.env.BASE_URL}images/bg3.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: -2, opacity: 0.3 }}></div>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'var(--color-bg-main)', opacity: 0.85, backdropFilter: 'blur(8px)', zIndex: -1 }}></div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '100px 24px 60px', position: 'relative', zIndex: 1 }}>
        
        {loading && !userDetails ? (
          <div style={{ height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner-dark" style={{ borderTopColor: 'var(--color-accent)', border: '2px solid var(--color-border)', borderRadius: '50%', width: '32px', height: '32px', animation: 'spin 1s linear infinite' }}></div>
          </div>
        ) : userDetails ? (
          <div className="fade-in-up">
            
            {/* Header section (Professional layout) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px', background: 'var(--color-bg-secondary)', backdropFilter: 'blur(20px)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '32px', marginBottom: '32px' }}>
              <div style={{ 
                width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
                backgroundImage: `url(${userDetails?.Profile_Pic || 'https://via.placeholder.com/150'})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                border: '2px solid var(--color-border)'
              }}></div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--color-text-main)', margin: '0 0 4px 0', fontWeight: '500' }}>
                      {userDetails?.Guest_Name?.display_value || 'Esteemed Guest'}
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: '0 0 12px 0' }}>
                      {userDetails?.member_email}
                    </p>
                    <div style={{ display: 'inline-block', backgroundColor: 'var(--color-bg-main)', border: '1px solid var(--color-border)', padding: '4px 12px', borderRadius: '4px', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Last Login: {userDetails?.Last_Login_Date || 'N/A'}
                    </div>
                  </div>
                  
                  <button 
                    onClick={logoutAction}
                    className="logout-btn"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)',
                      padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
                      fontSize: '11px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--color-border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '40px' }}>
              <div style={{ background: 'var(--color-bg-secondary)', padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Reward Points</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Award size={18} color="var(--color-accent)" /> {currentPoints}
                </div>
              </div>
              <div style={{ background: 'var(--color-bg-secondary)', padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Current Tier</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--color-accent)' }}>{userDetails?.member_level || 'Silver'}</div>
              </div>
              <div className="promo-hover" style={{ background: 'var(--color-bg-secondary)', padding: '24px', textAlign: 'center', position: 'relative', cursor: 'pointer' }} onClick={() => copyToClipboard(userDetails?.Discount_Code)}>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Promo Code</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {userDetails?.Discount_Code || 'N/A'} <Copy size={16} color="var(--color-text-muted)" className="copy-icon" />
                </div>
                {copied && <div style={{ position: 'absolute', bottom: '8px', left: '0', right: '0', textAlign: 'center', fontSize: '9px', color: 'var(--color-accent)', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Copied!</div>}
              </div>
            </div>

            {/* Exclusive Tier Entitlements - Grid Layout */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: 'var(--color-text-main)', margin: '0 0 4px 0', fontWeight: '500' }}>
                  Tier Entitlements
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', margin: 0 }}>View the benefits of your current and upcoming loyalty tiers.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {tiers.map((tier, idx) => (
                  <TierCard
                    key={idx}
                    title={tier.title}
                    color={tier.color}
                    requirements={tier.requirements}
                    active={userDetails?.member_level === tier.level}
                    perks={tier.perks}
                  />
                ))}
              </div>
            </div>

          </div>
        ) : null}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .tier-card:hover {
          border-color: var(--color-accent) !important;
          transform: translateY(-2px);
        }
        .promo-hover:hover .copy-icon {
          color: var(--color-accent) !important;
          opacity: 1 !important;
        }
        .logout-btn:hover {
          color: var(--color-text-main) !important;
          border-color: var(--color-text-main) !important;
          background: var(--color-bg-main) !important;
        }
      `}} />
    </div>
  );
};

export default Profile;
