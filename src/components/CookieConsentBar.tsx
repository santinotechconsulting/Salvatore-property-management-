import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Lock, ShieldCheck, X } from 'lucide-react';

export type CookiePreference = 'all' | 'essential';

interface CookieConsentBarProps {
  isOpen: boolean;
  currentPreference: CookiePreference | null;
  onSelectPreference: (pref: CookiePreference) => void;
  onDismiss: () => void;
}

export function CookieConsentBar({
  isOpen,
  currentPreference,
  onSelectPreference,
  onDismiss,
}: CookieConsentBarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          aria-label="Cookie and Privacy Preferences"
          className="fixed left-4 bottom-[max(1rem,env(safe-area-inset-bottom))] sm:left-6 sm:bottom-6 z-40 w-[calc(100vw-6rem)] sm:w-[360px] bg-[#091526] text-slate-200 border border-[#243E63] rounded-xl shadow-2xl p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F4D27A]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Privacy &amp; Cookie Notice</span>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Close cookie preferences"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#132642] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
            This site runs over encrypted HTTPS/SSL and uses zero advertising cookies—only essential local storage for your viewing preferences and Google Maps hub loading.
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#1A2F4D]">
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>{currentPreference === 'essential' ? 'Essential only' : 'SSL Secured'}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectPreference('essential')}
                className="px-2.5 py-1.5 text-[11px] font-medium text-slate-200 border border-[#2B466D] rounded-lg hover:bg-[#132642] transition-colors cursor-pointer"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={() => onSelectPreference('all')}
                className="px-3 py-1.5 text-[11px] font-semibold text-[#091526] bg-[#F4D27A] rounded-lg hover:bg-[#F7DE99] transition-colors cursor-pointer"
              >
                Accept All
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
