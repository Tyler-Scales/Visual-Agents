export type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'night'

export interface LightingState {
  ambientTint: string     // color overlay
  ambientOpacity: number  // overlay opacity (0-0.4)
  shadowIntensity: number // 0-1
  lampGlow: boolean       // whether desk lamps are lit
  screenGlow: number      // monitor glow intensity (0-1)
  timeOfDay: TimeOfDay    // current time period
}

export class DayNightCycle {
  private currentLighting: LightingState

  constructor() {
    this.currentLighting = this.calculateLighting()
  }

  /** Get the current time of day based on system clock */
  getTimeOfDay(): TimeOfDay {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 8) return 'dawn'
    if (hour >= 8 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 20) return 'dusk'
    return 'night'
  }

  /** Get the current lighting state */
  getLighting(): LightingState {
    return this.currentLighting
  }

  /** Recalculate lighting based on current hour — call in game loop */
  update(): void {
    this.currentLighting = this.calculateLighting()
  }

  private calculateLighting(): LightingState {
    const timeOfDay = this.getTimeOfDay()
    const hour = new Date().getHours()
    const minutes = new Date().getMinutes()

    switch (timeOfDay) {
      case 'dawn': {
        // 5-8: warm orange tint, low opacity, transitioning to clear
        // Smoothly interpolate from night-ish to clear
        const progress = ((hour - 5) * 60 + minutes) / (3 * 60) // 0 to 1 over 3 hours
        return {
          ambientTint: '#ff9940',
          ambientOpacity: 0.08 * (1 - progress * 0.5), // 0.08 -> 0.04
          shadowIntensity: 0.3 + progress * 0.2,
          lampGlow: progress < 0.5, // lamps on first half of dawn
          screenGlow: 0.6 - progress * 0.3,
          timeOfDay,
        }
      }

      case 'morning': {
        // 8-12: clear, no tint
        return {
          ambientTint: '#ffffff',
          ambientOpacity: 0,
          shadowIntensity: 0.5,
          lampGlow: false,
          screenGlow: 0.3,
          timeOfDay,
        }
      }

      case 'afternoon': {
        // 12-17: slight warm yellow
        const progress = ((hour - 12) * 60 + minutes) / (5 * 60)
        return {
          ambientTint: '#ffdd88',
          ambientOpacity: 0.04 + progress * 0.02, // 0.04 -> 0.06
          shadowIntensity: 0.5 - progress * 0.1,
          lampGlow: false,
          screenGlow: 0.3 + progress * 0.1,
          timeOfDay,
        }
      }

      case 'dusk': {
        // 17-20: deep orange tint, increasing
        const progress = ((hour - 17) * 60 + minutes) / (3 * 60)
        return {
          ambientTint: '#ff6622',
          ambientOpacity: 0.08 + progress * 0.12, // 0.08 -> 0.20
          shadowIntensity: 0.4 - progress * 0.2,
          lampGlow: progress > 0.5, // lamps on second half of dusk
          screenGlow: 0.4 + progress * 0.3,
          timeOfDay,
        }
      }

      case 'night': {
        // 20-5: dark blue tint, lamp glows ON, screen glow high
        return {
          ambientTint: '#1a2244',
          ambientOpacity: 0.25,
          shadowIntensity: 0.2,
          lampGlow: true,
          screenGlow: 0.8,
          timeOfDay,
        }
      }
    }
  }
}
