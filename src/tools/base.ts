import Paint from '..'

class BaseTool {
  isBaseTool: boolean = false
  isDrag: boolean = false
  mouseClickPos: [number, number] = [-1, -1]
  mouseMoveLast: [number, number] = [-1, -1]
  mouseValid = false
  mouseClickValid = false
  isTouch: boolean = false
  name = 'base'

  constructor(isBase: boolean, readonly paint: Paint) {
    this.isDrag = this.paint.ctx.mouse.isDrag

    // only the base tool save the mouse pos, other inherited tool just use it.
    if (isBase) {
      this.isBaseTool = true
    }

    this.paint = paint
    this.bindEvents()
  }

  bindEvents() {
    this.paint.addEventToPool(document, 'mousedown', event => {
      if (this.isTouch === true) {
        return
      }
      this.dragStart(event as MouseEvent | TouchEvent)
    })
    this.paint.addEventToPool(document, 'mousemove', event => {
      if (this.isTouch === true) {
        return
      }
      this.dragMove(event as MouseEvent | TouchEvent)
    })
    this.paint.addEventToPool(document, 'mouseup', event => {
      if (this.isTouch === true) {
        return
      }
      this.dragEnd(event as MouseEvent | TouchEvent)
    })
    this.paint.addEventToPool(document, 'touchstart', event => {
      this.isTouch = true
      this.dragStart(event as MouseEvent | TouchEvent)
    })
    this.paint.addEventToPool(document, 'touchmove', event => {
      this.dragMove(event as MouseEvent | TouchEvent)
    })
    this.paint.addEventToPool(document, 'touchend', event => {
      this.dragEnd(event as MouseEvent | TouchEvent)
    })
  }

  dragStart(event: MouseEvent | TouchEvent) {
    let mouse = this.getMouseInfo(event)
    this.mouseClickPos[0] = mouse.x
    this.mouseClickPos[1] = mouse.y
    this.isDrag = true

    // again, use mosue.x, mouse.y to update the lastX, lastY, clickX, clickY
    // and set isDrag with true
    this.setMouseInfo(event)
  }

  dragMove(event: MouseEvent | TouchEvent) {
    this.setMouseInfo(event)
  }

  dragEnd(event: MouseEvent | TouchEvent) {
    this.isDrag = false
    this.setMouseInfo(event)
  }

  getMouseInfo(event?: MouseEvent | TouchEvent) {
    if (typeof event !== 'undefined') {
      this.setMouseInfo(event)
    }

    return this.paint.ctx.mouse
  }

  setMouseInfo(event: MouseEvent | TouchEvent) {
    if (this.isBaseTool !== true) {
      return false
    }

    if ((event.target as any) !== this.paint.$el) {
      this.mouseValid = false
    } else {
      this.mouseValid = true
    }

    if (event.type === 'mousedown' || event.type === 'touchstart') {
      if (
        (event.target as any) !== this.paint.$el ||
        (event.type !== 'touchstart' && (event as MouseEvent).button !== 0)
      ) {
        this.mouseClickValid = false
      } else {
        this.mouseClickValid = true
      }
    }

    let rawCoords = { pageX: 0, pageY: 0 }
    if ((event as TouchEvent)?.changedTouches) {
      rawCoords = (event as TouchEvent)?.changedTouches[0]
    } else {
      rawCoords = event as MouseEvent
    }

    const { x: mouseX, y: mouseY } =
      this.getMouseCoordinatedFromEvent(rawCoords)

    this.paint.ctx.mouse = {
      x: mouseX,
      y: mouseY,
      lastX: this.mouseMoveLast[0],
      lastY: this.mouseMoveLast[1],
      clickX: this.mouseClickPos[0],
      clickY: this.mouseClickPos[1],
      isDrag: this.isDrag,
      valid: this.mouseValid,
      clickValid: this.mouseClickValid,
      touchPointsLength:
        [].slice.call((event as TouchEvent)?.touches || []).length || 0,
    }

    if (event.type === 'mousemove' || event.type === 'touchmove') {
      this.mouseMoveLast[0] = mouseX
      this.mouseMoveLast[1] = mouseY
    }
  }

  getMouseCoordinatedFromEvent(event: { pageX: number; pageY: number }) {
    const relativeX =
      (event.pageX - this.paint.gui!.canvasOffset.x) * this.paint.ctx.DPR
    const relativeY =
      (event.pageY - this.paint.gui!.canvasOffset.y) * this.paint.ctx.DPR

    //
    const canvasPos = this.paint.layersManager!.getWorldCoords(
      relativeX,
      relativeY
    )

    return canvasPos
  }

  getLayerHash() {
    const layer = this.paint.ctx.layer
    if (!layer) return ''
    const { lineWidth, color, opacity } = layer
    return `${lineWidth}-${color}-${opacity}`
  }

  showMouseCursor(x: number, y: number, size: number, type: string) {
    // TODO
  }
}

export default BaseTool
