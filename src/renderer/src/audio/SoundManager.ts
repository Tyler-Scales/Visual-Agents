/**
 * Procedural sound effects using Web Audio API.
 * No external audio files required — all sounds are synthesized.
 * OFF by default (muted = true). User must enable.
 */
export class SoundManager {
  private ctx: AudioContext | null = null
  private muted = true
  private lastTypingClick = 0
  private typingThrottleMs = 500

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
    }
    // Resume if suspended (browser autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  /**
   * Short click sound for typing/writing activities.
   * Random frequency between 800-1200Hz, triangle wave, 50ms, very low volume.
   */
  playTypingClick(): void {
    if (this.muted) return

    const now = Date.now()
    if (now - this.lastTypingClick < this.typingThrottleMs) return
    this.lastTypingClick = now

    const ctx = this.getContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.value = 800 + Math.random() * 400
    gain.gain.value = 0.03

    osc.connect(gain)
    gain.connect(ctx.destination)

    const t = ctx.currentTime
    gain.gain.setValueAtTime(0.03, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)

    osc.start(t)
    osc.stop(t + 0.05)
  }

  /**
   * Two-tone ascending chime for celebrating/task complete.
   * C5 (523Hz) -> E5 (659Hz), sine wave, 200ms total.
   */
  playChime(): void {
    if (this.muted) return

    const ctx = this.getContext()
    const t = ctx.currentTime

    // First tone: C5
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.value = 523.25 // C5
    gain1.gain.value = 0.08
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    gain1.gain.setValueAtTime(0.08, t)
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
    osc1.start(t)
    osc1.stop(t + 0.12)

    // Second tone: E5 (starts slightly after)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.value = 659.25 // E5
    gain2.gain.value = 0.08
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    gain2.gain.setValueAtTime(0.001, t + 0.08)
    gain2.gain.exponentialRampToValueAtTime(0.08, t + 0.1)
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
    osc2.start(t + 0.08)
    osc2.stop(t + 0.2)
  }

  /**
   * Low brown noise ambient loop at very low volume.
   * Optional — can be toggled on/off. Returns a stop function.
   */
  playAmbient(): () => void {
    if (this.muted) return () => {}

    const ctx = this.getContext()
    const bufferSize = 2 * ctx.sampleRate // 2 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    // Generate brown noise (integrated white noise)
    let lastOut = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      lastOut = (lastOut + 0.02 * white) / 1.02
      data[i] = lastOut * 3.5 // normalize
    }

    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    source.buffer = buffer
    source.loop = true
    gain.gain.value = 0.02

    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()

    return () => {
      try { source.stop() } catch { /* already stopped */ }
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted
  }

  isMuted(): boolean {
    return this.muted
  }
}
