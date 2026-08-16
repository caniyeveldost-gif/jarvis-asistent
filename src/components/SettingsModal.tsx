import React from 'react';
import { X, Volume2, Sliders, Globe, Sparkles, Bot } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  geminiVoice: string;
  onGeminiVoiceChange: (voice: string) => void;
  soundFXEnabled: boolean;
  onToggleSoundFX: (enabled: boolean) => void;
  autoSpeak: boolean;
  onToggleAutoSpeak: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  onLanguageChange,
  geminiVoice,
  onGeminiVoiceChange,
  soundFXEnabled,
  onToggleSoundFX,
  autoSpeak,
  onToggleAutoSpeak,
}) => {
  if (!isOpen) return null;

  const languages = [
    { code: 'az-AZ', label: 'Azərbaycan dili (az-AZ)', flag: '🇦🇿' },
    { code: 'tr-TR', label: 'Türkçe (tr-TR)', flag: '🇹🇷' },
    { code: 'en-US', label: 'English (en-US)', flag: '🇺🇸' },
    { code: 'ru-RU', label: 'Русский (ru-RU)', flag: '🇷🇺' },
  ];

  const geminiVoices = [
    { id: 'Kore', name: 'Kore (İntellektual & Təbii)', gender: 'Qadın səsi' },
    { id: 'Zephyr', name: 'Zephyr (Dərin & Jarvis tərzi)', gender: 'Kişi səsi' },
    { id: 'Puck', name: 'Puck (Cəld & Dinamik)', gender: 'Kişi səsi' },
    { id: 'Fenrir', name: 'Fenrir (Güclü & Aydın)', gender: 'Kişi səsi' },
    { id: 'Charon', name: 'Charon (Rəsmi & Sakit)', gender: 'Kişi səsi' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl glass-panel-glow border border-cyan-500/40 p-6 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base sm:text-lg font-tech font-bold text-cyan-200">
              SİSTEM TƏNZİMLƏMƏLƏRİ
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Bağla"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-5">
          {/* Language Selection */}
          <div>
            <label className="text-xs font-tech font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Globe className="w-3.5 h-3.5" /> Danışıq Dili (Nitq Tanıma)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onLanguageChange(lang.code)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all text-left cursor-pointer ${
                    language === lang.code
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="truncate">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Gemini AI Voice Selection */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <label className="text-xs font-tech font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Bot className="w-3.5 h-3.5 text-cyan-400" /> Gemini AI Səs Mühərriki
            </label>
            <div className="space-y-1.5">
              {geminiVoices.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onGeminiVoiceChange(v.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all text-left cursor-pointer ${
                    geminiVoice === v.id
                      ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="font-medium">{v.name}</div>
                  <div className="text-[11px] text-cyan-400/80 font-mono">{v.gender}</div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              ✨ Audio birbaşa Gemini AI tərəfindən generasiya olunur və telefonda qüsursuz səslənir.
            </p>
          </div>

          {/* Auto Readout Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <div className="text-xs sm:text-sm font-medium text-slate-200">
                Avtomatik Səsli Oxuma (AI Voice)
              </div>
              <div className="text-[11px] text-slate-400">
                Cavab gələndə Gemini AI səsi ilə dərhal oxunsun
              </div>
            </div>
            <button
              onClick={() => onToggleAutoSpeak(!autoSpeak)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer ${
                autoSpeak ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Sound FX Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <div className="text-xs sm:text-sm font-medium text-slate-200">
                Sci-Fi Səs Effektləri
              </div>
              <div className="text-[11px] text-slate-400">
                Jarvis aktivləşmə və hazırlıq siqnalları
              </div>
            </div>
            <button
              onClick={() => onToggleSoundFX(!soundFXEnabled)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer ${
                soundFXEnabled ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-cyan-500/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-tech font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
          >
            Yadda Saxla & Bağla
          </button>
        </div>
      </div>
    </div>
  );
};
