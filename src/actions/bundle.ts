import Paint from '..'
import BaseAction from './base'

export default class BundleAction extends BaseAction {
  constructor(private bundleId: string, private actions: BaseAction[]) {
    super(bundleId)
  }

  do(paint: Paint) {
    super.do(paint)

    let i = 0
    let err = null
    for (i = 0; i < this.actions.length; i++) {
      try {
        this.actions[i].do(paint)
      } catch (e) {
        err = e
        break
      }
    }

    if (err) {
      for (i--; i >= 0; i--) {
        this.actions[i].undo(paint)
      }
      throw err
    }

    paint.layersManager?.render(true)
  }

  undo(paint: Paint) {
    super.undo(paint)
    for (let i = this.actions.length - 1; i >= 0; i--) {
      this.actions[i].undo(paint)
    }
    paint.layersManager?.render(true)
  }

  free() {
    for (let action of this.actions) {
      action.free()
    }
    this.actions = []
  }
}
