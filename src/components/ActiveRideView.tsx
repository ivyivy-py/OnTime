/**
 * @file ActiveRideView.tsx
 * In-Transit live tracking screen mirroring Image 1 and Singapore transit guidance,
 * with real-time countdowns, crowd occupancy, door recommendations, taxi fallback,
 * and immediate late excuse generator triggering.
 */

import React, { useState, useEffect } from 'react';
import { TransitRoute } from '../types';
import { determinePacingStatus } from '../utils/timeCalculations';

interface ActiveRideViewProps {
  currentRoute: TransitRoute;
  onOpenExcuseGenerator: (delayMinutes?: number) => void;
  targetArrivalTime?: string;
}

export const ActiveRideView: React.FC<ActiveRideViewProps> = ({
  currentRoute,
  onOpenExcuseGenerator,
  targetArrivalTime = '09:00',
}) => {
  // Live seconds countdown simulation
  const [busCountdownMin, setBusCountdownMin] = useState<number>(2);
  const [busCountdownSec, setBusCountdownSec] = useState<number>(45);
  const [mrtCountdownMin, setMrtCountdownMin] = useState<number>(2);
  const [mrtCountdownSec, setMrtCountdownSec] = useState<number>(10);
  const [rideHailingToast, setRideHailingToast] = useState<string | null>(null);
  const [isSimulatedDelay, setIsSimulatedDelay] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Live timer ticks
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());

      setBusCountdownSec((prev) => {
        if (prev > 0) return prev - 1;
        setBusCountdownMin((m) => (m > 0 ? m - 1 : 4));
        return 59;
      });

      setMrtCountdownSec((prev) => {
        if (prev > 0) return prev - 1;
        setMrtCountdownMin((m) => (m > 0 ? m - 1 : 3));
        return 59;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Determine if user will be late based on current time + total time needed vs target arrival
  const simulatedDelayAddon = isSimulatedDelay ? 18 : 0;
  const totalTimeNeeded = currentRoute.totalDurationMin + simulatedDelayAddon;
  const pacing = determinePacingStatus(totalTimeNeeded, targetArrivalTime, currentTime);

  const handleLaunchRide = (provider: 'Grab' | 'TADA', price: string) => {
    setRideHailingToast(`Opening ${provider} app... Est fare: ${price}`);
    setTimeout(() => {
      setRideHailingToast(null);
    }, 2800);
  };

  const handleTriggerDelay = () => {
    const nextState = !isSimulatedDelay;
    setIsSimulatedDelay(nextState);
    if (nextState) {
      // Calculate delay minutes
      const lateMins = Math.max(18, pacing.lateMinutes + 18);
      onOpenExcuseGenerator(lateMins);
    }
  };

  return (
    <div className="flex flex-col w-full pb-20 space-y-4 sm:space-y-5 pt-1">
      {/* Toast Notification */}
      {rideHailingToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#283044] text-white px-5 py-2.5 rounded-full text-[13px] font-bold shadow-xl flex items-center gap-2 z-50 animate-bounce">
          <span className="material-symbols-outlined text-[18px] text-[#85f8c4]">local_taxi</span>
          {rideHailingToast}
        </div>
      )}

      {/* Active Trip Header Card */}
      <div className="rounded-2xl bg-white shadow-sm border border-[#eaedff] p-4 sm:p-5 flex flex-col gap-2.5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#dce1ff] text-[#001551] uppercase tracking-wider">
            <span className="material-symbols-outlined text-[15px]">check_circle</span>
            Active Trip • {currentRoute.title}
          </span>
          {pacing.isLate ? (
            <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#ffdad6] text-[#93000b] border border-[#ba1a1a]/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse"></span>
              Late by {pacing.lateMinutes} min
            </span>
          ) : (
            <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#85f8c4] text-[#002114] border border-[#004f35]/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#004f35] animate-ping"></span>
              +{pacing.bufferMinutes}m buffer
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-extrabold text-[20px] sm:text-[22px] text-[#131b2e] leading-snug">
              Tampines → Suntec City
            </h2>
            <p className="text-[13px] text-[#434655] flex flex-wrap items-center gap-1.5 mt-0.5">
              <span>Target: <strong className="text-[#131b2e]">{pacing.targetTimeFormatted}</strong></span>
              <span>•</span>
              <span>Est. Reach: <strong className={`text-[15px] ${pacing.isLate ? 'text-[#ba1a1a]' : 'text-[#004f35]'}`}>{pacing.estReachTimeFormatted}</strong></span>
              {pacing.isLate && (
                <span className="text-[#ba1a1a] font-bold text-[12px] bg-[#ffdad6] px-2 py-0.5 rounded-md">
                  (Late Lah! Exceeds target by {pacing.lateMinutes}m)
                </span>
              )}
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-2 sm:pt-0 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTriggerDelay}
              className={`px-3 py-1.5 rounded-lg font-bold text-[12px] flex items-center gap-1.5 transition-all min-h-[36px] ${
                isSimulatedDelay
                  ? 'bg-[#dce1ff] text-[#001551] hover:bg-[#c2ccff]'
                  : 'bg-[#ffdad6] text-[#93000b] hover:bg-[#ffb4ab]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">
                {isSimulatedDelay ? 'restart_alt' : 'warning'}
              </span>
              {isSimulatedDelay ? 'Reset +18m Delay' : 'Simulate +18m Delay'}
            </button>

            {pacing.isLate && (
              <button
                type="button"
                onClick={() => onOpenExcuseGenerator(pacing.lateMinutes)}
                className="px-3.5 py-1.5 rounded-lg bg-[#ba1a1a] text-white hover:bg-[#93000b] font-bold text-[12px] flex items-center gap-1.5 shadow-sm active:scale-95 transition-all min-h-[36px]"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                WhatsApp Excuse (+{pacing.lateMinutes}m)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transit Steps: Responsive 2-column on tablet/desktop (md:grid-cols-2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
        {/* Step 1: First Mile Bus */}
        <div className="rounded-2xl bg-white shadow-sm border border-[#eaedff] p-4 sm:p-5 flex flex-col justify-between space-y-3 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#0037b0] flex items-center justify-center text-white font-bold text-[13px]">
                1
              </span>
              <span className="font-extrabold text-[15px] sm:text-[16px] text-[#131b2e]">
                Step 1: First Mile Bus
              </span>
            </div>
            {pacing.isLate ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ffdad6] text-[#93000b] border border-[#ba1a1a]/20 text-[11px] font-extrabold">
                <span className="material-symbols-outlined text-[14px]">sprint</span>
                Walk Faster! (120 spm)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#dcfce7] text-[#14532d] border border-[#22c55e]/20 text-[11px] font-extrabold">
                <span className="material-symbols-outlined text-[14px]">directions_walk</span>
                Normal Pace (60 spm)
              </span>
            )}
          </div>

          {/* Walking instruction */}
          <div className="bg-[#f2f3ff] rounded-xl p-3 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[#434655] text-[11px]">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#0037b0]">
                  directions_walk
                </span>
                180m to Bus Stop
              </span>
              <span className="text-[#131b2e] font-bold">Opp Tampines Stn</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-[16px] text-[#131b2e]">Opp Tampines Stn</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#eaedff] text-[#434655]">
                B76149
              </span>
            </div>
          </div>

          {/* Bus timing card */}
          <div className="bg-[#eaedff] rounded-xl p-3.5 flex flex-col gap-2.5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-lg bg-[#283044] text-white font-extrabold text-[18px] tracking-tight">
                  65
                </span>
                <div className="flex flex-col">
                  <span className="font-bold text-[15px] text-[#131b2e]">SBS Transit</span>
                  <span className="text-[11px] text-[#434655] font-medium">Reg SBS8921T</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-[28px] font-extrabold text-[#0037b0] leading-none">
                    {busCountdownMin}
                  </span>
                  <span className="text-[11px] font-bold text-[#0037b0]">min</span>
                  <span className="text-[10px] text-[#434655]">({busCountdownSec}s)</span>
                </div>
                <span className="text-[12px] text-[#434655]">Next: 9 min</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-[#dae2fd]">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#434655]">Crowd:</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#85f8c4] text-[#002114] text-[11px] font-extrabold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#004f35]"></span>
                  Seats Avail
                </span>
              </div>
              <div className="flex items-center gap-1 text-[#434655] text-[11px]">
                <span className="material-symbols-outlined text-[15px] text-[#004f35]">
                  arrow_downward
                </span>
                <span>Alight: Bedok Reservoir Stn (8 stops)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Downtown Line MRT */}
        <div className="rounded-2xl bg-white shadow-sm border border-[#eaedff] p-4 sm:p-5 flex flex-col justify-between space-y-3 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#0037b0] flex items-center justify-center text-white font-bold text-[13px]">
                2
              </span>
              <span className="font-extrabold text-[15px] sm:text-[16px] text-[#131b2e]">
                Step 2: Downtown Line MRT
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#85f8c4] text-[#002114] text-[11px] font-extrabold">
              <span className="material-symbols-outlined text-[14px] text-[#004f35]">spa</span>
              Just Stroll (60m)
            </span>
          </div>

          {/* Interchange Underpass info */}
          <div className="bg-[#f2f3ff] rounded-xl p-3 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[#434655] text-[11px]">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#0037b0]">roofing</span>
                Sheltered Underpass Link
              </span>
              <span className="text-[#131b2e] font-bold">Exit B</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#00519f] text-white text-[11px] font-extrabold">
                  DT30
                </span>
                <span className="font-bold text-[16px] text-[#131b2e]">Bedok Reservoir</span>
              </div>
              <span className="text-[11px] text-[#434655] font-medium">To DT15 Promenade</span>
            </div>
          </div>

          {/* Train timing card */}
          <div className="bg-[#eaedff] rounded-xl p-3.5 flex flex-col gap-2.5">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00519f]"></span>
                  <span className="font-bold text-[15px] text-[#131b2e]">Towards Bukit Panjang</span>
                </div>
                <span className="text-[12px] text-[#434655] mt-0.5">
                  Direct train • 6 stops to Promenade
                </span>
              </div>
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-[28px] font-extrabold text-[#0037b0] leading-none">
                    {mrtCountdownMin}
                  </span>
                  <span className="text-[11px] font-bold text-[#0037b0]">min</span>
                  <span className="text-[10px] text-[#434655]">({mrtCountdownSec}s)</span>
                </div>
                <span className="text-[12px] text-[#434655]">Platform B</span>
              </div>
            </div>

            {/* Door recommendation for fastest transfer */}
            <div className="p-2.5 rounded-lg bg-[#e2e7ff] flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#0037b0]">
                  meeting_room
                </span>
                <span className="text-[#131b2e] font-extrabold">Door 03</span>
              </div>
              <span className="text-[11px] text-[#434655]">Fastest escalator exit at Promenade</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contingency Actions: Responsive 2-column on tablet/desktop (md:grid-cols-2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
        {/* Switch to Car Card */}
        <div className="rounded-2xl bg-white shadow-sm border border-[#eaedff] p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-[#bb0112]">local_taxi</span>
                <span className="font-bold text-[15px] sm:text-[16px] text-[#131b2e]">
                  Running tight? Switch to Car
                </span>
              </div>
              <span className="text-[11px] text-[#434655] font-bold px-2 py-0.5 rounded bg-[#f2f3ff]">
                Direct 18 mins
              </span>
            </div>
            <p className="text-[12px] text-[#434655] mt-1">
              Skip transfers and arrive directly at Suntec Tower 2 drop-off.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => handleLaunchRide('Grab', '$18.60')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] active:scale-[0.98] transition-all text-center gap-0.5 border border-[#dae2fd] min-h-[72px]"
            >
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#00b14f]">hail</span>
                <span className="font-bold text-[13px] text-[#131b2e]">Open Grab</span>
              </div>
              <span className="font-extrabold text-[18px] text-[#00b14f]">$18.60</span>
              <span className="text-[10px] text-[#434655]">Est 3m pickup</span>
            </button>

            <button
              type="button"
              onClick={() => handleLaunchRide('TADA', '$16.20')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] active:scale-[0.98] transition-all text-center gap-0.5 border border-[#dae2fd] min-h-[72px]"
            >
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#0037b0]">
                  electric_car
                </span>
                <span className="font-bold text-[13px] text-[#131b2e]">Open TADA</span>
              </div>
              <span className="font-extrabold text-[18px] text-[#0037b0]">$16.20</span>
              <span className="text-[10px] text-[#434655]">Zero commission</span>
            </button>
          </div>
        </div>

        {/* Delays Ahead Alert Card */}
        <div className="rounded-2xl bg-[#dae2fd] border border-[#c4c5d7] p-4 sm:p-5 flex flex-col justify-between space-y-3 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[26px] text-[#bb0112] mt-0.5">warning</span>
            <div className="flex-1">
              <span className="font-extrabold text-[16px] text-[#131b2e] block">Delays ahead?</span>
              <p className="text-[12px] sm:text-[13px] text-[#434655] leading-relaxed mt-0.5">
                If transit exceeds 9:00 AM, tap below to generate an airtight Singlish WhatsApp excuse
                via Gemini AI.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenExcuseGenerator(18)}
            className="w-full py-3 px-4 rounded-full bg-[#e02928] hover:bg-[#bb0112] text-white font-extrabold text-[14px] flex items-center justify-center gap-2 active:scale-98 transition-all shadow-sm min-h-[44px]"
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            Late Lah! Excuse Generator →
          </button>
        </div>
      </div>
    </div>
  );
};
