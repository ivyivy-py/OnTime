/**
 * @file ActiveRideView.tsx
 * In-Transit live tracking screen mirroring Image 1 and Singapore transit guidance,
 * with real-time countdowns, crowd occupancy, door recommendations, taxi fallback,
 * and immediate late excuse generator triggering.
 */

import React, { useState, useEffect } from 'react';
import { TransitRoute } from '../types';

interface ActiveRideViewProps {
  currentRoute: TransitRoute;
  onOpenExcuseGenerator: (delayMinutes?: number) => void;
}

export const ActiveRideView: React.FC<ActiveRideViewProps> = ({
  currentRoute,
  onOpenExcuseGenerator
}) => {
  // Live seconds countdown simulation
  const [busCountdownMin, setBusCountdownMin] = useState<number>(2);
  const [busCountdownSec, setBusCountdownSec] = useState<number>(45);
  const [mrtCountdownMin, setMrtCountdownMin] = useState<number>(2);
  const [mrtCountdownSec, setMrtCountdownSec] = useState<number>(10);
  const [rideHailingToast, setRideHailingToast] = useState<string | null>(null);
  const [isSimulatedDelay, setIsSimulatedDelay] = useState<boolean>(false);

  // Live timer ticks
  useEffect(() => {
    const timer = setInterval(() => {
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

  const handleLaunchRide = (provider: 'Grab' | 'TADA', price: string) => {
    setRideHailingToast(`Opening ${provider} app... Est fare: ${price}`);
    setTimeout(() => {
      setRideHailingToast(null);
    }, 2800);
  };

  const handleTriggerDelay = () => {
    setIsSimulatedDelay(true);
    onOpenExcuseGenerator(18);
  };

  return (
    <div className="flex flex-col w-full px-4 pb-20 space-y-3.5 pt-2">
      {/* Toast Notification */}
      {rideHailingToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#283044] text-white px-4 py-2 rounded-full text-[13px] font-bold shadow-xl flex items-center gap-2 z-50 animate-bounce">
          <span className="material-symbols-outlined text-[16px] text-[#85f8c4]">local_taxi</span>
          {rideHailingToast}
        </div>
      )}

      {/* Active Trip Header Card */}
      <div className="rounded-xl bg-white shadow-sm border border-[#eaedff] p-4 flex flex-col gap-2 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#dce1ff] text-[#001551] uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Active Trip
          </span>
          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#85f8c4] text-[#002114] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#004f35] animate-ping"></span>
            8 min buffer
          </span>
        </div>
        <div>
          <h2 className="font-bold text-[18px] text-[#131b2e] leading-snug">
            Tampines → Suntec City
          </h2>
          <p className="text-[12px] text-[#434655] flex items-center gap-1 mt-0.5">
            Target: <span className="text-[#131b2e] font-bold">9:00 AM</span> • Est. Reach:{' '}
            <span className="text-[#004f35] font-extrabold text-[15px]">8:52 AM</span>
          </p>
        </div>

        {/* Quick simulation bar */}
        <div className="pt-1 flex items-center justify-between text-[11px] border-t border-[#eaedff]">
          <span className="text-[#434655]">Live Trip Simulation:</span>
          <button
            type="button"
            onClick={handleTriggerDelay}
            className="px-2 py-0.5 rounded-md bg-[#ffdad6] text-[#93000b] hover:bg-[#ffb4ab] font-bold flex items-center gap-1 transition-all"
          >
            <span className="material-symbols-outlined text-[13px]">warning</span>
            Simulate +18m Delay
          </button>
        </div>
      </div>

      {/* Step 1: First Mile Bus */}
      <div className="rounded-xl bg-white shadow-sm border border-[#eaedff] p-4 flex flex-col space-y-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#0037b0] flex items-center justify-center text-white font-bold text-[12px]">
              1
            </span>
            <span className="font-bold text-[15px] text-[#131b2e]">Step 1: First Mile Bus</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#93000b] text-[11px] font-extrabold">
            <span className="material-symbols-outlined text-[14px]">sprint</span>
            Walk Faster! (120 spm)
          </span>
        </div>

        {/* Walking instruction */}
        <div className="bg-[#f2f3ff] rounded-lg p-2.5 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[#434655] text-[11px]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#0037b0]">
                directions_walk
              </span>
              180m to Bus Stop
            </span>
            <span className="text-[#131b2e] font-bold">Opp Tampines Stn</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-[16px] text-[#131b2e]">Opp Tampines Stn</span>
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#eaedff] text-[#434655]">
              B76149
            </span>
          </div>
        </div>

        {/* Bus timing card */}
        <div className="bg-[#eaedff] rounded-lg p-3 flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded bg-[#283044] text-white font-extrabold text-[18px] tracking-tight">
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
          <div className="flex items-center justify-between pt-1 border-t border-[#dae2fd]">
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
      <div className="rounded-xl bg-white shadow-sm border border-[#eaedff] p-4 flex flex-col space-y-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#0037b0] flex items-center justify-center text-white font-bold text-[12px]">
              2
            </span>
            <span className="font-bold text-[15px] text-[#131b2e]">Step 2: Downtown Line MRT</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#85f8c4] text-[#002114] text-[11px] font-extrabold">
            <span className="material-symbols-outlined text-[13px] text-[#004f35]">spa</span>
            Just Stroll (60m)
          </span>
        </div>

        {/* Interchange Underpass info */}
        <div className="bg-[#f2f3ff] rounded-lg p-2.5 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[#434655] text-[11px]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#0037b0]">roofing</span>
              Sheltered Underpass Link
            </span>
            <span className="text-[#131b2e] font-bold">Exit B</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#00519f] text-white text-[11px] font-extrabold">
                DT30
              </span>
              <span className="font-bold text-[16px] text-[#131b2e]">Bedok Reservoir</span>
            </div>
            <span className="text-[11px] text-[#434655] font-medium">To DT15 Promenade</span>
          </div>
        </div>

        {/* Train timing card */}
        <div className="bg-[#eaedff] rounded-lg p-3 flex flex-col gap-2">
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
          <div className="p-2 rounded bg-[#e2e7ff] flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#0037b0]">
                meeting_room
              </span>
              <span className="text-[#131b2e] font-extrabold">Door 03</span>
            </div>
            <span className="text-[11px] text-[#434655]">Fastest escalator exit at Promenade</span>
          </div>
        </div>
      </div>

      {/* Switch to Car Card */}
      <div className="rounded-xl bg-white shadow-sm border border-[#eaedff] p-4 flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[20px] text-[#bb0112]">local_taxi</span>
            <span className="font-bold text-[15px] text-[#131b2e]">
              Running tight? Switch to Car
            </span>
          </div>
          <span className="text-[11px] text-[#434655] font-semibold">Direct 18 mins</span>
        </div>
        <p className="text-[12px] text-[#434655]">
          Skip transfers and arrive directly at Suntec Tower 2 drop-off.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleLaunchRide('Grab', '$18.60')}
            className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-[#f2f3ff] hover:bg-[#eaedff] active:scale-[0.98] transition-transform text-center gap-0.5 border border-[#dae2fd]"
          >
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#00b14f]">hail</span>
              <span className="font-bold text-[14px] text-[#131b2e]">Open Grab</span>
            </div>
            <span className="font-extrabold text-[18px] text-[#00b14f]">$18.60</span>
            <span className="text-[11px] text-[#434655]">Est 3m pickup</span>
          </button>

          <button
            type="button"
            onClick={() => handleLaunchRide('TADA', '$16.20')}
            className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-[#f2f3ff] hover:bg-[#eaedff] active:scale-[0.98] transition-transform text-center gap-0.5 border border-[#dae2fd]"
          >
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#0037b0]">
                electric_car
              </span>
              <span className="font-bold text-[14px] text-[#131b2e]">Open TADA</span>
            </div>
            <span className="font-extrabold text-[18px] text-[#0037b0]">$16.20</span>
            <span className="text-[11px] text-[#434655]">Zero commission</span>
          </button>
        </div>
      </div>

      {/* Delays Ahead Alert Card */}
      <div className="rounded-xl bg-[#dae2fd] border border-[#c4c5d7] p-4 flex flex-col space-y-2.5 shadow-sm">
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[22px] text-[#bb0112] mt-0.5">warning</span>
          <div className="flex-1">
            <span className="font-bold text-[15px] text-[#131b2e] block">Delays ahead?</span>
            <p className="text-[12px] text-[#434655] leading-relaxed">
              If transit exceeds 9:00 AM, tap below to generate an airtight Singlish WhatsApp excuse
              via Gemini AI.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpenExcuseGenerator(18)}
          className="w-full py-2.5 px-4 rounded-full bg-[#e02928] hover:bg-[#bb0112] text-white font-bold text-[14px] flex items-center justify-center gap-2 active:scale-98 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          Late Lah! Excuse Generator →
        </button>
      </div>
    </div>
  );
};
