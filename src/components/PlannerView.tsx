/**
 * @file PlannerView.tsx
 * Route planner and pace dashboard with origin/destination presets,
 * arrive-by target calculations, transit preference toggles, and live comparison cards.
 */

import React, { useState } from 'react';
import { LOCATION_PRESETS, SAMPLE_ROUTES, getWalkingPaceAdvice } from '../data/transitData';
import { TransitRoute } from '../types';

interface PlannerViewProps {
  onSelectRoute: (route: TransitRoute) => void;
  onNavigateToActive: () => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({ onSelectRoute, onNavigateToActive }) => {
  const [origin, setOrigin] = useState<string>('Tampines Ave 4 (Home)');
  const [destination, setDestination] = useState<string>('Suntec City Tower 2 (Office)');
  const [arriveByTime, setArriveByTime] = useState<string>('09:00');
  const [transitPreference, setTransitPreference] = useState<'mrt' | 'bus_first'>('bus_first');
  const [filterMode, setFilterMode] = useState<'fastest' | 'fewer_transfers'>('fastest');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-bus65-dtl');

  // Handle setting presets
  const handleSelectPreset = (presetName: string, isOrigin: boolean) => {
    if (isOrigin) {
      setOrigin(presetName);
    } else {
      setDestination(presetName);
    }
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleActivate = (route: TransitRoute) => {
    setSelectedRouteId(route.id);
    onSelectRoute(route);
    onNavigateToActive();
  };

  return (
    <div className="flex flex-col w-full pb-20 space-y-5 pt-1">
      {/* Responsive Grid: Stacks on mobile, 2-column on desktop (lg:grid-cols-12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Planner Inputs & Target Settings */}
        <section className="lg:col-span-5 rounded-2xl bg-white shadow-sm border border-[#eaedff] p-4 sm:p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#dce1ff] text-[#0037b0] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">explore</span>
              </span>
              <h2 className="font-extrabold text-[16px] sm:text-[18px] text-[#131b2e]">
                Route Planner
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#dce1ff] text-[#001551] text-[11px] font-extrabold tracking-wider uppercase">
              Smart Pacing
            </span>
          </div>

          {/* Origin & Destination inputs */}
          <div className="space-y-2.5 relative">
            {/* Origin */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f2f3ff] border border-[#dae2fd]">
              <span className="material-symbols-outlined text-[#0037b0] text-[20px]">trip_origin</span>
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] text-[#434655] font-bold uppercase tracking-wider">
                  Origin
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Enter pick-up or MRT station..."
                  className="w-full bg-transparent text-[14px] sm:text-[15px] text-[#131b2e] font-semibold focus:outline-none"
                />
              </div>
            </div>

            {/* Swap button */}
            <button
              onClick={handleSwap}
              type="button"
              title="Swap Origin and Destination"
              className="absolute right-3 top-[38px] w-8 h-8 rounded-full bg-white shadow-md border border-[#dae2fd] text-[#0037b0] flex items-center justify-center hover:bg-[#eaedff] active:scale-90 transition-all z-10 min-w-[32px] min-h-[32px]"
            >
              <span className="material-symbols-outlined text-[18px]">swap_vert</span>
            </button>

            {/* Destination */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f2f3ff] border border-[#dae2fd]">
              <span className="material-symbols-outlined text-[#bb0112] text-[20px]">location_on</span>
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] text-[#434655] font-bold uppercase tracking-wider">
                  Destination
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Enter destination office or MRT..."
                  className="w-full bg-transparent text-[14px] sm:text-[15px] text-[#131b2e] font-semibold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quick Presets Carousel */}
          <div className="pt-1">
            <span className="text-[11px] text-[#434655] font-bold block mb-2">
              Quick Presets (Tap to set Destination):
            </span>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {LOCATION_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.name, false)}
                  className="px-3 py-1.5 rounded-full bg-[#eaedff] hover:bg-[#dae2fd] text-[#131b2e] text-[11px] sm:text-[12px] font-semibold flex items-center gap-1.5 active:scale-95 transition-all min-h-[36px]"
                >
                  <span className="material-symbols-outlined text-[14px] text-[#0037b0]">
                    {p.type === 'home' ? 'home' : p.type === 'office' ? 'business' : 'directions_subway'}
                  </span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Controls: Arrive By & Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[#eaedff]">
            {/* Arrive By */}
            <div className="p-2.5 rounded-xl bg-[#f2f3ff] flex flex-col justify-between">
              <span className="text-[10px] text-[#434655] font-bold uppercase tracking-wider">
                Arrive By Time
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="material-symbols-outlined text-[#0037b0] text-[20px]">alarm</span>
                <input
                  type="time"
                  value={arriveByTime}
                  onChange={(e) => setArriveByTime(e.target.value)}
                  className="bg-transparent font-bold text-[15px] text-[#131b2e] focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Transit Preference Toggle */}
            <div className="p-2.5 rounded-xl bg-[#f2f3ff] flex flex-col justify-between">
              <span className="text-[10px] text-[#434655] font-bold uppercase tracking-wider">
                Transit Priority
              </span>
              <div className="flex items-center gap-1 mt-1">
                <button
                  type="button"
                  onClick={() => setTransitPreference('bus_first')}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all min-h-[36px] ${
                    transitPreference === 'bus_first'
                      ? 'bg-[#0037b0] text-white shadow-xs'
                      : 'bg-white text-[#434655] hover:bg-[#faf8ff]'
                  }`}
                >
                  Bus + MRT
                </button>
                <button
                  type="button"
                  onClick={() => setTransitPreference('mrt')}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all min-h-[36px] ${
                    transitPreference === 'mrt'
                      ? 'bg-[#0037b0] text-white shadow-xs'
                      : 'bg-white text-[#434655] hover:bg-[#faf8ff]'
                  }`}
                >
                  MRT Direct
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Route Results & Pace Dashboard */}
        <section className="lg:col-span-7 flex flex-col space-y-3.5">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h3 className="font-extrabold text-[16px] sm:text-[18px] text-[#131b2e]">
                Route Results &amp; Pace Dashboard
              </h3>
              <p className="text-[12px] text-[#434655]">
                Target Arrival: <span className="font-bold text-[#131b2e]">{arriveByTime} AM</span> • Live LTA Sync
              </p>
            </div>
            {/* Filter toggles */}
            <div className="flex items-center gap-1 bg-[#eaedff] p-1 rounded-xl text-[12px] self-start sm:self-auto border border-[#dae2fd]">
              <button
                onClick={() => setFilterMode('fastest')}
                className={`px-3 py-1 rounded-lg font-bold transition-all min-h-[32px] ${
                  filterMode === 'fastest' ? 'bg-white text-[#0037b0] shadow-xs' : 'text-[#434655]'
                }`}
              >
                Fastest
              </button>
              <button
                onClick={() => setFilterMode('fewer_transfers')}
                className={`px-3 py-1 rounded-lg font-bold transition-all min-h-[32px] ${
                  filterMode === 'fewer_transfers' ? 'bg-white text-[#0037b0] shadow-xs' : 'text-[#434655]'
                }`}
              >
                Direct
              </button>
            </div>
          </div>

          {/* Route Cards */}
          <div className="space-y-3.5">
        {SAMPLE_ROUTES.map((route) => {
          const pace = getWalkingPaceAdvice(route.firstMileDistanceMeters);
          const isSelected = selectedRouteId === route.id;

          return (
            <div
              key={route.id}
              className={`rounded-xl bg-white shadow-sm border p-3.5 space-y-3 transition-all ${
                isSelected ? 'border-[#0037b0] ring-2 ring-[#0037b0]/20' : 'border-[#eaedff]'
              }`}
            >
              {/* Top status bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#dce1ff] text-[#001551]">
                    {route.tag || 'ROUTE'}
                  </span>
                  <span className="text-[12px] font-bold text-[#131b2e]">{route.title}</span>
                </div>
                {/* Buffer badge */}
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#85f8c4] text-[#002114] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#004f35] animate-ping"></span>
                  +{route.bufferMinutes}m buffer
                </span>
              </div>

              {/* Time and Distance metrics */}
              <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-[#f2f3ff] text-center">
                <div>
                  <span className="text-[10px] text-[#434655] font-semibold block">Total Time</span>
                  <span className="text-[16px] font-extrabold text-[#0037b0]">
                    {route.totalDurationMin} <span className="text-[11px]">min</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#434655] font-semibold block">Est. Reach</span>
                  <span className="text-[16px] font-extrabold text-[#004f35]">{route.estReachTime}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#434655] font-semibold block">Fare / Crowd</span>
                  <span className="text-[14px] font-bold text-[#131b2e]">
                    ${route.fareSgd.toFixed(2)} • {route.crowdLevel}
                  </span>
                </div>
              </div>

              {/* Distance Breakdown & Smart Walking Pace Indicator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#434655] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-[#0037b0]">
                      directions_walk
                    </span>
                    Distance to 1st stop:
                    <strong className="text-[#131b2e]">
                      {route.firstMileDistanceMeters}m to {route.firstMileTargetName} ({route.firstMileTargetCode})
                    </strong>
                  </span>
                </div>

                {/* Smart Walking Pace Indicator Badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold tracking-tight ${pace.badgeClass}`}
                  >
                    <span className="material-symbols-outlined text-[14px]">{pace.icon}</span>
                    {pace.shortText}
                  </span>

                  {/* Live countdown preview */}
                  <div className="text-right text-[11px] font-semibold text-[#0037b0] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0037b0] animate-pulse"></span>
                    Live Arrival: <strong>{route.firstMileLiveEtaMinutes} min</strong>
                  </div>
                </div>
              </div>

              {/* Action: Select as Active Ride */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleActivate(route)}
                  className="w-full py-2 px-3 rounded-full bg-[#0037b0] hover:bg-[#1d4ed8] text-white font-bold text-[13px] flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">directions_transit</span>
                  Start Active Ride &amp; Track
                </button>
              </div>
            </div>
          );
        })}
          </div>
        </section>
      </div>
    </div>
  );
};
