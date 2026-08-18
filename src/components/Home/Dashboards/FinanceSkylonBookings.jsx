import React, { useState, useEffect } from 'react';
import zohoAxios from '../../../utility/axiosInstance';
import { Download, RefreshCw, Calendar } from 'lucide-react';
import { getData } from '../../../utility/LocalStorageService';

const FinanceSkylonBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Default to current year and month (e.g., "2026-09")
  const today = new Date();
  const defaultMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [monthYear, setMonthYear] = useState(defaultMonthYear);

  useEffect(() => {
    fetchBookings(monthYear);
  }, [monthYear]);

  const fetchBookings = async (selectedMonthYear) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const refreshToken = await getData('refreshToken');
      const res = await zohoAxios.get(
        `/zoho-api/api/v2/brandontan18/housekeeping-system/report/Skylon_Bookings?Month_Year=${selectedMonthYear}`,
        { headers: { Authorization: `Zoho-oauthtoken ${refreshToken}` } }
      );
      
      if (res?.data?.code === 3000) {
        setBookings(res.data.data || []);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error('Failed to fetch Skylon Bookings', error);
      setErrorMsg('Failed to fetch Skylon bookings data.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (bookings.length === 0) return;

    // Define columns to export based on API response structure
    const headers = [
      "Booking_Ref_No",
      "Booking_Platform",
      "Listing_Name",
      "Building_Name",
      "Check_in_Date",
      "check_out",
      "Nights",
      "Accomodation_Fare",
      "Cleaning_Fare",
      "Platform_Fees",
      "Tourism_Tax",
      "Internal_Platform_Commission",
      "Host_Payout",
      "Owner_Payout_New",
      "Reservation_Status"
    ];

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(",") + "\n";

    bookings.forEach((row) => {
      let rowArray = headers.map(header => {
        let val = row[header];
        if (val && typeof val === 'object') {
          val = val.display_value || '';
        }
        val = val !== undefined && val !== null ? String(val) : '';
        // Escape double quotes and wrap in quotes
        return `"${val.replace(/"/g, '""')}"`;
      });
      csvContent += rowArray.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Skylon_Bookings_${monthYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="section-container fade-in-up stagger-1" style={{ marginBottom: '40px', backgroundColor: 'var(--color-secondary)', padding: '24px', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--color-primary)', margin: '0 0 8px 0' }}>Skylon Bookings</h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '14px' }}>Finance Admin View</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--color-bg-secondary)', padding: '8px 16px', borderRadius: 'var(--radius-sm)' }}>
            <Calendar size={18} color="var(--color-text-muted)" />
            <input 
              type="month" 
              value={monthYear} 
              onChange={(e) => setMonthYear(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', outline: 'none', fontFamily: 'inherit', fontSize: '14px', cursor: 'pointer' }}
            />
          </div>

          <button 
            className="hover-lift" 
            onClick={() => fetchBookings(monthYear)} 
            disabled={loading} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', backgroundColor: 'var(--color-bg-secondary)', padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: '600' }}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Refresh
          </button>

          <button 
            className="hover-lift" 
            onClick={exportToCSV} 
            disabled={loading || bookings.length === 0} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--color-accent)', color: '#fff', padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: '600', opacity: (loading || bookings.length === 0) ? 0.5 : 1 }}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {errorMsg && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>{errorMsg}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)' }}>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Ref No</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Platform</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Listing</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Check-in</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Check-out</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Nights</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Host Payout</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Owner Payout</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '32px' }}>
                  <div className="spinner-dark" style={{ margin: '0 auto' }}></div>
                </td>
              </tr>
            ) : bookings.length > 0 ? (
              bookings.map((b, i) => (
                <tr key={b.ID || i} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--color-primary)' }}>{b.Booking_Ref_No}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-primary)' }}>{b.Booking_Platform}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-primary)' }}>
                    <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={b.Listing_Name?.display_value}>
                      {b.Listing_Name?.display_value}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-primary)' }}>{b.Check_in_Date}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-primary)' }}>{b.check_out}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-primary)' }}>{b.Nights}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-primary)' }}>{b.Host_Payout}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-primary)', fontWeight: '600' }}>{b.Owner_Payout_New}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', backgroundColor: b.Reservation_Status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: b.Reservation_Status === 'Active' ? '#10B981' : '#EF4444', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>
                      {b.Reservation_Status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                  No bookings found for {monthYear}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinanceSkylonBookings;
