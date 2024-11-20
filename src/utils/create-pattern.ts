export default function createPattern() {
  const patternCanvas = document.createElement('canvas')
  patternCanvas.width = 8
  patternCanvas.height = 8
  const patternContext = patternCanvas.getContext('2d')!

  // 棋盘格
  // patternContext.fillStyle = '#E6E8EC'
  // patternContext.fillRect(0, 0, 8, 8)
  // patternContext.fillStyle = '#B1B5C3'
  // patternContext.fillRect(0, 0, 4, 4)
  // patternContext.fillRect(4, 4, 8, 8)

  // 红色画笔
  patternContext.fillStyle = 'rgba(239, 70, 111, 0.56)'
  patternContext.fillRect(0, 0, 8, 8)

  // Create our primary canvas and fill it with the pattern
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const pattern = ctx.createPattern(patternCanvas, 'repeat')
  return pattern
}
