import React, { useState } from 'react';
import { Send, Mic, Sparkles } from 'lucide-react';

interface ManualInputBarProps {
  onSendMessage: (text: string) => void;
  onMicClick: () => void;
  isListening: boolean;
  isThinking: boolean;
}

export const ManualInputBar: React.FC<ManualInputBarProps> = ({
  onSendMessage,
  onMicClick,
  isListening,
  isThinking,
}) => {
  const [inputVal, setInputVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isThinking) return;
    onSendMessage(inputVal.trim());
    setInputVal('');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-[#050811]/90 backdrop-blur-md border-t border-cyan-500/20">
      <div className="max-w-2xl mx-auto flex items-center gap-2">
        {/* Quick Mic Button on mobile bottom bar */}
        <button
          type="button"
          onClick={onMicClick}
          disabled={isThinking}
          title={isListening ? 'Danışığı bitir' : 'Səslə danış'}
          className={`p-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
            isListening
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.6)]'
              : 'bg-slate-900 text-cyan-400 border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-800'
          }`}
        >
          <Mic className="w-5 h-5" />
        </button>

        {/* Text Input Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Və ya bura sualınızı yazın..."
            disabled={isThinking}
            className="w-full text-xs sm:text-sm px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:outline-none text-slate-100 placeholder-slate-500 transition-all shadow-inner"
          />

          <button
            type="submit"
            disabled={!inputVal.trim() || isThinking}
            aria-label="Göndər"
            className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
