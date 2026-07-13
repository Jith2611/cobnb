import React, { useEffect, useState } from 'react';
import zohoAxios from '../../../utility/axiosInstance';
import { Search as SearchIcon, MapPin, ChevronRight, Heart } from 'lucide-react';
import { getData, storeData } from '../../../utility/LocalStorageService';
import { fetchRefreshToken } from '../../../helper';

const Search = () => {
  const [hotelList, setHotelList] = useState([]);
  const [hotelList2, setHotelList2] = useState([]);
  const [items, setItems] = useState([]);
  const [recentlyViewed, setRecentlyView] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getHotels();
    loadItems();
    loadRecentlyViewed();
  }, []);

  const getHotels = async () => {
    try {
      setLoading(true);
      const refreshToken = await getData('refreshToken');
      const res = await zohoAxios.get(
        `https://creator.zoho.com/api/v2/brandontan18/housekeeping-system/report/All_Building_Report?Mobile_App_Active=Active`,
        { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
      );
      setLoading(false);
      if (res?.data?.code === 3000) {
        setHotelList(res?.data?.data);
        setHotelList2(res?.data?.data);
      }
    } catch (error) {
      setLoading(false);
      if (error?.response?.data?.code === 1030) {
        fetchRefreshToken(getHotels);
      }
    }
  };

  const loadItems = async () => {
    try {
      const storedItems = await getData('fav');
      if (storedItems) setItems(JSON.parse(storedItems));
    } catch (error) {}
  };

  const saveItems = async (updatedItems) => {
    try {
      await storeData('fav', JSON.stringify(updatedItems));
      setItems(updatedItems);
    } catch (error) {}
  };

  const handleAddItem = (item) => {
    const updatedItems = [...items, item];
    saveItems(updatedItems);
  };

  const handleRemoveItem = (itemId) => {
    const updatedItems = items.filter(i => i.ID !== itemId);
    saveItems(updatedItems);
  };

  const searchFilterFunction = (text) => {
    setSearchQuery(text);
    if (text === '') {
      setHotelList2(hotelList);
    } else {
      const newData = hotelList.filter(item => {
        const itemData = `${item.Building_Name.toUpperCase()} ${item.Area.toUpperCase()}`;
        const searchText = text.toUpperCase();
        return itemData.indexOf(searchText) > -1;
      });
      setHotelList2(newData);
    }
  };

  const loadRecentlyViewed = async () => {
    try {
      const storedItems = await getData('recentlyviewed');
      if (storedItems) setRecentlyView(JSON.parse(storedItems));
    } catch (error) {}
  };

  const saveRecentlyViewed = async (updatedItems) => {
    try {
      await storeData('recentlyviewed', JSON.stringify(updatedItems));
      setRecentlyView(updatedItems);
    } catch (error) {}
  };

  const handleAddrecently = (item) => {
    const updatedItems = [...recentlyViewed];
    const itemExists = updatedItems.some(existingItem => existingItem.ID === item.ID);
    if (!itemExists) {
      updatedItems.push(item);
      saveRecentlyViewed(updatedItems);
    }
  };

  const openURL = (item) => {
    handleAddrecently(item);
    if (item?.Booking_URL?.url) {
      window.open(item.Booking_URL.url, '_blank');
    }
  };

  return (
    <div className="search-container" style={{ maxWidth: '1440px', margin: '0 auto', padding: '120px 40px 60px 40px', minHeight: 'calc(100vh - 80px)' }}>
      
      {/* Search Input */}
      <div style={{ backgroundColor: 'var(--color-secondary)', padding: '24px 32px', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '48px' }}>
        <SearchIcon color="var(--color-primary)" size={24} />
        <input 
          type="text" 
          placeholder="Search by Name, Area, City..." 
          value={searchQuery}
          onChange={(e) => searchFilterFunction(e.target.value)}
          style={{ border: 'none', background: 'transparent', flex: 1, fontSize: '18px', color: 'var(--color-primary)', outline: 'none', fontFamily: 'var(--font-heading)' }}
        />
      </div>

      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', color: 'var(--color-primary)', marginBottom: '32px', fontWeight: '500' }}>
        Search Results {hotelList2.length > 0 && `(${hotelList2.length})`}
      </h3>

      {loading ? (
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ borderTopColor: 'var(--color-accent)', border: '3px solid var(--color-border)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
        </div>
      ) : hotelList2.length > 0 ? (
        <div className="property-grid">
          {hotelList2.map((item, index) => {
            const isFav = items.some(fav => fav.ID === item.ID);
            return (
              <div 
                key={index} 
                className="property-card"
                onClick={() => openURL(item)}
              >
                <div className="property-image" style={{ backgroundImage: `url(${item?.Mobile_App_Image?.url || item?.Mobile_App_Image?.value})` }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      isFav ? handleRemoveItem(item.ID) : handleAddItem(item);
                    }}
                    style={{
                      position: 'absolute', top: '16px', right: '16px', background: 'var(--color-secondary)',
                      border: 'none', borderRadius: '50%', width: '36px', height: '36px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', boxShadow: 'var(--shadow-sm)', zIndex: 10
                    }}
                  >
                    <Heart size={18} color={isFav ? '#e11d48' : 'var(--color-text-muted)'} fill={isFav ? '#e11d48' : 'transparent'} />
                  </button>
                </div>
                <div className="property-info">
                  <div className="property-location">
                    <MapPin size={12} strokeWidth={2.5} color="var(--color-accent)" />
                    <span>{item?.Area || 'Malaysia'}</span>
                  </div>
                  <h4>{item?.Building_Name}</h4>
                  <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Get Details <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: '80px 20px', textAlign: 'center', backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
          <SearchIcon size={48} color="var(--color-text-muted)" style={{ marginBottom: '24px', opacity: 0.3 }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '16px' }}>No properties found matching "{searchQuery}"</p>
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

export default Search;
