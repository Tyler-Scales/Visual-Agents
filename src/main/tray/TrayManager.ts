import { Tray, Menu, nativeImage, type BrowserWindow } from 'electron'

export class TrayManager {
  private tray: Tray | null = null
  private win: BrowserWindow

  constructor(win: BrowserWindow) {
    this.win = win
  }

  create(): void {
    // Create a small 16x16 icon programmatically
    const icon = nativeImage.createEmpty()
    // Use a template image for macOS menu bar (monochrome)
    const size = 16
    const canvas = Buffer.alloc(size * size * 4) // RGBA

    // Draw a simple pixel art face
    const setPixel = (x: number, y: number, r: number, g: number, b: number, a = 255) => {
      if (x < 0 || x >= size || y < 0 || y >= size) return
      const offset = (y * size + x) * 4
      canvas[offset] = r
      canvas[offset + 1] = g
      canvas[offset + 2] = b
      canvas[offset + 3] = a
    }

    // Head outline
    for (let x = 4; x <= 11; x++) {
      setPixel(x, 2, 0, 0, 0)
      setPixel(x, 11, 0, 0, 0)
    }
    for (let y = 3; y <= 10; y++) {
      setPixel(3, y, 0, 0, 0)
      setPixel(12, y, 0, 0, 0)
    }

    // Fill head
    for (let y = 3; y <= 10; y++) {
      for (let x = 4; x <= 11; x++) {
        setPixel(x, y, 100, 140, 220)
      }
    }

    // Eyes
    setPixel(6, 6, 255, 255, 255)
    setPixel(9, 6, 255, 255, 255)

    // Body
    for (let x = 5; x <= 10; x++) {
      for (let y = 12; y <= 14; y++) {
        setPixel(x, y, 80, 120, 200)
      }
    }

    const image = nativeImage.createFromBuffer(canvas, {
      width: size,
      height: size
    })
    image.setTemplateImage(true)

    this.tray = new Tray(image)
    this.tray.setToolTip('Visual Agents')
    this.updateMenu(0)

    this.tray.on('click', () => {
      if (this.win.isVisible()) {
        this.win.hide()
      } else {
        this.win.show()
        this.win.focus()
      }
    })
  }

  updateMenu(agentCount: number): void {
    if (!this.tray) return

    const menu = Menu.buildFromTemplate([
      {
        label: `Visual Agents (${agentCount} active)`,
        enabled: false
      },
      { type: 'separator' },
      {
        label: this.win.isVisible() ? 'Hide Window' : 'Show Window',
        click: () => {
          if (this.win.isVisible()) {
            this.win.hide()
          } else {
            this.win.show()
            this.win.focus()
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          this.win.destroy()
        }
      }
    ])

    this.tray.setContextMenu(menu)
  }

  destroy(): void {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
    }
  }
}
