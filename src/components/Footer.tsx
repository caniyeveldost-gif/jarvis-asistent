import React from 'react';
import { ShieldCheck, Info, Mail, Cpu, Sparkles } from 'lucide-react';
import { InfoModalTab } from './InfoModal';

interface FooterProps {
  onOpenInfo: (tab: InfoModalTab) => void;
  remainingRequests?: number | null;
  maxDailyRequests?: number;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenInfo,
  remainingRequests,
  maxDailyRequests = 5,
}) => {
  return (
    <footer className="w-full mt-auto border-t border-cyan-500/10 bg-[#04060e]/80 backdrop-blur-md px-4 py-4 z-30">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Left: Brand & Rate Limit Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-cyan-400 font-tech font-bold tracking-wider">
            <Cpu className="w-3.5 h-3.5" />
            <span>JARVIS AI</span>
          </div>

          {remainingRequests !== undefined && remainingRequests !== null && (
            <div
              className={`flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full border ${
                remainingRequests > 0
                  ? 'bg-cyan-950/50 border-cyan-500/30 text-cyan-300'
                  : 'bg-rose-950/50 border-rose-500/30 text-rose-300'
              }`}
              title="Gündəlik sual limiti"
            >
              <Sparkles className="w-3 h-3" />
              <span>
                Gündəlik limit: {remainingRequests}/{maxDailyRequests}
              </span>
            </div>
          )}
        </div>

        {/* Center/Right: Static Page Links (Haqqında, Məxfilik Siyasəti, Əlaqə) */}
        <div className="flex items-center gap-4 text-slate-400 font-medium">
          <button
            onClick={() => onOpenInfo('about')}
            className="hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Haqqında</span>
          </button>

          <span className="text-slate-700">|</span>

          <button
            onClick={() => onOpenInfo('privacy')}
            className="hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Məxfilik Siyasəti</span>
          </button>

          <span className="text-slate-700">|</span>

          <button
            onClick={() => onOpenInfo('contact')}
            className="hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Əlaqə</span>
          </button>
        </div>

        {/* Right: Copyright */}
        <div className="text-[11px] text-slate-500 font-mono">
          © {new Date().getFullYear()} JARVIS Səsli Köməkçi
        </div>
      </div>
    </footer>
  );
};
