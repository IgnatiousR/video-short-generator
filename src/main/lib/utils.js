import fs from 'fs'
import path from 'path'

function safeFileName(text) {
  return text
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 80)
}

export function getFontFileFilterOption(fontName = 'Inter') {
  const fontMap = {
    Inter: path.join(process.cwd(), 'src/main/fonts/Inter.ttf'),
    Poppins: path.join(process.cwd(), 'src/main/fonts/Poppins.ttf'),
    'Playfair Display': path.join(process.cwd(), 'src/main/fonts/Playfair.ttf')
  }

  let fontPath = fontMap[fontName]

  if (!fontPath || !fs.existsSync(fontPath)) {
    if (process.platform === 'win32') {
      fontPath = 'C:/Windows/Fonts/arial.ttf'
    } else if (process.platform === 'darwin') {
      fontPath = '/Library/Fonts/Arial.ttf'
    }
  }

  if (fontPath && fs.existsSync(fontPath)) {
    const relativeFont = path.relative(process.cwd(), fontPath).replace(/\\/g, '/')
    return `fontfile='${relativeFont}':`
  }
  return ''
}

export { safeFileName }
