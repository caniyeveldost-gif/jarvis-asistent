import React, { useState } from 'react';
import { Volume2, VolumeX, Copy, Check, User, Bot, Trash2, Sparkles, Loader2 } from 'lucide-react';

export interface ChatItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  audio?: string | null;
  mimeType?: string | null;
}

interface ChatHistoryProps {
  messages: ChatItem[];
  currentPlayingId: string | null;
  onPlaySpeech: (id: string, text: string, audio?: string | null, mimeType?: string | null) => void;
  onStopSpeech: () => void;
  onClearHistory: () => void;
  onSelectSuggestion?: (query: string) => void;
  isAudioLoading?: string | null;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  messages,
  currentPlayingId,
  onPlaySpeech,
  onStopSpeech,
  onClearHistory,
  onSelectSuggestion,
  isAudioLoading,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const starterSuggestions = [
    'Salam Jarvis, necəsən?',
    'Bugün hava haqqında nə deyə bilərsən?',
    'Kainat haqqında maraqlı bir fakt de',
    'Mənə iş üçün motivasiya ver',
  ];

  if (messages.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-4 px-4 py-8 rounded-2xl glass-panel text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <Bot className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-tech font-bold text-cyan-200">JARVIS Gözləmə Rejimindədir</h3>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
          Yuxarıdakı böyük mikrofon düyməsinə toxunaraq sualınızı verin və ya aşağıdakı nümunələrdən birini seçin:
        </p>

        {onSelectSuggestion && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {starterSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => onSelectSuggestion(s)}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-cyan-950/80 border border-cyan-500/20 hover:border-cyan-400 text-slate-300 hover:text-cyan-200 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-2">
      {/* Header of History */}
      <div className="flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-xs sm:text-sm font-tech uppercase tracking-widest text-cyan-300">
            Danışıq Tarixçəsi ({messages.length})
          </h2>
        </div>

        <button
          onClick={onClearHistory}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-300 px-2.5 py-1 rounded-md hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Təmizlə</span>
        </button>
      </div>

      {/* Messages List */}
      <div className="space-y-3 pb-24">
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          const isPlaying = currentPlayingId === msg.id;
          const isLoadingAudio = isAudioLoading === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col rounded-2xl p-4 transition-all ${
                isAssistant
                  ? 'glass-panel-glow border-l-4 border-l-cyan-400 text-slate-100'
                  : 'bg-slate-900/70 border border-slate-800 border-r-4 border-r-indigo-400 text-slate-200 ml-4'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isAssistant
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40'
                    }`}
                  >
                    {isAssistant ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-tech font-bold tracking-wide">
                    {isAssistant ? 'J.A.R.V.I.S. (Gemini AI)' : 'SİZ'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>

                  {/* Actions for assistant message (read aloud via Gemini AI audio, copy) */}
                  {isAssistant && (
                    <button
                      onClick={() =>
                        isPlaying
                          ? onStopSpeech()
                          : onPlaySpeech(msg.id, msg.text, msg.audio, msg.mimeType)
                      }
                      disabled={isLoadingAudio}
                      title={isPlaying ? 'Səsi dayandır' : 'Gemini AI səsi ilə oxu'}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                          : 'bg-slate-800/80 text-cyan-300 border-cyan-500/30 hover:bg-cyan-950 hover:border-cyan-400'
                      }`}
                    >
                      {isLoadingAudio ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      ) : isPlaying ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    title="Mətni kopyala"
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 transition-all cursor-pointer"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Message Content */}
              <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
