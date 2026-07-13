import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Calendar, Building, MapPin, ChevronLeft } from 'lucide-react';
import './Dashboards.css';

const GenerateStatement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.item;
  const role = location.state?.role;

  const [statementType, setStatementType] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Generate Year Options
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear + 1; i >= currentYear - 10; i--) {
    years.push(i.toString());
  }

  const months = [
    { label: 'January', value: '01' }, { label: 'February', value: '02' },
    { label: 'March', value: '03' }, { label: 'April', value: '04' },
    { label: 'May', value: '05' }, { label: 'June', value: '06' },
    { label: 'July', value: '07' }, { label: 'August', value: '08' },
    { label: 'September', value: '09' }, { label: 'October', value: '10' },
    { label: 'November', value: '11' }, { label: 'December', value: '12' },
  ];

  useEffect(() => {
    if (!data) {
      navigate('/welcome');
      return;
    }

    const currentDate = new Date();
    const currentMonthStr = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const currentYearStr = currentDate.getFullYear().toString();

    setSelectedMonth(currentMonthStr);
    setSelectedYear(currentYearStr);
    getStartAndEndDateOfMonth(currentMonthStr, currentYearStr);
  }, [data, navigate]);

  useEffect(() => {
    if (selectedMonth && selectedYear && statementType === 'monthly') {
      getStartAndEndDateOfMonth(selectedMonth, selectedYear);
    }
  }, [selectedMonth, selectedYear, statementType]);

  const getStartAndEndDateOfMonth = (monthNumber, year) => {
    const mNumber = parseInt(monthNumber, 10);
    const yNumber = parseInt(year, 10);
    
    // JS dates are 0-indexed for months
    const start = new Date(yNumber, mNumber - 1, 1);
    const end = new Date(yNumber, mNumber, 0); // Last day of month
    
    // Formatting to YYYY-MM-DD
    const pad = (n) => n.toString().padStart(2, '0');
    
    const startDateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    const endDateStr = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
    
    setStartDate(startDateStr);
    setEndDate(endDateStr);
  };

  const handleGenerate = () => {
    setErrorMsg('');
    let url = "";

    if (statementType === 'annual') {
      if (!selectedYear) {
        setErrorMsg('Please Select Year!');
        return;
      }
      url = `https://creatorapp.zohopublic.com/brandontan18/housekeeping-system/page-perma/Annual_Statement/THxD3nmZgM6kZB192uSEqwVd83FDwSDVR8rdEd6ZCA3pRNNp6t4ARZtqaMrdryxSq5kwKQnqRgpaPErBAePXK35NK4VeZK7qXSah?prop_id_str=${data?.ID}&year_str=${selectedYear}`;
    } else {
      if (!startDate || !endDate) {
        setErrorMsg('Please Select Month & Year!');
        return;
      }
      url = role == 2
        ? `https://creatorapp.zohopublic.com/brandontan18/housekeeping-system/page-perma/Agent_Statement/3ua7f5Me1xj3s5emMP59et74tvF56Ohk2GQX2hqwy1CaNrt9N0BvCR6y68naEJG01BP2vzt9tB2P9yKQntB7Peq8Dr3nUsKA0Q1q?prop_id_val=${data?.ID}&end_date_val=${endDate}&st_date_val=${startDate}`
        : `https://creatorapp.zohopublic.com/brandontan18/housekeeping-system/view-perma/Statement/yApafWKzJs9dTXAPbxuqPMvJd1hXJhXjR3GxTDOTXWNxZGHtynMHj81D4bBsVFUAwZE9HkDECuksN4kSTqOYSq469xszYEO2zC1r?prop_id_val=${data?.ID}&end_date_val=${endDate}&st_date_val=${startDate}`;
    }

    // Open URL in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!data) return null;

  return (
    <div className="luxury-dashboard statement-page" style={{ padding: '100px 24px 24px', maxWidth: '800px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={() => navigate(-1)}
          className="hover-lift"
          style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-primary)' }}
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', fontSize: '28px', margin: '0 0 4px 0', fontWeight: '600' }}>Generate Statement</h2>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '15px' }}>Download your financial reports directly from Zoho.</p>
        </div>
      </div>

      <div className="property-card" style={{ backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--radius-sm)', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
        
        {/* Property Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building size={32} color="var(--color-accent)" />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--color-primary)', margin: '0 0 8px 0', fontWeight: '600' }}>{data?.Property_Name?.display_value}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {data?.Listing_Name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: data?.Not_Active === 'false' ? '#10B981' : '#EF4444' }}></div>
                {data?.Not_Active === 'false' ? 'Active' : 'Not Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Form Selection */}
        <div>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', color: 'var(--color-primary)', margin: '0 0 20px 0' }}>Statement Type</h4>
          
          {/* Radio Buttons */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '16px', color: 'var(--color-primary)', fontWeight: '500' }}>
              <input 
                type="radio" 
                name="statementType" 
                value="monthly" 
                checked={statementType === 'monthly'}
                onChange={() => setStatementType('monthly')}
                style={{ width: '20px', height: '20px', accentColor: 'var(--color-accent)' }}
              />
              Monthly Statement
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '16px', color: 'var(--color-primary)', fontWeight: '500' }}>
              <input 
                type="radio" 
                name="statementType" 
                value="annual" 
                checked={statementType === 'annual'}
                onChange={() => setStatementType('annual')}
                style={{ width: '20px', height: '20px', accentColor: 'var(--color-accent)' }}
              />
              Annual Statement
            </label>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {statementType === 'monthly' && (
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase' }}>Select Month</label>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ width: '100%', padding: '16px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-primary)', fontSize: '16px', outline: 'none' }}
                >
                  <option value="" disabled>Select Month</option>
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase' }}>Select Year</label>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{ width: '100%', padding: '16px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-primary)', fontSize: '16px', outline: 'none' }}
              >
                <option value="" disabled>Select Year</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {statementType === 'monthly' && startDate && endDate && (
            <div style={{ display: 'flex', gap: '24px', padding: '20px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 120px' }}>
                <Calendar color="var(--color-accent)" size={20} />
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Start Date</div>
                  <div style={{ fontSize: '15px', color: 'var(--color-primary)', fontWeight: '600' }}>{startDate}</div>
                </div>
              </div>
              <div style={{ width: '1px', backgroundColor: 'var(--color-border)', display: 'block' }} className="hide-on-mobile"></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 120px' }}>
                <Calendar color="var(--color-accent)" size={20} />
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>End Date</div>
                  <div style={{ fontSize: '15px', color: 'var(--color-primary)', fontWeight: '600' }}>{endDate}</div>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '8px', marginBottom: '24px', fontWeight: '500', fontSize: '14px' }}>
              {errorMsg}
            </div>
          )}

          <button 
            className="hover-lift"
            onClick={handleGenerate}
            style={{ width: '100%', padding: '18px', backgroundColor: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}
          >
            <FileText size={20} />
            Generate {statementType === 'annual' ? 'Annual' : 'Monthly'} Statement
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateStatement;
