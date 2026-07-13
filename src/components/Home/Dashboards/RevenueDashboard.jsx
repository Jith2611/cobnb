import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { TrendingUp, Home, Users, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Legend
} from 'recharts';
import zohoAxios from '../../../utility/axiosInstance';
import { getData } from '../../../utility/LocalStorageService';
import './RevenueDashboard.css';

const RevenueDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [property, setProperty] = useState([]);
  const [isColiving, setIsColiving] = useState(false);

  const now = new Date();
  const monthNames = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  const [currentMonth] = useState(monthNames[now.getMonth()]);
  const [currentMonthNo] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [currentYear] = useState(now.getFullYear());

  const [monthlyRevenueData, setMonthlyRevenueData] = useState(0);
  const [nightOccupied, setNightOccupied] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [graphLabels, setGraphLabels] = useState([]);
  const [graphDataset, setGraphDataset] = useState([]);

  const [colivingData, setColivingData] = useState([]);
  const [fullNight, setFullNight] = useState(0);
  const [fullMonthlyRevenue, setFullMonthlyRevenue] = useState(100000);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const res = await getData('userDetails');
    if (res) {
      const parsed = JSON.parse(res);
      setUserDetails(parsed);
      if (parsed?.member_email) {
        await loadAll(parsed);
      }
    }
  };

  const loadAll = async (user) => {
    setLoading(true);
    await getProperty(user);
    await getSTRData(user);
    await getLast6Months(user);
    setLoading(false);
  };

  const getProperty = async (user) => {
    try {
      const isDemo = user?.member_email === 'demo.cobnb@gmail.com';
      const emailParam = isDemo ? 'Sales_Demo_Email' : 'Owner_Email';
      const url = `/zoho-api/api/v2/brandontan18/housekeeping-system/report/All_Properties?${emailParam}=${encodeURIComponent(user?.member_email)}`;
      const res = await zohoAxios.get(url);
      if (res?.data?.code === 3000) {
        const props = res.data.data;
        setProperty(props);
        setFullNight(props.length * 30);
        const target = props.reduce((sum, p) => sum + (Number(p?.Monthly_Target_Revenue_Owner_Payout) || 0), 0);
        if (target > 0) setFullMonthlyRevenue(target);

        const colivingIds = props
          .filter(p => p.Property_Status === 'Co-living (Tenanted)')
          .map(p => p.ID);

        if (colivingIds.length > 0) {
          setIsColiving(true);
          fetchColivingRevenue(colivingIds);
        } else {
          setIsColiving(false);
          setColivingData([]);
        }
      }
    } catch (e) { console.error('Property Fetch Error', e); }
  };

  const fetchColivingRevenue = async (ids) => {
    try {
      const allColiving = [];
      for (const id of ids) {
        const url = `/zoho-api/api/v2/brandontan18/housekeeping-system/report/AR_Validation_Report_Co_living?Listing_Name.ID=${id}&Date_field=${currentYear}-${currentMonthNo}-01`;
        const res = await zohoAxios.get(url);
        if (res.data.code === 3000) allColiving.push(...res.data.data);
      }
      setColivingData(allColiving);
    } catch (e) { console.error('Coliving Error', e); }
  };

  const getSTRData = async (user) => {
    try {
      const isDemo = user?.member_email === 'demo.cobnb@gmail.com';
      const emailField = isDemo ? 'Sales_Demo_Email' : 'Owner_Email';
      const dateRange = `${currentYear}-${currentMonthNo}`;

      const revUrl = `/zoho-api/api/v2/brandontan18/housekeeping-system/report/Master_Statement_Report?Listing_Number.${emailField}=${encodeURIComponent(user?.member_email)}&Month_Year=${dateRange}`;
      const revRes = await zohoAxios.get(revUrl);
      if (revRes.data.code === 3000) {
        const payout = revRes.data.data.reduce((s, i) => s + (parseFloat(i.Owner_Payout) || 0), 0);
        const nights = revRes.data.data.reduce((s, i) => s + (parseFloat(i.Total_No_of_Nights) || 0), 0);
        setMonthlyRevenueData(Math.round(payout * 100) / 100);
        setNightOccupied(nights);
      }

      const bookUrl = `/zoho-api/api/v2/brandontan18/housekeeping-system/report/Property_Reservation_System_Report?Listing_Name.${emailField}=${encodeURIComponent(user?.member_email)}&Month_Year=${dateRange}`;
      const bookRes = await zohoAxios.get(bookUrl);
      if (bookRes.data.code === 3000) setBookings(bookRes.data.data);
    } catch (e) { console.error('STR Error', e); }
  };

  const getLast6Months = async (user) => {
    try {
      const months = [];
      let d = new Date();
      for (let i = 0; i < 12; i++) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        months.push(`${y}-${m}`);
        d.setMonth(d.getMonth() - 1);
      }

      const url = `/zoho-api/api/v2/brandontan18/housekeeping-system/report/Master_Statement_Report?Listing_Number.Owner_Email=${encodeURIComponent(user?.member_email)}`;
      const res = await zohoAxios.get(url);
      if (res.data.code === 3000) {
        const grouped = {};
        res.data.data
          .filter(item => months.includes(item.Month_Year))
          .forEach(item => {
            grouped[item.Month_Year] = (grouped[item.Month_Year] || 0) + (Number(item.Owner_Payout) || 0);
          });
        const sortedKeys = Object.keys(grouped).sort().reverse().slice(0, 6).reverse();
        const shortMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        setGraphLabels(sortedKeys.map(k => shortMonths[parseInt(k.split('-')[1]) - 1]));
        setGraphDataset(sortedKeys.map(k => Math.round(grouped[k])));
      }
    } catch (e) { console.error('History Error', e); }
  };

  const colivingRevenue = colivingData.reduce((t, i) => t + (parseFloat(i?.Owner_Payout) || 0), 0);
  const totalRevenue = monthlyRevenueData + colivingRevenue;
  const occupancyRate = fullNight > 0 ? Math.round((nightOccupied / fullNight) * 100) : 0;
  const revenueProgress = Math.min(Math.round((totalRevenue / fullMonthlyRevenue) * 100), 100);

  const chartData = graphLabels.map((label, i) => ({ month: label, revenue: graphDataset[i] || 0 }));

  const radialData = [
    { name: 'Revenue', value: revenueProgress, fill: '#C5A880' },
    { name: 'Occupancy', value: occupancyRate, fill: '#132135' },
  ];

  return (
    <div className="rd-page">
      {/* Header */}
      <div className="rd-header">
        <div>
          <h2 className="rd-title">{currentMonth} {currentYear} — Revenue Dashboard</h2>
          <p className="rd-subtitle">{property.length} propert{property.length !== 1 ? 'ies' : 'y'} under management</p>
        </div>
        <button className="rd-refresh" onClick={() => loadAll(userDetails)} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'rd-spin' : ''} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading && (
        <div className="rd-loading-bar">
          <div className="rd-loading-fill"></div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="rd-stats-grid">
        <StatCard icon={<DollarSign size={22} />} label="Total Revenue" value={`RM ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub={colivingRevenue > 0 ? `STR: RM ${monthlyRevenueData.toFixed(2)}  Co-living: RM ${colivingRevenue.toFixed(2)}` : null} accent="#C5A880" />
        <StatCard icon={<TrendingUp size={22} />} label="Revenue Progress" value={`${revenueProgress}%`} sub={`Target: RM ${fullMonthlyRevenue.toLocaleString()}`} accent="#132135" progress={revenueProgress} />
        <StatCard icon={<Calendar size={22} />} label="Occupancy Rate" value={`${occupancyRate}%`} sub={`${nightOccupied} / ${fullNight} nights`} accent="#10B981" progress={occupancyRate} />
        <StatCard icon={<Home size={22} />} label="Properties" value={property.length} sub="Under management" accent="#6366F1" />
      </div>

      {/* Charts Row */}
      <div className="rd-charts-row">
        {/* Line Chart */}
        <div className="rd-card rd-chart-card">
          <h3 className="rd-card-title">Revenue History (Last 6 Months)</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={v => `RM ${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`RM ${v.toLocaleString()}`, 'Revenue']} contentStyle={{ backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="revenue" stroke="#C5A880" strokeWidth={2.5} dot={{ fill: '#C5A880', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="rd-empty">No historical data available</div>
          )}
        </div>

        {/* Radial Chart */}
        <div className="rd-card rd-radial-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 className="rd-card-title" style={{ width: '100%', marginBottom: 0 }}>Performance Overview</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadialBarChart 
              cx="50%" cy="45%" 
              innerRadius="40%" outerRadius="100%" 
              barSize={16} data={radialData} 
              startAngle={180} endAngle={-180}
            >
              <RadialBar minAngle={15} background dataKey="value" cornerRadius={8} />
              <Legend 
                iconSize={10} layout="horizontal" verticalAlign="bottom" align="center" 
                wrapperStyle={{ paddingBottom: '10px' }}
                formatter={(v) => <span style={{ fontSize: '13px', color: 'var(--color-text-main)', fontWeight: '600', marginLeft: '4px' }}>{v}</span>} 
              />
              <Tooltip 
                formatter={(v) => [`${v}%`]} 
                contentStyle={{ backgroundColor: 'var(--color-secondary)', borderRadius: '8px', border: '1px solid var(--color-border)', padding: '8px' }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rd-card" style={{ marginBottom: '24px' }}>
        <h3 className="rd-card-title">This Month's Bookings <span className="rd-count">{bookings.length}</span></h3>
        {bookings.length > 0 ? (
          <div className="rd-table-wrap">
            <table className="rd-table">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Unit</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Payout</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((item, idx) => (
                  <tr key={idx}>
                    <td><span className="rd-platform">{item?.Booking_Platform || '-'}</span></td>
                    <td>{item?.Listing_Name?.display_value || '-'}</td>
                    <td>{item?.Check_in_Date || '-'}</td>
                    <td>{item?.check_out || '-'}</td>
                    <td><strong>RM {item?.Owner_Payout_New || '0'}</strong></td>
                    <td><span className={`rd-status ${item?.Reservation_Status === 'Confirmed' ? 'confirmed' : 'other'}`}>{item?.Reservation_Status || '-'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rd-empty">No bookings this month</div>
        )}
      </div>

      {/* Co-living Section */}
      {isColiving && (
        <div className="rd-card" style={{ marginBottom: '40px' }}>
          <h3 className="rd-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: '#10B981', borderRadius: '50%', display: 'inline-block' }}></span>
            Co-living Collections — RM {colivingRevenue.toFixed(2)}
          </h3>
          {colivingData.length > 0 ? (
            <div className="rd-table-wrap">
              <table className="rd-table">
                <thead>
                  <tr>
                    <th>Listing</th>
                    <th>Date Collected</th>
                    <th>Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {colivingData.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item['Booking_Ref_Number.Listing_Name'] || '-'}</td>
                      <td>{item?.Date_field || '-'}</td>
                      <td><strong style={{ color: '#10B981' }}>RM {item?.Owner_Payout || '0'}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rd-empty">No active co-living collections</div>
          )}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, accent, progress }) => (
  <div className="rd-stat-card">
    <div className="rd-stat-icon" style={{ backgroundColor: `${accent}18`, color: accent }}>{icon}</div>
    <div className="rd-stat-label">{label}</div>
    <div className="rd-stat-value">{value}</div>
    {sub && <div className="rd-stat-sub">{sub}</div>}
    {progress !== undefined && (
      <div className="rd-progress-bar">
        <div className="rd-progress-fill" style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: accent }}></div>
      </div>
    )}
  </div>
);

export default RevenueDashboard;
