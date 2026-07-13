import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Home, 
  Calendar, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Search,
  Moon,
  Sun,
  BarChart2,
  Gift
} from 'lucide-react';
import { saveUserData, setIsOwner } from '../../redux/actions';
import { storeData } from '../../utility/LocalStorageService';
import './DashboardLayout.css';

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Read role from Redux
  const isOwner = useSelector((state) => state.userInfo?.isOwner);
  
  const navItems = [
    { path: '/welcome', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Find & Reserve' },
    { path: '/calendar', icon: Calendar, label: 'COBNB' },
    { path: '/my-bookings', icon: Calendar, label: 'My Trips' },
    ...(isOwner === 1 ? [{ path: '/revenue-dashboard', icon: BarChart2, label: 'Revenue Dashboard' }] : []),
    ...(isOwner === 2 ? [{ path: '/agent-revenue-dashboard', icon: BarChart2, label: 'Agent Revenue' }] : []),
    { path: '/rewards', icon: Gift, label: 'Reward/Coupons' },
    { path: '/profile', icon: User, label: 'Sign In / Join' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    saveUserData(null);
    setIsOwner(0);
    await storeData('ID', '');
    await storeData('refreshToken', '');
    navigate('/login');
  };

  const isHome = location.pathname === '/welcome' || location.pathname === '/';

  return (
    <div className="layout-container">
      {/* Top Header Navbar */}
      <header className={`top-navbar ${scrolled || !isHome ? 'navbar-solid' : 'navbar-transparent'}`}>
        <div className="navbar-content">
          <div className="navbar-logo" onClick={() => navigate('/welcome')}>
            <img 
              src="https://static.wixstatic.com/media/201a1b_b218982b63c849f98d3165723606121d~mv2_d_6796_3863_s_4_2.png/v1/crop/x_65,y_0,w_6731,h_3863/fill/w_422,h_238,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/logo%20with%20TM.png" 
              alt="COBNB Logo" 
              style={{ height: '36px', objectFit: 'contain', cursor: 'pointer' }}
            />
          </div>
          
          {/* Desktop Nav */}
          <nav className="desktop-nav">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    if (item.label === 'COBNB') {
                      window.open('https://www.cobnb.com.my/', '_blank');
                    } else {
                      navigate(item.path);
                    }
                  }}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  {item.label}
                </button>
              );
            })}
            <button className="nav-link logout-link" onClick={handleLogout}>
              Logout
            </button>
            <button 
              onClick={toggleTheme}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', border: '1px solid currentColor', background: 'transparent', cursor: 'pointer', color: 'inherit' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      <div className={`mobile-nav-backdrop ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)} />
      <div className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <button 
          onClick={() => setMobileMenuOpen(false)}
          style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}
        >
          <X size={32} />
        </button>
        <nav className="mobile-nav">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => { 
                  if (item.label === 'COBNB') {
                    window.open('https://www.cobnb.com.my/', '_blank');
                  } else {
                    navigate(item.path); 
                  }
                  setMobileMenuOpen(false); 
                }}
                className={`mobile-nav-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </button>
            );
          })}
          <button className="mobile-nav-link" onClick={() => { toggleTheme(); setMobileMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button className="mobile-nav-link" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="main-content-area">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
