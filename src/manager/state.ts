import Paint from '..'
import BaseAction from '../actions/base'

class State {
  actionHistoryIndex: number = 0
  actionHistory: BaseAction[] = []
  actionHistoryMax = 50
  paint: Paint

  constructor(paint: Paint) {
    this.paint = paint
  }

  async doAction(action: BaseAction) {
    try {
      action.do(this.paint)
    } catch (error) {
      return { status: 'aborted', reason: error }
    }

    // remove all redo actions
    if (this.actionHistoryIndex < this.actionHistory.length) {
      const actionsToFree = this.actionHistory
        .slice(this.actionHistoryIndex, this.actionHistory.length)
        .reverse()
      this.actionHistory = this.actionHistory.slice(0, this.actionHistoryIndex)
      for (let actionToFree of actionsToFree) {
        actionToFree.free()
      }
    }

    this.actionHistory.push(action)
    if (this.actionHistory.length > this.actionHistoryMax) {
      let actionToFree = this.actionHistory.shift()
      actionToFree?.free()
    } else {
      this.actionHistoryIndex++
    }
    return { status: 'completed' }
  }

  canRedo() {
    return this.actionHistoryIndex < this.actionHistory.length
  }

  canUndo() {
    return this.actionHistoryIndex > 0
  }

  redoAction() {
    if (this.canUndo()) {
      const action = this.actionHistory[this.actionHistoryIndex]
      action.do(this.paint)
      this.actionHistoryIndex++
    }
  }

  undoAction() {
    if (this.canUndo()) {
      this.actionHistoryIndex--
      this.actionHistory[this.actionHistoryIndex].undo(this.paint)
    }
  }
}

export default State
