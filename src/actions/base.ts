import Paint from '..'

export default class BaseAction {
  constructor(readonly actionId: string, public isDown: boolean = false) {
    this.actionId = actionId
  }

  do(paint: Paint) {
    this.isDown = true
  }

  undo(paint: Paint) {
    this.isDown = false
  }

  free() {}
}
