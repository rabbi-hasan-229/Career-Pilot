import type { LiveVoiceName } from '../ai/aiGateway';

export type LiveSessionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'closed';

export interface GeminiLiveCallbacks {
  onStateChange: (state: LiveSessionState) => void;
  onModelActive?: (model: string) => void;
  onMicLevel?: (level: number) => void;
  onUserTranscriptChunk?: (partialText: string) => void;
  onUserTurnCommitted?: (finalText: string) => void;
  onInterviewerTranscriptChunk?: (partialText: string) => void;
  onInterviewerTurnCommitted?: (finalText: string) => void;
  onSpeakingStateChange?: (isSpeaking: boolean) => void;
  onError?: (message: string) => void;
}

const PCM_INPUT_SAMPLE_RATE = 16000;
const PCM_OUTPUT_SAMPLE_RATE = 24000;

const WORKLET_CODE = `
class PcmCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (channel && channel.length > 0) {
      this.port.postMessage(channel.slice(0));
    }
    return true;
  }
}
registerProcessor('pcm-capture-processor', PcmCaptureProcessor);
`;

function downsampleFloat32ToInt16Pcm(input: Float32Array, inputSampleRate: number, outputSampleRate: number): Int16Array {
  if (inputSampleRate === outputSampleRate) {
    const pcm = new Int16Array(input.length);
    for (let i = 0; i < input.length; i += 1) {
      const clamped = Math.max(-1, Math.min(1, input[i]));
      pcm[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    }
    return pcm;
  }

  const ratio = inputSampleRate / outputSampleRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const pcm = new Int16Array(outputLength);
  for (let i = 0; i < outputLength; i += 1) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const s0 = input[Math.min(idx, input.length - 1)] ?? 0;
    const s1 = input[Math.min(idx + 1, input.length - 1)] ?? s0;
    const sample = s0 + (s1 - s0) * frac;
    const clamped = Math.max(-1, Math.min(1, sample));
    pcm[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return pcm;
}

function int16ToBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToFloat32Pcm(base64: string): Float32Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i += 1) {
    float32[i] = int16[i] / 32768;
  }
  return float32;
}

function parseSampleRateFromMime(mimeType?: string): number {
  if (!mimeType) return PCM_OUTPUT_SAMPLE_RATE;
  const match = mimeType.match(/rate=(\d+)/i);
  return match ? Math.max(8000, Number(match[1]) || PCM_OUTPUT_SAMPLE_RATE) : PCM_OUTPUT_SAMPLE_RATE;
}

