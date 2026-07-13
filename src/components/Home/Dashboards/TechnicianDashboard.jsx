import React, { useState, useEffect } from 'react';
import zohoAxios from '../../../utility/axiosInstance';
import { Wrench, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { getData } from '../../../utility/LocalStorageService';
import { fetchRefreshToken } from '../../../helper';
import './Dashboards.css';

const TechnicianDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  
  const counts = {
    Pending: tasks.filter(t => t.Job_Status === 'Pending').length,
    Assigned: tasks.filter(t => t.Job_Status === 'Assigned').length,
    Completed: tasks.filter(t => t.Job_Status === 'Completed').length,
  };

  useEffect(() => {
    loadData();
  }, []);

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
    if (!internalId) return;
    try {
      const refreshToken = await getData('refreshToken');
      
      // Fetch Assigned
      const resAssigned = await zohoAxios.get(
        `https://creator.zoho.com/api/v2/brandontan18/housekeeping-system/report/Maintenance_Misc_Request_Report?Assign_To.ID=${internalId}&Job_Status=Assigned`,
        { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
      );
      
      // Fetch All
      const resAll = await zohoAxios.get(
        `https://creator.zoho.com/api/v2/brandontan18/housekeeping-system/report/Maintenance_Misc_Request_Report?Assign_To.ID=${internalId}`,
        { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
      );
      
      const assignedData = resAssigned?.data?.data || [];
      const allData = resAll?.data?.data || [];
      
      // Merge unique
      const merged = [...assignedData, ...allData].filter(
        (obj, index, self) => index === self.findIndex((o) => o?.ID === obj?.ID)
      );
      
      // Sort assigned first
      const sortedData = [...merged].sort((a, b) => {
        if (a?.Job_Status === 'Assigned' && b?.Job_Status !== 'Assigned') return -1;
        if (a?.Job_Status !== 'Assigned' && b?.Job_Status === 'Assigned') return 1;
        return 0;
      });
      
      setTasks(sortedData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
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
      <div className="welcome-banner glass-card" style={{ background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(249, 115, 22, 0.05) 100%)' }}>
        <div>
          <h2>Hi, {userDetails?.Guest_Name?.first_name || 'Technician'}!</h2>
          <p>Here are your maintenance tickets.</p>
        </div>
        <div className="banner-actions">
          <button className="icon-btn" onClick={loadData} disabled={loading} title="Refresh">
            <RefreshCw size={20} className={loading ? 'spinning' : ''} />
          </button>
          <div className="banner-badge" style={{ color: '#fb923c', borderColor: 'rgba(251, 146, 60, 0.3)' }}>Technician</div>
        </div>
      </div>

      <div className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="section-title" style={{ margin: 0 }}>Maintenance Requests</h3>
          <div style={{ color: '#8b949e', fontSize: '14px' }}>
            Assigned: <strong style={{ color: '#fff' }}>{counts.Assigned}</strong> | Completed: <strong style={{ color: '#fff' }}>{counts.Completed}</strong>
          </div>
        </div>
        
        {loading && tasks.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading tickets...</p>
          </div>
        ) : tasks.length > 0 ? (
          <div className="property-grid">
            {tasks.map((item, index) => {
              const statusStyle = getStatusColor(item?.Job_Status);
              return (
                <div key={index} className="property-card glass-card">
                  <div className="property-header">
                    <div className="property-icon-box" style={{ background: 'rgba(251, 146, 60, 0.1)' }}>
                      <Wrench size={24} color="#fb923c" />
                    </div>
                    <div className="property-title-box">
                      <h4>{item?.Listing_Name?.display_value || 'Unnamed Unit'}</h4>
                      <p className="property-subtitle">{item?.Property_Name?.display_value}</p>
                    </div>
                  </div>
                  
                  <div className="property-details">
                    <div className="detail-row">
                      <span>Status</span>
                      <span className="status-badge" style={{ background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}>
                        {item?.Job_Status}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span>PT Number</span>
                      <span className="highlight-text">{item?.PT_Number || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span>Availability</span>
                      <span className="highlight-text" style={{ color: '#f59e0b' }}>{item?.Availability_Status || 'N/A'}</span>
                    </div>
                    {item?.General_Remarks && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#8b949e', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px' }}>
                        <strong>Remark:</strong> {item.General_Remarks}
                      </div>
                    )}
                  </div>

                  <div className="property-actions">
                    <button 
                      className="action-btn solid-btn"
                      style={{ background: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)', color: '#fff' }}
                      onClick={() => alert('View Details functionality coming soon!')}
                    >
                      <AlertTriangle size={16} /> Resolve Issue
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state glass-card">
            <Wrench size={48} color="#4b5563" />
            <h3>No Tickets Found</h3>
            <p>You have no maintenance requests assigned at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianDashboard;
