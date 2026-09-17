/**
 * @file LateLahAIView.tsx
 * Singlish WhatsApp excuse generator powered by Gemini AI with tone selection,
 * LTA proof verification badges, instant copy, and WhatsApp deep-linking.
 * Perfectly adheres to Image 3 and Singapore cultural humor & professionalism.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { generateSinglishExcuse } from '../services/excuseGenerator';
import { ExcuseRequest } from '../types';
import { parseTimeToMinutes, formatMinutesToTime } from '../utils/timeCalculations';

interface LateLahAIViewProps {
  initialDelay?: number;
  targetArrivalTime?: string;
}

export const LateLahAIView: React.FC<LateLahAIViewProps> = ({
  initialDelay = 18,
  targetArrivalTime = '09:00',
}) => {
  const [recipient, setRecipient] = useState<'boss' | 'colleagues' | 'friends'>('boss');
  const [spiceLevel, setSpiceLevel] = useState<1 | 2 | 3>(2);
  const [delayMinutes, setDelayMinutes] = useState<number>(initialDelay);
  const [targetArrival, setTargetArrival] = useState<string>(() => {
    return targetArrivalTime ? formatMinutesToTime(parseTimeToMinutes(targetArrivalTime)) : '9:00 AM';
  });

  // Compute live ETA directly from targetArrival + delayMinutes
  const liveEta = useMemo(() => {
    const targetMins = parseTimeToMinutes(targetArrival);
    return formatMinutesToTime(targetMins + delayMinutes);
  }, [targetArrival, delayMinutes]);

  const [messageText, setMessageText] = useState<string>(
    'Good morning Boss, paiseh! DT Line train got crowd delay and bus transfer jammed at PIE. Currently brisk walking from MRT, live ETA 9:18 AM. Will make up time, thank you boss!'
  );
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<string>('Copy');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const incidentRef = useRef<string>('DTL-918-LIVE');

  // Keep targetArrival and delayMinutes in sync with props
  useEffect(() => {
    if (targetArrivalTime) {
      setTargetArrival(formatMinutesToTime(parseTimeToMinutes(targetArrivalTime)));
    }
  }, [targetArrivalTime]);

  useEffect(() => {
    if (initialDelay) {
      setDelayMinutes(initialDelay);
    }
  }, [initialDelay]);

  // Spice labels map
  const spiceLabels: Record<number, string> = {
    1: 'Mild & Safe',
    2: 'Standard Lah (Medium)',
    3: 'Level 99 Kanchiong 🔥'
  };

  // Trigger excuse regeneration when recipient or spice level changes
  useEffect(() => {
    let isCurrent = true;

    const fetchExcuse = async () => {
      setIsAiLoading(true);

      const req: ExcuseRequest = {
        recipient,
        spiceLevel,
        origin: 'Tampines Ave 4',
        destination: 'Suntec City Tower 2',
        targetTime: targetArrival,
        liveEta,
        delayMinutes,
        incidentId: incidentRef.current,
        transportLines: ['DTL', 'Bus 65']
      };

      try {
        const result = await generateSinglishExcuse(req);
        if (isCurrent) {
          setMessageText(result.message);
          setIsAiGenerated(result.generatedByAi);
        }
      } catch (err) {
        console.error('Failed to generate excuse:', err);
      } finally {
        if (isCurrent) {
          setIsAiLoading(false);
        }
      }
    };

    fetchExcuse();

    return () => {
      isCurrent = false;
    };
  }, [recipient, spiceLevel, delayMinutes, targetArrival, liveEta]);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText.trim()).then(() => {
      setCopyFeedback('Copied!');
      setTimeout(() => {
        setCopyFeedback('Copy');
      }, 1800);
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(messageText)}`;

  return (
    <div className="flex flex-col w-full pb-20 space-y-5 pt-1">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#283044] text-white px-5 py-2.5 rounded-full text-[13px] font-bold shadow-xl flex items-center gap-2 z-50 animate-fade-in">
          <span className="material-symbols-outlined text-[18px] text-[#85f8c4]">check_circle</span>
          {toastMessage}
        </div>
      )}

      {/* Alert Banner: Transit Delay Detected */}
      <section className="relative overflow-hidden rounded-2xl bg-[#bb0112] p-4 sm:p-5 text-white shadow-md">
        <div className="flex items-start justify-between gap-2 relative z-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white text-[#bb0112] shadow-xs">
              <span className="material-symbols-outlined text-[24px]">warning</span>
            </span>
            <div>
              <span className="text-[11px] font-extrabold tracking-wider uppercase opacity-90 block">
                Incident Detected
              </span>
              <h2 className="text-[18px] sm:text-[22px] font-extrabold leading-tight">
                Transit Delay Detected!
              </h2>
            </div>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-white text-[#bb0112] text-[13px] font-extrabold shadow-xs">
            +{delayMinutes}m Delay
          </span>
        </div>

        {/* Alamak Cry & ETA comparison pill */}
        <div className="mt-3.5 bg-[#e02928] rounded-xl p-3.5 sm:p-4 flex flex-col gap-2 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">😱</span>
              <span className="font-extrabold text-[17px] sm:text-[18px]">Alamak! Confirm Late!</span>
            </div>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-white text-[#bb0112]">
              Kanchiong Max
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-1">
            <div className="bg-white/15 rounded-xl p-2.5 text-center backdrop-blur-xs flex flex-col justify-center">
              <span className="text-[11px] opacity-90 block font-semibold">Target Arrival</span>
              <span className="font-extrabold text-[16px] sm:text-[18px] line-through opacity-80">
                {targetArrival}
              </span>
            </div>
            <div className="bg-white rounded-xl p-2.5 text-center text-[#bb0112] shadow-xs flex flex-col justify-center">
              <span className="text-[11px] font-extrabold block">Live ETA</span>
              <span className="text-[24px] sm:text-[28px] font-extrabold leading-tight tracking-tight">
                {liveEta}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Responsive Grid: Stacks on mobile, 2-column on large screens (lg:grid-cols-12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Delay Diagnosis & Persona Settings */}
        <div className="lg:col-span-6 space-y-4">
          {/* Gemini AI Delay Diagnosis Card */}
          <section className="rounded-2xl bg-[#f2f3ff] border border-[#dae2fd] p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#dce1ff] text-[#0037b0] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                </span>
                <h3 className="font-extrabold text-[15px] sm:text-[16px] text-[#131b2e]">
                  Gemini Transit Diagnosis
                </h3>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#dce1ff] text-[#001551] font-extrabold">
                Live LTA Feed Verified
              </span>
            </div>

            <div className="space-y-2.5">
              {/* DTL issue */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white shadow-xs border border-[#eaedff]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#00519f] text-white text-[11px] font-extrabold flex-shrink-0">
                    DTL
                  </span>
                  <span className="text-[13px] sm:text-[14px] font-semibold text-[#131b2e] truncate">
                    Signalling &amp; Crowd Congestion
                  </span>
                </div>
                <span className="text-[14px] text-[#bb0112] font-extrabold flex-shrink-0 ml-2">
                  +11m
                </span>
              </div>

              {/* Bus 65 issue */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white shadow-xs border border-[#eaedff]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#283044] text-white text-[11px] font-extrabold flex-shrink-0">
                    BUS 65
                  </span>
                  <span className="text-[13px] sm:text-[14px] font-semibold text-[#131b2e] truncate">
                    Transfer Wait &amp; PIE Jam
                  </span>
                </div>
                <span className="text-[14px] text-[#bb0112] font-extrabold flex-shrink-0 ml-2">
                  +7m
                </span>
              </div>
            </div>
          </section>

          {/* Recipient & Tone Controls */}
          <section className="rounded-2xl bg-white border border-[#eaedff] p-4 sm:p-5 shadow-sm space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[15px] font-extrabold text-[#131b2e]">Choose Recipient</span>
                <span className="text-[11px] text-[#434655] font-semibold">Tone auto-adapts</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {/* Boss button */}
                <button
                  type="button"
                  onClick={() => setRecipient('boss')}
                  className={`text-left p-3 rounded-xl transition-all flex items-center justify-between active:scale-[0.98] min-h-[46px] ${
                    recipient === 'boss'
                      ? 'bg-[#0037b0] text-white shadow-xs'
                      : 'bg-[#eaedff] text-[#131b2e] hover:bg-[#dae2fd]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px]">business_center</span>
                    <span className="text-[13px] sm:text-[14px] font-bold">To Boss (Formal Singlish)</span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      recipient === 'boss' ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    check_circle
                  </span>
                </button>

                {/* Colleagues button */}
                <button
                  type="button"
                  onClick={() => setRecipient('colleagues')}
                  className={`text-left p-3 rounded-xl transition-all flex items-center justify-between active:scale-[0.98] min-h-[46px] ${
                    recipient === 'colleagues'
                      ? 'bg-[#0037b0] text-white shadow-xs'
                      : 'bg-[#eaedff] text-[#131b2e] hover:bg-[#dae2fd]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px]">groups</span>
                    <span className="text-[13px] sm:text-[14px] font-bold">Colleagues / Team (Casual)</span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      recipient === 'colleagues' ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    check_circle
                  </span>
                </button>

                {/* Friends button */}
                <button
                  type="button"
                  onClick={() => setRecipient('friends')}
                  className={`text-left p-3 rounded-xl transition-all flex items-center justify-between active:scale-[0.98] min-h-[46px] ${
                    recipient === 'friends'
                      ? 'bg-[#0037b0] text-white shadow-xs'
                      : 'bg-[#eaedff] text-[#131b2e] hover:bg-[#dae2fd]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px]">
                      sentiment_very_satisfied
                    </span>
                    <span className="text-[13px] sm:text-[14px] font-bold">Kakis / Friends (Super Singlish)</span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      recipient === 'friends' ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    check_circle
                  </span>
                </button>
              </div>
            </div>

            {/* Singlish Intensity Slider */}
            <div className="pt-2 border-t border-[#eaedff]">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="singlish-slider" className="text-[12px] sm:text-[13px] text-[#434655] font-bold">
                  Singlish Spice Level
                </label>
                <span className="text-[12px] sm:text-[13px] text-[#0037b0] font-extrabold">
                  {spiceLabels[spiceLevel]}
                </span>
              </div>
              <input
                id="singlish-slider"
                type="range"
                min="1"
                max="3"
                value={spiceLevel}
                onChange={(e) => setSpiceLevel(Number(e.target.value) as 1 | 2 | 3)}
                className="w-full accent-[#0037b0] h-2 bg-[#dae2fd] rounded-full cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#434655] font-semibold mt-1.5">
                <span>Mild &amp; Safe</span>
                <span>Standard Lah</span>
                <span>Level 99 Kanchiong 🔥</span>
              </div>
            </div>
          </section>

          {/* Fallback Action Card: Switch to Ride-hailing */}
          <section className="rounded-2xl bg-[#e2e7ff] border border-[#c4c5d7] p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#bb0112] text-[22px]">local_taxi</span>
                <h4 className="font-extrabold text-[14px] sm:text-[15px] text-[#131b2e]">
                  Emergency Rescue: Save 12 mins
                </h4>
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#85f8c4] text-[#002114]">
                ETA 9:06 AM
              </span>
            </div>
            <p className="text-[12px] sm:text-[13px] text-[#434655] mb-3">
              Skip the Bus 65 queue right now at Newton Circus exit B!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => showToast('Connecting to Grab driver...')}
                className="py-2.5 px-3 rounded-xl bg-white text-[#131b2e] text-[12px] font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-[#faf8ff] active:scale-95 border border-[#c4c5d7] min-h-[42px]"
              >
                <span className="material-symbols-outlined text-[17px] text-[#00b14f]">hail</span>
                <span>Book Grab (~$14)</span>
              </button>
              <button
                type="button"
                onClick={() => showToast('Connecting to TADA driver...')}
                className="py-2.5 px-3 rounded-xl bg-white text-[#131b2e] text-[12px] font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-[#faf8ff] active:scale-95 border border-[#c4c5d7] min-h-[42px]"
              >
                <span className="material-symbols-outlined text-[17px] text-[#0037b0]">
                  directions_car
                </span>
                <span>Call TADA (~$12)</span>
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: WhatsApp Preview & One-Tap Actions */}
        <div className="lg:col-span-6 space-y-4">
          {/* WhatsApp Message Preview Card */}
          <section className="rounded-2xl bg-white border border-[#eaedff] p-4 sm:p-5 shadow-md space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#25d366]"></span>
                <h3 className="font-extrabold text-[16px] sm:text-[17px] text-[#131b2e]">WhatsApp Draft Preview</h3>
                {isAiLoading && (
                  <span className="text-[11px] text-[#0037b0] font-semibold animate-pulse ml-1">
                    (Crafting...)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#eaedff] text-[#0037b0] text-[12px] font-bold hover:bg-[#dae2fd] active:scale-95 transition-all min-h-[32px]"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                <span>{copyFeedback}</span>
              </button>
            </div>

            {/* Message Bubble (Authentic WhatsApp Look) */}
            <div className="p-4 rounded-2xl bg-[#DCF8C6] text-[#131b2e] text-[14px] sm:text-[15px] shadow-inner space-y-2.5 border border-[#B2E28D]">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={5}
                className="w-full bg-transparent resize-none leading-relaxed focus:outline-none text-[#131b2e] font-medium"
                placeholder="Excuse message will generate here..."
              />

              {/* Attached Proof Badge */}
              <div className="flex items-center justify-between bg-[#C8E6C9] rounded-xl px-3 py-1.5 text-[#004f35]">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-extrabold">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Proof Attached: LTA Incident #{incidentRef.current}</span>
                </div>
                <span className="text-[10px] sm:text-[11px] opacity-75 font-bold">8:42 AM</span>
              </div>
            </div>

            {/* Send to WhatsApp Primary CTA */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-full bg-[#006948] hover:bg-[#004f35] text-white text-[15px] font-extrabold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all min-h-[48px]"
            >
              <span className="material-symbols-outlined text-[22px]">send</span>
              <span>Send to WhatsApp Now</span>
            </a>

            {/* Quick blast chips */}
            <div className="pt-1">
              <span className="text-[11px] text-[#434655] font-bold block mb-2">Quick Blast To:</span>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => showToast('Opening chat with Boss David...')}
                  className="px-3 py-1.5 rounded-full bg-[#eaedff] hover:bg-[#dae2fd] text-[#131b2e] text-[11px] sm:text-[12px] font-bold flex items-center gap-1.5 active:scale-95 transition-all min-h-[36px]"
                >
                  <span className="material-symbols-outlined text-[15px] text-[#0037b0]">person</span>
                  Boss David
                </button>
                <button
                  type="button"
                  onClick={() => showToast('Sending update to Mktg Team channel...')}
                  className="px-3 py-1.5 rounded-full bg-[#eaedff] hover:bg-[#dae2fd] text-[#131b2e] text-[11px] sm:text-[12px] font-bold flex items-center gap-1.5 active:scale-95 transition-all min-h-[36px]"
                >
                  <span className="material-symbols-outlined text-[15px] text-[#0037b0]">forum</span>
                  Mktg Team (12 pax)
                </button>
                <button
                  type="button"
                  onClick={() => showToast('Opening group chat with Lunch Kakis...')}
                  className="px-3 py-1.5 rounded-full bg-[#eaedff] hover:bg-[#dae2fd] text-[#131b2e] text-[11px] sm:text-[12px] font-bold flex items-center gap-1.5 active:scale-95 transition-all min-h-[36px]"
                >
                  <span className="material-symbols-outlined text-[15px] text-[#0037b0]">
                    ramen_dining
                  </span>
                  Lunch Kakis
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
