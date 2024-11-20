import BundleAction from './actions/bundle'
import InsertLayerAction from './actions/insert-layer'
import UpdateLayerAction from './actions/update-layer'
import { newContext } from './ctx'
import Cursor from './manager/cursor'
import Gui from './manager/gui'
import LayersManager from './manager/layers'
import State from './manager/state'
import BaseTool from './tools/base'
import Brush from './tools/brush'
import Erase from './tools/erase'
import Select from './tools/select'
import createPattern from './utils/create-pattern'
import mitt from './utils/event'
import { zoomView } from './utils/zoomView'

class Paint {
  //
  ctx = newContext()
  zoomView = zoomView()

  //
  domEventPool: [
    HTMLElement | Document | Window,
    string,
    (event: Event) => void
  ][] = []

  // component
  gui = new Gui(this)
  layersManager = new LayersManager(this)
  state = new State(this)
  cursor = new Cursor(this)
  emitter = mitt()

  // tools
  baseTool = new BaseTool(true, this)
  brushTool = new Brush(this)
  eraseTool = new Erase(this)
  selectTool = new Select(this)

  constructor(
    public readonly $el: HTMLCanvasElement,
    public readonly $cursorEl: HTMLElement
  ) {
    this.ctx = newContext(this.$el)
    this.ctx.pattern = createPattern()
    this.layersManager.init()
    this.bindEvents()
  }

  /** 内部method */

  addEventToPool(
    dom: HTMLElement | Document | Window,
    eventType: string,
    func: (event: Event) => void
  ) {
    this.domEventPool.push([dom, eventType, func])
  }

  bindEvents() {
    this.domEventPool.map(item => {
      const [$dom, eventtype, func] = item
      $dom.addEventListener(eventtype, func)
    })
  }

  unbindEvents() {
    this.domEventPool.forEach(item => {
      const [$dom, eventtype, func] = item
      $dom.removeEventListener(eventtype, func)
    })

    this.domEventPool = []
  }

  resetCtx() {
    this.ctx = newContext(this.$el)
    this.ctx.pattern = createPattern()
  }

  /** api */

  selectBrush() {
    this.ctx.tool.name = 'brush'
  }

  selectErase() {
    this.ctx.tool.name = 'erase'
  }

  selectSelect() {
    this.ctx.tool.name = 'select'
  }

  setLineWidth(lineWidth: number) {
    this.ctx.lineWidth = lineWidth
  }

  zoomAtCenter(n: number) {
    this.gui?.centerZoom(n)
  }

  loadBottomImage(url: string) {
    this.resetCtx()
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      this.ctx.bottomImage = img
      this.ctx.needRender = true
    }
    img.src = url
  }

  loadMaskImage(url: string) {
    const MASK_LAYER_ID = 99999999

    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      this.ctx.preloadMaskImage = img
      this.ctx.needRender = true

      const newCanvas = this.convertImageToMaskCanvas(img)

      const layer = {
        id: MASK_LAYER_ID,
        type: 'image' as const,
        linkCanvas: newCanvas,
        x: 0,
        y: 0,
        width: this.ctx.WIDTH,
        height: this.ctx.HEIGHT,
      }
      this.state.doAction(
        new BundleAction('insert_preload_mask_layer', [
          new InsertLayerAction(layer),
        ])
      )
    }
    img.src = url
  }

  reloadMaskImage(url: string) {
    const MASK_LAYER_ID = 99999999

    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      this.ctx.preloadMaskImage = img
      this.ctx.needRender = true

      const newCanvas = this.convertImageToMaskCanvas(img)

      const layer = {
        id: MASK_LAYER_ID,
        type: 'image' as const,
        linkCanvas: newCanvas,
        x: 0,
        y: 0,
        width: this.ctx.WIDTH,
        height: this.ctx.HEIGHT,
      }
      this.state.doAction(
        new BundleAction('insert_preload_mask_layer', [
          new UpdateLayerAction(layer.id, layer),
        ])
      )
    }
    img.src = url
  }

  private convertImageToMaskCanvas(img: HTMLImageElement) {
    const newCanvas = document.createElement('canvas')
    const w = this.ctx.WIDTH
    const h = this.ctx.HEIGHT
    newCanvas.width = w
    newCanvas.height = h
    const newCtx = newCanvas.getContext('2d')!
    const imgW = img.naturalWidth
    const imgH = img.naturalHeight
    let drawW = imgW
    let drawH = imgH
    if (imgW / imgH > w / h) {
      drawW = w
      drawH = (w / imgW) * imgH
    } else {
      drawW = (h / imgH) * imgW
      drawH = h
    }
    newCtx.save()
    newCtx.translate(w / 2, h / 2)
    newCtx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
    newCtx.restore()
    const oldData = newCtx.getImageData(0, 0, w, h)
    const newData = new Uint8ClampedArray(oldData.data.length)

    /**
     * 将颜色数据转化为蒙版
     * 其他色转为透明
     */
    for (let i = 0; i < oldData.data.length; i += 4) {
      const r = oldData.data[i]
      const g = oldData.data[i + 1]
      const b = oldData.data[i + 2]
      const a = oldData.data[i + 3]
      if (r + g + b + a > 255 * 3) {
        newData[i] = 239
        newData[i + 1] = 70
        newData[i + 2] = 111
        newData[i + 3] = 143
      } else {
        newData[i] = 0
        newData[i + 1] = 0
        newData[i + 2] = 0
        newData[i + 3] = 0
      }
    }

    newCtx.save()
    newCtx.globalCompositeOperation = 'copy'
    newCtx.putImageData(new ImageData(newData, w, h), 0, 0)
    newCtx.restore()

    return newCanvas
  }

  saveMask() {
    return this.layersManager?.saveMask()
  }

  back() {
    this.state?.undoAction()
  }

  reset() {
    const bottomImage = this.ctx.bottomImage
    this.resetCtx()
    this.ctx.bottomImage = bottomImage
    this.ctx.needRender = true
  }

  onZoom(handler: (zoom: number) => void) {
    this.emitter.on('zoom', handler as any)
  }

  destroy() {
    this.emitter.off('zoom')
    this.layersManager?.destroy()
    this.unbindEvents()
  }
}

export default Paint
