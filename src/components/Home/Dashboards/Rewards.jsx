import React, { useEffect, useState } from 'react';
import zohoAxios from '../../../utility/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { getData } from '../../../utility/LocalStorageService';
import { Calendar, ChevronRight } from 'lucide-react';
import './Rewards.css';

const Rewards = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rewards, setRewards] = useState([]);

  useEffect(() => {
    getRewards();
  }, []);

  const checkDatesExpired = (dateStr) => {
    if (!dateStr) return { isExpired: false };
    const currentDate = new Date();
    const givenDate = new Date(dateStr);
    return { isExpired: givenDate < currentDate };
  };

  const getRewards = async () => {
    try {
      setLoading(true);
      const refreshToken = await getData('refreshToken');
      const res = await zohoAxios.get(
        `https://creator.zoho.com/api/v2/brandontan18/housekeeping-system/report/Loyalty_App_Rewards_List_Report`,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${refreshToken}`,
          },
        }
      );
      
      setLoading(false);
      
      if (res?.data?.code === 3000) {
        const newArray = [];
        res.data.data.forEach((item) => {
          if (item.Active === 'true') {
            const { isExpired } = checkDatesExpired(item.Rewards_Expiry_Date);
            if (!isExpired) {
              newArray.push(item);
            }
          }
        });
        setRewards(newArray);
      }
    } catch (error) {
      setLoading(false);
      console.error('Failed to fetch rewards:', error);
    }
  };

  return (
    <div className="rewards-page">
      <div className="rewards-header fade-in-up">
        <h2>Exclusive Rewards</h2>
        <p>Redeem your points for exceptional stays and curated benefits.</p>
      </div>

      <div className="rewards-content fade-in-up stagger-1">
        {loading ? (
          <div className="loading-state">Loading your rewards...</div>
        ) : rewards.length === 0 ? (
          <div className="empty-state">No Active Rewards Available at the moment.</div>
        ) : (
          <div className="rewards-grid">
            {rewards.map((item, idx) => (
              <div key={idx} className="reward-card group">
                <div className="reward-image-container">
                  <img 
                    src={item?.Rewards_Thumbnail_Picture || 'https://via.placeholder.com/400'} 
                    alt={item?.Rewards_Name} 
                    className="reward-image"
                  />
                  <div className="reward-points-badge">
                    {item?.Points_Required || 0} PTS
                  </div>
                </div>
                
                <div className="reward-info">
                  <h4 className="reward-title">{item?.Rewards_Name}</h4>
                  
                  <div className="reward-meta">
                    <Calendar size={14} color="var(--color-text-muted)" />
                    <span>Valid until {item?.Rewards_Expiry_Date || 'N/A'}</span>
                  </div>
                  
                  <button className="redeem-btn" onClick={() => navigate('/reward-details', { state: { item } })}>
                    <span>Redeem Now</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Rewards;
