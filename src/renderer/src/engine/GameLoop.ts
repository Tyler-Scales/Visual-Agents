const TICK_MS = 1000 / 60 // 60fps fixed timestep

export type UpdateFn = (dt: number) => void
export type RenderFn = (ctx: CanvasRenderingContext2D, interpolation: number) => void

export class GameLoop {
  private running = false
  private rafId = 0
  private lastTime = 0
  private accumulator = 0
  private updateFn: UpdateFn
  private renderFn: RenderFn
  private ctx: CanvasRenderingContext2D

  constructor(ctx: CanvasRenderingContext2D, updateFn: UpdateFn, renderFn: RenderFn) {
    this.ctx = ctx
    this.updateFn = updateFn
    this.renderFn = renderFn
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.accumulator = 0
    this.tick(this.lastTime)
  }

  stop(): void {
    this.running = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
  }

  private tick = (now: number): void => {
    if (!this.running) return

    const frameTime = Math.min(now - this.lastTime, 100) // cap to avoid spiral of death
    this.lastTime = now
    this.accumulator += frameTime

    while (this.accumulator >= TICK_MS) {
      this.updateFn(TICK_MS)
      this.accumulator -= TICK_MS
    }

    const interpolation = this.accumulator / TICK_MS
    this.renderFn(this.ctx, interpolation)

    this.rafId = requestAnimationFrame(this.tick)
  }
}
