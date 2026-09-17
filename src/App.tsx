/**
 * @file App.tsx
 * Main application container for OnTime SG transit navigator & pacing assistant.
 * Seamlessly manages navigation between Planner, Active Ride, and Late Lah! AI screens.
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { PlannerView } from './components/PlannerView';
import { ActiveRideView } from './components/ActiveRideView';
import { LateLahAIView } from './components/LateLahAIView';
import { DisqusFeedbackModal } from './components/DisqusFeedbackModal';
import { TalkToUsSection } from './components/TalkToUsSection';
import { SAMPLE_ROUTES } from './data/transitData';
import { TransitRoute } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'plan' | 'active-ride' | 'late-lah-ai'>('active-ride');
  const [currentRoute, setCurrentRoute] = useState<TransitRoute>(SAMPLE_ROUTES[0]);
  const [isDisqusModalOpen, setIsDisqusModalOpen] = useState<boolean>(false);
  const [simulatedDelayMinutes, setSimulatedDelayMinutes] = useState<number>(18);

  const handleSelectRoute = (route: TransitRoute) => {
    setCurrentRoute(route);
    setActiveTab('active-ride');
  };

  const handleOpenExcuseGenerator = (delayMinutes: number = 18) => {
    setSimulatedDelayMinutes(delayMinutes);
    setActiveTab('late-lah-ai');
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'plan':
        return 'Plan & Compare';
      case 'active-ride':
        return 'Active Ride';
      case 'late-lah-ai':
        return 'Late Lah! AI';
    }
  };

  return (
    <div className="bg-[#faf8ff] text-[#131b2e] min-h-screen flex flex-col antialiased selection:bg-[#dce1ff] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header with responsive navigation */}
      <Header
        activeTabTitle={getTabTitle()}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenFeedback={() => setIsDisqusModalOpen(true)}
      />

      {/* Main Content Area (Fluid responsive container: 100% on mobile, max-w-6xl on desktop) */}
      <main className="flex-1 flex flex-col relative w-full pt-20 pb-28 md:pb-12 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 transition-all">
        {activeTab === 'plan' && (
          <PlannerView
            onSelectRoute={handleSelectRoute}
            onNavigateToActive={() => setActiveTab('active-ride')}
          />
        )}

        {activeTab === 'active-ride' && (
          <ActiveRideView
            currentRoute={currentRoute}
            onOpenExcuseGenerator={handleOpenExcuseGenerator}
          />
        )}

        {activeTab === 'late-lah-ai' && (
          <LateLahAIView initialDelay={simulatedDelayMinutes} />
        )}

        {/* Talk to Us - Embedded Disqus Section at the foot of the page */}
        <TalkToUsSection />
      </main>

      {/* Mobile Bottom Navigation Bar (Visible on mobile screens < 768px, hidden on md+ where header navigation takes over) */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 pb-safe bg-white/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(19,27,46,0.06)] border-t border-[#eaedff]">
        <div className="w-full max-w-md mx-auto h-16 px-4 flex items-center justify-around">
          {/* Plan Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('plan')}
            className={`group flex flex-col items-center justify-center min-w-[72px] h-12 py-1 px-1 rounded-xl transition-all active:scale-95 ${
              activeTab === 'plan'
                ? 'text-[#0037b0] font-bold'
                : 'text-[#434655] hover:text-[#131b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[24px] transition-transform group-hover:-translate-y-0.5">
              route
            </span>
            <span className="text-[11px] font-bold tracking-tight mt-0.5">Plan</span>
          </button>

          {/* Active Ride Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('active-ride')}
            className={`group flex flex-col items-center justify-center min-w-[72px] h-12 py-1 px-1 rounded-xl transition-all active:scale-95 ${
              activeTab === 'active-ride'
                ? 'text-[#0037b0] font-bold'
                : 'text-[#434655] hover:text-[#131b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[24px] transition-transform group-hover:-translate-y-0.5">
              directions_transit
            </span>
            <span className="text-[11px] font-bold tracking-tight mt-0.5">Active Ride</span>
          </button>

          {/* Late Lah! AI Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('late-lah-ai')}
            className={`group flex flex-col items-center justify-center min-w-[72px] h-12 py-1 px-1 rounded-xl transition-all active:scale-95 ${
              activeTab === 'late-lah-ai'
                ? 'text-[#0037b0] font-bold'
                : 'text-[#434655] hover:text-[#131b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[24px] transition-transform group-hover:-translate-y-0.5">
              auto_awesome
            </span>
            <span className="text-[11px] font-bold tracking-tight mt-0.5">Late Lah! AI</span>
          </button>
        </div>
      </nav>

      {/* Classroom Evaluation & Disqus Feedback Modal */}
      <DisqusFeedbackModal
        isOpen={isDisqusModalOpen}
        onClose={() => setIsDisqusModalOpen(false)}
      />
    </div>
  );
}
