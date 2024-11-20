export interface Layer {
  id: number
  type: 'image' | 'brush' | 'erase' | null
  order: number
  globalCompositeOperation: CanvasRenderingContext2D['globalCompositeOperation']
  // dimension
  x: number
  y: number
  width: number
  height: number
  /** 旋转角度 0 - 360 */
  rotate: number
  data: [x: number, y: number][][]

  /** :: 下面的配置影响绘图，决定是否新起一个layer */
  /** 不透明度 0 - 100 */
  opacity: number
  lineWidth: number
  color: string | CanvasPattern
  /** :: */

  visible?: boolean
  linkCanvas?: HTMLCanvasElement | null
  link?: HTMLImageElement | null
  render?: (ctx: CanvasRenderingContext2D, layer: Layer) => void
}

export interface Mouse {
  x: number
  y: number
  lastX: number
  lastY: number
  clickX: number
  clickY: number
  valid: boolean
  isDrag: boolean
  clickValid: boolean
  touchPointsLength: number
}

export interface Tool {
  name: string
}

export interface Context {
  DPR: number
  WIDTH: number
  HEIGHT: number
  layer: Layer | null
  layerAutoIncr: number
  layers: Layer[]
  needRender: boolean
  lineWidth: number
  mouse: Mouse
  tool: Tool
  zoom: {
    x: number
    y: number
    multiple: number
  }
  move: {
    x: number
    y: number
  }
  bottomImage: HTMLImageElement | null
  pattern: CanvasPattern | null
  preloadMaskImage: HTMLImageElement | null
}
