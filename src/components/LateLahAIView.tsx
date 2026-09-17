/**
 * @file LateLahAIView.tsx
 * Singlish WhatsApp excuse generator powered by Gemini AI with tone selection,
 * LTA proof verification badges, instant copy, and WhatsApp deep-linking.
 * Perfectly adheres to Image 3 and Singapore cultural humor & professionalism.
 */

import React, { useState, useEffect, useRef } from 'react';
import { generateSinglishExcuse } from '../services/excuseGenerator';
import { ExcuseRequest } from '../types';

interface LateLahAIViewProps {
  initialDelay?: number;
}

export const LateLahAIView: React.FC<LateLahAIViewProps> = ({ initialDelay = 18 }) => {
  const [recipient, setRecipient] = useState<'boss' | 'colleagues' | 'friends'>('boss');
  const [spiceLevel, setSpiceLevel] = useState<1 | 2 | 3>(2);
  const [delayMinutes, setDelayMinutes] = useState<number>(initialDelay);
  const [targetArrival, setTargetArrival] = useState<string>('9:00 AM');
  const [liveEta, setLiveEta] = useState<string>('9:18 AM');
  const [messageText, setMessageText] = useState<string>(
    'Good morning Boss, paiseh! DT Line train got crowd delay and bus transfer jammed at PIE. Currently brisk walking from MRT, live ETA 9:18 AM. Will make up time, thank you boss!'
  );
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<string>('Copy');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const incidentRef = useRef<string>('DTL-918-LIVE');

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
    <div className="flex flex-col w-full px-4 pb-20 space-y-4 pt-2">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#283044] text-white px-4 py-2 rounded-full text-[13px] font-bold shadow-xl flex items-center gap-2 z-50 animate-fade-in">
          <span className="material-symbols-outlined text-[16px] text-[#85f8c4]">check_circle</span>
          {toastMessage}
        </div>
      )}

      {/* Alert Banner: Transit Delay Detected */}
      <section className="relative overflow-hidden rounded-xl bg-[#bb0112] p-4 text-white shadow-md">
        <div className="flex items-start justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white text-[#bb0112] shadow-xs">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </span>
            <div>
              <span className="text-[11px] font-extrabold tracking-wider uppercase opacity-90 block">
                Incident Detected
              </span>
              <h2 className="text-[18px] font-extrabold leading-tight">
                Transit Delay Detected!
              </h2>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white text-[#bb0112] text-[12px] font-extrabold shadow-xs">
            +{delayMinutes}m Delay
          </span>
        </div>

        {/* Alamak Cry & ETA comparison pill */}
        <div className="mt-3 bg-[#e02928] rounded-lg p-3 flex flex-col gap-1.5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xl">😱</span>
              <span className="font-extrabold text-[16px]">Alamak! Confirm Late!</span>
            </div>
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-white text-[#bb0112]">
              Kanchiong Max
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="bg-white/15 rounded-lg p-1.5 text-center backdrop-blur-xs">
              <span className="text-[11px] opacity-90 block font-semibold">Target Arrival</span>
              <span className="font-extrabold text-[16px] line-through opacity-80">
                {targetArrival}
              </span>
            </div>
            <div className="bg-white rounded-lg p-1.5 text-center text-[#bb0112] shadow-xs">
              <span className="text-[11px] font-extrabold block">Live ETA</span>
              <span className="text-[26px] font-extrabold leading-tight tracking-tight">
                {liveEta}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Gemini AI Delay Diagnosis Card */}
      <section className="rounded-xl bg-[#f2f3ff] border border-[#dae2fd] p-3.5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#0037b0] text-[20px]">auto_awesome</span>
            <h3 className="font-bold text-[15px] text-[#131b2e]">Gemini Transit Diagnosis</h3>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#dce1ff] text-[#001551] font-extrabold">
            Live LTA Feed Verified
          </span>
        </div>

        <div className="space-y-2">
          {/* DTL issue */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-white shadow-xs border border-[#eaedff]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded-full bg-[#00519f] text-white text-[11px] font-extrabold flex-shrink-0">
                DTL
              </span>
              <span className="text-[13px] font-semibold text-[#131b2e] truncate">
                Signalling &amp; Crowd Congestion
              </span>
            </div>
            <span className="text-[14px] text-[#bb0112] font-extrabold flex-shrink-0 ml-2">
              +11m
            </span>
          </div>

          {/* Bus 65 issue */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-white shadow-xs border border-[#eaedff]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded-full bg-[#283044] text-white text-[11px] font-extrabold flex-shrink-0">
                BUS 65
              </span>
              <span className="text-[13px] font-semibold text-[#131b2e] truncate">
                Transfer Wait &amp; PIE Jam
              </span>
            </div>
            <span className="text-[14px] text-[#bb0112] font-extrabold flex-shrink-0 ml-2">+7m</span>
          </div>
        </div>
      </section>

      {/* Recipient & Tone Controls */}
      <section className="rounded-xl bg-white border border-[#eaedff] p-4 shadow-sm space-y-3.5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-bold text-[#131b2e]">Choose Recipient</span>
            <span className="text-[11px] text-[#434655] font-semibold">Tone auto-adapts</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {/* Boss button */}
            <button
              type="button"
              onClick={() => setRecipient('boss')}
              className={`text-left p-2.5 rounded-lg transition-all flex items-center justify-between active:scale-[0.98] ${
                recipient === 'boss'
                  ? 'bg-[#0037b0] text-white shadow-xs'
                  : 'bg-[#eaedff] text-[#131b2e] hover:bg-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">business_center</span>
                <span className="text-[13px] font-bold">To Boss (Formal Singlish)</span>
              </div>
              <span
                className={`material-symbols-outlined text-[18px] ${
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
              className={`text-left p-2.5 rounded-lg transition-all flex items-center justify-between active:scale-[0.98] ${
                recipient === 'colleagues'
                  ? 'bg-[#0037b0] text-white shadow-xs'
                  : 'bg-[#eaedff] text-[#131b2e] hover:bg-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">groups</span>
                <span className="text-[13px] font-bold">Colleagues / Team (Casual)</span>
              </div>
              <span
                className={`material-symbols-outlined text-[18px] ${
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
              className={`text-left p-2.5 rounded-lg transition-all flex items-center justify-between active:scale-[0.98] ${
                recipient === 'friends'
                  ? 'bg-[#0037b0] text-white shadow-xs'
                  : 'bg-[#eaedff] text-[#131b2e] hover:bg-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  sentiment_very_satisfied
                </span>
                <span className="text-[13px] font-bold">Kakis / Friends (Super Singlish)</span>
              </div>
              <span
                className={`material-symbols-outlined text-[18px] ${
                  recipient === 'friends' ? 'opacity-100' : 'opacity-0'
                }`}
              >
                check_circle
              </span>
            </button>
          </div>
        </div>

        {/* Singlish Intensity Slider */}
        <div className="pt-1 border-t border-[#eaedff]">
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="singlish-slider" className="text-[12px] text-[#434655] font-bold">
              Singlish Spice Level
            </label>
            <span className="text-[12px] text-[#0037b0] font-extrabold">
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
          <div className="flex justify-between text-[11px] text-[#434655] font-semibold mt-1">
            <span>Mild &amp; Safe</span>
            <span>Standard Lah</span>
            <span>Level 99 Kanchiong 🔥</span>
          </div>
        </div>
      </section>

      {/* WhatsApp Message Preview Card */}
      <section className="rounded-xl bg-white border border-[#eaedff] p-4 shadow-md space-y-3.5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#25d366]"></span>
            <h3 className="font-extrabold text-[16px] text-[#131b2e]">WhatsApp Draft Preview</h3>
            {isAiLoading && (
              <span className="text-[11px] text-[#0037b0] font-semibold animate-pulse ml-1">
                (Crafting...)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#eaedff] text-[#0037b0] text-[12px] font-bold hover:bg-[#dae2fd] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">content_copy</span>
            <span>{copyFeedback}</span>
          </button>
        </div>

        {/* Message Bubble (Authentic WhatsApp Look) */}
        <div className="p-3.5 rounded-xl bg-[#DCF8C6] text-[#131b2e] text-[14px] shadow-inner space-y-2 border border-[#B2E28D]">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={4}
            className="w-full bg-transparent resize-none leading-relaxed focus:outline-none text-[#131b2e] font-medium"
            placeholder="Excuse message will generate here..."
          />

          {/* Attached Proof Badge */}
          <div className="flex items-center justify-between bg-[#C8E6C9] rounded-lg px-2.5 py-1 text-[#004f35]">
            <div className="flex items-center gap-1 text-[11px] font-extrabold">
              <span className="material-symbols-outlined text-[15px]">verified</span>
              <span>Proof Attached: LTA Incident #{incidentRef.current}</span>
            </div>
            <span className="text-[10px] opacity-75 font-bold">8:42 AM</span>
          </div>
        </div>

        {/* Send to WhatsApp Primary CTA */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-full bg-[#006948] hover:bg-[#004f35] text-white text-[15px] font-extrabold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
          <span>Send to WhatsApp Now</span>
        </a>

        {/* Quick blast chips */}
        <div className="pt-1">
          <span className="text-[11px] text-[#434655] font-bold block mb-1.5">Quick Blast To:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => showToast('Opening chat with Boss David...')}
              className="px-2.5 py-1 rounded-full bg-[#eaedff] hover:bg-[#dae2fd] text-[#131b2e] text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[14px] text-[#0037b0]">person</span>
              Boss David
            </button>
            <button
              type="button"
              onClick={() => showToast('Sending update to Mktg Team channel...')}
              className="px-2.5 py-1 rounded-full bg-[#eaedff] hover:bg-[#dae2fd] text-[#131b2e] text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[14px] text-[#0037b0]">forum</span>
              Mktg Team (12 pax)
            </button>
            <button
              type="button"
              onClick={() => showToast('Opening group chat with Lunch Kakis...')}
              className="px-2.5 py-1 rounded-full bg-[#eaedff] hover:bg-[#dae2fd] text-[#131b2e] text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[14px] text-[#0037b0]">
                ramen_dining
              </span>
              Lunch Kakis
            </button>
          </div>
        </div>
      </section>

      {/* Fallback Action Card: Switch to Ride-hailing */}
      <section className="rounded-xl bg-[#e2e7ff] border border-[#c4c5d7] p-3.5 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#bb0112] text-[20px]">local_taxi</span>
            <h4 className="font-bold text-[14px] text-[#131b2e]">
              Emergency Rescue: Save 12 mins
            </h4>
          </div>
          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#85f8c4] text-[#002114]">
            ETA 9:06 AM
          </span>
        </div>
        <p className="text-[12px] text-[#434655] mb-2">
          Skip the Bus 65 queue right now at Newton Circus exit B!
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => showToast('Connecting to Grab driver...')}
            className="py-2 px-3 rounded-lg bg-white text-[#131b2e] text-[12px] font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-[#faf8ff] active:scale-95 border border-[#c4c5d7]"
          >
            <span className="material-symbols-outlined text-[16px] text-[#00b14f]">hail</span>
            <span>Book Grab (~$14)</span>
          </button>
          <button
            type="button"
            onClick={() => showToast('Connecting to TADA driver...')}
            className="py-2 px-3 rounded-lg bg-white text-[#131b2e] text-[12px] font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-[#faf8ff] active:scale-95 border border-[#c4c5d7]"
          >
            <span className="material-symbols-outlined text-[16px] text-[#0037b0]">
              directions_car
            </span>
            <span>Call TADA (~$12)</span>
          </button>
        </div>
      </section>
    </div>
  );
};
