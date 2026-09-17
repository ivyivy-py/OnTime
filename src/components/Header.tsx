/**
 * @file Header.tsx
 * Top application bar with OnTime SG branding, status cues, and live Singapore Time.
 */

import React, { useState, useEffect } from 'react';

interface HeaderProps {
  activeTabTitle: string;
  onOpenFeedback: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTabTitle, onOpenFeedback }) => {
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
      <div className="max-w-[520px] mx-auto h-16 px-4 flex items-center justify-between gap-2">
        {/* Brand identity */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Logo icon */}
          <div className="w-8 h-8 rounded-lg bg-[#0037b0] flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">schedule</span>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[18px] text-[#131b2e] tracking-tight truncate font-['Plus_Jakarta_Sans']">
                OnTime
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#bb0112] text-white text-[11px] font-extrabold tracking-wider leading-none">
                SG
              </span>
            </div>
            <span className="text-[11px] text-[#434655] truncate font-medium">
              Smart Commute &amp; Pacing
            </span>
          </div>
        </div>

        {/* Live status and profile */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Singapore live clock pill */}
          <div className="hidden sm:flex flex-col items-end text-[11px] text-[#434655]">
            <span className="font-semibold text-[#131b2e]">{singaporeTime || '8:52 AM'}</span>
            <span className="text-[10px] text-[#004f35] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#004f35] animate-pulse"></span>
              LTA Live
            </span>
          </div>

          {/* Feedback button */}
          <button
            onClick={onOpenFeedback}
            title="Classroom Feedback / Disqus"
            className="px-2 py-1 rounded-lg bg-[#eaedff] hover:bg-[#dae2fd] text-[#0037b0] text-[11px] font-bold flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">rate_review</span>
            <span className="hidden sm:inline">Disqus</span>
          </button>

          {/* Profile avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#0037b0]/20 flex-shrink-0">
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
