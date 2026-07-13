import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Splash from './components/Splash/Splash';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import VerifyOtp from './components/Auth/VerifyOtp';
import ForgotPassword from './components/Auth/ForgotPassword';
import UpdatePassword from './components/Auth/UpdatePassword';
import DashboardLayout from './components/Layout/DashboardLayout';
import Home from './components/Home/Home';
import Calendar from './components/Home/Dashboards/Calendar';
import MyBookings from './components/Home/Dashboards/MyBookings';
import Search from './components/Home/Dashboards/Search';
import Profile from './components/Home/Dashboards/Profile';
import GenerateStatement from './components/Home/Dashboards/GenerateStatement';
import MyTripDetails from './components/Home/Dashboards/MyTripDetails';
import RevenueDashboard from './components/Home/Dashboards/RevenueDashboard';
import AgentRevenueDashboard from './components/Home/Dashboards/AgentRevenueDashboard';
import Booking from './components/Home/Dashboards/Booking';
import Rewards from './components/Home/Dashboards/Rewards';
import RewardDetails from './components/Home/Dashboards/RewardDetails';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const token = useSelector((state) => state.userInfo?.loginInfo);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const DashboardRoute = ({ children }) => (
  <ProtectedRoute>
    <DashboardLayout>
      {children}
    </DashboardLayout>
  </ProtectedRoute>
);

const Placeholder = ({ title }) => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#fff', flexDirection: 'column' }}>
    <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>{title}</h2>
    <p style={{ color: '#cbd5e1' }}>This feature is currently under development.</p>
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      
      {/* Protected Dashboard Routes */}
      <Route path="/welcome" element={<DashboardRoute><Home /></DashboardRoute>} />
      <Route path="/calendar" element={<DashboardRoute><Calendar /></DashboardRoute>} />
      <Route path="/my-bookings" element={<DashboardRoute><MyBookings /></DashboardRoute>} />
      <Route path="/search" element={<DashboardRoute><Search /></DashboardRoute>} />
      <Route path="/profile" element={<DashboardRoute><Profile /></DashboardRoute>} />
      <Route path="/generate-statement" element={<DashboardRoute><GenerateStatement /></DashboardRoute>} />
      <Route path="/trip-details" element={<DashboardRoute><MyTripDetails /></DashboardRoute>} />
      <Route path="/revenue-dashboard" element={<DashboardRoute><RevenueDashboard /></DashboardRoute>} />
      <Route path="/agent-revenue-dashboard" element={<DashboardRoute><AgentRevenueDashboard /></DashboardRoute>} />
      <Route path="/rewards" element={<DashboardRoute><Rewards /></DashboardRoute>} />
      <Route path="/reward-details" element={<DashboardRoute><RewardDetails /></DashboardRoute>} />
      <Route path="/booking" element={<DashboardRoute><Booking /></DashboardRoute>} />
    </Routes>
  );
}

export default App;
