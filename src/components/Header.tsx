/**
 * @file Header.tsx
 * Top application bar with OnTime SG branding, status cues, and live Singapore Time.
 */

import React, { useState, useEffect } from 'react';

interface HeaderProps {
  activeTabTitle: string;
  activeTab?: 'plan' | 'active-ride' | 'late-lah-ai';
  onSelectTab?: (tab: 'plan' | 'active-ride' | 'late-lah-ai') => void;
  onOpenFeedback: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTabTitle,
  activeTab = 'active-ride',
  onSelectTab,
  onOpenFeedback
}) => {
  const [singaporeTime, setSingaporeTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format time in Singapore (UTC+8)
      const timeStr = now.toLocaleTimeString('en-SG', {
        timeZone: 'Asia/Singapore',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setSingaporeTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-[#faf8ff]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#eaedff]">
      <div className="w-full max-w-6xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
          {/* Logo icon */}
          <div className="w-9 h-9 rounded-xl bg-[#0037b0] flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">schedule</span>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[18px] sm:text-[20px] text-[#131b2e] tracking-tight truncate font-['Plus_Jakarta_Sans']">
                OnTime
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#bb0112] text-white text-[11px] font-extrabold tracking-wider leading-none">
                SG
              </span>
            </div>
            <span className="text-[11px] sm:text-[12px] text-[#434655] truncate font-medium">
              Smart Commute &amp; Pacing
            </span>
          </div>
        </div>

        {/* Desktop / Tablet Nav Tabs (Breakpoints >= 768px) */}
        {onSelectTab && (
          <nav className="hidden md:flex items-center gap-1 bg-[#eaedff] p-1 rounded-xl border border-[#dae2fd]">
            <button
              type="button"
              onClick={() => onSelectTab('plan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all ${
                activeTab === 'plan'
                  ? 'bg-white text-[#0037b0] shadow-xs'
                  : 'text-[#434655] hover:text-[#131b2e]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">route</span>
              <span>Plan</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('active-ride')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all ${
                activeTab === 'active-ride'
                  ? 'bg-white text-[#0037b0] shadow-xs'
                  : 'text-[#434655] hover:text-[#131b2e]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">directions_transit</span>
              <span>Active Ride</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('late-lah-ai')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all ${
                activeTab === 'late-lah-ai'
                  ? 'bg-white text-[#0037b0] shadow-xs'
                  : 'text-[#434655] hover:text-[#131b2e]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span>Late Lah! AI</span>
            </button>
          </nav>
        )}

        {/* Live status and profile */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Singapore live clock pill */}
          <div className="hidden sm:flex flex-col items-end text-[11px] text-[#434655]">
            <span className="font-semibold text-[#131b2e]">{singaporeTime || '8:52 AM'}</span>
            <span className="text-[10px] text-[#004f35] flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#004f35] animate-pulse"></span>
              LTA Live
            </span>
          </div>

          {/* Feedback / Talk to Us button */}
          <button
            onClick={() => {
              const el = document.getElementById('talk-to-us');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                onOpenFeedback();
              }
            }}
            title="Talk to Us / Disqus Forum"
            className="px-2.5 py-1.5 rounded-lg bg-[#eaedff] hover:bg-[#dae2fd] text-[#0037b0] text-[12px] font-bold flex items-center gap-1.5 transition-colors min-h-[36px]"
          >
            <span className="material-symbols-outlined text-[16px]">forum</span>
            <span className="hidden sm:inline">Talk to Us</span>
          </button>

          {/* Profile avatar */}
          <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#0037b0]/20 flex-shrink-0">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Commuter Profile"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
