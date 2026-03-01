export type ParticleType = 'sparkle' | 'dust' | 'confetti' | 'error'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  type: ParticleType
}

const SPARKLE_COLORS = ['#ffd700', '#fff8dc', '#fffacd', '#ffffff', '#f0e68c']
const DUST_COLORS = ['#c4a882', '#b8976a', '#d2b48c', '#a0885a']
const CONFETTI_COLORS = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff', '#ff8800', '#88ff00']
const ERROR_COLORS = ['#ff3333', '#ff6633', '#ff4444', '#cc2200', '#ff5500']

export class ParticleSystem {
  particles: Particle[] = []

  emit(x: number, y: number, type: ParticleType, count: number): void {
    for (let i = 0; i < count; i++) {
      const particle = this.createParticle(x, y, type)
      this.particles.push(particle)
    }
  }

  private createParticle(x: number, y: number, type: ParticleType): Particle {
    switch (type) {
      case 'sparkle': {
        const colors = SPARKLE_COLORS
        return {
          x,
          y,
          vx: (Math.random() - 0.5) * 0.02,
          vy: -(Math.random() * 0.02 + 0.01), // float upward slowly
          life: 800 + Math.random() * 400,
          maxLife: 800 + Math.random() * 400,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2 + Math.random(),
          type
        }
      }
      case 'dust': {
        const colors = DUST_COLORS
        const angle = Math.random() * Math.PI * 2
        const speed = 0.01 + Math.random() * 0.02
        return {
          x,
          y,
          vx: Math.cos(angle) * speed, // scatter outward
          vy: Math.sin(angle) * speed,
          life: 400 + Math.random() * 200,
          maxLife: 400 + Math.random() * 200,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 1 + Math.random(),
          type
        }
      }
      case 'confetti': {
        const colors = CONFETTI_COLORS
        return {
          x,
          y,
          vx: (Math.random() - 0.5) * 0.04, // slight horizontal spread
          vy: -(Math.random() * 0.02 + 0.01), // start moving up, gravity will pull down
          life: 1500 + Math.random() * 500,
          maxLife: 1500 + Math.random() * 500,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2 + Math.random() * 2,
          type
        }
      }
      case 'error': {
        const colors = ERROR_COLORS
        const angle = Math.random() * Math.PI * 2
        const speed = 0.02 + Math.random() * 0.03
        return {
          x,
          y,
          vx: Math.cos(angle) * speed, // burst outward
          vy: Math.sin(angle) * speed,
          life: 600 + Math.random() * 300,
          maxLife: 600 + Math.random() * 300,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2 + Math.random(),
          type
        }
      }
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]

      // Apply velocity
      p.x += p.vx * dt
      p.y += p.vy * dt

      // Apply gravity (only for confetti)
      if (p.type === 'confetti') {
        p.vy += 0.001 * dt
      }

      // Decrease life
      p.life -= dt

      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      // Calculate alpha — fade out in last 30% of life
      const lifeRatio = p.life / p.maxLife
      const alpha = lifeRatio <= 0.3 ? lifeRatio / 0.3 : 1.0

      ctx.globalAlpha = alpha

      switch (p.type) {
        case 'sparkle':
          this.drawCross(ctx, p)
          break
        case 'dust':
          this.drawRect(ctx, p)
          break
        case 'confetti':
          this.drawConfetti(ctx, p)
          break
        case 'error':
          this.drawCross(ctx, p)
          break
      }
    }

    ctx.globalAlpha = 1.0
  }

  /** Cross shape: center pixel + 4 cardinal directions (5 pixels total) */
  private drawCross(ctx: CanvasRenderingContext2D, p: Particle): void {
    const x = Math.round(p.x)
    const y = Math.round(p.y)
    const s = Math.round(p.size)

    ctx.fillStyle = p.color
    // Center
    ctx.fillRect(x, y, s, s)
    // Cardinal directions
    ctx.fillRect(x - s, y, s, s) // left
    ctx.fillRect(x + s, y, s, s) // right
    ctx.fillRect(x, y - s, s, s) // up
    ctx.fillRect(x, y + s, s, s) // down
  }

  /** Single filled rect */
  private drawRect(ctx: CanvasRenderingContext2D, p: Particle): void {
    const x = Math.round(p.x)
    const y = Math.round(p.y)
    const s = Math.round(p.size)

    ctx.fillStyle = p.color
    ctx.fillRect(x, y, s, s)
  }

  /** 2x2 or 3x3 filled rect for confetti */
  private drawConfetti(ctx: CanvasRenderingContext2D, p: Particle): void {
    const x = Math.round(p.x)
    const y = Math.round(p.y)
    const s = Math.round(p.size)

    ctx.fillStyle = p.color
    ctx.fillRect(x, y, s, s)
  }
}
