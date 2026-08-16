// Speech synthesis manager (Browser Text-To-Speech)
// Uses Turkish (tr-TR) voice engine for natural, crystal-clear pronunciation of Azerbaijani text.

export interface VoiceOption {
  name: string;
  lang: string;
  voiceURI: string;
  default: boolean;
}

export class TextToSpeechManager {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  public selectedVoiceURI: string = '';
  public rate: number = 1.0;
  public pitch: number = 1.0;
  public volume: number = 1.0;
  public isSpeaking: boolean = false;
  private onStateChangeCb: ((isSpeaking: boolean) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  public isSupported(): boolean {
    return !!this.synth;
  }

  public loadVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    this.voices = this.synth.getVoices();
    return this.voices;
  }

  public getAvailableVoices(): VoiceOption[] {
    const list = this.loadVoices();
    return list.map((v) => ({
      name: v.name,
      lang: v.lang,
      voiceURI: v.voiceURI,
      default: v.default,
    }));
  }

  // Clean and phonetically adapt text for flawless Turkish TTS engine reading
  public cleanTextForSpeech(text: string): string {
    return text
      .replace(/[*_~`#>]/g, '') // remove markdown bold, italics, code markers
      .replace(/https?:\/\/\S+/g, 'keçid') // replace URLs
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // markdown links [text](url) -> text
      // Adapt Azerbaijani schwa 'ə' / 'Ə' so Turkish TTS pronounces it naturally as 'e' / 'E'
      .replace(/ə/g, 'e')
      .replace(/Ə/g, 'E')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Find Turkish (tr-TR) voice for top-tier pronunciation
  private findTurkishVoice(): SpeechSynthesisVoice | null {
    if (!this.voices.length) {
      this.loadVoices();
    }

    // 1. If user explicitly selected a voiceURI in settings
    if (this.selectedVoiceURI) {
      const explicit = this.voices.find((v) => v.voiceURI === this.selectedVoiceURI);
      if (explicit) return explicit;
    }

    // 2. High Quality / Google / Natural Turkish voices
    const premiumTurkish = this.voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith('tr') &&
        (v.name.includes('Google') ||
          v.name.includes('Natural') ||
          v.name.includes('Premium') ||
          v.name.includes('Online') ||
          v.name.includes('Ahmet') ||
          v.name.includes('Emel') ||
          v.name.includes('Tolga') ||
          v.name.includes('Yelda') ||
          v.name.includes('Cem') ||
          v.name.includes('Filiz'))
    );
    if (premiumTurkish) return premiumTurkish;

    // 3. Any Turkish voice
    const anyTurkish = this.voices.find((v) => v.lang.toLowerCase().startsWith('tr'));
    if (anyTurkish) return anyTurkish;

    // 4. Fallback to first available voice
    return this.voices[0] || null;
  }

  public speak(
    text: string,
    _langCode: string = 'tr-TR',
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    if (!this.synth) {
      if (onError) onError(new Error('Speech synthesis not supported'));
      return;
    }

    // Cancel any ongoing speech
    this.stop();

    const cleaned = this.cleanTextForSpeech(text);
    if (!cleaned) return;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    const voice = this.findTurkishVoice();

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = 'tr-TR';
    }

    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    utterance.volume = this.volume;

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (this.onStateChangeCb) this.onStateChangeCb(true);
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (this.onStateChangeCb) this.onStateChangeCb(false);
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      if (this.onStateChangeCb) this.onStateChangeCb(false);
      if (onError) onError(e);
    };

    // Speak
    try {
      this.synth.speak(utterance);
    } catch (e) {
      console.error('Speech synthesis speak error:', e);
      if (onError) onError(e);
    }
  }

  public stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        // ignore
      }
    }
    this.isSpeaking = false;
    if (this.onStateChangeCb) this.onStateChangeCb(false);
  }

  public pause() {
    if (this.synth && this.isSpeaking) {
      this.synth.pause();
    }
  }

  public resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  public onStateChange(cb: (isSpeaking: boolean) => void) {
    this.onStateChangeCb = cb;
  }
}

export const ttsManager = new TextToSpeechManager();
