import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioEngine } from '../audio';

class MockGainNode {
  gain = { setTargetAtTime: vi.fn(), value: 1, linearRampToValueAtTime: vi.fn(), setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
  connect = vi.fn();
}

class MockOscillator {
  type = 'sine';
  frequency = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), setTargetAtTime: vi.fn() };
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockBiquadFilter {
  type = 'lowpass';
  frequency = { value: 1000, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() };
  Q = { value: 1, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() };
  connect = vi.fn();
}

class MockCompressor {
  threshold = { value: 0 };
  knee = { value: 0 };
  ratio = { value: 0 };
  attack = { value: 0 };
  release = { value: 0 };
  connect = vi.fn();
}

class MockBufferSource {
  buffer = null;
  playbackRate = { value: 1 };
  connect = vi.fn();
  start = vi.fn();
}

class MockAudioContext {
  currentTime = 0;
  sampleRate = 44100;
  state = 'running';
  resume = vi.fn();
  createGain = () => new MockGainNode();
  createOscillator = () => new MockOscillator();
  createBiquadFilter = () => new MockBiquadFilter();
  createDynamicsCompressor = () => new MockCompressor();
  createBuffer = () => ({ getChannelData: () => new Float32Array(44100) });
  createBufferSource = () => new MockBufferSource();
  destination = {};
}

describe('AudioEngine', () => {
  beforeEach(() => {
    (window as any).AudioContext = MockAudioContext;
    (window as any).webkitAudioContext = MockAudioContext;
  });

  it('initializes and enables/disables', () => {
    AudioEngine.init();
    expect(AudioEngine.isEnabled()).toBe(true);
    AudioEngine.setEnabled(false);
    expect(AudioEngine.isEnabled()).toBe(false);
    AudioEngine.setEnabled(true);
  });

  it('plays sounds', () => {
    AudioEngine.init();
    AudioEngine.playHover();
    AudioEngine.playClick();
    AudioEngine.playAlert();
    AudioEngine.playVocalization('ANIMIST');
    AudioEngine.playMiracleRain();
    AudioEngine.playMiracleMeteor();
    AudioEngine.playMiracleRift();
    AudioEngine.updateAdaptiveDrone('ANIMIST', 1);
  });

  it('starts and stops OST', () => {
    AudioEngine.init();
    AudioEngine.startOST();
    AudioEngine.stopOST();
  });
});
