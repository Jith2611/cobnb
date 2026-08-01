import React, { useState, useEffect, useRef } from 'react';
import zohoAxios from '../../../utility/axiosInstance';
import { ClipboardList, Clock, CheckCircle, RefreshCw, ChevronLeft } from 'lucide-react';
import { getData } from '../../../utility/LocalStorageService';
import { fetchRefreshToken } from '../../../helper';
import CleanerDetails from './CleanerDetails';
import './Dashboards.css';

const CleanerDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // --- Clock States ---
  const [loadingAction, setLoadingAction] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isShiftEnded, setIsShiftEnded] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [clockData, setClockData] = useState(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  const counts = {
    Pending: tasks.filter(t => t.Job_Status === 'Pending').length,
    Assigned: tasks.filter(t => t.Job_Status === 'Assigned').length,
    Completed: tasks.filter(t => t.Job_Status === 'Completed').length,
  };

  useEffect(() => {
    loadData();
    return () => clearInterval(timerRef.current);
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
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/loyalty_members_Report/${Id}`,
        { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
      );

      if (res?.data?.code === 3000) {
        const user = res.data.data;
        setUserDetails(user);
        await fetchTasks(user.Internal_User.ID);
        await fetchtodayClockIn(user.Internal_User.ID);
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
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/Cleaning_Request_Completed?Assign_To.ID=${internalId}&Requested_Date=${getTodayDate()}`,
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

  const getTimeNow = () => {
    const date = new Date();
    const time = date.toTimeString().split(' ')[0];
    return `${getTodayDate()} ${time}`;
  };

  const formatDuration = (ms) => {
    if (ms < 0) return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const startTimer = (startTime) => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const now = new Date();
      const diff = now - startTime;
      setElapsedTime(formatDuration(diff));
    }, 1000);
  };

  const parseDateString = (dateStr) => {
    try {
      if (!dateStr || typeof dateStr !== 'string') return new Date();
      const parts = dateStr.split(' ');
      if (parts.length !== 2) {
        const fallback = new Date(dateStr.replace(' ', 'T'));
        return isNaN(fallback.getTime()) ? new Date() : fallback;
      }
      const dateParts = parts[0].split('-');
      const timeParts = parts[1].split(':');
      if (dateParts.length < 3 || timeParts.length < 3) return new Date();
      const [year, month, day] = dateParts.map(Number);
      const [hour, minute, second] = timeParts.map(Number);
      const parsedDate = new Date(year, month - 1, day, hour, minute, second);
      return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    } catch (error) {
      console.log('Date parsing error:', error);
      return new Date();
    }
  };

  const convertTimeToDecimal = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    const decimalHours = hours + (minutes / 60) + (seconds / 3600);
    return parseFloat(decimalHours.toFixed(2));
  };

  const fetchtodayClockIn = async (empID) => {
    try {
      setLoadingAction(true);
      const refreshToken = await getData('refreshToken');
      const res = await zohoAxios.get(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/Housekeeper_Clock_IN_and_Out_Report?Employees.ID=${empID}&Date_field=${getTodayDate()}`,
        { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
      );
      
      if (res?.data?.data?.length > 0) {
        const record = res.data.data[0];
        setClockData(record);

        if (record.Clock_IN && !record.Clock_Out) {
          const startTime = parseDateString(record.Clock_IN);
          setIsClockedIn(true);
          setIsShiftEnded(false);
          startTimer(startTime);
        } else if (record.Clock_IN && record.Clock_Out) {
          const start = parseDateString(record.Clock_IN);
          const end = parseDateString(record.Clock_Out);
          setIsClockedIn(false);
          setIsShiftEnded(true);
          clearInterval(timerRef.current);
          setElapsedTime(formatDuration(end - start));
        }
      } else {
        setIsClockedIn(false);
        setIsShiftEnded(false);
        setElapsedTime("00:00:00");
      }
    } catch (error) {
      if (error.response?.data?.code === 3100) {
        setIsClockedIn(false);
        setIsShiftEnded(false);
        setElapsedTime("00:00:00");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const uploadToImgBB = async (file) => {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `attendance_${Date.now()}.${fileExtension}`;
      const uploadUrl = `https://cobnb-uploads.s3.ap-southeast-1.amazonaws.com/Attendance/${fileName}`;
      
      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "image/jpeg",
        },
        body: file,
      });

      if (response.status === 200) {
        return uploadUrl;
      } else {
        console.log("Upload failed");
        return null;
      }
    } catch (err) {
      console.log("Upload Error", err);
      return null;
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      setLoadingAction(false);
      return;
    }
    await processClockAction(file);
    event.target.value = '';
  };

  const handleClockActionClick = () => {
    if (isShiftEnded) return;
    setLoadingAction(true);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processClockAction = async (imageFile) => {
    try {
      const imageUrl = await uploadToImgBB(imageFile);
      if (!imageUrl) {
        alert('Image upload failed.');
        setLoadingAction(false);
        return;
      }

      const refreshToken = await getData('refreshToken');
      const currentTime = getTimeNow();

      if (!isClockedIn) {
        let payload = {
          data: {
            Employees: userDetails?.Internal_User?.ID,
            Clock_IN: currentTime,
            Date_field: getTodayDate(),
            Clock_In_Photo: imageUrl,
            Status: "Clocked In"
          }
        };

        await zohoAxios.post(
          `/zoho-api/api/v2/brandontan18/housekeeping-system/form/Housekeeper_Clock_IN_and_Out`,
          payload,
          { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
        );
        alert('Clocked In Successfully');

      } else {
        const decimalHours = convertTimeToDecimal(elapsedTime);
        if (!clockData?.ID) {
          alert('Clock-in record not found');
          setLoadingAction(false);
          return;
        }

        let payload = {
          data: {
            Clock_Out: currentTime,
            Clock_Out_Photo: imageUrl,
            Status: "Clocked Out",
            Hours: decimalHours
          }
        };

        await zohoAxios.patch(
          `/zoho-api/api/v2/brandontan18/housekeeping-system/report/Housekeeper_Clock_IN_and_Out_Report/${clockData.ID}`,
          payload,
          { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
        );
        alert('Clocked Out Successfully');
      }

      await fetchtodayClockIn(userDetails?.Internal_User?.ID);
    } catch (error) {
      console.error(error);
      alert('Process failed. Check logs.');
    } finally {
      setLoadingAction(false);
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
    <div className="luxury-dashboard">

      {/* Hero Section */}
      <div className="hero-section cleaner-hero">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${import.meta.env.BASE_URL}images/bg2.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(17, 17, 17, 0.5)', zIndex: 1 }}></div>

        {/* Floating Pass Widget */}
        {!selectedTask && (
          <div className="membership-card cleaner" style={{ zIndex: 10 }}>
            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-accent)', marginBottom: '4px' }}>Welcome Back</div>
              <div style={{ fontSize: '20px', fontFamily: 'var(--font-heading)', fontWeight: '600', color: '#ffffff' }}>
                {userDetails?.Guest_Name?.first_name || 'Cleaner'} {userDetails?.Guest_Name?.last_name || ''}
              </div>
              {userDetails?.member_email && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>{userDetails.member_email}</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
              <div className="membership-tier">
                <ClipboardList size={14} fill="var(--color-accent)" color="var(--color-accent)" />
                <span>HOUSEKEEPER</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="container">
        {selectedTask ? (
          <CleanerDetails item={selectedTask} onBack={() => setSelectedTask(null)} onUpdate={loadData} />
        ) : (
          <div className="section-container fade-in-up stagger-2">
            <div className="section-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '32px' }}>
              <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', color: 'var(--color-primary)', margin: 0 }}>Today's Tasks</h3>
                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>Assigned: {counts.Assigned}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>Completed: {counts.Completed}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
              <button className="hover-lift" onClick={loadData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Refresh
              </button>
              
              <div style={{ textAlign: 'right', borderLeft: '1px solid var(--color-border)', paddingLeft: '20px' }}>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--color-primary)', fontFamily: 'monospace' }}>{elapsedTime}</div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '1px', fontWeight: '600' }}>{isShiftEnded ? "Shift Completed" : isClockedIn ? "Working Time" : "Ready to Start"}</div>
              </div>
              
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <button 
                className="hover-lift" 
                disabled={isShiftEnded || loadingAction}
                style={{ padding: '10px 24px', backgroundColor: isShiftEnded ? '#4B5563' : isClockedIn ? '#EF4444' : '#10B981', color: '#fff', borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', opacity: (isShiftEnded || loadingAction) ? 0.7 : 1, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                onClick={handleClockActionClick}
              >
                {loadingAction ? <RefreshCw size={16} className="spinning" /> : <Clock size={16} />}
                {isShiftEnded ? "FINISHED" : isClockedIn ? "CLOCK OUT" : "CLOCK IN"}
              </button>
            </div>
          </div>

          {loading && tasks.length === 0 ? (
            <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="spinner-dark"></div>
            </div>
          ) : tasks.length > 0 ? (
            <div className="property-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '32px' }}>
              {tasks.map((item, index) => {
                const statusStyle = getStatusColor(item?.Job_Status);
                return (
                  <div key={index} className="property-card hover-lift" style={{ backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '24px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ClipboardList size={24} color="var(--color-accent)" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 4px 0', fontFamily: 'var(--font-heading)', fontSize: '18px', color: 'var(--color-primary)', fontWeight: '600', lineHeight: '1.3' }}>
                            {item?.Listing_Name?.display_value || 'Unnamed Unit'}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                            Ref: {item?.Booking_Reference_No?.display_value}
                          </div>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--color-border)', margin: '0 -24px 20px -24px' }}></div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Priority</span>
                        <span style={{ fontSize: '14px', color: 'var(--color-primary)', fontWeight: '700' }}>{item?.Priority}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Type</span>
                        <span style={{ fontSize: '14px', color: 'var(--color-primary)', fontWeight: '700' }}>{item?.cleaning_type}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Occupancy</span>
                        <span style={{ fontSize: '11px', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)', padding: '4px 10px', borderRadius: '4px', fontWeight: '600', letterSpacing: '0.5px' }}>
                          {item?.["Booking_Reference_No.Checked_Out"] === 'false' ? 'In-House' : 'Checked-Out'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Status</span>
                        <span style={{ fontSize: '11px', backgroundColor: statusStyle.bg, color: statusStyle.text, padding: '4px 10px', borderRadius: '4px', fontWeight: '600', letterSpacing: '0.5px' }}>
                          {item?.Job_Status}
                        </span>
                      </div>
                      {item?.remarks && (
                        <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                          * {item.remarks}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', borderTop: '1px solid var(--color-border)' }}>
                      <button
                        className="hover-lift"
                        onClick={() => setSelectedTask(item)}
                        style={{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: 'transparent', color: 'var(--color-primary)', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', border: 'none', cursor: 'pointer' }}
                      >
                        <CheckCircle size={16} /> View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '80px 20px', textAlign: 'center', backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)' }}>
              <ClipboardList size={64} color="var(--color-text-muted)" style={{ marginBottom: '24px', opacity: 0.5 }} />
              <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', margin: '0 0 16px 0', fontSize: '28px', fontWeight: '600' }}>No Jobs Found</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '16px', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>There are currently no cleaning requests available for you today.</p>
            </div>
          )}
        </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
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

export default CleanerDashboard;

