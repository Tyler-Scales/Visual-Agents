export class Camera {
  x = 0
  y = 0
  zoom = 4
  private minZoom = 1
  private maxZoom = 8

  /** World-space bounds for clamping (set via setBounds) */
  private worldWidth = Infinity
  private worldHeight = Infinity

  // Smooth centering
  private targetX: number | null = null
  private targetY: number | null = null
  private lerpSpeed = 0.005 // per ms

  // Camera shake
  shakeOffsetX = 0
  shakeOffsetY = 0
  private shakeIntensity = 0
  private shakeTimer = 0
  private shakeDuration = 300 // ms

  pan(dx: number, dy: number): void {
    this.x += dx
    this.y += dy
  }

  setZoom(z: number): void {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, Math.round(z)))
  }

  zoomIn(): void {
    this.setZoom(this.zoom + 1)
  }

  zoomOut(): void {
    this.setZoom(this.zoom - 1)
  }

  /** Reset zoom to default level (3x for the expanded 26x18 grid) */
  resetZoom(): void {
    this.zoom = 3
  }

  /**
   * Set the world-space bounds used by clamp().
   * Typically called once after the office grid is created.
   */
  setBounds(worldWidth: number, worldHeight: number): void {
    this.worldWidth = worldWidth
    this.worldHeight = worldHeight
  }

  /**
   * Clamp the camera position so the viewport stays within the world bounds.
   * Call after panning or zooming to prevent scrolling into empty space.
   */
  clamp(canvasWidth: number, canvasHeight: number): void {
    if (!isFinite(this.worldWidth) || !isFinite(this.worldHeight)) return

    const viewW = canvasWidth / this.zoom
    const viewH = canvasHeight / this.zoom

    const minX = 0
    const minY = 0
    const maxX = Math.max(this.worldWidth - viewW, minX)
    const maxY = Math.max(this.worldHeight - viewH, minY)

    this.x = Math.max(minX, Math.min(maxX, this.x))
    this.y = Math.max(minY, Math.min(maxY, this.y))
  }

  worldToScreen(wx: number, wy: number): { sx: number; sy: number } {
    return {
      sx: (wx - this.x) * this.zoom,
      sy: (wy - this.y) * this.zoom
    }
  }

  screenToWorld(sx: number, sy: number): { wx: number; wy: number } {
    return {
      wx: sx / this.zoom + this.x,
      wy: sy / this.zoom + this.y
    }
  }

  /** Center the camera on a world point given the canvas dimensions */
  centerOn(wx: number, wy: number, canvasWidth: number, canvasHeight: number): void {
    this.x = wx - canvasWidth / (2 * this.zoom)
    this.y = wy - canvasHeight / (2 * this.zoom)
  }

  /** Smoothly lerp toward a target world position */
  smoothCenterOn(wx: number, wy: number, canvasWidth: number, canvasHeight: number): void {
    this.targetX = wx - canvasWidth / (2 * this.zoom)
    this.targetY = wy - canvasHeight / (2 * this.zoom)
  }

  /** Clear smooth follow target (e.g., when user pans manually). */
  clearTarget(): void {
    this.targetX = null
    this.targetY = null
  }

  /** Returns true if camera is currently smooth-following a target. */
  hasTarget(): boolean {
    return this.targetX !== null && this.targetY !== null
  }

  /** Trigger a camera shake effect lasting 300ms */
  shake(intensity = 3): void {
    this.shakeIntensity = intensity
    this.shakeTimer = this.shakeDuration
  }

  /** Advance lerp animation and decay shake — call once per update tick */
  update(dt: number): void {
    // Smooth centering lerp
    if (this.targetX !== null && this.targetY !== null) {
      const t = 1 - Math.pow(1 - this.lerpSpeed, dt)
      this.x += (this.targetX - this.x) * t
      this.y += (this.targetY - this.y) * t

      // Snap when close enough
      const dx = Math.abs(this.targetX - this.x)
      const dy = Math.abs(this.targetY - this.y)
      if (dx < 0.01 && dy < 0.01) {
        this.x = this.targetX
        this.y = this.targetY
        this.targetX = null
        this.targetY = null
      }
    }

    // Camera shake decay
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt
      const progress = Math.max(0, this.shakeTimer / this.shakeDuration)
      const currentIntensity = this.shakeIntensity * progress
      this.shakeOffsetX = (Math.random() - 0.5) * 2 * currentIntensity
      this.shakeOffsetY = (Math.random() - 0.5) * 2 * currentIntensity
    } else {
      this.shakeOffsetX = 0
      this.shakeOffsetY = 0
    }
  }
}
