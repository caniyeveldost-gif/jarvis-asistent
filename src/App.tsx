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
    localStorage.setItem('jarvis_sound_fx', enabled.toString());
  };

  // Handle Auto-Speak toggle
  const handleToggleAutoSpeak = (enabled: boolean) => {
    setAutoSpeak(enabled);
    localStorage.setItem('jarvis_auto_speak', enabled.toString());
  };

  // Stop currently playing audio
  const handleStopSpeaking = () => {
    geminiAudioPlayer.stop();
    setIsSpeaking(false);
    setCurrentPlayingId(null);
    setStatusText('SİSTEM HAZIRDIR');
  };

  // Play a specific message audio using Gemini AI Voice
  const handlePlaySpeech = async (
    id: string,
    text: string,
    cachedAudio?: string | null,
    cachedMimeType?: string | null
  ) => {
    geminiAudioPlayer.stop();
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
          console.warn('Gemini audio playback error:', err);
          setIsSpeaking(false);
          setCurrentPlayingId(null);
          setStatusText('SİSTEM HAZIRDIR');
        }
      );
      return;
    }

    // 2. Otherwise fetch audio on demand from /api/tts
    setAudioLoadingId(id);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: geminiVoice }),
      });

      if (!response.ok) {
        throw new Error('Audio alına bilmədi.');
      }

      const data = await response.json();
      setAudioLoadingId(null);

      if (data.audio) {
        // Cache audio in state
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
      }
    } catch (err) {
      console.warn('Failed to load audio from TTS API:', err);
      setAudioLoadingId(null);
      setIsSpeaking(false);
      setCurrentPlayingId(null);
      setStatusText('SİSTEM HAZIRDIR');
    }
  };

  // Process User Query with Gemini API (Text + Gemini AI Audio TTS)
  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    setErrorMessage(null);
    setTranscript('');
    setIsListening(false);
    voiceRecognizer.stop();

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
      // 3. Call backend Gemini API endpoint for both text reply and Gemini AI Audio
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          history: priorHistory,
          language,
          voice: geminiVoice,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server cavab vermədi.');
      }

      const data = await response.json();
      const replyText = data.reply || 'Cavab hazırlana bilmədi.';
      const audioBase64 = data.audio || null;
      const mimeType = data.mimeType || 'audio/pcm;rate=24000';

      // 4. Add Assistant Message to History (with cached Gemini AI audio)
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

      // 5. If autoSpeak is enabled and audio exists, play Gemini AI Voice immediately
      if (autoSpeak && audioBase64) {
        setStatusText('CAVAB VERİLİR...');
        setCurrentPlayingId(assistantMsgId);
        await geminiAudioPlayer.playBase64Audio(
          audioBase64,
          mimeType,
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
    // If speaking, stop speaking
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
    setMessages([]);
    localStorage.removeItem('jarvis_chat_history');
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col relative pb-16">
      {/* Top Futuristic Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        language={language}
        isSpeaking={isSpeaking}
        soundEffectsEnabled={soundFXEnabled}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-4 flex flex-col items-center">
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
        />

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
    </div>
  );
}
