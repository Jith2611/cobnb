import React from 'react';
import { Search, Globe, Menu, User } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <div className="navbar-logo">
          <span className="logo-icon">C</span>
          <span className="logo-text">cobnb</span>
        </div>
        
        <div className="navbar-search">
          <button className="search-btn">Anywhere</button>
          <span className="divider"></span>
          <button className="search-btn">Any week</button>
          <span className="divider"></span>
          <button className="search-btn add-guests">Add guests</button>
          <div className="search-icon-wrapper">
            <Search size={14} className="search-icon" />
          </div>
        </div>

        <div className="navbar-actions">
          <a href="#" className="host-link">Cobnb your home</a>
          <button className="globe-btn">
            <Globe size={18} />
          </button>
          <button className="profile-menu">
            <Menu size={18} />
            <div className="avatar">
              <User size={18} />
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
