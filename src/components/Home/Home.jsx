import React from 'react';
import { useSelector } from 'react-redux';
import OwnerDashboard from './Dashboards/OwnerDashboard';
import AgentDashboard from './Dashboards/AgentDashboard';
import CleanerDashboard from './Dashboards/CleanerDashboard';
import TechnicianDashboard from './Dashboards/TechnicianDashboard';
import GuestDashboard from './Dashboards/GuestDashboard';
import './Home.css';

const Home = () => {
  const isOwner = useSelector((state) => state.userInfo?.isOwner);

  const renderDashboard = () => {
    switch (isOwner) {
      case 1:
        return <OwnerDashboard />;
      case 2:
        return <AgentDashboard />;
      case 3:
        return <CleanerDashboard />;
      case 4:
        return <TechnicianDashboard />;
      default:
        return <GuestDashboard />;
    }
  };

  return (
    <div className="home-content">
      {renderDashboard()}
    </div>
  );
};

export default Home;
