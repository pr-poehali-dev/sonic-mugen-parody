import { useRef, useCallback } from "react";

type SoundType =
  | "punch"
  | "heavy"
  | "block"
  | "parry"
  | "special"
  | "dodge"
  | "hit"
  | "transform"
  | "win"
  | "lose"
  | "combo"
  | "charge";

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  const playTone = useCallback(
    (
      freq: number,
      type: OscillatorType,
      duration: number,
      gainVal: number,
      freqEnd?: number,
      delay = 0
    ) => {
      try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        if (freqEnd !== undefined) {
          osc.frequency.exponentialRampToValueAtTime(
            freqEnd,
            ctx.currentTime + delay + duration
          );
        }
        gain.gain.setValueAtTime(gainVal, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + delay + duration
        );
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      } catch (e) {
        void e;
      }
    },
    [getCtx]
  );

  const playNoise = useCallback(
    (duration: number, gainVal: number, delay = 0) => {
      try {
        const ctx = getCtx();
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        source.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(gainVal, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
        source.start(ctx.currentTime + delay);
      } catch (e) {
        void e;
      }
    },
    [getCtx]
  );

  const play = useCallback(
    (sound: SoundType) => {
      switch (sound) {
        case "punch":
          playNoise(0.06, 0.3);
          playTone(180, "square", 0.08, 0.15, 80);
          break;

        case "heavy":
          playNoise(0.12, 0.5);
          playTone(120, "sawtooth", 0.15, 0.25, 50);
          playTone(80, "square", 0.1, 0.2, 40, 0.05);
          break;

        case "block":
          playTone(400, "square", 0.05, 0.2, 600);
          playNoise(0.04, 0.15);
          break;

        case "parry":
          playTone(600, "sine", 0.04, 0.3, 900);
          playTone(300, "triangle", 0.08, 0.2, 800, 0.02);
          break;

        case "special":
          playTone(200, "sawtooth", 0.05, 0.3, 400);
          playTone(400, "sawtooth", 0.05, 0.25, 800, 0.05);
          playTone(800, "sine", 0.08, 0.4, 1600, 0.1);
          playNoise(0.15, 0.4, 0.05);
          playTone(1200, "sine", 0.2, 0.3, 600, 0.2);
          break;

        case "dodge":
          playTone(500, "sine", 0.06, 0.15, 800);
          break;

        case "hit":
          playNoise(0.05, 0.4);
          playTone(150, "square", 0.07, 0.2, 60);
          break;

        case "transform":
          [0, 0.1, 0.2, 0.3, 0.45].forEach((d, i) => {
            playTone(300 * (i + 1), "sine", 0.15, 0.3 - i * 0.03, 600 * (i + 1), d);
          });
          playNoise(0.5, 0.2, 0.2);
          playTone(1800, "sine", 0.4, 0.5, 2400, 0.5);
          break;

        case "win":
          [0, 0.15, 0.3, 0.45].forEach((d, i) => {
            const notes = [523, 659, 784, 1047];
            playTone(notes[i], "triangle", 0.3, 0.4, notes[i], d);
          });
          break;

        case "lose":
          playTone(400, "sawtooth", 0.15, 0.3, 200);
          playTone(200, "sawtooth", 0.2, 0.25, 100, 0.15);
          playTone(100, "square", 0.3, 0.2, 50, 0.35);
          break;

        case "combo":
          playTone(700, "sine", 0.05, 0.25, 900);
          playTone(900, "sine", 0.05, 0.2, 1100, 0.05);
          break;

        case "charge":
          playTone(200, "sawtooth", 0.3, 0.15, 600);
          break;
      }
    },
    [playTone, playNoise]
  );

  return { play };
}