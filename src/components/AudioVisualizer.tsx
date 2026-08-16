import React from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  type: 'listening' | 'speaking' | 'thinking' | 'idle';
  barCount?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isActive,
  type,
  barCount = 24,
}) => {
  const getBarColor = (index: number) => {
    if (type === 'listening') {
      // Emerald to Cyan gradient
      return index % 2 === 0 ? 'bg-cyan-400' : 'bg-emerald-400';
    }
    if (type === 'thinking') {
      // Amber to Cyan
      return index % 2 === 0 ? 'bg-amber-400' : 'bg-cyan-400';
    }
    if (type === 'speaking') {
      // Electric Blue & Cyan
      return index % 3 === 0 ? 'bg-blue-400' : index % 3 === 1 ? 'bg-cyan-300' : 'bg-indigo-400';
    }
    return 'bg-cyan-900/40';
  };

  return (
    <div className="flex items-center justify-center gap-[3px] h-12 px-4 py-2 w-full max-w-sm mx-auto">
      {Array.from({ length: barCount }).map((_, i) => {
        // Calculate variable heights based on wave curve
        const centerDistance = Math.abs(i - barCount / 2) / (barCount / 2);
        const factor = 1 - centerDistance * 0.4;
        
        const delayStr = `${(i * 0.07).toFixed(2)}s`;
        const durationStr = type === 'speaking' ? '0.7s' : type === 'listening' ? '0.5s' : '1.2s';

        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-200 ${getBarColor(i)} ${
              isActive ? 'shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'opacity-30'
            }`}
            style={{
              height: isActive ? `${Math.max(12, Math.floor(factor * 100))}%` : '15%',
              animationName: isActive ? 'equalizer' : 'none',
              animationDuration: durationStr,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDirection: 'alternate',
              animationDelay: delayStr,
            }}
          />
        );
      })}
    </div>
  );
};
