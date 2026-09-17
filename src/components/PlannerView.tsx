/**
 * @file PlannerView.tsx
 * Route planner: pick origin/destination from real presets, set an arrive-by
 * time, then tap "Save Me the Headache" to compute live route options.
 *
 * Route data used to be a static hardcoded array (SAMPLE_ROUTES) that never
 * responded to input — see routePlanner.ts, which now computes routes from
 * real coordinates plus live LTA bus-arrival / train-alert calls.
 */

import React, { useState } from 'react';
import { LOCATION_PRESETS, getWalkingPaceAdvice } from '../data/transitData';
import { TransitRoute, DriveOption } from '../types';
import { determinePacingStatus } from '../utils/timeCalculations';
import { formatDistance } from '../utils/geo';
import { planRoutes } from '../services/routePlanner';

interface PlannerViewProps {
  onSelectRoute: (route: TransitRoute) => void;
  onNavigateToActive: () => void;
  arriveByTime: string;
  onChangeArriveByTime: (time: string) => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  onSelectRoute,
  onNavigateToActive,
  arriveByTime,
  onChangeArriveByTime,
}) => {
  const [originId, setOriginId] = useState<string>('tampines');
  const [destinationId, setDestinationId] = useState<string>('suntec');
  const [filterMode, setFilterMode] = useState<'fastest' | 'fewer_transfers'>('fastest');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [currentTime] = useState<Date>(new Date());

  const [isComputing, setIsComputing] = useState(false);
  const [hasComputed, setHasComputed] = useState(false);
  const [routes, setRoutes] = useState<TransitRoute[]>([]);
  const [driveOption, setDriveOption] = useState<DriveOption | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [computeError, setComputeError] = useState<string | null>(null);

  const origin = LOCATION_PRESETS.find((p) => p.id === originId)!;
  const destination = LOCATION_PRESETS.find((p) => p.id === destinationId)!;
  const sameLocation = originId === destinationId;

  const handleSwap = () => {
    setOriginId(destinationId);
    setDestinationId(originId);
  };

  const handleSaveMeTheHeadache = async () => {
    if (sameLocation) {
      setComputeError('Origin and destination are the same place — pick two different locations.');
      return;
    }
    setIsComputing(true);
    setComputeError(null);
    try {
      const result = await planRoutes(origin, destination, arriveByTime, new Date());
      const sorted = [...result.routes].sort((a, b) => {
        if (filterMode === 'fewer_transfers') return a.steps.length - b.steps.length;
        return a.totalDurationMin - b.totalDurationMin;
      });
      setRoutes(sorted);
      setDriveOption(result.driveOption);
      setWarnings(result.warnings);
      setHasComputed(true);
      setSelectedRouteId('');
    } catch (err) {
      setComputeError('Could not compute routes right now. Please try again.');
    } finally {
      setIsComputing(false);
    }
  };

  const handleActivate = (route: TransitRoute, estReachTime: string, bufferMinutes: number) => {
    setSelectedRouteId(route.id);
    onSelectRoute({ ...route, estReachTime, bufferMinutes });
    onNavigateToActive();
  };

  const headerPacing = determinePacingStatus(0, arriveByTime, currentTime);

  return (
    <div className="flex flex-col w-full pb-20 space-y-5 pt-1">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Planner Inputs & Target Settings */}
        <section className="lg:col-span-5 rounded-2xl bg-white shadow-sm border border-[#eaedff] p-4 sm:p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#dce1ff] text-[#0037b0] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">explore</span>
              </span>
              <h2 className="font-extrabold text-[16px] sm:text-[18px] text-[#131b2e]">Route Planner</h2>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#dce1ff] text-[#001551] text-[11px] font-extrabold tracking-wider uppercase">
              Live LTA Data
            </span>
          </div>

          {/* Origin & Destination selects */}
          <div className="space-y-2.5 relative">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f2f3ff] border border-[#dae2fd]">
              <span className="material-symbols-outlined text-[#0037b0] text-[20px]">trip_origin</span>
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] text-[#434655] font-bold uppercase tracking-wider" htmlFor="origin-select">
                  Origin
                </label>
                <select
                  id="origin-select"
                  value={originId}
                  onChange={(e) => setOriginId(e.target.value)}
                  className="w-full bg-transparent text-[14px] sm:text-[15px] text-[#131b2e] font-semibold focus:outline-none"
                >
                  {LOCATION_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleSwap}
              type="button"
              title="Swap Origin and Destination"
              className="absolute right-3 top-[38px] w-8 h-8 rounded-full bg-white shadow-md border border-[#dae2fd] text-[#0037b0] flex items-center justify-center hover:bg-[#eaedff] active:scale-90 transition-all z-10 min-w-[32px] min-h-[32px]"
            >
              <span className="material-symbols-outlined text-[18px]">swap_vert</span>
            </button>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f2f3ff] border border-[#dae2fd]">
              <span className="material-symbols-outlined text-[#bb0112] text-[20px]">location_on</span>
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] text-[#434655] font-bold uppercase tracking-wider" htmlFor="destination-select">
                  Destination
                </label>
                <select
                  id="destination-select"
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  className="w-full bg-transparent text-[14px] sm:text-[15px] text-[#131b2e] font-semibold focus:outline-none"
                >
                  {LOCATION_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {sameLocation && (
            <p className="text-[12px] text-[#93000b] font-semibold -mt-2">Pick two different locations.</p>
          )}

          {/* Controls: Arrive By & Sort */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[#eaedff]">
            <div className="p-2.5 rounded-xl bg-[#f2f3ff] flex flex-col justify-between">
              <span className="text-[10px] text-[#434655] font-bold uppercase tracking-wider">Arrive By Time</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="material-symbols-outlined text-[#0037b0] text-[20px]">alarm</span>
                <input
                  type="time"
                  value={arriveByTime}
                  onChange={(e) => onChangeArriveByTime(e.target.value)}
                  className="bg-transparent font-bold text-[15px] text-[#131b2e] focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#f2f3ff] flex flex-col justify-between">
              <span className="text-[10px] text-[#434655] font-bold uppercase tracking-wider">Sort Results By</span>
              <div className="flex items-center gap-1 mt-1">
                <button
                  type="button"
                  onClick={() => setFilterMode('fastest')}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all min-h-[36px] ${
                    filterMode === 'fastest' ? 'bg-[#0037b0] text-white shadow-xs' : 'bg-white text-[#434655] hover:bg-[#faf8ff]'
                  }`}
                >
                  Fastest
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('fewer_transfers')}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all min-h-[36px] ${
                    filterMode === 'fewer_transfers' ? 'bg-[#0037b0] text-white shadow-xs' : 'bg-white text-[#434655] hover:bg-[#faf8ff]'
                  }`}
                >
                  Fewer Steps
                </button>
              </div>
            </div>
          </div>

          {/* The trigger button */}
          <button
            type="button"
            onClick={handleSaveMeTheHeadache}
            disabled={isComputing || sameLocation}
            className="w-full py-3.5 px-4 rounded-full bg-[#0037b0] hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-[14px] flex items-center justify-center gap-2 active:scale-98 transition-all shadow-sm min-h-[48px]"
          >
            {isComputing ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                Crunching live LTA data...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                Save Me the Headache
              </>
            )}
          </button>
          {computeError && <p className="text-[12px] text-[#93000b] font-semibold">{computeError}</p>}
        </section>

        {/* Right Column: Route Results & Pace Dashboard */}
        <section className="lg:col-span-7 flex flex-col space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h3 className="font-extrabold text-[16px] sm:text-[18px] text-[#131b2e]">Route Results &amp; Pace Dashboard</h3>
              <p className="text-[12px] text-[#434655]">
                Target: <strong className="text-[#131b2e]">{headerPacing.targetTimeFormatted}</strong> • Current Time:{' '}
                <strong className="text-[#0037b0]">{headerPacing.currentTimeFormatted}</strong>
              </p>
            </div>
          </div>

          {!hasComputed && !isComputing && (
            <div className="rounded-2xl bg-white shadow-sm border border-dashed border-[#dae2fd] p-8 flex flex-col items-center justify-center text-center gap-2">
              <span className="material-symbols-outlined text-[32px] text-[#0037b0]">route</span>
              <p className="text-[13px] text-[#434655] font-semibold max-w-xs">
                Pick your origin and destination, set your arrive-by time, then tap{' '}
                <strong className="text-[#131b2e]">Save Me the Headache</strong> to pull live bus arrivals and MRT status.
              </p>
            </div>
          )}

          {warnings.length > 0 && hasComputed && (
            <div className="rounded-xl bg-[#fff8e1] border border-[#f5c518]/40 p-3 space-y-1">
              {warnings.map((w, i) => (
                <p key={i} className="text-[11px] text-[#7a5b00] font-medium flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-[14px] mt-0.5">info</span>
                  {w}
                </p>
              ))}
            </div>
          )}

          <div className="space-y-3.5">
            {routes.map((route) => {
              const isSelected = selectedRouteId === route.id;
              const pacing = determinePacingStatus(route.totalDurationMin, arriveByTime, currentTime);

              return (
                <div
                  key={route.id}
                  className={`rounded-xl bg-white shadow-sm border p-3.5 space-y-3 transition-all ${
                    isSelected ? 'border-[#0037b0] ring-2 ring-[#0037b0]/20' : 'border-[#eaedff]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#dce1ff] text-[#001551]">
                        {route.tag || 'ROUTE'}
                      </span>
                      <span className="text-[12px] font-bold text-[#131b2e]">{route.title}</span>
                    </div>
                    {pacing.isLate ? (
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#93000b] border border-[#ba1a1a]/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-pulse"></span>
                        +{pacing.lateMinutes}m Late
                      </span>
                    ) : (
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#85f8c4] text-[#002114] border border-[#004f35]/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#004f35] animate-ping"></span>
                        +{pacing.bufferMinutes}m buffer
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-[#f2f3ff] text-center">
                    <div>
                      <span className="text-[10px] text-[#434655] font-semibold block">Total Time</span>
                      <span className="text-[16px] font-extrabold text-[#0037b0]">
                        {route.totalDurationMin} <span className="text-[11px]">min</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#434655] font-semibold block">Est. Reach</span>
                      <span className={`text-[16px] font-extrabold ${pacing.isLate ? 'text-[#ba1a1a]' : 'text-[#004f35]'}`}>
                        {pacing.estReachTimeFormatted}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#434655] font-semibold block">Fare / Crowd</span>
                      <span className="text-[14px] font-bold text-[#131b2e]">
                        ${route.fareSgd.toFixed(2)} • {route.crowdLevel}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#434655] font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-[#0037b0]">directions_walk</span>
                        Distance to {route.firstMileType === 'BUS' ? 'bus stop' : 'MRT'}:
                        <strong className="text-[#131b2e]">
                          {formatDistance(route.firstMileDistanceMeters)} to {route.firstMileTargetName} ({route.firstMileTargetCode})
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      {(() => {
                        const pace = getWalkingPaceAdvice(route.firstMileDistanceMeters);
                        return (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold tracking-tight ${
                              pacing.isLate ? 'bg-[#ffdad6] text-[#93000b] border border-[#ba1a1a]/20' : pace.badgeClass
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">{pacing.isLate ? 'sprint' : pace.icon}</span>
                            {pacing.isLate ? `Sprint! Late alert (+${pacing.lateMinutes}m)` : pace.shortText}
                          </span>
                        );
                      })()}

                      <div className="text-right text-[11px] font-semibold text-[#0037b0] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0037b0] animate-pulse"></span>
                        Live Arrival: <strong>{route.firstMileLiveEtaMinutes} min</strong>
                      </div>
                    </div>

                    {route.liveDataNote && (
                      <p className="text-[10px] text-[#434655] italic pt-0.5">{route.liveDataNote}</p>
                    )}
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleActivate(route, pacing.estReachTimeFormatted, pacing.isLate ? -pacing.lateMinutes : pacing.bufferMinutes)}
                      className="w-full py-2 px-3 rounded-full bg-[#0037b0] hover:bg-[#1d4ed8] text-white font-bold text-[13px] flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">directions_transit</span>
                      Start Active Ride &amp; Track
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Drive option — always a labeled estimate, never presented as live traffic */}
            {driveOption && (
              <div className="rounded-xl bg-white shadow-sm border border-[#dae2fd] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#f2f3ff] text-[#0037b0]">
                      DRIVE • ESTIMATE
                    </span>
                    <span className="text-[12px] font-bold text-[#131b2e]">Travel by Car</span>
                  </div>
                  <span className="material-symbols-outlined text-[20px] text-[#bb0112]">directions_car</span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-[#f2f3ff] text-center">
                  <div>
                    <span className="text-[10px] text-[#434655] font-semibold block">Est. Drive Time</span>
                    <span className="text-[16px] font-extrabold text-[#0037b0]">
                      {driveOption.estimatedMinutes} <span className="text-[11px]">min</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#434655] font-semibold block">Road Distance</span>
                    <span className="text-[16px] font-extrabold text-[#131b2e]">{formatDistance(driveOption.distanceMeters)}</span>
                  </div>
                </div>
                <p className="text-[10px] text-[#434655] italic">
                  {driveOption.method}. This is a computed estimate, not live traffic — no driving-directions API is configured.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
