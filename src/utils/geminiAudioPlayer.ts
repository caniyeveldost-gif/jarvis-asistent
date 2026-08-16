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

  // Lazily get or create AudioContext
  public getAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    return this.audioCtx;
  }

  // Ensure AudioContext is unlocked / running on user gesture
  public async initOrResumeContext(): Promise<void> {
    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
        console.log('[GeminiAudioPlayer] AudioContext resumed successfully');
      }
    } catch (err) {
      console.warn('[GeminiAudioPlayer] Failed to resume AudioContext:', err);
    }
  }

  // Convert raw 16-bit PCM little-endian buffer into Web Audio AudioBuffer safely
  private pcmToAudioBuffer(
    uint8Array: Uint8Array,
    sampleRate: number = 24000,
    channels: number = 1
  ): AudioBuffer {
    const ctx = this.getAudioContext();
    const bytesPerSample = 2;
    const numSamples = Math.floor(uint8Array.length / (bytesPerSample * channels));
    const audioBuffer = ctx.createBuffer(channels, Math.max(1, numSamples), sampleRate);

    const dataView = new DataView(
      uint8Array.buffer,
      uint8Array.byteOffset,
      numSamples * bytesPerSample * channels
    );

    for (let channel = 0; channel < channels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < numSamples; i++) {
        const byteOffset = (i * channels + channel) * 2;
        // 16-bit signed integer little-endian [-32768, 32767]
        const int16 = dataView.getInt16(byteOffset, true);
        channelData[i] = int16 / 32768.0;
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
    if (!base64Data) {
      console.warn('[GeminiAudioPlayer] playBase64Audio called with empty base64 data');
      if (onError) onError(new Error('Audio data is empty'));
      return;
    }

    try {
      this.stop();

      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      console.log('[GeminiAudioPlayer] Decoding audio data...', {
        base64Length: base64Data.length,
        mimeType,
        audioContextState: ctx.state,
      });

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

      if (isWav || (!mimeType.includes('pcm') && mimeType.includes('audio/'))) {
        try {
          const bufferCopy = bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength
          );
          audioBuffer = await ctx.decodeAudioData(bufferCopy);
        } catch (decodeErr) {
          console.warn('[GeminiAudioPlayer] decodeAudioData failed, falling back to PCM decoder:', decodeErr);
          const sampleRateMatch = mimeType.match(/rate=(\d+)/);
          const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1], 10) : 24000;
          audioBuffer = this.pcmToAudioBuffer(bytes, sampleRate, 1);
        }
      } else {
        // Raw 16-bit PCM (standard for gemini-3.1-flash-tts-preview)
        const sampleRateMatch = mimeType.match(/rate=(\d+)/);
        const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1], 10) : 24000;
        audioBuffer = this.pcmToAudioBuffer(bytes, sampleRate, 1);
      }

      console.log('[GeminiAudioPlayer] AudioBuffer ready:', {
        duration: audioBuffer.duration.toFixed(2) + 's',
        numberOfChannels: audioBuffer.numberOfChannels,
        sampleRate: audioBuffer.sampleRate,
      });

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      this.currentSource = source;
      this.isPlaying = true;
      if (this.onStateChangeCb) this.onStateChangeCb(true);
      if (onStart) onStart();

      source.onended = () => {
        if (this.currentSource === source) {
          console.log('[GeminiAudioPlayer] Playback completed naturally');
          this.currentSource = null;
          this.isPlaying = false;
          if (this.onStateChangeCb) this.onStateChangeCb(false);
          if (onEnd) onEnd();
        }
      };

      source.start(0);
      console.log('[GeminiAudioPlayer] Playback started');
    } catch (err: any) {
      console.error('[GeminiAudioPlayer] Playback error:', err);
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
