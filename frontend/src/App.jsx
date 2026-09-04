import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import LoginPage from './components/LoginPage';
import SidebarLayout from './components/SidebarLayout';
import CitizenPortal from './components/CitizenPortal';
import MyComplaintsView from './components/MyComplaintsView';
import TrackRequestView from './components/TrackRequestView';
import CommunitySupportView from './components/CommunitySupportView';
import WardSanitationScorecardView from './components/WardSanitationScorecardView';
import EmergencyHotlineView from './components/EmergencyHotlineView';
import AdminPortal from './components/AdminPortal';
import CityHeatmapView from './components/CityHeatmapView';
import AnalyticsView from './components/AnalyticsView';
import DPRModal from './components/DPRModal';
import AuthModal from './components/AuthModal';
import RoleManagement from './components/RoleManagement';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nagarmitra_user');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return null;
  });

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [currentPortal, setCurrentPortal] = useState(() => {
    try {
      const saved = localStorage.getItem('nagarmitra_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.role === 'SUPER_ADMIN') return 'SUPER_ADMIN';
      }
    } catch(e) {}
    return 'CITIZEN';
  });

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('nagarmitra_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.role === 'SUPER_ADMIN') return 'admin-gis';
      }
    } catch(e) {}
    return 'citizen-voice';
  });

  const [activeCountry, setActiveCountry] = useState('IN');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedClusterForDPR, setSelectedClusterForDPR] = useState(null);
  const [selectedTrackingId, setSelectedTrackingId] = useState('');

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.role === 'SUPER_ADMIN') {
      setCurrentPortal('SUPER_ADMIN');
      setActiveTab('admin-gis');
    } else {
      setCurrentPortal('CITIZEN');
      setActiveTab('citizen-voice');
    }
  };

  const handleSwitchPortal = (targetPortal) => {
    if (targetPortal === 'SUPER_ADMIN') {
      if (!isSuperAdmin) {
        setIsAuthOpen(true);
        return;
      }
      setCurrentPortal('SUPER_ADMIN');
      if (!activeTab.startsWith('admin-')) {
        setActiveTab('admin-gis');
      }
    } else {
      setCurrentPortal('CITIZEN');
      if (!activeTab.startsWith('citizen-')) {
        setActiveTab('citizen-voice');
      }
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('nagarmitra_user');
      await signOut(auth);
    } catch(e) {}
    setCurrentUser(null);
    setCurrentPortal('CITIZEN');
    setActiveTab('citizen-voice');
  };

  // If user is not signed in, show the dedicated LoginPage
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      <SidebarLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        activeCountry={activeCountry}
        setActiveCountry={setActiveCountry}
        isSuperAdmin={isSuperAdmin}
        currentPortal={currentPortal}
        onSwitchPortal={handleSwitchPortal}
      >
        {/* Render View Based on Active Tab */}
        {activeTab === 'citizen-voice' && (
          <CitizenPortal
            activeSubTab={activeTab}
            currentUser={currentUser}
            onComplaintCreated={() => {
              setActiveTab('citizen-my-complaints');
            }}
          />
        )}

        {activeTab === 'citizen-my-complaints' && (
          <MyComplaintsView
            currentUser={currentUser}
            onNavigateToCreate={() => setActiveTab('citizen-voice')}
            onSelectComplaintForTracking={(id) => {
              setSelectedTrackingId(id);
              setActiveTab('citizen-track');
            }}
          />
        )}

        {activeTab === 'citizen-track' && (
          <TrackRequestView
            initialTrackingId={selectedTrackingId}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'citizen-upvote' && (
          <CommunitySupportView
            onOpenDPR={(cluster) => setSelectedClusterForDPR(cluster || { id: 'DC-IND-001' })}
          />
        )}

        {activeTab === 'citizen-scorecard' && (
          <WardSanitationScorecardView />
        )}

        {(activeTab === 'citizen-emergency' || activeTab === 'admin-emergency') && (
          <EmergencyHotlineView currentUser={currentUser} />
        )}

        {(activeTab === 'admin-gis' || activeTab === 'admin-heatmap') && (
          <CityHeatmapView
            isSuperAdmin={isSuperAdmin}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {(activeTab === 'admin-clusters' || activeTab === 'admin-dpr' || activeTab === 'admin-ranking') && (
          <AdminPortal
            activeSubTab={activeTab}
            activeCountry={activeCountry}
            isSuperAdmin={isSuperAdmin}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenDPR={(cluster) => setSelectedClusterForDPR(cluster || { id: 'DC-IND-001' })}
          />
        )}

        {activeTab === 'admin-analytics' && (
          <AnalyticsView />
        )}

        {activeTab === 'admin-roles' && (
          <RoleManagement
            currentUser={currentUser}
            isSuperAdmin={isSuperAdmin}
          />
        )}
      </SidebarLayout>

      {/* Auth Login Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);

          // Multi-user Live Location Prompt: Ask every user for their live GPS location upon login
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                console.log(`Live GPS acquired for ${user.displayName}:`, pos.coords.latitude, pos.coords.longitude);
              },
              (err) => {
                console.warn("User geolocation prompt dismissed or unavailable:", err.message);
              },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
          }

          // Strict Role-Based Routing:
          // Super Admin -> lands on Super Admin Portal (admin-gis)
          // Citizen -> lands on Citizen Governance Portal (citizen-voice) to lodge grievances from their live location
          if (user.role === 'SUPER_ADMIN') {
            setCurrentPortal('SUPER_ADMIN');
            setActiveTab('admin-gis');
          } else {
            setCurrentPortal('CITIZEN');
            setActiveTab('citizen-voice');
          }
        }}
      />

      {/* DPR Report Modal */}
      {selectedClusterForDPR && (
        <DPRModal
          cluster={selectedClusterForDPR}
          onClose={() => setSelectedClusterForDPR(null)}
        />
      )}
    </>
  );
}
