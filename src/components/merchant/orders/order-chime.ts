import { sounds } from "@/lib/sounds";

type AudioCtor = typeof AudioContext;

/** Two-tone chime for a new order. Falls back to the app's ting sound. */
export function playNewOrderChime(): void {
  try {
    const Ctor: AudioCtor | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
    if (!Ctor) {
      sounds.ting();
      return;
    }
    const ctx = new Ctor();
    const tone = (
      type: OscillatorType,
      from: number,
      to: number,
      start: number,
      end: number,
      gain: number
    ) => {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, ctx.currentTime + start);
      osc.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + start + 0.2);
      amp.gain.setValueAtTime(gain, ctx.currentTime + start);
      amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + end);
      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + end);
    };
    tone("sine", 880, 1320, 0, 0.5, 0.3);
    tone("triangle", 1046.5, 1760, 0.18, 0.85, 0.35);
  } catch {
    sounds.ting();
  }
}
