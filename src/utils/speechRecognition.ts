// Speech recognition helper for Web Speech API

export interface SpeechRecognitionResultPayload {
  transcript: string;
  isFinal: boolean;
}

export type SpeechCallback = (result: SpeechRecognitionResultPayload) => void;
export type ErrorCallback = (error: string) => void;
export type StateCallback = (isListening: boolean) => void;

export class VoiceRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResultCb: SpeechCallback | null = null;
  private onErrorCb: ErrorCallback | null = null;
  private onStateCb: StateCallback | null = null;
  public language: string = 'az-AZ';

  constructor() {
    this.initRecognition();
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  private initRecognition() {
    if (!this.isSupported()) return;

    try {
      const SpeechRecognitionConstructor =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      this.recognition = new SpeechRecognitionConstructor();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = this.language;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.onStateCb) this.onStateCb(true);
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (this.onResultCb) {
          if (finalTranscript.trim()) {
            this.onResultCb({ transcript: finalTranscript.trim(), isFinal: true });
          } else if (interimTranscript.trim()) {
            this.onResultCb({ transcript: interimTranscript.trim(), isFinal: false });
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        let msg = 'Səs tanıma xətası';
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          msg = 'Mikrofon icazəsi verilməyib. Brauzerinizdə mikrofon girişinə icazə verin.';
        } else if (event.error === 'no-speech') {
          msg = 'Səs aşkar edilmədi. Xahiş edirik mikrofona yaxın danışın.';
        } else if (event.error === 'network') {
          msg = 'Şəbəkə bağlantısında xəta baş verdi.';
        } else if (event.error === 'aborted') {
          msg = 'Səs qeydi dayandırıldı.';
        }
        
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          if (this.onErrorCb) this.onErrorCb(msg);
        }
        
        this.isListening = false;
        if (this.onStateCb) this.onStateCb(false);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onStateCb) this.onStateCb(false);
      };
    } catch (e) {
      console.error('Speech Recognition initialization error:', e);
    }
  }

  public setLanguage(lang: string) {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public start(onResult: SpeechCallback, onError: ErrorCallback, onState: StateCallback) {
    this.onResultCb = onResult;
    this.onErrorCb = onError;
    this.onStateCb = onState;

    if (!this.recognition) {
      this.initRecognition();
    }

    if (!this.recognition) {
      onError('Brauzeriniz nitqi tanıma funksiyasını dəstəkləmir. Chrome, Edge və ya Safari istifadə etməyiniz tövsiyə olunur.');
      return;
    }

    try {
      if (this.isListening) {
        this.recognition.stop();
      }
      this.recognition.lang = this.language;
      this.recognition.start();
    } catch (e: any) {
      console.warn('Recognition start exception, retrying:', e);
      try {
        this.recognition.abort();
        setTimeout(() => {
          this.recognition.start();
        }, 150);
      } catch (err: any) {
        onError('Mikrofonu aktivləşdirmək mümkün olmadı: ' + (err?.message || 'Xəta'));
      }
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore stop errors
      }
    }
    this.isListening = false;
    if (this.onStateCb) this.onStateCb(false);
  }
}

export const voiceRecognizer = new VoiceRecognizer();
