import React, { useState, useEffect } from 'react';
import zohoAxios from '../../../utility/axiosInstance';
import { ClipboardList, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { getData } from '../../../utility/LocalStorageService';
import { fetchRefreshToken } from '../../../helper';
import './Dashboards.css';

const CleanerDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [clockStatus, setClockStatus] = useState('Ready to Start');
  
  const counts = {
    Pending: tasks.filter(t => t.Job_Status === 'Pending').length,
    Assigned: tasks.filter(t => t.Job_Status === 'Assigned').length,
    Completed: tasks.filter(t => t.Job_Status === 'Completed').length,
  };

  useEffect(() => {
    loadData();
  }, []);

  const getTodayDate = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const Id = await getData('ID');
      const refreshToken = await getData('refreshToken');
      
      const res = await zohoAxios.get(
        `https://creator.zoho.com/api/v2/brandontan18/housekeeping-system/report/loyalty_members_Report/${Id}`,
        { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
      );
      
      if (res?.data?.code === 3000) {
        const user = res.data.data;
        setUserDetails(user);
        await fetchTasks(user.Internal_User.ID);
      }
    } catch (error) {
      if (error?.response?.data?.code === 1030) {
        await fetchRefreshToken();
        loadData();
      }
      setLoading(false);
    }
  };

  const fetchTasks = async (internalId) => {
    try {
      const refreshToken = await getData('refreshToken');
      const res = await zohoAxios.get(
        `https://creator.zoho.com/api/v2/brandontan18/housekeeping-system/report/Cleaning_Request_Completed?Assign_To.ID=${internalId}&Requested_Date=${getTodayDate()}`,
        { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
      );
      
      if (res?.data?.data) {
        const sortedData = [...res.data.data].sort((a, b) => (a?.Job_Status === 'Assigned' ? -1 : 1));
        setTasks(sortedData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockAction = () => {
    alert("Web Clock In/Out via Webcam coming soon!");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'Assigned': return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
      case 'Completed': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      default: return { bg: 'rgba(107, 114, 128, 0.15)', text: '#9ca3af', border: 'rgba(107, 114, 128, 0.3)' };
    }
  };

  return (
    <div className="dashboard-wrapper">
      <div className="welcome-banner glass-card" style={{ background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)' }}>
        <div>
          <h2>Hi, {userDetails?.Guest_Name?.first_name || 'Cleaner'}!</h2>
          <p>Here are your cleaning requests for today.</p>
        </div>
        <div className="banner-actions">
          <button className="icon-btn" onClick={loadData} disabled={loading} title="Refresh">
            <RefreshCw size={20} className={loading ? 'spinning' : ''} />
          </button>
          <div className="banner-badge" style={{ color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.3)' }}>Housekeeper</div>
        </div>
      </div>

      <div className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="section-title" style={{ margin: 0 }}>Today's Tasks</h3>
          <button 
            className="action-btn solid-btn" 
            style={{ padding: '8px 24px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', maxWidth: '200px' }}
            onClick={handleClockAction}
          >
            <Clock size={16} /> {clockStatus}
          </button>
        </div>
        
        {loading && tasks.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading tasks...</p>
          </div>
        ) : tasks.length > 0 ? (
          <div className="property-grid">
            {tasks.map((item, index) => {
              const statusStyle = getStatusColor(item?.Job_Status);
              return (
                <div key={index} className="property-card glass-card">
                  <div className="property-header">
                    <div className="property-icon-box" style={{ background: 'rgba(52, 211, 153, 0.1)' }}>
                      <ClipboardList size={24} color="#34d399" />
                    </div>
                    <div className="property-title-box">
                      <h4>{item?.Listing_Name?.display_value || 'Unnamed Unit'}</h4>
                      <p className="property-subtitle">Ref: {item?.Booking_Reference_No?.display_value}</p>
                    </div>
                  </div>
                  
                  <div className="property-details">
                    <div className="detail-row">
                      <span>Priority</span>
                      <span className="highlight-text">{item?.Priority}</span>
                    </div>
                    <div className="detail-row">
                      <span>Type</span>
                      <span className="highlight-text">{item?.cleaning_type}</span>
                    </div>
                    <div className="detail-row">
                      <span>Occupancy</span>
                      <span className="status-badge" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: 'none' }}>
                        {item?.["Booking_Reference_No.Checked_Out"] === 'false' ? 'In-House' : 'Checked-Out'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span>Status</span>
                      <span className="status-badge" style={{ background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}>
                        {item?.Job_Status}
                      </span>
                    </div>
                    {item?.remarks && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#8b949e' }}>
                        * {item.remarks}
                      </div>
                    )}
                  </div>

                  <div className="property-actions">
                    <button 
                      className="action-btn solid-btn"
                      style={{ background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)', color: '#000' }}
                      onClick={() => alert('View Details functionality coming soon!')}
                    >
                      <CheckCircle size={16} /> View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state glass-card">
            <ClipboardList size={48} color="#4b5563" />
            <h3>No Jobs Found</h3>
            <p>There are currently no cleaning requests available for you today.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CleanerDashboard;
