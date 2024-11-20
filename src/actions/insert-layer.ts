import Paint from '..'
import { Layer } from '../types'
import BaseAction from './base'

export default class InsertLayerAction extends BaseAction {
  previousLayer: Layer | null = null
  constructor(private settings: Partial<Layer>) {
    super('insert_layer')
  }

  do(paint: Paint) {
    super.do(paint)

    this.previousLayer = paint.ctx.layer

    const defaultLayer: Layer = {
      id: paint.ctx.layerAutoIncr,
      type: null,
      order: paint.ctx.layerAutoIncr,
      opacity: 100,
      globalCompositeOperation: 'source-over',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      rotate: 0,
      lineWidth: 10,
      color: paint.ctx.pattern || '#ffffff',
      data: [[]],
    }

    const layer = { ...defaultLayer, ...this.settings }

    paint.ctx.layers.push(layer)
    paint.ctx.layerAutoIncr++
    paint.ctx.layer = layer

    paint.layersManager?.render(false)
  }

  undo(paint: Paint) {
    super.undo(paint)

    paint.ctx.layers.pop()
    paint.ctx.layer = this.previousLayer
    this.previousLayer = null

    paint.layersManager?.render(false)
  }

  free() {
    this.previousLayer = null
  }
}
