import React, { useState, useRef } from 'react';
import zohoAxios from '../../../utility/axiosInstance';
import { getData } from '../../../utility/LocalStorageService';
import { ChevronLeft, Camera, Check, X, RefreshCw } from 'lucide-react';

const CleanerDetails = ({ item: preData, onBack, onUpdate }) => {
  const conditions = ['All Good', 'Minor Issue', 'Major Issue'];
  
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [startCleaningModalVisible, setStartCleaningModalVisible] = useState(false);

  const [photo1, setPhotos1] = useState(preData?.Image_1 || '');
  const [photo2, setPhotos2] = useState(preData?.Image_2 || '');
  const [photo3, setPhotos3] = useState(preData?.Image_3 || '');
  const [photo4, setPhotos4] = useState(preData?.Image_4 || '');

  const [roomCondition, setRoomCondition] = useState(preData?.Room_Condition || '');
  const [tvAfterCleaning, setTvAfterCleaning] = useState(preData?.TV_After_Cleaning || '');
  const [livingRoomAfterCleaning, setLivingRoomAfterCleaning] = useState(preData?.Living_Room_After_Cleaning || '');
  const [bedroomAfterCleaning, setBedroomAfterCleaning] = useState(preData?.Bedroom_After_Cleaning || '');
  const [kitchenAfterCleaning, setKitchenAfterCleaning] = useState(preData?.Kitchen_Area_After_Cleaning || '');
  
  const [turnOffElectricity, setTurnOffElectricity] = useState(preData?.Turn_Off_Electricity === 'true');
  const [turnOffWater, setTurnOffWater] = useState(preData?.Turn_Off_Water === 'true');
  const [lockDoor, setLockDoor] = useState(preData?.Lock_the_Door === 'true');
  const [keyPlaced, setKeyPlaced] = useState(preData?.Key_Done_Place_in_the_Mailbox === 'true');
  
  const [mailboxpic, setMailBoxPic] = useState(preData?.Key_Placed_in_Mailbox_Image || '');
  const [photo, setPhotos] = useState(preData?.HK_Inspection_Image || '');
  const [hkRemark, setHKRemark] = useState(preData?.HK_Remark || '');

  const fileInputRef = useRef(null);
  const [currentUploader, setCurrentUploader] = useState(null);

  const triggerUpload = (setterFunction) => {
    setCurrentUploader(() => setterFunction);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const uploadToImgBB = async (file) => {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `photo_${Date.now()}.${fileExtension}`;
      const uploadUrl = `https://cobnb-uploads.s3.ap-southeast-1.amazonaws.com/Housekeeping/${fileName}`;
      
      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });

      if (response.status === 200) return uploadUrl;
      return null;
    } catch (err) {
      console.log("Upload Error", err);
      return null;
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setImageUploading(true);
    const imageUrl = await uploadToImgBB(file);
    setImageUploading(false);
    
    if (imageUrl && currentUploader) {
      currentUploader(imageUrl);
    } else {
      alert("Image upload failed.");
    }
    
    event.target.value = '';
    setCurrentUploader(null);
  };

  const getCurrentFormattedDateTime = () => {
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  };

  const parseDateStringSafe = (dateStr) => {
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
      return new Date();
    }
  };

  const calculateHours = (startTime, endTime) => {
    const start = parseDateStringSafe(startTime);
    const end = parseDateStringSafe(endTime);
    const diffInMs = end - start;
    const hours = diffInMs / (1000 * 60 * 60);
    return hours.toFixed(2);
  };

  const updateStatus = async (arg) => {
    try {
      if (arg?.type === 'start') {
        if (!photo1 || !photo2 || !photo3 || !photo4) {
          alert('Please upload all 4 required before-cleaning images.');
          return;
        }
      } else if (arg?.type !== 'update') {
        if (!roomCondition) {
          alert('Please select room condition.');
          return;
        }
        if (!photo) {
          alert('Please upload HK inspection image.');
          return;
        }
        if (!tvAfterCleaning || !livingRoomAfterCleaning || !bedroomAfterCleaning || !kitchenAfterCleaning) {
          alert('Please upload all 4 required after-cleaning images.');
          return;
        }
        if (!turnOffElectricity || !turnOffWater || !lockDoor) {
          alert('Please ensure electricity and water are off, and door is locked.');
          return;
        }
        if (keyPlaced && !mailboxpic) {
          alert('Please upload Mailbox image since key is placed.');
          return;
        }
      }

      if (arg?.type === 'update') {
        if (!mailboxpic) {
          alert('Please upload MailBox image.');
          return;
        }
      }

      setLoading(true);
      let payload = {
        data: arg?.type === 'start'
          ? {
              Job_Status: 'Inprogress',
              Cleaning_Start_Date_Time: getCurrentFormattedDateTime(),
              Image_1: photo1,
              Image_2: photo2,
              Image_3: photo3,
              Image_4: photo4,
            }
          : arg?.type === 'update'
            ? {
                Key_Done_Place_in_the_Mailbox: keyPlaced.toString(),
                Key_Placed_in_Mailbox_Image: mailboxpic,
              }
            : {
                Completed_Date_Time: getCurrentFormattedDateTime(),
                Hours_Used: calculateHours(preData?.Cleaning_Start_Date_Time, getCurrentFormattedDateTime()),
                Job_Status: 'Completed',
                Room_Condition: roomCondition,
                HK_Remark: hkRemark,
                HK_Inspection_Image: photo,
                Key_Done_Place_in_the_Mailbox: keyPlaced.toString(),
                Key_Placed_in_Mailbox_Image: mailboxpic,
                Turn_Off_Electricity: turnOffElectricity.toString(),
                Turn_Off_Water: turnOffWater.toString(),
                Lock_the_Door: lockDoor.toString(),
                TV_After_Cleaning: tvAfterCleaning,
                Living_Room_After_Cleaning: livingRoomAfterCleaning,
                Bedroom_After_Cleaning: bedroomAfterCleaning,
                Kitchen_Area_After_Cleaning: kitchenAfterCleaning,
              },
      };

      const refreshToken = await getData('refreshToken');
      const res = await zohoAxios.patch(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/Cleaning_Request_Completed/${preData?.ID}`,
        payload,
        { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
      );

      setLoading(false);
      if (res?.data?.code === 3000) {
        alert('Status Updated Successfully!');
        if (arg?.type === 'start') setStartCleaningModalVisible(false);
        onUpdate();
        onBack();
      } else {
        alert('Failed to update status. Please try again.');
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      alert('An error occurred. Please try again.');
    }
  };

  const renderLabel = (title, value, badge = false, color = null) => (
    <div style={{ flex: '1 1 calc(50% - 16px)', minWidth: '200px', padding: '16px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontWeight: '600' }}>{title}</div>
      {badge ? (
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>{value || '-'}</span>
      ) : color ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }}></div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-primary)' }}>{value || '-'}</span>
        </div>
      ) : (
        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-primary)' }}>{value || '-'}</div>
      )}
    </div>
  );

  const renderImageUpload = (title, currentPhoto, setterFunction) => (
    <div style={{ flex: '1 1 calc(50% - 16px)', minWidth: '200px' }}>
      <button 
        style={{ width: '100%', height: '120px', backgroundColor: 'transparent', border: '1px dashed var(--color-border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}
        onClick={() => triggerUpload(setterFunction)}
      >
        {currentPhoto ? (
          <img src={currentPhoto} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <>
            <Camera size={24} color="var(--color-text-muted)" style={{ marginBottom: '8px' }} />
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '0 16px' }}>{title}</span>
          </>
        )}
      </button>
    </div>
  );

  return (
    <div className="section-container fade-in-up stagger-2" style={{ position: 'relative' }}>
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
      
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={onBack} className="hover-lift" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-bg-secondary)', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}>
            <ChevronLeft size={20} />
          </button>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--color-primary)', margin: 0 }}>Task Details</h3>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        {renderLabel('Request Type', preData?.Request_Type)}
        {renderLabel('Job Status', preData?.Job_Status, true)}
        {renderLabel('Priority', preData?.Priority, false, '#ef4444')}
        {renderLabel('Listing Name', preData?.Listing_Name?.display_value)}
        {renderLabel('Property Name', preData?.Property_Name?.display_value)}
        {renderLabel('Booking Ref.', preData?.Booking_Reference_No?.display_value)}
        {renderLabel('Cleaning Type', preData?.cleaning_type, true)}
        {renderLabel('Room Type', preData?.['Listing_Name.Room_Type'], false, '#f59e0b')}
        {renderLabel('Room Code', preData?.['Listing_Name.Room_Code'])}
        {renderLabel('Check In Status', preData?.Check_In_Status)}
        {renderLabel('Arrival Instructions', preData?.Arrival_Instructions)}
        {renderLabel('Start Time', preData?.Cleaning_Start_Date_Time)}
        {renderLabel('End Time', preData?.Completed_Date_Time)}
        {renderLabel('Hours Used', preData?.Hours_Used)}
        {renderLabel('Inspected', preData?.Inspected)}
        {renderLabel('Cleaning Cost', preData?.['Listing_Name.Cleaning_Cost'])}
        {renderLabel('Laundry Cost', preData?.Laundry_Cost)}
        {renderLabel('Remark', preData?.Remark)}
        {renderLabel('Key Placed In Mailbox', preData?.Key_Done_Place_in_the_Mailbox)}
        {renderLabel('Room Condition', preData?.Room_Condition)}
        {renderLabel('HK Remark', preData?.HK_Remark)}
      </div>

      {preData?.HK_Inspection_Image && (
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '14px', color: 'var(--color-primary)', marginBottom: '12px' }}>HK Inspection Image</h4>
          <img src={preData?.HK_Inspection_Image} style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px' }} alt="HK Inspection" />
        </div>
      )}

      {(preData?.Image_1 || preData?.Image_2 || preData?.Image_3 || preData?.Image_4) && (
        <div style={{ backgroundColor: 'var(--color-secondary)', padding: '24px', borderRadius: '12px', marginBottom: '32px' }}>
          <h4 style={{ fontSize: '16px', color: 'var(--color-primary)', margin: '0 0 16px 0' }}>Before Cleaning Images</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {preData?.Image_1 && <div style={{ flex: '1 1 calc(50% - 16px)' }}><span style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>TV</span><img src={preData?.Image_1} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} /></div>}
            {preData?.Image_2 && <div style={{ flex: '1 1 calc(50% - 16px)' }}><span style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>Living Room</span><img src={preData?.Image_2} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} /></div>}
            {preData?.Image_3 && <div style={{ flex: '1 1 calc(50% - 16px)' }}><span style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>Bedroom</span><img src={preData?.Image_3} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} /></div>}
            {preData?.Image_4 && <div style={{ flex: '1 1 calc(50% - 16px)' }}><span style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>Kitchen</span><img src={preData?.Image_4} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} /></div>}
          </div>
        </div>
      )}

      {preData?.Job_Status === 'Completed' && (
        <div style={{ backgroundColor: 'var(--color-secondary)', padding: '24px', borderRadius: '12px', marginBottom: '32px' }}>
          <h4 style={{ fontSize: '16px', color: 'var(--color-primary)', margin: '0 0 16px 0' }}>After Cleaning Review</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            {renderLabel('Electricity Off', preData?.Turn_Off_Electricity === 'true' ? 'Yes' : 'No')}
            {renderLabel('Water Off', preData?.Turn_Off_Water === 'true' ? 'Yes' : 'No')}
            {renderLabel('Door Locked', preData?.Lock_the_Door === 'true' ? 'Yes' : 'No')}
            {renderLabel('Key in Mailbox', preData?.Key_Done_Place_in_the_Mailbox === 'true' ? 'Yes' : 'No')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {preData?.TV_After_Cleaning && <div style={{ flex: '1 1 calc(50% - 16px)' }}><span style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>TV</span><img src={preData?.TV_After_Cleaning} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} /></div>}
            {preData?.Living_Room_After_Cleaning && <div style={{ flex: '1 1 calc(50% - 16px)' }}><span style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>Living Room</span><img src={preData?.Living_Room_After_Cleaning} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} /></div>}
            {preData?.Bedroom_After_Cleaning && <div style={{ flex: '1 1 calc(50% - 16px)' }}><span style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>Bedroom</span><img src={preData?.Bedroom_After_Cleaning} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} /></div>}
            {preData?.Kitchen_Area_After_Cleaning && <div style={{ flex: '1 1 calc(50% - 16px)' }}><span style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>Kitchen</span><img src={preData?.Kitchen_Area_After_Cleaning} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} /></div>}
          </div>
          {preData?.Key_Placed_in_Mailbox_Image && (
            <div style={{ marginTop: '24px' }}>
              <h5 style={{ fontSize: '14px', color: 'var(--color-primary)', marginBottom: '12px' }}>Mailbox Image</h5>
              <img src={preData?.Key_Placed_in_Mailbox_Image} style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px' }} />
            </div>
          )}
        </div>
      )}

      {/* Start Cleaning Button */}
      {preData?.Cleaning_Start_Date_Time === '' ? (
        <div style={{ padding: '24px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '12px', textAlign: 'center' }}>
          <button 
            className="hover-lift"
            onClick={() => setStartCleaningModalVisible(true)}
            style={{ width: '100%', padding: '16px', backgroundColor: 'var(--color-accent)', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}
          >
            Start Cleaning
          </button>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '12px' }}>This will update your current date & time</div>
        </div>
      ) : preData?.Completed_Date_Time === '' || preData?.Job_Status === '' ? (
        /* End Cleaning Form */
        <div style={{ backgroundColor: 'var(--color-secondary)', padding: '24px', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '20px', color: 'var(--color-primary)', margin: '0 0 24px 0', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>Complete Cleaning</h3>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)', marginBottom: '8px' }}>Select Room Condition</label>
            <select 
              value={roomCondition}
              onChange={(e) => setRoomCondition(e.target.value)}
              style={{ width: '100%', padding: '12px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-primary)', fontSize: '15px' }}
            >
              <option value="">Select Room Condition</option>
              {conditions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)', marginBottom: '12px' }}>Upload After Cleaning Images</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              {renderImageUpload("TV", tvAfterCleaning, setTvAfterCleaning)}
              {renderImageUpload("Living Room", livingRoomAfterCleaning, setLivingRoomAfterCleaning)}
              {renderImageUpload("Bedroom", bedroomAfterCleaning, setBedroomAfterCleaning)}
              {renderImageUpload("Kitchen", kitchenAfterCleaning, setKitchenAfterCleaning)}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', backgroundColor: 'var(--color-bg-secondary)', padding: '16px', borderRadius: '8px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontSize: '15px', color: 'var(--color-primary)' }}>Turn Off Electricity</span>
              <input type="checkbox" checked={turnOffElectricity} onChange={e => setTurnOffElectricity(e.target.checked)} style={{ width: '20px', height: '20px' }} />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontSize: '15px', color: 'var(--color-primary)' }}>Turn Off Water</span>
              <input type="checkbox" checked={turnOffWater} onChange={e => setTurnOffWater(e.target.checked)} style={{ width: '20px', height: '20px' }} />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontSize: '15px', color: 'var(--color-primary)' }}>Lock the Door</span>
              <input type="checkbox" checked={lockDoor} onChange={e => setLockDoor(e.target.checked)} style={{ width: '20px', height: '20px' }} />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontSize: '15px', color: 'var(--color-primary)' }}>Key Placed in Mailbox</span>
              <input type="checkbox" checked={keyPlaced} onChange={e => setKeyPlaced(e.target.checked)} style={{ width: '20px', height: '20px' }} />
            </label>
          </div>

          {keyPlaced && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)', marginBottom: '12px' }}>Upload Mailbox Image</label>
              {renderImageUpload("Capture Mailbox Image 📷", mailboxpic, setMailBoxPic)}
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)', marginBottom: '12px' }}>Upload HK Inspection Image</label>
            {renderImageUpload("Capture HK Inspection Image 📷", photo, setPhotos)}
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)', marginBottom: '12px' }}>Write HK Remark</label>
            <textarea 
              value={hkRemark} 
              onChange={e => setHKRemark(e.target.value)} 
              placeholder="HK Remarks..."
              style={{ width: '100%', height: '100px', padding: '16px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-primary)', fontSize: '15px', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <button 
            className="hover-lift"
            disabled={loading || imageUploading}
            onClick={() => updateStatus({ type: 'end' })}
            style={{ width: '100%', padding: '16px', backgroundColor: 'var(--color-accent)', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', opacity: (loading || imageUploading) ? 0.7 : 1 }}
          >
            {loading ? <RefreshCw size={20} className="spinning" /> : 'Complete/End Cleaning'}
          </button>
        </div>
      ) : null}

      {/* Update Key Placement if Completed but not placed */}
      {preData?.Key_Done_Place_in_the_Mailbox === 'false' && preData?.Job_Status === 'Completed' && (
        <div style={{ backgroundColor: 'var(--color-secondary)', padding: '24px', borderRadius: '12px', marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--color-accent)' }}>🔑 Key done placed in the mailbox?</span>
            <input type="checkbox" checked={keyPlaced} onChange={e => setKeyPlaced(e.target.checked)} style={{ width: '24px', height: '24px' }} />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            {renderImageUpload("Capture Mailbox Image 📷", mailboxpic, setMailBoxPic)}
          </div>

          <button 
            className="hover-lift"
            disabled={loading || imageUploading}
            onClick={() => updateStatus({ type: 'update' })}
            style={{ width: '100%', padding: '16px', backgroundColor: 'var(--color-accent)', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', opacity: (loading || imageUploading) ? 0.7 : 1 }}
          >
            {loading ? <RefreshCw size={20} className="spinning" /> : 'Update'}
          </button>
        </div>
      )}

      {/* Start Cleaning Modal */}
      {startCleaningModalVisible && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--color-secondary)', borderRadius: '12px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary)', fontSize: '20px' }}>Upload Before Cleaning Images</h3>
              <button onClick={() => setStartCleaningModalVisible(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
              {renderImageUpload("TV", photo1, setPhotos1)}
              {renderImageUpload("Living Room", photo2, setPhotos2)}
              {renderImageUpload("Bedroom", photo3, setPhotos3)}
              {renderImageUpload("Kitchen Area", photo4, setPhotos4)}
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                onClick={() => setStartCleaningModalVisible(false)}
                style={{ flex: 1, padding: '14px', backgroundColor: 'transparent', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-primary)', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                disabled={loading || imageUploading}
                onClick={() => updateStatus({ type: 'start' })}
                style={{ flex: 1, padding: '14px', backgroundColor: 'var(--color-accent)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: (loading || imageUploading) ? 0.7 : 1 }}
              >
                {loading ? <RefreshCw size={20} className="spinning" /> : 'Start'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CleanerDetails;
