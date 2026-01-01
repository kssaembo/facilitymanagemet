
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import RepairRequestForm from './components/RepairRequestForm';
import CheckRequestStatus from './components/CheckRequestStatus';
import FacilityInspectionView from './components/FacilityInspectionView';
import AdminView from './components/AdminView';
import type { ViewType } from './types';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('request');

  // Simplified navigation, as auto-filling is no longer required.
  const navigate = useCallback((view: ViewType) => {
    setActiveView(view);
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case 'request':
        return <RepairRequestForm navigate={navigate} />;
      case 'check':
        // The component no longer needs an initial name. The user will input it manually.
        return <CheckRequestStatus />;
      case 'inspection':
        return <FacilityInspectionView />;
      case 'admin':
        return <AdminView />;
      default:
        return <RepairRequestForm navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-200 to-blue-400 text-gray-800">
      <Header activeView={activeView} setActiveView={setActiveView} />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div key={activeView} className="fade-in">
            {renderContent()}
          </div>
        </div>
      </main>
      <footer className="text-center p-6 text-gray-500 text-sm">
        © 2025. Kwon's class. All rights reserved.
      </footer>
    </div>
  );
};

export default App;
