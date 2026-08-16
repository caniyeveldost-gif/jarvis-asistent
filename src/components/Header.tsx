import React, { useState, useEffect } from 'react';
import { Cpu, Settings, Volume2, Globe, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  language: string;
  isSpeaking: boolean;
  soundEffectsEnabled: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  language,
  isSpeaking,
  soundEffectsEnabled,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const getLangLabel = (code: string) => {
    if (code.startsWith('az')) return 'AZE';
    if (code.startsWith('tr')) return 'TUR';
    if (code.startsWith('en')) return 'ENG';
    if (code.startsWith('ru')) return 'RUS';
    return code.substring(0, 3).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-cyan-500/20 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Left: Jarvis Logo & System Status */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-tech text-base sm:text-lg font-bold tracking-widest text-cyan-300">
                J.A.R.V.I.S.
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-400 font-mono">
                AI 3.7
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider font-mono hidden sm:block">
              SƏSLİ İNTELLEKT SİSTEMİ
            </p>
          </div>
        </div>

        {/* Right: Controls & Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real-time Clock */}
          <div className="hidden sm:flex items-center gap-1 font-mono text-xs text-cyan-400/80 px-2 py-1 rounded bg-slate-950/60 border border-cyan-500/20">
            <span>{timeStr}</span>
          </div>

          {/* Current Language Badge */}
          <button
            onClick={onOpenSettings}
            title="Dili dəyiş"
            className="flex items-center gap-1 text-xs font-tech px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{getLangLabel(language)}</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            aria-label="Tənzimləmələr"
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