function appendTranscriptionSegment(current: string, incoming: string): string {
  if (!incoming) return current;
  if (!current) return incoming;
  const needsSpace = !current.endsWith(' ') && !incoming.startsWith(' ') && !/^[,.;!?']/.test(incoming);
  return needsSpace ? `${current} ${incoming}` : `${current}${incoming}`;
}

export class GeminiLiveSessionClient {
  private callbacks: GeminiLiveCallbacks;
  private ws: WebSocket | null = null;
  private micStream: MediaStream | null = null;
  private inputCtx: AudioContext | null = null;
  private outputCtx: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private scheduledSources: Set<AudioBufferSourceNode> = new Set();
  private nextPlaybackTime = 0;
  private isMuted = false;
  private isClosedByUser = false;
  private userBuffer = '';
  private modelBuffer = '';
  private pcmBuffer: number[] = [];

  constructor(callbacks: GeminiLiveCallbacks) {
    this.callbacks = callbacks;
  }

  async connect(params: {
    ephemeralToken: string;
    models: string[];
    voiceName: LiveVoiceName;
    systemInstruction: string;
    initialPrompt?: string;
  }): Promise<string> {
    this.isClosedByUser = false;
    this.callbacks.onStateChange('connecting');

    await this.setupAudioPipeline();

    const uniqueModels = [...new Set(params.models.filter(Boolean))];
    let lastError = 'Could not connect to Gemini Live voice server.';

    for (const model of uniqueModels) {
      if (this.isClosedByUser) throw new Error('Live session cancelled.');
      try {
        await this.connectSingleModel({
          ephemeralToken: params.ephemeralToken,
          model,
          voiceName: params.voiceName,
          systemInstruction: params.systemInstruction,
        });
        this.callbacks.onModelActive?.(model);
        this.callbacks.onStateChange('connected');
        if (params.initialPrompt) {
          this.sendTextTurn(params.initialPrompt);
        }
        return model;
      } catch (err) {
        lastError = err instanceof Error ? err.message : `Model ${model} rejected Live connection.`;
      }
    }

    await this.disconnect();
    this.callbacks.onStateChange('error');
    this.callbacks.onError?.(lastError);
    throw new Error(lastError);
  }

  private async setupAudioPipeline(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone access is not available in this browser.');
    }

    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) throw new Error('Web Audio API is unavailable in this browser.');

    this.inputCtx = new AudioCtx();
    if (this.inputCtx.state === 'suspended') {
      await this.inputCtx.resume();
    }

    this.outputCtx = new AudioCtx({ sampleRate: PCM_OUTPUT_SAMPLE_RATE });
    if (this.outputCtx.state === 'suspended') {
      await this.outputCtx.resume();
    }

    this.sourceNode = this.inputCtx.createMediaStreamSource(this.micStream);
    const inputSampleRate = this.inputCtx.sampleRate || 48000;

    const handlePcmFrame = (floatFrame: Float32Array) => {
      if (this.isMuted || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.callbacks.onMicLevel?.(0);
        return;
      }
      let sum = 0;
      for (let i = 0; i < floatFrame.length; i += 1) {
        sum += floatFrame[i] * floatFrame[i];
      }
      const rms = Math.sqrt(sum / floatFrame.length);
      this.callbacks.onMicLevel?.(Math.min(1, rms * 5));

      const downsampled = downsampleFloat32ToInt16Pcm(floatFrame, inputSampleRate, PCM_INPUT_SAMPLE_RATE);
      for (let i = 0; i < downsampled.length; i += 1) {
        this.pcmBuffer.push(downsampled[i]);
      }

      // Send ~100ms (1600 samples at 16kHz) chunks for low latency & small overhead
      if (this.pcmBuffer.length >= 1600) {
        const chunk = new Int16Array(this.pcmBuffer.splice(0, this.pcmBuffer.length));
        const base64 = int16ToBase64(chunk);
        this.ws.send(JSON.stringify({
          realtimeInput: {
            audio: {
              mimeType: `audio/pcm;rate=${PCM_INPUT_SAMPLE_RATE}`,
              data: base64,
            },
          },
        }));
      }
    };

    // Prefer modern AudioWorklet, fall back seamlessly to ScriptProcessor on older Safari/WebViews
    if (this.inputCtx.audioWorklet && typeof Blob !== 'undefined' && typeof URL.createObjectURL === 'function') {
      try {
        const blobUrl = URL.createObjectURL(new Blob([WORKLET_CODE], { type: 'application/javascript' }));
        await this.inputCtx.audioWorklet.addModule(blobUrl);
        URL.revokeObjectURL(blobUrl);
        this.workletNode = new AudioWorkletNode(this.inputCtx, 'pcm-capture-processor');
        this.workletNode.port.onmessage = (ev: MessageEvent<Float32Array>) => {
          if (ev.data) handlePcmFrame(ev.data);
        };
        this.sourceNode.connect(this.workletNode);
        this.workletNode.connect(this.inputCtx.destination);
        return;
      } catch {
        // Fall through cleanly to ScriptProcessorNode fallback
      }
    }

    this.scriptNode = this.inputCtx.createScriptProcessor(2048, 1, 1);
    this.scriptNode.onaudioprocess = (ev) => {
      const channel = ev.inputBuffer.getChannelData(0);
      if (channel) handlePcmFrame(channel);
    };
    this.sourceNode.connect(this.scriptNode);
    this.scriptNode.connect(this.inputCtx.destination);
  }

  private connectSingleModel(params: {
    ephemeralToken: string;
    model: string;
    voiceName: LiveVoiceName;
    systemInstruction: string;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(params.ephemeralToken)}`;
      const ws = new WebSocket(wsUrl);
      let settled = false;

      const handshakeTimer = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          try { ws.close(); } catch { /* ignore */ }
          reject(new Error(`Handshake timed out for ${params.model}.`));
        }
      }, 8000);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          setup: {
            model: `models/${params.model}`,
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: params.voiceName,
                  },
                },
              },
            },
            systemInstruction: {
              parts: [{ text: params.systemInstruction }],
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        }));
      };

      ws.onmessage = async (ev: MessageEvent) => {
        try {
          const text = typeof ev.data === 'string'
            ? ev.data
            : ev.data instanceof Blob
              ? await ev.data.text()
              : '';
          if (!text) return;
          const payload = JSON.parse(text) as {
            setupComplete?: unknown;
            goAway?: { timeLeft?: string };
            serverContent?: {
              interrupted?: boolean;
              turnComplete?: boolean;
              modelTurn?: {
                parts?: Array<{
                  inlineData?: { data?: string; mimeType?: string };
                  text?: string;
                }>;
              };
              inputTranscription?: { text?: string };
              outputTranscription?: { text?: string };
            };
          };

          if (payload.setupComplete && !settled) {
            settled = true;
            window.clearTimeout(handshakeTimer);
            this.ws = ws;
            resolve();
            return;
          }

          const sc = payload.serverContent;
          if (!sc) return;

          // Flush pending user transcript once interviewer begins responding
          if (sc.inputTranscription?.text) {
            this.userBuffer = appendTranscriptionSegment(this.userBuffer, sc.inputTranscription.text);
            this.callbacks.onUserTranscriptChunk?.(this.userBuffer);
          }

          if (sc.interrupted) {
            this.clearAudioQueue();
            this.flushModelBuffer();
          }

          if (sc.modelTurn?.parts) {
            if (this.userBuffer.trim()) {
              this.callbacks.onUserTurnCommitted?.(this.userBuffer.trim());
              this.userBuffer = '';
              this.callbacks.onUserTranscriptChunk?.('');
            }
            for (const part of sc.modelTurn.parts) {
              if (part.inlineData?.data) {
                const sampleRate = parseSampleRateFromMime(part.inlineData.mimeType);
                this.enqueueAudioChunk(part.inlineData.data, sampleRate);
              }
            }
          }

          if (sc.outputTranscription?.text) {
            if (this.userBuffer.trim()) {
              this.callbacks.onUserTurnCommitted?.(this.userBuffer.trim());
              this.userBuffer = '';
              this.callbacks.onUserTranscriptChunk?.('');
            }
            this.modelBuffer = appendTranscriptionSegment(this.modelBuffer, sc.outputTranscription.text);
            this.callbacks.onInterviewerTranscriptChunk?.(this.modelBuffer);
          }

          if (sc.turnComplete) {
            if (this.userBuffer.trim()) {
              this.callbacks.onUserTurnCommitted?.(this.userBuffer.trim());
              this.userBuffer = '';
              this.callbacks.onUserTranscriptChunk?.('');
            }
            this.flushModelBuffer();
          }
        } catch {
          // Ignore malformed keepalive frames
        }
      };

      ws.onerror = () => {
        if (!settled) {
          settled = true;
          window.clearTimeout(handshakeTimer);
          try { ws.close(); } catch { /* ignore */ }
          reject(new Error(`WebSocket connection failed for ${params.model}.`));
        } else if (!this.isClosedByUser) {
          this.callbacks.onError?.('Live voice connection interrupted.');
        }
      };

      ws.onclose = (ev: CloseEvent) => {
        if (!settled) {
          settled = true;
          window.clearTimeout(handshakeTimer);
          reject(new Error(ev.reason || `Live socket closed (${ev.code}) on ${params.model}.`));
        } else if (!this.isClosedByUser) {
          this.flushAllBuffers();
          this.callbacks.onStateChange('closed');
        }
      };
    });
  }

  private flushModelBuffer(): void {
    const finalized = this.modelBuffer.trim();
    if (finalized) {
      this.callbacks.onInterviewerTurnCommitted?.(finalized);
    }
    this.modelBuffer = '';
    this.callbacks.onInterviewerTranscriptChunk?.('');
  }

  private flushAllBuffers(): void {
    if (this.userBuffer.trim()) {
      this.callbacks.onUserTurnCommitted?.(this.userBuffer.trim());
      this.userBuffer = '';
      this.callbacks.onUserTranscriptChunk?.('');
    }
    this.flushModelBuffer();
  }

  private enqueueAudioChunk(base64: string, sampleRate: number): void {
    if (!this.outputCtx) return;
    if (this.outputCtx.state === 'suspended') {
      void this.outputCtx.resume();
    }
    const samples = base64ToFloat32Pcm(base64);
    if (samples.length === 0) return;

    const buffer = this.outputCtx.createBuffer(1, samples.length, sampleRate);
    buffer.getChannelData(0).set(samples);

    const src = this.outputCtx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.outputCtx.destination);

    const now = this.outputCtx.currentTime;
    if (this.nextPlaybackTime < now + 0.02) {
      this.nextPlaybackTime = now + 0.03;
    }

    this.scheduledSources.add(src);
    this.callbacks.onSpeakingStateChange?.(true);
    src.onended = () => {
      this.scheduledSources.delete(src);
      if (this.scheduledSources.size === 0) {
        this.callbacks.onSpeakingStateChange?.(false);
      }
    };
    src.start(this.nextPlaybackTime);
    this.nextPlaybackTime += buffer.duration;
  }

  private clearAudioQueue(): void {
    for (const src of this.scheduledSources) {
      try {
        src.stop();
      } catch {
        // Ignore already-stopped nodes
      }
    }
    this.scheduledSources.clear();
    this.nextPlaybackTime = 0;
    this.callbacks.onSpeakingStateChange?.(false);
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
      this.callbacks.onMicLevel?.(0);
    }
  }

  sendTextTurn(text: string): void {
    const trimmed = text.trim();
    if (!trimmed || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      realtimeInput: { text: trimmed },
    }));
  }

  async disconnect(): Promise<void> {
    this.isClosedByUser = true;
    this.flushAllBuffers();
    this.clearAudioQueue();

    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // Ignore
      }
      this.ws = null;
    }

    if (this.workletNode) {
      try { this.workletNode.disconnect(); } catch { /* ignore */ }
      this.workletNode = null;
    }
    if (this.scriptNode) {
      try { this.scriptNode.disconnect(); } catch { /* ignore */ }
      this.scriptNode = null;
    }
    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch { /* ignore */ }
      this.sourceNode = null;
    }
    if (this.micStream) {
      for (const track of this.micStream.getTracks()) {
        track.stop();
      }
      this.micStream = null;
    }
    if (this.inputCtx) {
      await this.inputCtx.close().catch(() => {});
      this.inputCtx = null;
    }
    if (this.outputCtx) {
      await this.outputCtx.close().catch(() => {});
      this.outputCtx = null;
    }
    this.callbacks.onMicLevel?.(0);
    this.callbacks.onStateChange('idle');
  }
}
