/**
 * @file ActiveRideView.tsx
 * In-Transit live tracking screen: countdowns, crowd occupancy, and the
 * excuse-generator trigger, all driven by the currently selected route.
 *
 * Bug fixed here (the same class of bug this whole review kept finding):
 * the countdown timers used to be seeded once from hardcoded literals and
 * never resynced when the user picked a different route — so switching
 * routes never visibly changed anything on this screen. Countdown state is
 * now re-seeded from currentRoute's real ETA fields via a ref, keyed on the
 * currentRoute object itself so every new selection (even one that reuses
 * the same route id, e.g. "route-mrt" for a different origin/destination)
 * is picked up.
 */

import React, { useState, useEffect, useRef } from 'react';
import { TransitRoute, JourneyStep, ExcuseTrigger } from '../types';
import { determinePacingStatus } from '../utils/timeCalculations';
import { formatDistance } from '../utils/geo';

interface ActiveRideViewProps {
  currentRoute: TransitRoute;
  onOpenExcuseGenerator: (trigger: ExcuseTrigger) => void;
  targetArrivalTime?: string;
}

interface RideCountdown {
  step: JourneyStep;
  precedingWalk?: JourneyStep;
  secondsLeft: number;
}

export const ActiveRideView: React.FC<ActiveRideViewProps> = ({
  currentRoute,
  onOpenExcuseGenerator,
  targetArrivalTime = '09:00',
}) => {
  const [countdownSecondsByStep, setCountdownSecondsByStep] = useState<Record<number, number>>({});
  const [rideHailingToast, setRideHailingToast] = useState<string | null>(null);
  const [isSimulatedDelay, setIsSimulatedDelay] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const rideSteps = currentRoute.steps.filter((s) => s.type === 'BUS' || s.type === 'MRT');

  // Re-seed every countdown from this route's real live-ETA fields whenever
  // the selected route changes (object identity, not just its id string —
  // App.tsx always creates a fresh object on selection, so this fires on
  // every "Start Active Ride & Track" tap, including re-picking the same
  // route id for a different origin/destination).
  useEffect(() => {
    const seeded: Record<number, number> = {};
    rideSteps.forEach((step) => {
      const etaMin = step.busDetails?.arrivalMinutes ?? step.mrtDetails?.arrivalMinutes ?? currentRoute.firstMileLiveEtaMinutes ?? 2;
      seeded[step.stepNumber] = Math.max(0, etaMin) * 60;
    });
    setCountdownSecondsByStep(seeded);
    setIsSimulatedDelay(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoute]);

  // Live timer tick — reads current state via the setState updater form, so
  // this single interval (registered once) never captures a stale route.
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setCountdownSecondsByStep((prev) => {
        const next: Record<number, number> = {};
        for (const key of Object.keys(prev)) {
          const n = Number(key);
          next[n] = prev[n] > 0 ? prev[n] - 1 : 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
      // Simulating IS explicitly asking to see the late-excuse flow, so this
      // one forces isLate:true even if the real plan is on time right now.
      const lateMins = Math.max(18, pacing.lateMinutes + 18);
      onOpenExcuseGenerator({ isLate: true, delayMinutes: lateMins, etaFormatted: pacing.estReachTimeFormatted });
    }
  };

  const cards: RideCountdown[] = rideSteps.map((step, idx) => {
    const precedingWalk = currentRoute.steps[currentRoute.steps.indexOf(step) - 1];
    return {
      step,
      precedingWalk: precedingWalk?.type === 'WALK' ? precedingWalk : undefined,
      secondsLeft: countdownSecondsByStep[step.stepNumber] ?? 0,
    };
  });

  const driveMinutes = currentRoute.driveEstimateMinutes;
  const driveDistance = currentRoute.driveDistanceMeters;

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
              {currentRoute.originName || 'Origin'} → {currentRoute.destinationName || 'Destination'}
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
            {currentRoute.liveDataNote && (
              <p className="text-[11px] text-[#434655] italic mt-1">{currentRoute.liveDataNote}</p>
            )}
          </div>

          <div className="pt-2 sm:pt-0 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTriggerDelay}
              className={`px-3 py-1.5 rounded-lg font-bold text-[12px] flex items-center gap-1.5 transition-all min-h-[36px] ${
                isSimulatedDelay ? 'bg-[#dce1ff] text-[#001551] hover:bg-[#c2ccff]' : 'bg-[#ffdad6] text-[#93000b] hover:bg-[#ffb4ab]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{isSimulatedDelay ? 'restart_alt' : 'warning'}</span>
              {isSimulatedDelay ? 'Reset +18m Delay' : 'Simulate +18m Delay'}
            </button>

            {pacing.isLate && (
              <button
                type="button"
                onClick={() => onOpenExcuseGenerator({ isLate: true, delayMinutes: pacing.lateMinutes, etaFormatted: pacing.estReachTimeFormatted })}
                className="px-3.5 py-1.5 rounded-lg bg-[#ba1a1a] text-white hover:bg-[#93000b] font-bold text-[12px] flex items-center gap-1.5 shadow-sm active:scale-95 transition-all min-h-[36px]"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                WhatsApp Excuse (+{pacing.lateMinutes}m)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transit Steps — one card per ride leg in the selected route (live-refreshed each second) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
        {cards.map(({ step, precedingWalk, secondsLeft }) => {
          const min = Math.floor(secondsLeft / 60);
          const sec = secondsLeft % 60;
          const isBus = step.type === 'BUS';
          return (
            <div
              key={step.stepNumber}
              className="rounded-2xl bg-white shadow-sm border border-[#eaedff] p-4 sm:p-5 flex flex-col justify-between space-y-3 relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-[#0037b0] flex items-center justify-center text-white font-bold text-[13px]">
                    {step.stepNumber}
                  </span>
                  <span className="font-extrabold text-[15px] sm:text-[16px] text-[#131b2e]">{step.title}</span>
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

              {precedingWalk && (
                <div className="bg-[#f2f3ff] rounded-xl p-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[#434655] text-[11px]">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-[#0037b0]">directions_walk</span>
                      {formatDistance(precedingWalk.distanceMeters || 0)} to {step.fromName}
                    </span>
                    <span className="text-[#131b2e] font-bold">{step.fromName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[16px] text-[#131b2e]">{step.fromName}</span>
                    {step.fromCode && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#eaedff] text-[#434655]">{step.fromCode}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-[#eaedff] rounded-xl p-3.5 flex flex-col gap-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    {isBus ? (
                      <span className="px-3 py-1 rounded-lg bg-[#283044] text-white font-extrabold text-[18px] tracking-tight">
                        {step.busDetails?.serviceNo}
                      </span>
                    ) : (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-white text-[11px] font-extrabold"
                        style={{ backgroundColor: step.mrtDetails?.lineColor || '#00519f' }}
                      >
                        {step.mrtDetails?.lineCode}
                      </span>
                    )}
                    <div className="flex flex-col">
                      <span className="font-bold text-[15px] text-[#131b2e]">
                        {isBus ? step.busDetails?.operator : step.mrtDetails?.lineName}
                      </span>
                      <span className="text-[11px] text-[#434655] font-medium">
                        {isBus ? `Reg ${step.busDetails?.regNo}` : step.mrtDetails?.direction}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-[28px] font-extrabold text-[#0037b0] leading-none">{min}</span>
                      <span className="text-[11px] font-bold text-[#0037b0]">min</span>
                      <span className="text-[10px] text-[#434655]">({sec}s)</span>
                    </div>
                    <span className="text-[12px] text-[#434655]">
                      {isBus ? `Next: ${step.busDetails?.nextArrivalMinutes} min` : step.mrtDetails?.platform}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-[#dae2fd]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#434655]">Crowd:</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#85f8c4] text-[#002114] text-[11px] font-extrabold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#004f35]"></span>
                      {isBus ? step.busDetails?.crowdLabel : 'Live from LTA'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[#434655] text-[11px]">
                    <span className="material-symbols-outlined text-[15px] text-[#004f35]">arrow_downward</span>
                    <span>Alight: {step.toName}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Contingency Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
        {/* Switch to Car Card — real estimate for THIS trip, not a hardcoded number */}
        <div className="rounded-2xl bg-white shadow-sm border border-[#eaedff] p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-[#bb0112]">local_taxi</span>
                <span className="font-bold text-[15px] sm:text-[16px] text-[#131b2e]">Running tight? Switch to Car</span>
              </div>
              <span className="text-[11px] text-[#434655] font-bold px-2 py-0.5 rounded bg-[#f2f3ff]">
                Est {driveMinutes ?? '—'} mins
              </span>
            </div>
            <p className="text-[12px] text-[#434655] mt-1">
              Skip transfers — {driveDistance ? `~${formatDistance(driveDistance)} by road` : 'road distance unavailable'} directly to{' '}
              {currentRoute.destinationName || 'your destination'}. Estimated, not live traffic.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => handleLaunchRide('Grab', 'Check app for fare')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] active:scale-[0.98] transition-all text-center gap-0.5 border border-[#dae2fd] min-h-[72px]"
            >
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#00b14f]">hail</span>
                <span className="font-bold text-[13px] text-[#131b2e]">Open Grab</span>
              </div>
              <span className="font-extrabold text-[13px] text-[#00b14f]">Est {driveMinutes ?? '—'}m pickup+ride</span>
            </button>

            <button
              type="button"
              onClick={() => handleLaunchRide('TADA', 'Check app for fare')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] active:scale-[0.98] transition-all text-center gap-0.5 border border-[#dae2fd] min-h-[72px]"
            >
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#0037b0]">electric_car</span>
                <span className="font-bold text-[13px] text-[#131b2e]">Open TADA</span>
              </div>
              <span className="font-extrabold text-[13px] text-[#0037b0]">Est {driveMinutes ?? '—'}m pickup+ride</span>
            </button>
          </div>
        </div>

        {/* Status Check-in Card — reflects the REAL pacing, not a hardcoded delay.
            Late: offers the Singlish excuse generator. On time: offers a quick
            "I'm on my way" check-in instead — there's nothing to excuse. */}
        <div className="rounded-2xl bg-[#dae2fd] border border-[#c4c5d7] p-4 sm:p-5 flex flex-col justify-between space-y-3 shadow-sm">
          <div className="flex items-start gap-3">
            <span className={`material-symbols-outlined text-[26px] mt-0.5 ${pacing.isLate ? 'text-[#bb0112]' : 'text-[#004f35]'}`}>
              {pacing.isLate ? 'warning' : 'check_circle'}
            </span>
            <div className="flex-1">
              <span className="font-extrabold text-[16px] text-[#131b2e] block">
                {pacing.isLate ? 'Delays ahead?' : "You're on track"}
              </span>
              <p className="text-[12px] sm:text-[13px] text-[#434655] leading-relaxed mt-0.5">
                {pacing.isLate
                  ? `Transit is tracking past ${pacing.targetTimeFormatted} — tap below to generate an airtight Singlish WhatsApp excuse via Gemini AI.`
                  : `Est. reach ${pacing.estReachTimeFormatted}, ahead of your ${pacing.targetTimeFormatted} target — send a quick "I'm on my way" check-in.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              onOpenExcuseGenerator({
                isLate: pacing.isLate,
                delayMinutes: pacing.isLate ? pacing.lateMinutes : 0,
                etaFormatted: pacing.estReachTimeFormatted,
              })
            }
            className={`w-full py-3 px-4 rounded-full text-white font-extrabold text-[14px] flex items-center justify-center gap-2 active:scale-98 transition-all shadow-sm min-h-[44px] ${
              pacing.isLate ? 'bg-[#e02928] hover:bg-[#bb0112]' : 'bg-[#004f35] hover:bg-[#00382a]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{pacing.isLate ? 'auto_awesome' : 'send'}</span>
            {pacing.isLate ? 'Late Lah! Excuse Generator →' : "I'm On My Way →"}
          </button>
        </div>
      </div>
    </div>
  );
};
