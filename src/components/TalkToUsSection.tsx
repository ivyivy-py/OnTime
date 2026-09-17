/**
 * @file TalkToUsSection.tsx
 * "Talk to Us" community feedback & discussion section embedded at the foot of the page.
 * Integrates official Disqus thread with fixed canonical page.url and page.identifier.
 */

import React, { useEffect } from 'react';

declare global {
  interface Window {
    disqus_config?: () => void;
    DISQUS?: {
      reset: (options: { reload: boolean; config?: () => void }) => void;
    };
  }
}

export const TalkToUsSection: React.FC = () => {
  const PAGE_URL = 'https://ais-pre-mm4kkyltreb22cnzmuclfh-682905196571.asia-southeast1.run.app';
  const PAGE_IDENTIFIER = 'ontime-sg-talk-to-us';

  useEffect(() => {
    try {
      // Ensure container exists before initializing Disqus
      const threadContainer = document.getElementById('disqus_thread');
      if (!threadContainer) return;

      // Configure fixed canonical URL and unique identifier if not already defined
      if (!window.disqus_config) {
        window.disqus_config = function (this: any) {
          try {
            const ctx = this || window;
            ctx.page = ctx.page || {};
            ctx.page.url = PAGE_URL;
            ctx.page.identifier = PAGE_IDENTIFIER;
          } catch (err) {
            console.warn('disqus_config internal guard:', err);
          }
        };
      }

      if (window.DISQUS && typeof window.DISQUS.reset === 'function') {
        // Safe SPA reset with dedicated config function
        window.DISQUS.reset({
          reload: true,
          config: function (this: any) {
            try {
              const ctx = this || window;
              ctx.page = ctx.page || {};
              ctx.page.url = PAGE_URL;
              ctx.page.identifier = PAGE_IDENTIFIER;
            } catch (err) {
              console.warn('disqus reset config error:', err);
            }
          },
        });
      } else {
        // Inject the official Disqus embed script
        const d = document;
        const existingScript = document.getElementById('disqus-embed-script');
        if (!existingScript) {
          const s = d.createElement('script');
          s.id = 'disqus-embed-script';
          s.src = 'https://ontime-2.disqus.com/embed.js';
          s.setAttribute('data-timestamp', String(+new Date()));
          s.async = true;
          s.onerror = (e) => {
            console.warn('Disqus embed script load failed (handled):', e);
          };
          (d.head || d.body).appendChild(s);
        }
      }
    } catch (err) {
      console.warn('Disqus initialization caught error:', err);
    }
  }, []);

  return (
    <section
      id="talk-to-us"
      className="w-full mt-8 sm:mt-12 rounded-2xl bg-white border border-[#eaedff] p-5 sm:p-8 shadow-sm transition-all"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-[#eaedff]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#dce1ff] text-[#0037b0] flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[22px]">forum</span>
          </div>
          <div>
            <h2 className="font-extrabold text-[18px] sm:text-[20px] text-[#131b2e] tracking-tight">
              Talk to Us
            </h2>
            <p className="text-[12px] sm:text-[13px] text-[#434655]">
              Share your commuter feedback, route suggestions, or live class demo notes.
            </p>
          </div>
        </div>

        {/* Live Discussion Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#85f8c4] text-[#002114] text-[11px] font-extrabold">
            <span className="w-2 h-2 rounded-full bg-[#004f35] animate-pulse"></span>
            Disqus Live Forum
          </span>
        </div>
      </div>

      {/* Disqus Thread Container */}
      <div className="min-h-[220px] w-full">
        <div id="disqus_thread" className="w-full"></div>
        <noscript>
          Please enable JavaScript to view the{' '}
          <a
            href="https://disqus.com/?ref_noscript"
            rel="nofollow noopener noreferrer"
            className="text-[#0037b0] underline"
          >
            comments powered by Disqus.
          </a>
        </noscript>
      </div>

      {/* Footer Note */}
      <div className="mt-4 pt-3 border-t border-[#f2f3ff] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#434655]">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-[#0037b0]">verified</span>
          Verified Thread: <code className="bg-[#f2f3ff] px-1.5 py-0.5 rounded font-mono text-[10px] text-[#131b2e]">{PAGE_IDENTIFIER}</code>
        </span>
        <span className="opacity-80">
          Powered by ontime-2.disqus.com
        </span>
      </div>
    </section>
  );
};
