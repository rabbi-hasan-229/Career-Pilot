import { transcribeSpeechAudio } from '../ai/aiGateway';

export type VoiceCommandType = 'next' | 'hint' | 'repeat' | 'end' | 'restart';

export interface VoiceCommandMatch {
  type: VoiceCommandType;
  label: string;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike extends Event {
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionInstanceLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstanceLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstanceLike;
}

export function getSpeechRecognitionCtor(): (new () => SpeechRecognitionInstanceLike) | undefined {
  if (typeof window === 'undefined') return undefined;
  const win = window as unknown as SpeechWindow;
  return win.SpeechRecognition || win.webkitSpeechRecognition;
}

export function isVoiceCaptureSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const hasMediaRecorder = typeof navigator !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && typeof MediaRecorder !== 'undefined';
  return hasMediaRecorder || Boolean(getSpeechRecognitionCtor());
}

/** Match clear short spoken control commands without intercepting normal long interview answers. */
export function parseVoiceCommand(rawTranscript: string): VoiceCommandMatch | null {
  const normalized = rawTranscript
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized || normalized.split(' ').length > 7) return null;

  if (/^(?:please\s+)?(?:go\s+to\s+|move\s+to\s+)?(?:next\s+question|skip\s+(?:this\s+)?question|skip\s+to\s+next|continue\s+next)$/.test(normalized)) {
    return { type: 'next', label: 'Advancing to next question' };
  }
  if (/^(?:please\s+)?(?:give\s+(?:me\s+)?a?\s*hint|ask\s+for\s+a?\s*steer|steer\s+me|hint\s+please|help\s+me\s+start)$/.test(normalized)) {
    return { type: 'hint', label: 'Asking interviewer for a steer' };
  }
  if (/^(?:please\s+)?(?:repeat(?:\s+that|\s+the\s+question)?|say\s+that\s+again|read\s+the\s+question\s+again)$/.test(normalized)) {
    return { type: 'repeat', label: 'Repeating current prompt' };
  }
  if (/^(?:please\s+)?(?:end\s+(?:the\s+)?interview|finish\s+(?:and\s+)?debrief|stop\s+interview|wrap\s+up\s+interview)$/.test(normalized)) {
    return { type: 'end', label: 'Ending interview & generating debrief' };
  }
  if (/^(?:please\s+)?(?:restart\s+interview|new\s+interview\s+loop|start\s+over)$/.test(normalized)) {
    return { type: 'restart', label: 'Starting a fresh interview loop' };
  }
  return null;
}

export function pickSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return 'audio/webm';
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return '';
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

export interface SpeechCaptureResult {
  transcript: string;
  source: 'gemini' | 'browser' | 'none';
  hadAudioSignal: boolean;
}

export interface HybridSpeechController {
  start: () => Promise<void>;
  stop: () => Promise<SpeechCaptureResult>;
  abort: () => void;
}

/**
 * Captures mic audio via MediaRecorder (for universal Gemini server-side transcription)
 * while running Web Speech API live preview in parallel whenever available.
 */
