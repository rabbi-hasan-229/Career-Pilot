import { describe, it, expect } from 'vitest';
import { blobToBase64, parseVoiceCommand } from './speechCapture';

describe('speechCapture', () => {
  it('recognizes short hands-free mock interview voice commands', () => {
    expect(parseVoiceCommand('next question')?.type).toBe('next');
    expect(parseVoiceCommand('Please skip this question!')?.type).toBe('next');
    expect(parseVoiceCommand('give me a hint')?.type).toBe('hint');
    expect(parseVoiceCommand('Repeat the question.')?.type).toBe('repeat');
    expect(parseVoiceCommand('end interview')?.type).toBe('end');
    expect(parseVoiceCommand('Start over')?.type).toBe('restart');
  });

  it('does not misclassify long interview answers that contain command words', () => {
    const answer = 'During my previous project I worked on the next question pipeline and gave hints to users when validation failed so latency stayed low.';
    expect(parseVoiceCommand(answer)).toBeNull();
    expect(parseVoiceCommand('')).toBeNull();
  });

  it('encodes binary audio blobs reliably into base64 strings', async () => {
    const sampleBytes = new Uint8Array([72, 101, 108, 108, 111]);
    const blob = new Blob([sampleBytes], { type: 'audio/webm' });
    const base64 = await blobToBase64(blob);
    expect(base64).toBe(btoa('Hello'));
  });
});
