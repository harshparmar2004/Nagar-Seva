import React, { useState, useEffect } from 'react';
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
import CitizenSettings from './components/CitizenSettings';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-stone-200 rounded-3xl shadow-sm text-center space-y-4 animate-fade-in">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
            ⚠️
          </div>
          <h2 className="text-xl font-extrabold text-stone-900">View Temporarily Unavailable</h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            {this.state.error?.message || 'An unexpected rendering error occurred in this view.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onReset) this.props.onReset();
              }}
              className="px-5 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-extrabold rounded-xl cursor-pointer transition-all shadow-xs"
            >
              Back to Safe Home View
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl cursor-pointer transition-all"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nagarmitra_user');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return null;
  });

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

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

  // Strict isolation: Ensure activeTab always matches user role
  useEffect(() => {
    if (currentUser) {
      if (isSuperAdmin && !activeTab.startsWith('admin-')) {
        setActiveTab('admin-gis');
      } else if (!isSuperAdmin && !activeTab.startsWith('citizen-')) {
        setActiveTab('citizen-voice');
      }
    }
  }, [currentUser, isSuperAdmin, activeTab]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.role === 'SUPER_ADMIN') {
      setActiveTab('admin-gis');
    } else {
      setActiveTab('citizen-voice');
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('nagarmitra_user');
      await signOut(auth);
    } catch(e) {}
    setCurrentUser(null);
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
      >
        <ErrorBoundary key={activeTab} onReset={() => setActiveTab(isSuperAdmin ? 'admin-gis' : 'citizen-voice')}>
          {/* Render View Based on Active Tab */}
          {activeTab === 'citizen-voice' && (
            <CitizenPortal
              activeSubTab={activeTab}
              currentUser={currentUser}
              onNavigateToMyComplaints={() => {
                setActiveTab('citizen-my-complaints');
              }}
              onNavigateToTrack={(id) => {
                setSelectedTrackingId(id);
                setActiveTab('citizen-track');
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
            <WardSanitationScorecardView
              currentUser={currentUser}
              isSuperAdmin={isSuperAdmin}
            />
          )}

          {activeTab === 'citizen-settings' && (
            <CitizenSettings currentUser={currentUser} />
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
        </ErrorBoundary>
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
