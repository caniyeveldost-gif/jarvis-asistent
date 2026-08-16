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
import { voiceRecognizer } from './utils/speechRecognition';
import { geminiAudioPlayer } from './utils/geminiAudioPlayer';
import { ttsManager } from './utils/speechSynthesis';
import { soundFX } from './utils/audioEffects';

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

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

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

  // Initialize Speech Recognition & Gemini Audio listener
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
    localStorage.setItem('jarvis_sound_fx', String(enabled));
    if (enabled) soundFX.playBeep();
  };

  // Handle Auto Speak toggle
  const handleToggleAutoSpeak = (enabled: boolean) => {
    setAutoSpeak(enabled);
    localStorage.setItem('jarvis_auto_speak', String(enabled));
    if (soundFXEnabled) soundFX.playBeep();
  };

  // Clear chat history
  const handleClearHistory = () => {
    setMessages([]);
    localStorage.removeItem('jarvis_chat_history');
    if (soundFXEnabled) soundFX.playDeactivation();
  };

  // Stop currently playing speech
  const handleStopSpeaking = () => {
    geminiAudioPlayer.stop();
    ttsManager.stop();
    setIsSpeaking(false);
    setCurrentPlayingId(null);
    setStatusText('SİSTEM HAZIRDIR');
    if (soundFXEnabled) soundFX.playDeactivation();
  };

  // Play a specific message audio using Gemini AI Voice
  const handlePlaySpeech = async (
    id: string,
    text: string,
    cachedAudio?: string | null,
    cachedMimeType?: string | null
  ) => {
    // Unlock and prime AudioContext on user interaction
    geminiAudioPlayer.initOrResumeContext();
    geminiAudioPlayer.stop();
    ttsManager.stop();
    setCurrentPlayingId(id);

    console.log('[App] handlePlaySpeech triggered:', { id, hasCachedAudio: !!cachedAudio, voice: geminiVoice });

    // 1. If audio is already cached in the message
    if (cachedAudio) {
      await geminiAudioPlayer.playBase64Audio(
        cachedAudio,
        cachedMimeType || 'audio/pcm;rate=24000',
        () => {
          setIsSpeaking(true);
          setStatusText('SƏS İFA EDİLİR...');
        },
        () => {
          setIsSpeaking(false);
          setCurrentPlayingId(null);
          setStatusText('SİSTEM HAZIRDIR');
        },
        (err) => {
          console.error('[App] Playback error with cached audio:', err);
          ttsManager.speak(
            text,
            language === 'az' ? 'tr-TR' : language === 'tr' ? 'tr-TR' : language === 'ru' ? 'ru-RU' : 'en-US',
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
      console.log('[App] Fetching TTS on demand for message:', id);
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: geminiVoice || 'Kore' }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setAudioLoadingId(null);

      if (data.audio) {
        // Cache audio in the message item
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
            setStatusText('SƏS İFA EDİLİR...');
          },
          () => {
            setIsSpeaking(false);
            setCurrentPlayingId(null);
            setStatusText('SİSTEM HAZIRDIR');
          },
          (err) => {
            console.error('[App] Playback error with fetched TTS, falling back to local TTS:', err);
            ttsManager.speak(
              text,
              language === 'az' ? 'tr-TR' : language === 'tr' ? 'tr-TR' : language === 'ru' ? 'ru-RU' : 'en-US',
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
      } else {
        throw new Error('No audio data in TTS response');
      }
    } catch (err: any) {
      console.error('[App] Failed to fetch on-demand TTS, falling back to local TTS:', err);
      setAudioLoadingId(null);
      ttsManager.speak(
        text,
        language === 'az' ? 'tr-TR' : language === 'tr' ? 'tr-TR' : language === 'ru' ? 'ru-RU' : 'en-US',
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
  };

  // Main Submit Query Function
  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    // Unlock AudioContext on user interaction
    geminiAudioPlayer.initOrResumeContext();

    setErrorMessage(null);
    setTranscript('');
    setIsListening(false);
    voiceRecognizer.stop();

    if (soundFXEnabled) {
      soundFX.playProcessing();
    }

    // 1. Add User Message to History
    const userMsgId = Date.now().toString();
    const newUserMsg: ChatItem = {
      id: userMsgId,
      role: 'user',
      text: queryText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsThinking(true);
    setStatusText('ANALİZ EDİLİR...');

    try {
      // Prepare conversation history for context
      const priorHistory = messages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      // 2. Call backend proxy endpoint (unlimited queries)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: queryText,
          history: priorHistory,
          language,
          voice: geminiVoice || 'Kore',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server cavab vermədi.');
      }

      const replyText = data.reply || 'Məlumat tapılmadı.';
      const audioBase64 = data.audio || null;
      const mimeType = data.mimeType || 'audio/pcm;rate=24000';

      // 3. Add Assistant Message to History
      const assistantMsgId = (Date.now() + 1).toString();
      const newAssistantMsg: ChatItem = {
        id: assistantMsgId,
        role: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        audio: audioBase64,
        mimeType: mimeType,
      };

      setMessages((prev) => [...prev, newAssistantMsg]);
      setIsThinking(false);

      // 4. Play success audio chime
      if (soundFXEnabled) {
        soundFX.playReady();
      }

      // 5. If autoSpeak is enabled, play Gemini AI Voice with consistent voice model
      if (autoSpeak) {
        console.log('[App] autoSpeak enabled. Initial audio attached:', !!audioBase64);
        setStatusText('CAVAB VERİLİR...');
        setCurrentPlayingId(assistantMsgId);

        let finalAudioBase64 = audioBase64;
        let finalMimeType = mimeType;

        // If audio was not attached in chat response, fetch it with the exact voice model
        if (!finalAudioBase64) {
          try {
            console.log('[App] Fetching fallback TTS for autoSpeak...');
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
            console.error('[App] Auto-TTS fetch error:', e);
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
              console.error('[App] Gemini AI audio auto-playback error, falling back to local TTS:', err);
              ttsManager.speak(
                replyText,
                language === 'az' ? 'tr-TR' : language === 'tr' ? 'tr-TR' : language === 'ru' ? 'ru-RU' : 'en-US',
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
        } else {
          console.warn('[App] No Gemini audio available, using local TTS for auto-speak');
          ttsManager.speak(
            replyText,
            language === 'az' ? 'tr-TR' : language === 'tr' ? 'tr-TR' : language === 'ru' ? 'ru-RU' : 'en-US',
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
      } else {
        setStatusText('SİSTEM HAZIRDIR');
      }
    } catch (err: any) {
      console.error('Query processing error:', err);
      setIsThinking(false);
      setStatusText('XƏTA BAŞ VERDİ');
      setErrorMessage(err.message || 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
      if (soundFXEnabled) soundFX.playError();
    }
  };

  // Toggle Microphone Listening
  const handleToggleMic = () => {
    geminiAudioPlayer.initOrResumeContext();
    if (isSpeaking) {
      handleStopSpeaking();
    }

    if (isListening) {
      voiceRecognizer.stop();
      setIsListening(false);
      setStatusText('SİSTEM HAZIRDIR');
      if (soundFXEnabled) soundFX.playDeactivation();
    } else {
      setErrorMessage(null);
      setTranscript('');

      voiceRecognizer.start(
        ({ transcript: text, isFinal }) => {
          setTranscript(text);
          if (isFinal && text.trim()) {
            setIsListening(false);
            handleSendQuery(text);
          }
        },
        (error) => {
          console.warn('Speech Recognition error:', error);
          setIsListening(false);
          setStatusText('SİSTEM HAZIRDIR');
          setErrorMessage('Mikrofon xətası: ' + error);
          if (soundFXEnabled) soundFX.playError();
        },
        (listeningState) => {
          setIsListening(listeningState);
          if (!listeningState && !isThinking && !isSpeaking) {
            setStatusText('SİSTEM HAZIRDIR');
          }
        }
      );

      setIsListening(true);
      setStatusText('DİNLƏNİLİR...');
      if (soundFXEnabled) soundFX.playListening();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050811] text-slate-100 font-sans relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      {/* Dynamic Futuristic Grid Background */}
      <div className="fixed inset-0 bg-cyber-grid bg-[length:40px_40px] opacity-15 pointer-events-none" />

      {/* Futuristic Radial Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-cyan-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[450px] h-[350px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Top Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        language={language}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 flex flex-col items-center justify-start z-20 space-y-4">
        {/* Central Jarvis Arc Reactor Core & Status */}
        <JarvisCore
          isListening={isListening}
          isThinking={isThinking}
          isSpeaking={isSpeaking}
          transcript={transcript}
          onMicClick={handleToggleMic}
          onStopSpeaking={handleStopSpeaking}
          statusText={statusText}
          errorMessage={errorMessage}
        />

        {/* Manual Text Query Input Bar */}
        <div className="w-full max-w-2xl">
          <ManualInputBar
            onSendMessage={handleSendQuery}
            disabled={isThinking}
            isListening={isListening}
            onToggleMic={handleToggleMic}
          />
        </div>

        {/* Interactive Chat History Feed */}
        <div className="w-full max-w-2xl flex-1 flex flex-col pb-8">
          <ChatHistory
            messages={messages}
            currentPlayingId={currentPlayingId}
            audioLoadingId={audioLoadingId}
            onPlaySpeech={handlePlaySpeech}
            onStopSpeech={handleStopSpeaking}
            onClearHistory={handleClearHistory}
            historyEndRef={historyEndRef}
          />
        </div>
      </main>

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
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
