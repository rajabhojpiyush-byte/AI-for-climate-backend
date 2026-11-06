// Web Audio API tactical synthesizer for emergency alerts
// 100% client-side, zero external audio assets required, works completely offline

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a high-priority emergency siren/ping for P1 Critical incidents
 */
export function playEmergencyAlert(type = 'P1') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'P1') {
      // Dual-tone high priority siren pulse
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';

      // Alternating frequency between 880Hz (A5) and 659.25Hz (E5)
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.setValueAtTime(659, now + 0.12);
      osc1.frequency.setValueAtTime(987, now + 0.24);

      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(554, now + 0.12);
      osc2.frequency.setValueAtTime(440, now + 0.24);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } else {
      // Single tactical notification chime (P2/P3/Status change)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (err) {
    console.warn('Audio alert could not play:', err);
  }
}
