import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import zohoAxios from '../../../utility/axiosInstance';
import { ChevronLeft, MapPin, Star, Calendar, Camera, Upload, Building, Clock, Users, Mail, AlertTriangle, Key } from 'lucide-react';
import { getData } from '../../../utility/LocalStorageService';

const MyTripDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const preData = location.state?.item;
  
  const [loading, setLoading] = useState(false);
  const [hotelDetails, setHotelDetails] = useState({});
  const [allPropertiesData, setAllPropertiesData] = useState({});
  
  // Modals & States
  const [showInstructions, setShowInstructions] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  
  // Issue Form
  const [issueTitle, setIssueTitle] = useState('');
  const [issueBody, setIssueBody] = useState('');
  const [issueImage, setIssueImage] = useState(null);
  const [issueDate, setIssueDate] = useState('');
  const [rating, setRating] = useState(0);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!preData) {
      navigate('/my-bookings');
      return;
    }
    fetchData();
  }, [preData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const refreshToken = await getData('refreshToken');
      
      // Fetch Hotel Details
      if (preData?.Building_Name?.ID) {
        const hotelRes = await zohoAxios.get(
          `/zoho-api/api/v2/brandontan18/housekeeping-system/report/All_Building_Report/${preData?.Building_Name?.ID}`,
          { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
        );
        if (hotelRes?.data?.code === 3000) {
          setHotelDetails(hotelRes.data.data);
        }
      }

      // Fetch Property details (for instructions & status)
      if (preData?.Listing_Name?.ID) {
        const propRes = await zohoAxios.get(
          `/zoho-api/api/v2/brandontan18/housekeeping-system/report/All_Properties?ID=${preData?.Listing_Name?.ID}`,
          { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
        );
        if (propRes?.data?.code === 3000 && propRes.data.data.length > 0) {
          setAllPropertiesData(propRes.data.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isWithinTwoDays = () => {
    if (!preData?.Check_in_Date) return false;
    const checkIn = new Date(preData.Check_in_Date);
    const today = new Date();
    const diffTime = checkIn - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2;
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const token = await getData('refreshToken');
      let params = { data: { Checked_Out: 'true' } };
      
      await zohoAxios.patch(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/Property_Reservation_System_Report/${preData?.ID}`,
        params,
        { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
      );
      
      if (allPropertiesData?.ID) {
        await zohoAxios.patch(
          `/zoho-api/api/v2/brandontan18/housekeeping-system/report/All_Properties/${allPropertiesData?.ID}`,
          { data: { Room_Status: 'Checked_Out' } },
          { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
        );
      }
      
      alert('Successfully Checked Out, Thanks for staying with us :)');
      navigate('/my-bookings');
    } catch (err) {
      console.error(err);
      alert('Error during checkout');
    }
    setLoading(false);
  };

  const uploadImageToS3 = async (file) => {
    if (!file) return '';
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `photo_${Date.now()}.${fileExtension}`;
      const uploadUrl = `https://cobnb-uploads.s3.ap-southeast-1.amazonaws.com/complaints/${fileName}`;

      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });

      if (response.status === 200) {
        return uploadUrl;
      }
    } catch (err) {
      console.error(err);
    }
    return '';
  };

  const submitIssue = async (e) => {
    e.preventDefault();
    if (!preData?.Listing_Name?.ID) {
      alert('Raise Complaint allowed only after unit assigned!');
      return;
    }
    if (!issueTitle || !issueBody || !issueDate || !rating) {
      alert('Please fill all the fields!');
      return;
    }
    
    setLoading(true);
    try {
      const imageUrl = await uploadImageToS3(issueImage);
      
      // format date to YYYY-MM-DD HH:mm:ss (append a generic time for now)
      const formattedDate = `${issueDate} 12:00:00`;
      
      let params = {
        data: {
          Booking_Ref_Number: preData?.ID,
          Building_Name: hotelDetails?.ID || '',
          Listing_Name: preData?.Listing_Name?.ID,
          Do_you_have_problem_on_your_Arrival: 'Yes',
          Title: issueTitle,
          Describe_the_Problem: issueBody,
          Picture_of_the_Problem: imageUrl,
          Guest_Available_Date_Time: formattedDate,
          Rate_your_stay: rating,
        },
      };
      
      const refreshToken = await getData('refreshToken');
      const res = await zohoAxios.post(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/form/IN_STAY_SATISFACTION_SURVEY`,
        params,
        { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
      );
      
      if (res?.data?.code === 3000) {
        alert('Submission successful. Our team will review your complaint.');
        setShowIssueModal(false);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit issue');
    }
    setLoading(false);
  };

  if (!preData) return null;

  const isCheckedOut = preData?.Checked_Out === 'true';

  return (
    <div style={{ padding: '100px 20px 40px', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button 
          onClick={() => navigate(-1)}
          className="hover-lift"
          style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-primary)' }}
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', fontSize: '28px', margin: '0 0 4px 0', fontWeight: '600' }}>Your Stay Details</h2>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>REF: {preData?.Booking_Ref_No}</p>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--color-secondary)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' }}>
        
        {/* Hotel Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '12px', 
            backgroundImage: `url(${hotelDetails?.Mobile_App_Image?.url || 'https://via.placeholder.com/150'})`,
            backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'var(--color-bg-secondary)'
          }}></div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--color-primary)', margin: '0 0 8px 0', fontWeight: '600' }}>
              {hotelDetails?.Building_Name || preData?.Building_Name?.display_value || 'To Be Assigned'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
              <MapPin size={16} /> {hotelDetails?.Area || preData?.['Building_Name.Area'] || 'Location Pending'}
            </div>
          </div>
        </div>

        {/* Statuses */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', backgroundColor: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px', marginBottom: '4px' }}>Room Status</div>
            <div style={{ fontSize: '16px', color: 'var(--color-primary)', fontWeight: '600' }}>
              {isCheckedOut ? "Checked Out" : (allPropertiesData?.Room_Status || 'N/A')}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px', marginBottom: '4px' }}>Reservation</div>
            <div style={{ fontSize: '16px', color: 'var(--color-primary)', fontWeight: '600' }}>{preData?.Reservation_Status || 'Confirmed'}</div>
          </div>
        </div>

        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: 'var(--color-primary)', margin: '0 0 20px 0' }}>Your Booking</h4>
        
        {/* Booking Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ padding: '10px', backgroundColor: 'var(--color-bg-main)', borderRadius: '8px' }}><Building size={18} color="var(--color-accent)" /></div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Unit No.</div>
              <div style={{ fontSize: '15px', color: 'var(--color-primary)', fontWeight: '600' }}>{preData?.Listing_Name?.display_value || 'To Be Assigned'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ padding: '10px', backgroundColor: 'var(--color-bg-main)', borderRadius: '8px' }}><Clock size={18} color="var(--color-accent)" /></div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Check-In</div>
              <div style={{ fontSize: '15px', color: 'var(--color-primary)', fontWeight: '600' }}>{formatDate(preData?.Check_in_Date)} 3:00 PM</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ padding: '10px', backgroundColor: 'var(--color-bg-main)', borderRadius: '8px' }}><Clock size={18} color="var(--color-accent)" /></div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Check-Out</div>
              <div style={{ fontSize: '15px', color: 'var(--color-primary)', fontWeight: '600' }}>{formatDate(preData?.check_out)} 11:00 AM</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ padding: '10px', backgroundColor: 'var(--color-bg-main)', borderRadius: '8px' }}><Users size={18} color="var(--color-accent)" /></div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Guests</div>
              <div style={{ fontSize: '15px', color: 'var(--color-primary)', fontWeight: '600' }}>{preData?.Number_of_Guests || '-'} Guests</div>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '32px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'var(--color-bg-main)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Key size={20} color="var(--color-primary)" />
              <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-primary)' }}>Check-In Instructions</span>
            </div>
            <button 
              className="hover-lift"
              onClick={() => {
                if (isCheckedOut) alert('You have checked out!');
                else setShowInstructions(true);
              }}
              style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid var(--color-accent)', color: 'var(--color-accent)', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
            >
              View
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'var(--color-bg-main)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle size={20} color="var(--color-primary)" />
              <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-primary)' }}>Report an Issue</span>
            </div>
            <button 
              className="hover-lift"
              onClick={() => {
                if (isCheckedOut) alert('You have checked out!');
                else setShowIssueModal(true);
              }}
              style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
            >
              Raise
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'var(--color-bg-main)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MapPin size={20} color="var(--color-primary)" />
              <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-primary)' }}>Location Map</span>
            </div>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${hotelDetails?.latitude || '3.1614153'},${hotelDetails?.longitude || '101.7364555'}`}
              target="_blank" rel="noreferrer"
              className="hover-lift"
              style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', borderRadius: '6px', fontWeight: '600', textDecoration: 'none' }}
            >
              Open Map
            </a>
          </div>

        </div>

        {/* Check Out Button */}
        <div style={{ marginTop: '32px' }}>
          <button 
            className="hover-lift"
            disabled={isCheckedOut || loading}
            onClick={() => setShowCheckoutModal(true)}
            style={{ 
              width: '100%', padding: '16px', borderRadius: '8px', border: 'none',
              backgroundColor: isCheckedOut ? '#9ca3af' : 'var(--color-primary)', color: 'var(--color-secondary)',
              fontSize: '16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', cursor: isCheckedOut ? 'not-allowed' : 'pointer',
              display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}
          >
            {loading ? 'Processing...' : (isCheckedOut ? "Already Checked Out" : "Proceed to Check-Out")}
          </button>
        </div>

      </div>

      {/* INSTRUCTIONS MODAL */}
      {showInstructions && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--color-secondary)', width: '100%', maxWidth: '600px', maxHeight: '80vh', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '32px', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setShowInstructions(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-primary)' }}>&times;</button>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--color-primary)', margin: '0 0 24px 0' }}>🏨 Building Check-In Instructions</h3>
            
            <div style={{ color: 'var(--color-text-main)', lineHeight: '1.6', fontSize: '15px', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
              {hotelDetails?.CII_1 || 'General check-in instructions pending...'}
            </div>

            {isWithinTwoDays() ? (
              <>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: 'var(--color-primary)', margin: '32px 0 16px 0', borderTop: '1px solid var(--color-border)', paddingTop: '32px' }}>🔑 Unit Check-In Instructions</h3>
                <div style={{ color: 'var(--color-text-main)', lineHeight: '1.6', fontSize: '15px', whiteSpace: 'pre-wrap' }}>
                  {allPropertiesData?.CII_2_Template || 'Specific unit instructions pending...'}
                </div>
              </>
            ) : (
              <div style={{ marginTop: '32px', padding: '16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669', borderRadius: '8px', fontSize: '14px', fontWeight: '500' }}>
                * You'll receive your unit-specific check-in instructions 2 days prior to your arrival.
              </div>
            )}
          </div>
        </div>
      )}

      {/* REPORT ISSUE MODAL */}
      {showIssueModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--color-secondary)', width: '90%', maxWidth: '500px', borderRadius: '16px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--color-primary)', margin: '0 0 24px 0' }}>Raise Complaint</h3>
            
            <form onSubmit={submitIssue}>
              <div 
                onClick={() => fileInputRef.current.click()}
                style={{ height: '120px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '20px', overflow: 'hidden', position: 'relative', border: '1px dashed var(--color-border)' }}
              >
                {issueImage ? (
                  <img src={URL.createObjectURL(issueImage)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--color-text-muted)' }}>
                    <Camera size={24} style={{ marginBottom: '8px' }} />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Add Photo (optional)</span>
                  </div>
                )}
                <input 
                  type="file" accept="image/*" capture="environment" 
                  ref={fileInputRef} style={{ display: 'none' }}
                  onChange={(e) => { if(e.target.files[0]) setIssueImage(e.target.files[0]) }}
                />
              </div>

              <input 
                type="text" placeholder="Title (e.g., Missing Towel)" 
                value={issueTitle} onChange={e => setIssueTitle(e.target.value)} required
                style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)', color: 'var(--color-primary)', marginBottom: '16px', fontSize: '15px' }}
              />
              <textarea 
                placeholder="Description" rows={3}
                value={issueBody} onChange={e => setIssueBody(e.target.value)} required
                style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)', color: 'var(--color-primary)', marginBottom: '16px', fontSize: '15px', fontFamily: 'inherit', resize: 'vertical' }}
              />

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Your Availability Date</label>
                <input 
                  type="date" 
                  value={issueDate} onChange={e => setIssueDate(e.target.value)} required
                  style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)', color: 'var(--color-primary)', fontSize: '15px' }}
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Rate Your Stay So Far</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1,2,3,4,5].map(star => (
                    <Star 
                      key={star} size={32} cursor="pointer"
                      fill={star <= rating ? '#F59E0B' : 'transparent'}
                      color={star <= rating ? '#F59E0B' : 'var(--color-border)'}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button type="button" onClick={() => setShowIssueModal(false)} style={{ flex: 1, padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ flex: 1, padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--color-accent)', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
                  {loading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {showCheckoutModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--color-secondary)', width: '90%', maxWidth: '400px', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--color-primary)', margin: '0 0 16px 0' }}>Check-Out Instructions</h3>
            <p style={{ color: 'var(--color-text-main)', fontSize: '15px', marginBottom: '16px', textAlign: 'left' }}>To proceed to check-out:</p>
            <ul style={{ color: 'var(--color-text-muted)', fontSize: '14px', textAlign: 'left', marginBottom: '32px', lineHeight: '1.6', paddingLeft: '20px' }}>
              <li>Place the keys in the correct key locker.</li>
              <li>Ensure all appliances are turned off.</li>
              <li>Lock the door behind you.</li>
            </ul>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => setShowCheckoutModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCheckout} disabled={loading} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#10B981', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyTripDetails;
