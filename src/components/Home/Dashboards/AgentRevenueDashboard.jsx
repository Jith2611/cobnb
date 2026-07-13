import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { TrendingUp, Home, Users, Calendar, DollarSign, RefreshCw, Briefcase } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Legend
} from 'recharts';
import zohoAxios from '../../../utility/axiosInstance';
import { getData } from '../../../utility/LocalStorageService';
import './RevenueDashboard.css';

const AgentDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [property, setProperty] = useState([]);

  const now = new Date();
  const monthNames = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  const [currentMonth] = useState(monthNames[now.getMonth()]);
  const [currentMonthNo] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [currentYear] = useState(now.getFullYear());

  const [monthlyRevenueData, setMonthlyRevenueData] = useState(0);
  const [graphLabels, setGraphLabels] = useState([]);
  const [graphDataset, setGraphDataset] = useState([]);

  const [fullMonthlyRevenue, setFullMonthlyRevenue] = useState(50000); // Dummy target for agents

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
      const isDemo = user?.member_email === 'demo1.cobnb@gmail.com';
      const emailParam = isDemo ? 'Agent_Demo_Email' : 'Agent_Email';
      const url = `/zoho-api/api/v2/brandontan18/housekeeping-system/report/All_Properties?${emailParam}=${encodeURIComponent(user?.member_email)}`;
      const res = await zohoAxios.get(url);
      if (res?.data?.code === 3000) {
        setProperty(res.data.data);
      }
    } catch (e) { console.error('Property Fetch Error', e); }
  };

  const getSTRData = async (user) => {
    try {
      const isDemo = user?.member_email === 'demo1.cobnb@gmail.com';
      const emailField = isDemo ? 'Agent_Demo_Email' : 'Agent_Email';
      const dateRange = `${currentYear}-${currentMonthNo}`;

      const revUrl = `/zoho-api/api/v2/brandontan18/housekeeping-system/report/Master_Statement_Report?Listing_Number.${emailField}=${encodeURIComponent(user?.member_email)}&Month_Year=${dateRange}`;
      const revRes = await zohoAxios.get(revUrl);
      if (revRes.data.code === 3000) {
        let payout = 0;
        revRes.data.data.forEach(item => {
          payout += parseFloat(item.Agent_Profit_Share) || 0;
        });
        setMonthlyRevenueData(Math.round(payout * 100) / 100);
      }
    } catch (e) { console.error('STR Error', e); }
  };

  const getLast6Months = async (user) => {
    try {
      const isDemo = user?.member_email === 'demo1.cobnb@gmail.com';
      const emailField = isDemo ? 'Agent_Demo_Email' : 'Agent_Email';
      
      const months = [];
      let d = new Date();
      for (let i = 0; i < 12; i++) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        months.push(`${y}-${m}`);
        d.setMonth(d.getMonth() - 1);
      }

      const url = `/zoho-api/api/v2/brandontan18/housekeeping-system/report/Master_Statement_Report?Listing_Number.${emailField}=${encodeURIComponent(user?.member_email)}`;
      const res = await zohoAxios.get(url);
      if (res.data.code === 3000) {
        const grouped = {};
        res.data.data
          .filter(item => months.includes(item.Month_Year))
          .forEach(item => {
            grouped[item.Month_Year] = (grouped[item.Month_Year] || 0) + parseFloat(item.Agent_Profit_Share || 0);
          });
        const sortedKeys = Object.keys(grouped).sort().reverse().slice(0, 6).reverse();
        const shortMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        setGraphLabels(sortedKeys.map(k => shortMonths[parseInt(k.split('-')[1]) - 1]));
        setGraphDataset(sortedKeys.map(k => Math.round(grouped[k])));
      }
    } catch (e) { console.error('History Error', e); }
  };

  const revenueProgress = Math.min(Math.round((monthlyRevenueData / fullMonthlyRevenue) * 100), 100);

  const chartData = graphLabels.map((label, i) => ({ month: label, revenue: graphDataset[i] || 0 }));

  const radialData = [
    { name: 'Revenue', value: revenueProgress, fill: '#C5A880' },
    { name: 'Active Props', value: property.length > 0 ? 100 : 0, fill: '#132135' },
  ];

  return (
    <div className="rd-page">
      {/* Header */}
      <div className="rd-header">
        <div>
          <h2 className="rd-title" style={{color: '#C5A880'}}>{currentMonth} {currentYear} — Agent Dashboard</h2>
          <p className="rd-subtitle">{property.length} propert{property.length !== 1 ? 'ies' : 'y'} assigned to you</p>
        </div>
        <button className="rd-refresh" onClick={() => loadAll(userDetails)} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'rd-spin' : ''} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading && (
        <div className="rd-loading-bar">
          <div className="rd-loading-fill" style={{background: '#C5A880'}}></div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="rd-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <StatCard icon={<DollarSign size={22} />} label="Agent Profit Share" value={`RM ${monthlyRevenueData.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub="Monthly Collection" accent="#C5A880" />
        <StatCard icon={<Briefcase size={22} />} label="Properties" value={property.length} sub="Active Assignments" accent="#10B981" />
      </div>

      {/* Charts Row */}
      <div className="rd-charts-row">
        {/* Line Chart */}
        <div className="rd-card rd-chart-card">
          <h3 className="rd-card-title">Profit Share History (Last 6 Months)</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={v => `RM ${v}`} width={80} />
                <Tooltip formatter={(v) => [`RM ${v.toLocaleString()}`, 'Profit Share']} contentStyle={{ backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="revenue" stroke="#C5A880" strokeWidth={2.5} dot={{ fill: '#C5A880', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="rd-empty">No historical data available</div>
          )}
        </div>

        {/* Radial Chart */}
        <div className="rd-card rd-radial-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 className="rd-card-title" style={{ width: '100%', marginBottom: 0 }}>Agent Performance</h3>
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

export default AgentDashboard;
