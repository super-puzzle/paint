import { Context } from './types'

export function newContext($el?: HTMLCanvasElement): Context {
  const dpr = 2
  const canvasRect = $el?.getBoundingClientRect()

  return {
    DPR: dpr,
    WIDTH: (canvasRect?.width || 0) * dpr,
    HEIGHT: (canvasRect?.height || 0) * dpr,
    layer: null,
    layerAutoIncr: 1,
    layers: [],
    needRender: false,
    lineWidth: 10,
    mouse: {
      x: -1,
      y: -1,
      lastX: -1,
      lastY: -1,
      clickX: -1,
      clickY: -1,
      isDrag: false,
      valid: false,
      clickValid: false,
      touchPointsLength: 0,
    },
    tool: {
      name: '',
    },
    zoom: {
      x: 0,
      y: 0,
      multiple: 100,
    },
    move: {
      x: 0,
      y: 0,
    },
    bottomImage: null,
    pattern: null,
    preloadMaskImage: null,
  }
}
