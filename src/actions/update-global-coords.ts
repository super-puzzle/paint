import Paint from '..'
import BaseAction from './base'

export default class UpdateGlobalCoords extends BaseAction {
  oldMoveX = 0
  oldMoveY = 0
  constructor(readonly moveX: number, readonly moveY: number) {
    super('update-global-coordinate')
  }

  do(paint: Paint) {
    super.do(paint)

    this.oldMoveX = paint.ctx.move.x
    this.oldMoveY = paint.ctx.move.y
    paint.ctx.move.x = this.moveX
    paint.ctx.move.y = this.moveY

    paint.layersManager?.render(false)
  }

  undo(paint: Paint) {
    super.undo(paint)

    paint.ctx.move.x = this.oldMoveX
    paint.ctx.move.y = this.oldMoveY
    this.oldMoveX = 0
    this.oldMoveY = 0

    paint.layersManager?.render(false)
  }

  free() {}
}
