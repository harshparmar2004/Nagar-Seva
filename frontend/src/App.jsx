import React, { useState } from 'react';
import SidebarLayout from './components/SidebarLayout';
import CitizenPortal from './components/CitizenPortal';
import MyComplaintsView from './components/MyComplaintsView';
import TrackRequestView from './components/TrackRequestView';
import CommunitySupportView from './components/CommunitySupportView';
import WardSanitationScorecardView from './components/WardSanitationScorecardView';
import EmergencyHotlineView from './components/EmergencyHotlineView';
import AdminPortal from './components/AdminPortal';
import AnalyticsView from './components/AnalyticsView';
import DPRModal from './components/DPRModal';
import AuthModal from './components/AuthModal';
import RoleManagement from './components/RoleManagement';

export default function App() {
  const [activeTab, setActiveTab] = useState('citizen-voice');
  const [activeCountry, setActiveCountry] = useState('IN');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // { uid, email, displayName, photoURL, role }
  const [selectedClusterForDPR, setSelectedClusterForDPR] = useState(null);
  const [selectedTrackingId, setSelectedTrackingId] = useState('');

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const handleLogout = () => {
    setCurrentUser(null);
    if (activeTab.startsWith('admin-')) {
      setActiveTab('citizen-voice');
    }
  };

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

        {(activeTab === 'admin-gis' || activeTab === 'admin-clusters' || activeTab === 'admin-dpr' || activeTab === 'admin-ranking') && (
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
          if (user.role === 'SUPER_ADMIN') {
            setActiveTab('admin-gis');
          } else {
            setActiveTab('citizen-my-complaints');
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