export function createHybridSpeechController(options: {
  onInterimTranscript?: (text: string) => void;
  onAudioLevel?: (level: number) => void;
  onStatusText?: (status: string) => void;
  transcribeHint?: string;
  preferGeminiTranscription?: boolean;
}): HybridSpeechController {
  let mediaStream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  let recognition: SpeechRecognitionInstanceLike | null = null;
  let audioCtx: AudioContext | null = null;
  let meterRaf: number | null = null;
  let chunks: BlobPart[] = [];
  let mimeType = 'audio/webm';
  let startedAt = 0;
  let peakRms = 0;
  let browserFinalTranscript = '';
  let browserLatestTranscript = '';
  let isStopping = false;

  const stopMeter = () => {
    if (meterRaf !== null) {
      cancelAnimationFrame(meterRaf);
      meterRaf = null;
    }
    if (audioCtx) {
      void audioCtx.close().catch(() => {});
      audioCtx = null;
    }
    options.onAudioLevel?.(0);
  };

  const cleanupStreams = () => {
    stopMeter();
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // Ignore recognition cleanup errors
      }
      recognition = null;
    }
    if (mediaStream) {
      for (const track of mediaStream.getTracks()) {
        track.stop();
      }
      mediaStream = null;
    }
    recorder = null;
  };

  const start = async () => {
    chunks = [];
    browserFinalTranscript = '';
    browserLatestTranscript = '';
    peakRms = 0;
    startedAt = Date.now();
    isStopping = false;

    const SpeechCtor = getSpeechRecognitionCtor();
    const canRecord = typeof navigator !== 'undefined'
      && Boolean(navigator.mediaDevices?.getUserMedia)
      && typeof MediaRecorder !== 'undefined';

    if (canRecord) {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Track RMS volume so silent taps aren't sent to transcription
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          audioCtx = new AudioCtx();
          const source = audioCtx.createMediaStreamSource(mediaStream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);
          const dataArray = new Uint8Array(analyser.fftSize);
          const updateLevel = () => {
            if (isStopping || !audioCtx) return;
            analyser.getByteTimeDomainData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i += 1) {
              const v = (dataArray[i] - 128) / 128;
              sum += v * v;
            }
            const rms = Math.sqrt(sum / dataArray.length);
            if (rms > peakRms) peakRms = rms;
            options.onAudioLevel?.(Math.min(1, rms * 4.5));
            meterRaf = requestAnimationFrame(updateLevel);
          };
          meterRaf = requestAnimationFrame(updateLevel);
        }
      } catch {
        // Ignore analyser setup failures on restricted devices
      }

      mimeType = pickSupportedAudioMimeType();
      recorder = mimeType ? new MediaRecorder(mediaStream, { mimeType }) : new MediaRecorder(mediaStream);
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data);
      };
      recorder.start(250);
    }

    if (SpeechCtor) {
      try {
        const rec = new SpeechCtor();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = navigator.language || 'en-US';
        rec.onresult = (event) => {
          let finalParts = '';
          let fullPreview = '';
          for (let i = 0; i < event.results.length; i += 1) {
            const part = event.results[i][0]?.transcript || '';
            fullPreview += `${part} `;
            if (event.results[i].isFinal) {
              finalParts += `${part} `;
            }
          }
          browserFinalTranscript = finalParts.trim();
          browserLatestTranscript = fullPreview.trim();
          if (browserLatestTranscript) {
            options.onInterimTranscript?.(browserLatestTranscript);
          }
        };
        rec.onerror = () => {
          // Non-fatal: MediaRecorder + Gemini transcription catches all browser speech errors
        };
        rec.start();
        recognition = rec;
      } catch {
        recognition = null;
      }
    }

    if (!recorder && !recognition) {
      throw new Error('Microphone recording is not supported in this browser.');
    }
    options.onStatusText?.('Listening… speak naturally');
  };

  const stop = async (): Promise<SpeechCaptureResult> => {
    if (isStopping) {
      return { transcript: '', source: 'none', hadAudioSignal: false };
    }
    isStopping = true;
    options.onStatusText?.('Transcribing…');

    const audioBlob = await new Promise<Blob | null>((resolve) => {
      if (!recorder || recorder.state === 'inactive') {
        resolve(chunks.length > 0 ? new Blob(chunks, { type: mimeType || 'audio/webm' }) : null);
        return;
      }
      const timeout = window.setTimeout(() => {
        resolve(chunks.length > 0 ? new Blob(chunks, { type: recorder?.mimeType || mimeType || 'audio/webm' }) : null);
      }, 1500);
      recorder.onstop = () => {
        window.clearTimeout(timeout);
        resolve(chunks.length > 0 ? new Blob(chunks, { type: recorder?.mimeType || mimeType || 'audio/webm' }) : null);
      };
      try {
        recorder.stop();
      } catch {
        window.clearTimeout(timeout);
        resolve(null);
      }
    });

    // Allow Web Speech one brief tick to flush final words before tearing down
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // Ignore
      }
      await new Promise((r) => window.setTimeout(r, 140));
    }

    const durationMs = Date.now() - startedAt;
    const browserText = (browserFinalTranscript || browserLatestTranscript).trim();
    const hasSpokenSignal = peakRms > 0.004 || browserText.length > 0 || (audioBlob ? audioBlob.size > 1500 : false);

    cleanupStreams();

    if (durationMs < 350 && !browserText) {
      return { transcript: '', source: 'none', hadAudioSignal: false };
    }

    // Use Gemini transcription whenever we have real recorded audio for maximum accuracy
    // across accents/technical jargon and universal browser support.
    if (
      (options.preferGeminiTranscription ?? true)
      && audioBlob
      && audioBlob.size > 600
      && hasSpokenSignal
    ) {
      try {
        const audioBase64 = await blobToBase64(audioBlob);
        if (audioBase64.length <= 4_100_000) {
          const cleanMime = (audioBlob.type || mimeType || 'audio/webm').split(';')[0].trim();
          const res = await transcribeSpeechAudio({
            audio_base64: audioBase64,
            mime_type: cleanMime,
            hint: options.transcribeHint,
          });
          const geminiText = res.response.transcript?.trim() || '';
          if (geminiText) {
            return { transcript: geminiText, source: 'gemini', hadAudioSignal: true };
          }
        }
      } catch {
        // Fall through cleanly to browser Web Speech transcript if offline/unauthenticated
      }
    }

    if (browserText) {
      return { transcript: browserText, source: 'browser', hadAudioSignal: true };
    }

    return { transcript: '', source: 'none', hadAudioSignal: hasSpokenSignal };
  };

  const abort = () => {
    isStopping = true;
    cleanupStreams();
  };

  return { start, stop, abort };
}
