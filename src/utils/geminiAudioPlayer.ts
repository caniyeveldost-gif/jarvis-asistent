/**
 * Gemini AI Voice Audio Player
 * Plays raw PCM (24kHz / 16-bit) or encoded WAV/MP3 audio returned by Gemini Text-to-Speech API
 * Works consistently across all mobile (iOS Safari, Android Chrome) and desktop browsers.
 */

export class GeminiAudioPlayer {
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  public isPlaying: boolean = false;
  private onStateChangeCb: ((isPlaying: boolean) => void) | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Convert raw 16-bit PCM little-endian buffer into Web Audio AudioBuffer
  private pcmToAudioBuffer(
    buffer: ArrayBuffer,
    sampleRate: number = 24000,
    channels: number = 1
  ): AudioBuffer {
    const ctx = this.getAudioContext();
    const int16Array = new Int16Array(buffer);
    const numSamples = int16Array.length / channels;
    const audioBuffer = ctx.createBuffer(channels, numSamples, sampleRate);

    for (let channel = 0; channel < channels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < numSamples; i++) {
        // Normalize 16-bit signed int [-32768, 32767] to [-1.0, 1.0]
        channelData[i] = int16Array[i * channels + channel] / 32768.0;
      }
    }
    return audioBuffer;
  }

  // Play base64 audio string from Gemini TTS
  public async playBase64Audio(
    base64Data: string,
    mimeType: string = 'audio/pcm;rate=24000',
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): Promise<void> {
    try {
      this.stop();

      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Decode base64 string
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      let audioBuffer: AudioBuffer;

      // Check if it has a RIFF header (WAV format)
      const isWav =
        bytes.length > 4 &&
        bytes[0] === 0x52 && // 'R'
        bytes[1] === 0x49 && // 'I'
        bytes[2] === 0x46 && // 'F'
        bytes[3] === 0x46; // 'F'

      if (isWav || !mimeType.includes('pcm')) {
        try {
          audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
        } catch {
          // Fallback to PCM interpretation
          const sampleRateMatch = mimeType.match(/rate=(\d+)/);
          const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1], 10) : 24000;
          audioBuffer = this.pcmToAudioBuffer(bytes.buffer, sampleRate, 1);
        }
      } else {
        // Raw 16-bit PCM (standard for gemini-3.1-flash-tts-preview)
        const sampleRateMatch = mimeType.match(/rate=(\d+)/);
        const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1], 10) : 24000;
        audioBuffer = this.pcmToAudioBuffer(bytes.buffer, sampleRate, 1);
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      this.currentSource = source;
      this.isPlaying = true;
      if (this.onStateChangeCb) this.onStateChangeCb(true);
      if (onStart) onStart();

      source.onended = () => {
        if (this.currentSource === source) {
          this.currentSource = null;
          this.isPlaying = false;
          if (this.onStateChangeCb) this.onStateChangeCb(false);
          if (onEnd) onEnd();
        }
      };

      source.start(0);
    } catch (err: any) {
      console.error('Gemini audio playback error:', err);
      this.isPlaying = false;
      if (this.onStateChangeCb) this.onStateChangeCb(false);
      if (onError) onError(err);
    }
  }

  public stop() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {
        // ignore
      }
      this.currentSource = null;
    }
    this.isPlaying = false;
    if (this.onStateChangeCb) this.onStateChangeCb(false);
  }

  public onStateChange(cb: (isPlaying: boolean) => void) {
    this.onStateChangeCb = cb;
  }
}

export const geminiAudioPlayer = new GeminiAudioPlayer();
