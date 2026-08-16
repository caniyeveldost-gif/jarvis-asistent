import React from 'react';
import { Mic, MicOff, Volume2, Sparkles, Loader2, Square, Gift } from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';

interface JarvisCoreProps {
  isListening: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
  transcript: string;
  onMicClick: () => void;
  onStopSpeaking: () => void;
  statusText: string;
  errorMessage?: string | null;
  isLimitReached?: boolean;
  onWatchAdClick?: () => void;
}

export const JarvisCore: React.FC<JarvisCoreProps> = ({
  isListening,
  isThinking,
  isSpeaking,
  transcript,
  onMicClick,
  onStopSpeaking,
  statusText,
  errorMessage,
  isLimitReached = false,
  onWatchAdClick,
}) => {
  // Determine state type
  const stateType: 'listening' | 'speaking' | 'thinking' | 'idle' = isListening
    ? 'listening'
    : isThinking
    ? 'thinking'
    : isSpeaking
    ? 'speaking'
    : 'idle';

  return (
    <div className="relative flex flex-col items-center justify-center pt-2 pb-6 px-4">
      {/* Background ambient glow effect */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isListening
            ? 'bg-cyan-500/25 scale-125'
            : isThinking
            ? 'bg-amber-500/20 scale-110'
            : isSpeaking
            ? 'bg-blue-600/30 scale-125'
            : 'bg-cyan-900/15 scale-90'
        }`}
      />

      {/* Main Circular Arc Reactor Centerpiece */}
      <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
        {/* Outer Rotating HUD Ring 1 */}
        <div
          className={`absolute inset-0 rounded-full border border-dashed border-cyan-500/30 transition-all duration-1000 ${
            isListening || isSpeaking ? 'animate-spin-slow border-cyan-400/60' : 'animate-spin-slow opacity-40'
          }`}
        />

        {/* Outer Rotating HUD Ring 2 (Counter Clockwise with dashes) */}
        <div
          className={`absolute inset-2 sm:inset-3 rounded-full border border-dotted border-cyan-400/40 transition-all duration-700 ${
            isThinking ? 'animate-spin-reverse-slow border-amber-400/70' : 'animate-spin-reverse-slow opacity-50'
          }`}
        />

        {/* Pulse Ripple Rings when Listening or Speaking */}
        {(isListening || isSpeaking) && (
          <>
            <div className="absolute inset-0 rounded-full bg-cyan-500/15 animate-ping opacity-60 pointer-events-none" />
            <div className="absolute -inset-4 rounded-full border border-cyan-400/30 animate-pulse-ring pointer-events-none" />
          </>
        )}

        {/* Inner Glowing Reactor Ring */}
        <div
          className={`absolute inset-6 sm:inset-7 rounded-full transition-all duration-500 flex items-center justify-center ${
            isListening
              ? 'bg-gradient-to-tr from-cyan-950/80 via-cyan-900/40 to-emerald-950/80 border-2 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.6)]'
              : isThinking
              ? 'bg-gradient-to-tr from-amber-950/80 via-slate-900/60 to-cyan-950/80 border-2 border-amber-400/80 shadow-[0_0_30px_rgba(251,191,36,0.4)]'
              : isSpeaking
              ? 'bg-gradient-to-tr from-blue-950/90 via-cyan-900/50 to-indigo-950/90 border-2 border-cyan-300 shadow-[0_0_40px_rgba(56,189,248,0.7)]'
              : 'bg-gradient-to-tr from-slate-950/90 via-slate-900/70 to-cyan-950/60 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
          }`}
        >
          {/* Central Interactive Mic/Control Button */}
          <button
            onClick={isSpeaking ? onStopSpeaking : onMicClick}
            disabled={isThinking}
            aria-label={isListening ? 'Danışığı dayandır' : 'Danışmağa başla'}
            className={`group relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer disabled:cursor-not-allowed ${
              isListening
                ? 'bg-gradient-to-b from-cyan-400 to-cyan-600 text-slate-950 shadow-[0_0_30px_rgba(6,182,212,0.8)]'
                : isSpeaking
                ? 'bg-gradient-to-b from-rose-500 to-red-600 text-white shadow-[0_0_25px_rgba(239,68,68,0.6)]'
                : isThinking
                ? 'bg-slate-800/90 text-amber-300 border border-amber-500/40 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                : 'bg-gradient-to-b from-cyan-500/20 to-slate-900 text-cyan-400 hover:text-cyan-200 border border-cyan-400/40 hover:border-cyan-300 hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]'
            }`}
          >
            {isListening ? (
              <>
                <Mic className="w-9 h-9 sm:w-11 sm:h-11 animate-pulse" />
                <span className="text-[10px] font-bold tracking-wider uppercase mt-1 font-tech">
                  DAYANDIR
                </span>
              </>
            ) : isSpeaking ? (
              <>
                <Square className="w-8 h-8 sm:w-9 sm:h-9 fill-current" />
                <span className="text-[10px] font-bold tracking-wider uppercase mt-1 font-tech">
                  SUS
                </span>
              </>
            ) : isThinking ? (
              <>
                <Loader2 className="w-9 h-9 sm:w-10 sm:h-10 animate-spin" />
                <span className="text-[10px] font-medium tracking-wider uppercase mt-1 font-tech">
                  ANALİZ...
                </span>
              </>
            ) : (
              <>
                <Mic className="w-10 h-10 sm:w-11 sm:h-11 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold tracking-widest uppercase mt-1 font-tech opacity-90">
                  DANIŞ
                </span>
              </>
            )}
          </button>
        </div>

        {/* Small corner tech HUD markers */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[9px] font-tech text-cyan-400/50 tracking-widest">
          SYS.V3.7
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] font-tech text-cyan-400/50 tracking-widest">
          AI CORE
        </div>
      </div>

      {/* Dynamic Status Indicator Badge */}
      <div className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-cyan-500/30">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            isListening
              ? 'bg-emerald-400 animate-ping'
              : isThinking
              ? 'bg-amber-400 animate-pulse'
              : isSpeaking
              ? 'bg-cyan-400 animate-pulse'
              : 'bg-cyan-600'
          }`}
        />
        <span className="text-xs sm:text-sm font-tech font-semibold tracking-wider text-cyan-200">
          {statusText}
        </span>
      </div>

      {/* Audio Visualizer Waveform */}
      <div className="w-full mt-2">
        <AudioVisualizer
          isActive={isListening || isSpeaking || isThinking}
          type={stateType}
          barCount={28}
        />
      </div>

      {/* Live Interim / Final Speech Transcript Display */}
      {transcript && isListening && (
        <div className="mt-2 w-full max-w-md px-4 py-3 rounded-xl glass-panel-glow border border-cyan-400/50 text-center animate-fade-in">
          <div className="text-[11px] uppercase tracking-wider font-tech text-cyan-400 mb-1 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" /> Nitq aşkarlanır:
          </div>
          <p className="text-sm sm:text-base font-medium text-white italic line-clamp-2">
            "{transcript}"
          </p>
        </div>
      )}

      {/* Error Message banner if any */}
      {errorMessage && (
        <div className="mt-3 w-full max-w-md px-4 py-2.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs sm:text-sm text-center">
          {errorMessage}
        </div>
      )}

      {/* Rewarded Ad Action Button when Limit is Reached */}
      {isLimitReached && onWatchAdClick && (
        <div className="mt-3.5 w-full max-w-md flex flex-col items-center animate-fade-in">
          <button
            onClick={onWatchAdClick}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-slate-950 font-tech font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(245,158,11,0.6)] cursor-pointer active:scale-98 animate-pulse hover:animate-none"
          >
            <Gift className="w-4 h-4 text-slate-950" />
            <span>Reklam izlə, 2 sual da qazan</span>
            <Sparkles className="w-4 h-4 text-slate-950" />
          </button>
          <span className="text-[10px] text-amber-300/80 font-mono mt-1.5">
            15 saniyəlik qısa reklam izləyərək əlavə sual balansınızı artırın
          </span>
        </div>
      )}
    </div>
  );
};
