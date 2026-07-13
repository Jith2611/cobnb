import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import zohoAxios from '../../../utility/axiosInstance';
import { getData } from '../../../utility/LocalStorageService';
import { Calendar, ArrowLeft } from 'lucide-react';
import QRCode from 'react-qr-code';
import './RewardDetails.css';

const RewardDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [preData, setPreData] = useState(location.state?.item || {});
  const [userDetails, setUserDetails] = useState({});
  const [allVoucherDetails, setAllVoucherDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!preData?.ID) {
      navigate('/rewards');
      return;
    }
    getUserAndFunc();
  }, [preData]);

  const getUserAndFunc = async () => {
    const userDataStr = await getData('userDetails');
    if (userDataStr) {
      const parsedData = JSON.parse(userDataStr);
      setUserDetails(parsedData);
      getUsersVoucher(parsedData?.ID);
    }
  };

  const getCurrentDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const redeemVoucher = async () => {
    if (claiming) return;
    try {
      setClaiming(true);
      const refresh_token = await getData('refreshToken');

      let params = {
        data: {
          loyalty_members: userDetails?.ID,
          Loyalty_App_Rewards_Name: preData?.ID,
        },
      };

      const res = await zohoAxios.post(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/form/Rewards_Claim_System`,
        params,
        { headers: { Authorization: `Zoho-oauthtoken ${refresh_token}` } }
      );

      setClaiming(false);
      if (res?.data?.code === 3000) {
        alert('Congratulations! Your voucher has been successfully claimed.');
        getUsersVoucher(userDetails?.ID);
      } else {
        const errMsg = res?.data?.error?.[0]?.alert_message?.[0] || 'Failed to claim reward. Please try again.';
        alert(errMsg);
      }
    } catch (error) {
      console.error(error);
      setClaiming(false);
      alert('An error occurred while claiming the reward.');
    }
  };

  const getUsersVoucher = async (ID) => {
    try {
      setLoading(true);
      const refreshToken = await getData('refreshToken');
      let url = `/zoho-api/api/v2/brandontan18/housekeeping-system/report/Rewards_Claim_System_Report?criteria=loyalty_members==${ID}`;

      const res = await zohoAxios.get(url, {
        headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` },
      });

      setLoading(false);
      if (res?.data?.data?.length > 0) {
        const filteredData = res.data.data.filter(
          (item) => item?.Loyalty_App_Rewards_Name?.ID === preData?.ID
        );
        setAllVoucherDetails(filteredData);
      }
    } catch (error) {
      setLoading(false);
      console.error('Failed to fetch user vouchers:', error);
    }
  };

  const canClaim = preData?.Claim_Type === 'Single' && allVoucherDetails.length > 0 ? false : true;
  const isAvailable = preData?.Number_of_Vouchers > 0;

  return (
    <div className="reward-details-page">
      <button className="back-btn" onClick={() => navigate('/rewards')}>
        <ArrowLeft size={20} /> Back
      </button>

      <div className="reward-hero">
        <div 
          className="reward-hero-bg" 
          style={{ backgroundImage: `url(${preData?.Rewards_Full_Screen_Picture || 'https://via.placeholder.com/800x400'})` }}
        />
        <div className="reward-hero-overlay" />
        
        <img 
          src={preData?.Rewards_Thumbnail_Picture || 'https://via.placeholder.com/220'} 
          alt={preData?.Rewards_Name} 
          className="reward-hero-circle-img"
        />
      </div>

      <div className="reward-details-container fade-in-up">
        <h1 className="reward-details-title">{preData?.Rewards_Name}</h1>

        <div className="info-cards-container">
          <div className="info-card">
            <span className="info-card-label">VALID TILL</span>
            <span className="info-card-value">{preData?.Rewards_Expiry_Date || 'N/A'}</span>
          </div>
          <div className="info-card-divider" />
          <div className="info-card">
            <span className="info-card-label">POINTS REQUIRED</span>
            <span className="info-card-value">{preData?.Points_Required || 0}</span>
          </div>
        </div>

        {allVoucherDetails.length > 0 && (
          <div className="vouchers-horizontal-scroll">
            {allVoucherDetails.map((item, index) => (
              <div key={index} className="voucher-card">
                <div className="qr-placeholder">
                  <QRCode value={item?.Claim_Number || 'VOUCHER'} size={120} />
                </div>
                <div className="coupon-view">
                  <span className="claim-number-text">{item?.Claim_Number}</span>
                </div>
                <p className="voucher-meta">Voucher Status: <strong>{item?.Status}</strong></p>
                <p className="voucher-meta">Claimed Date: {item?.Redemption_Date}</p>
                <p className="voucher-note">* Take a screenshot to save your voucher *</p>
              </div>
            ))}
          </div>
        )}

        <div className="description-container">
          <h3 className="description-title">About this Reward</h3>
          <p className="description-text">{preData?.Rewards_Description || 'No description available for this reward.'}</p>
        </div>

        {!canClaim ? null : isAvailable ? (
          <button 
            className="claim-btn hover-lift" 
            onClick={redeemVoucher}
            disabled={claiming}
          >
            {claiming ? 'Claiming...' : 'Claim Reward'}
          </button>
        ) : (
          <p className="not-available-note">🎯 VOUCHER IS NOT AVAILABLE 🎯</p>
        )}
      </div>
    </div>
  );
};

export default RewardDetails;
