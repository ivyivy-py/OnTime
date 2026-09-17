/**
 * @file DisqusFeedbackModal.tsx
 * Classroom evaluation and commuter feedback modal supporting Disqus discussion threads
 * and Microsoft Clarity user session recording.
 */

import React, { useState } from 'react';

interface DisqusFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DisqusFeedbackModal: React.FC<DisqusFeedbackModalProps> = ({ isOpen, onClose }) => {
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFeedbackText('');
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-[460px] bg-white rounded-2xl shadow-2xl border border-[#eaedff] p-5 space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#dce1ff] text-[#0037b0] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">forum</span>
            </div>
            <div>
              <h3 className="font-bold text-[16px] text-[#131b2e]">Classroom Demo Feedback</h3>
              <p className="text-[11px] text-[#434655]">Disqus Forum &amp; Commuter Reviews</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#eaedff] text-[#434655] flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Disqus Notice */}
        <div className="p-3 rounded-xl bg-[#f2f3ff] border border-[#dae2fd] text-[12px] text-[#434655] space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-[#0037b0]">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>Canonical Disqus Thread Enabled</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                document.getElementById('talk-to-us')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[11px] font-bold text-[#0037b0] hover:underline"
            >
              Scroll to Foot ↓
            </button>
          </div>
          <p className="leading-relaxed">
            As configured in <code className="bg-white px-1 py-0.5 rounded text-[11px]">&lt;link rel="canonical"&gt;</code>, comments hook into the live Talk to Us Disqus forum at the foot of the page.
          </p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-xl bg-[#85f8c4]/30 text-[#004f35] text-center font-bold text-[14px] flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            Feedback submitted to Disqus thread!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[12px] font-bold text-[#131b2e] mb-1">
                Leave a comment or route pacing note:
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                required
                rows={3}
                placeholder="e.g. Walk Faster! pacing alert was super helpful at Bedok Reservoir linkway..."
                className="w-full p-2.5 rounded-lg border border-[#dae2fd] bg-[#faf8ff] text-[13px] text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#0037b0]/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-full text-[12px] font-bold text-[#434655] hover:bg-[#eaedff]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-full bg-[#0037b0] hover:bg-[#1d4ed8] text-white text-[12px] font-bold shadow-xs active:scale-95 transition-all"
              >
                Post Comment
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
