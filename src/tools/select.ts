import Paint from '..'
import BundleAction from '../actions/bundle'
import UpdateGlobalCoords from '../actions/update-global-coords'
import BaseTool from './base'

class Select extends BaseTool {
  name: 'select' = 'select'
  moving = false
  cacheX = 0
  cacheY = 0

  constructor(paint: Paint) {
    super(false, paint)
  }

  dragStart(event: MouseEvent | TouchEvent): void {
    if (this.paint.ctx.tool.name !== this.name) return

    const mouse = this.getMouseInfo()
    if (!mouse.isDrag) {
      return
    }
    if (!mouse.clickValid) {
      return
    }
    if (mouse.touchPointsLength > 1) {
      return
    }

    this.cacheX = this.paint.ctx.move.x
    this.cacheY = this.paint.ctx.move.y
  }

  dragMove(event: MouseEvent | TouchEvent): void {
    if (this.paint.ctx.tool.name !== this.name) return

    const mouse = this.getMouseInfo()
    if (!mouse.isDrag) {
      return
    }
    if (!mouse.clickValid) {
      return
    }
    if (mouse.touchPointsLength > 1) {
      return
    }

    this.paint.ctx.move.x = Math.round(mouse.x - mouse.clickX) + this.cacheX
    this.paint.ctx.move.y = Math.round(mouse.y - mouse.clickY) + this.cacheY

    this.paint.layersManager?.render(false)
  }

  dragEnd(event: MouseEvent | TouchEvent): void {
    if (this.paint.ctx.tool.name !== this.name) return

    const mouse = this.getMouseInfo()
    if (!mouse.isDrag) {
      return
    }
    if (!mouse.clickValid) {
      return
    }
    if (mouse.touchPointsLength > 1) {
      return
    }

    // 让 action 缓存老的坐标，方便redo
    this.paint.ctx.move.x = this.cacheX
    this.paint.ctx.move.y = this.cacheY

    const newX = Math.round(mouse.x - mouse.clickX + this.cacheX)
    const newY = Math.round(mouse.y - mouse.clickY + this.cacheY)

    if (newX !== this.cacheX || newY !== this.cacheY) {
      this.paint.state?.doAction(
        new BundleAction('move_layer', [new UpdateGlobalCoords(newX, newY)])
      )
    }

    this.paint.layersManager?.render(false)
  }
}

export default Select
