/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { JarvisCore } from './components/JarvisCore';
import { ChatHistory, ChatItem } from './components/ChatHistory';
import { SettingsModal } from './components/SettingsModal';
import { ManualInputBar } from './components/ManualInputBar';
import { Footer } from './components/Footer';
import { InfoModal, InfoModalTab } from './components/InfoModal';
import { AdsterraBanner } from './components/AdsterraBanner';
import { RewardedAdModal } from './components/RewardedAdModal';
import { voiceRecognizer } from './utils/speechRecognition';
import { geminiAudioPlayer } from './utils/geminiAudioPlayer';
import { ttsManager } from './utils/speechSynthesis';
import { soundFX } from './utils/audioEffects';

// Helper to get or generate persistent browser Client ID
export function getOrCreateClientId(): string {
  try {
    let id = localStorage.getItem('jarvis_client_id');
    if (!id) {
      id = 'usr_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
      localStorage.setItem('jarvis_client_id', id);
    }
    return id;
  } catch {
    return 'default_client';
  }
}

export default function App() {
  // Application State
  const [messages, setMessages] = useState<ChatItem[]>(() => {
    try {
      const saved = localStorage.getItem('jarvis_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isListening, setIsListening] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [statusText, setStatusText] = useState<string>('SİSTEM HAZIRDIR');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Rate Limiting & Rewarded state
  const [remainingRequests, setRemainingRequests] = useState<number | null>(() => {
    try {
      const savedDate = localStorage.getItem('jarvis_limit_date');
      const today = new Date().toISOString().slice(0, 10);
      if (savedDate === today) {
        const count = localStorage.getItem('jarvis_remaining_requests');
        return count !== null ? Number(count) : 5;
      }
      return 5;
    } catch {
      return 5;
    }
  });

  const [maxDailyRequests, setMaxDailyRequests] = useState<number>(() => {
    try {
      const savedLimit = localStorage.getItem('jarvis_max_daily_limit');
      return savedLimit ? Number(savedLimit) : 5;
    } catch {
      return 5;
    }
  });

  // Settings & Info Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [infoModalTab, setInfoModalTab] = useState<InfoModalTab>('about');
  const [isRewardModalOpen, setIsRewardModalOpen] = useState<boolean>(false);

  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('jarvis_lang') || 'az-AZ';
  });
  const [geminiVoice, setGeminiVoice] = useState<string>(() => {
    return localStorage.getItem('jarvis_gemini_voice') || 'Kore';
  });
  const [soundFXEnabled, setSoundFXEnabled] = useState<boolean>(() => {
    return localStorage.getItem('jarvis_sound_fx') !== 'false';
  });
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    return localStorage.getItem('jarvis_auto_speak') !== 'false';
  });

  const historyEndRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition & Gemini Audio listener & Server Limit sync
  useEffect(() => {
    voiceRecognizer.setLanguage(language);
    soundFX.enabled = soundFXEnabled;

    geminiAudioPlayer.onStateChange((playing) => {
      setIsSpeaking(playing);
      if (!playing) {
        setCurrentPlayingId(null);
        if (!isListening && !isThinking) {
          setStatusText('SİSTEM HAZIRDIR');
        }
      }
    });

    // Synchronize limit status with server on mount
    const clientId = getOrCreateClientId();
    fetch(`/api/reward?clientId=${encodeURIComponent(clientId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && typeof data.remaining === 'number') {
          setRemainingRequests(data.remaining);
          if (typeof data.limit === 'number') {
            setMaxDailyRequests(data.limit);
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to sync rate limit with server:', err);
      });

    // Welcome chime on initial mount
    const timer = setTimeout(() => {
      if (soundFXEnabled) {
        soundFX.playActivation();
      }
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('jarvis_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat history:', e);
    }
  }, [messages]);

  // Save remaining requests and max limit state
  useEffect(() => {
    if (remainingRequests !== null) {
      try {
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem('jarvis_limit_date', today);
        localStorage.setItem('jarvis_remaining_requests', String(remainingRequests));
        localStorage.setItem('jarvis_max_daily_limit', String(maxDailyRequests));
      } catch (e) {
        console.warn('Failed to save limit state:', e);
      }
    }
  }, [remainingRequests, maxDailyRequests]);

  // Handle language change for speech recognition
  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    voiceRecognizer.setLanguage(newLang);
    localStorage.setItem('jarvis_lang', newLang);
  };

  // Handle Gemini Voice change
  const handleGeminiVoiceChange = (voice: string) => {
    setGeminiVoice(voice);
    localStorage.setItem('jarvis_gemini_voice', voice);
  };

  // Handle sound FX toggle
  const handleToggleSoundFX = (enabled: boolean) => {
    setSoundFXEnabled(enabled);
    soundFX.enabled = enabled;
    localStorage.setItem('jarvis_sound_fx', enabled.toString());
  };

  // Handle Auto-Speak toggle
  const handleToggleAutoSpeak = (enabled: boolean) => {
    setAutoSpeak(enabled);
    localStorage.setItem('jarvis_auto_speak', enabled.toString());
  };

  // Open specific Info Modal tab (Haqqında / Məxfilik / Əlaqə)
  const handleOpenInfoModal = (tab: InfoModalTab) => {
    setInfoModalTab(tab);
    setIsInfoModalOpen(true);
  };

  // Stop currently playing audio
  const handleStopSpeaking = () => {
    geminiAudioPlayer.stop();
    ttsManager.stop();
    setIsSpeaking(false);
    setCurrentPlayingId(null);
    setStatusText('SİSTEM HAZIRDIR');
  };

  // Handle Reward Claimed after watching Adsterra Ad
  const handleRewardClaimed = (newRemaining: number, newLimit: number) => {
    setRemainingRequests(newRemaining);
    setMaxDailyRequests(newLimit);
    setErrorMessage(null);
    setStatusText('SİSTEM HAZIRDIR (+5 SUAL ƏLAVƏ EDİLDİ)');
    if (soundFXEnabled) {
      soundFX.playActivation();
    }
  };

  // Play a specific message audio using Gemini AI Voice (or TTS fallback)
  const handlePlaySpeech = async (
    id: string,
    text: string,
    cachedAudio?: string | null,
    cachedMimeType?: string | null
  ) => {
    geminiAudioPlayer.stop();
    ttsManager.stop();
    setCurrentPlayingId(id);
    setStatusText('SƏSLƏNDİRİLİR...');

    // 1. If audio is already cached in the message
    if (cachedAudio) {
      await geminiAudioPlayer.playBase64Audio(
        cachedAudio,
        cachedMimeType || 'audio/pcm;rate=24000',
        () => {
          setIsSpeaking(true);
        },
        () => {
          setIsSpeaking(false);
          setCurrentPlayingId(null);
          setStatusText('SİSTEM HAZIRDIR');
        },
        (err) => {
          console.warn('Gemini audio playback error, falling back to TTS:', err);
          ttsManager.speak(
            text,
            'tr-TR',
            () => setIsSpeaking(true),
            () => {
              setIsSpeaking(false);
              setCurrentPlayingId(null);
              setStatusText('SİSTEM HAZIRDIR');
            },
            () => {
              setIsSpeaking(false);
              setCurrentPlayingId(null);
              setStatusText('SİSTEM HAZIRDIR');
            }
          );
        }
      );
      return;
    }

    // 2. Otherwise fetch audio on demand from /api/tts with the exact same voice
    setAudioLoadingId(id);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: geminiVoice || 'Kore' }),
      });

      if (!response.ok) {
        throw new Error('Audio alına bilmədi.');
      }

      const data = await response.json();
      setAudioLoadingId(null);

      if (data.audio) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, audio: data.audio, mimeType: data.mimeType } : m
          )
        );

        await geminiAudioPlayer.playBase64Audio(
          data.audio,
          data.mimeType || 'audio/pcm;rate=24000',
          () => {
            setIsSpeaking(true);
          },
          () => {
            setIsSpeaking(false);
            setCurrentPlayingId(null);
            setStatusText('SİSTEM HAZIRDIR');
          },
          () => {
            setIsSpeaking(false);
            setCurrentPlayingId(null);
            setStatusText('SİSTEM HAZIRDIR');
          }
        );
      } else {
        throw new Error('No audio in response');
      }
    } catch (err) {
      console.warn('Gemini audio playback error:', err);
      setAudioLoadingId(null);
      setIsSpeaking(false);
      setCurrentPlayingId(null);
      setStatusText('SİSTEM HAZIRDIR');
    }
  };

  // Process User Query with Gemini API (Text + Gemini AI Audio TTS + Rate limit check)
  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    setErrorMessage(null);
    setTranscript('');
    setIsListening(false);
    voiceRecognizer.stop();

    const clientId = getOrCreateClientId();

    // 1. Add User Message to History
    const userMsgId = `user_${Date.now()}`;
    const userTimestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newUserMessage: ChatItem = {
      id: userMsgId,
      role: 'user',
      text: queryText,
      timestamp: userTimestamp,
    };

    const priorHistory = messages.map((m) => ({ role: m.role, text: m.text }));
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    // 2. Set Thinking state
    setIsThinking(true);
    setStatusText('ANALİZ EDİLİR...');

    try {
      // 3. Call backend Gemini API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId,
        },
        body: JSON.stringify({
          message: queryText,
          history: priorHistory,
          language,
          voice: geminiVoice,
          clientId,
        }),
      });

      const data = await response.json().catch(() => ({}));

      // Check if rate limit reached (HTTP 429)
      if (response.status === 429) {
        setRemainingRequests(0);
        setIsThinking(false);
        setStatusText('LİMİT BİTDİ');
        const limitMsg = data.error || 'Gündəlik limitiniz bitib, sabah yenidən cəhd edin';
        setErrorMessage(limitMsg);
        if (soundFXEnabled) soundFX.playError();
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Server cavab vermədi.');
      }

      // Update remaining requests and limit from server response
      if (typeof data.remaining === 'number') {
        setRemainingRequests(data.remaining);
      }
      if (typeof data.limit === 'number') {
        setMaxDailyRequests(data.limit);
      }

      const replyText = data.reply || 'Cavab hazırlana bilmədi.';
      const audioBase64 = data.audio || null;
      const mimeType = data.mimeType || 'audio/pcm;rate=24000';

      // 4. Add Assistant Message to History
      const assistantMsgId = `asst_${Date.now()}`;
      const asstTimestamp = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      const newAssistantMessage: ChatItem = {
        id: assistantMsgId,
        role: 'assistant',
        text: replyText,
        timestamp: asstTimestamp,
        audio: audioBase64,
        mimeType: mimeType,
      };

      setMessages((prev) => [...prev, newAssistantMessage]);
      setIsThinking(false);

      if (soundFXEnabled) {
        soundFX.playReady();
      }

      // 5. If autoSpeak is enabled, play Gemini AI Voice with consistent voice model
      if (autoSpeak) {
        setStatusText('CAVAB VERİLİR...');
        setCurrentPlayingId(assistantMsgId);

        let finalAudioBase64 = audioBase64;
        let finalMimeType = mimeType;

        // If audio was not attached in chat response, fetch it with the exact voice model
        if (!finalAudioBase64) {
          try {
            const ttsRes = await fetch('/api/tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: replyText, voice: geminiVoice || 'Kore' }),
            });
            if (ttsRes.ok) {
              const ttsData = await ttsRes.json();
              if (ttsData.audio) {
                finalAudioBase64 = ttsData.audio;
                finalMimeType = ttsData.mimeType || finalMimeType;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, audio: ttsData.audio, mimeType: ttsData.mimeType }
                      : m
                  )
                );
              }
            }
          } catch (e) {
            console.warn('Auto-TTS fetch error:', e);
          }
        }

        if (finalAudioBase64) {
          await geminiAudioPlayer.playBase64Audio(
            finalAudioBase64,
            finalMimeType,
            () => {
              setIsSpeaking(true);
            },
            () => {
              setIsSpeaking(false);
              setCurrentPlayingId(null);
              setStatusText('SİSTEM HAZIRDIR');
            },
            (err) => {
              console.warn('Gemini AI audio playback error:', err);
              setIsSpeaking(false);
              setCurrentPlayingId(null);
              setStatusText('SİSTEM HAZIRDIR');
            }
          );
        } else {
          setIsSpeaking(false);
          setCurrentPlayingId(null);
          setStatusText('SİSTEM HAZIRDIR');
        }
      } else {
        setStatusText('SİSTEM HAZIRDIR');
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setIsThinking(false);
      setStatusText('XƏTA BAŞ VERDİ');
      setErrorMessage(
        err?.message || 'Gemini ilə əlaqə yaradıla bilmədi. Zəhmət olmasa yenidən yoxlayın.'
      );
      if (soundFXEnabled) {
        soundFX.playError();
      }
    }
  };

  // Toggle Microphone Listening
  const handleToggleMic = () => {
    if (isSpeaking) {
      handleStopSpeaking();
    }

    if (isListening) {
      voiceRecognizer.stop();
      setIsListening(false);
      setStatusText('SİSTEM HAZIRDIR');
      if (soundFXEnabled) {
        soundFX.playDeactivate();
      }
      return;
    }

    setErrorMessage(null);
    setTranscript('');
    if (soundFXEnabled) {
      soundFX.playActivation();
    }

    voiceRecognizer.start(
      (result) => {
        setTranscript(result.transcript);
        if (result.isFinal && result.transcript.trim()) {
          handleSendQuery(result.transcript.trim());
        }
      },
      (error) => {
        setErrorMessage(error);
        setIsListening(false);
        setStatusText('XƏTA BAŞ VERDİ');
        if (soundFXEnabled) {
          soundFX.playError();
        }
      },
      (listeningState) => {
        setIsListening(listeningState);
        if (listeningState) {
          setStatusText('DİNLƏYİRƏM... DANIŞIN');
        } else if (!isThinking && !isSpeaking) {
          setStatusText('SİSTEM HAZIRDIR');
        }
      }
    );
  };

  // Clear Chat History
  const handleClearHistory = () => {
    geminiAudioPlayer.stop();
    ttsManager.stop();
    setMessages([]);
    localStorage.removeItem('jarvis_chat_history');
  };

  const isLimitReached = remainingRequests !== null && remainingRequests <= 0;

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col relative selection:bg-cyan-500 selection:text-black">
      {/* Top Futuristic Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        language={language}
        isSpeaking={isSpeaking}
        soundEffectsEnabled={soundFXEnabled}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-4 flex flex-col items-center pb-24">
        {/* Central Jarvis Orb & Big Microphone Button */}
        <JarvisCore
          isListening={isListening}
          isThinking={isThinking}
          isSpeaking={isSpeaking}
          transcript={transcript}
          onMicClick={handleToggleMic}
          onStopSpeaking={handleStopSpeaking}
          statusText={statusText}
          errorMessage={errorMessage}
          isLimitReached={isLimitReached}
          onWatchAdClick={() => setIsRewardModalOpen(true)}
        />

        {/* Reklam / Adsterra 300x250 Banner */}
        <AdsterraBanner />

        {/* Danışıq Tarixçəsi (Chat History) */}
        <ChatHistory
          messages={messages}
          currentPlayingId={currentPlayingId}
          isAudioLoading={audioLoadingId}
          onPlaySpeech={handlePlaySpeech}
          onStopSpeech={handleStopSpeaking}
          onClearHistory={handleClearHistory}
          onSelectSuggestion={(sugg) => handleSendQuery(sugg)}
        />

        <div ref={historyEndRef} />
      </main>

      {/* Bottom Manual Text / Quick Mic Input Bar */}
      <ManualInputBar
        onSendMessage={handleSendQuery}
        onMicClick={handleToggleMic}
        isListening={isListening}
        isThinking={isThinking}
      />

      {/* Footer with Static Page Links & Rate Limit Status */}
      <Footer
        onOpenInfo={handleOpenInfoModal}
        remainingRequests={remainingRequests}
        maxDailyRequests={maxDailyRequests}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        language={language}
        onLanguageChange={handleLanguageChange}
        geminiVoice={geminiVoice}
        onGeminiVoiceChange={handleGeminiVoiceChange}
        soundFXEnabled={soundFXEnabled}
        onToggleSoundFX={handleToggleSoundFX}
        autoSpeak={autoSpeak}
        onToggleAutoSpeak={handleToggleAutoSpeak}
      />

      {/* Static Information Modal (Haqqında / Məxfilik / Əlaqə) */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        initialTab={infoModalTab}
      />

      {/* Rewarded Adsterra Modal (Watch ad, earn 5 questions) */}
      <RewardedAdModal
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        onRewardClaimed={handleRewardClaimed}
        clientId={getOrCreateClientId()}
        onPlaySuccessSound={() => soundFX.playActivation()}
      />
    </div>
  );
}
