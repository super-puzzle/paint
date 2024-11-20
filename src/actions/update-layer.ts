import Paint from '..'
import { Layer } from '../types'
import BaseAction from './base'

export default class UpdateLayerAction extends BaseAction {
  oldSettings: Partial<Layer> = {}
  referenceLayer: Layer | null = null
  constructor(readonly layerId: number, private settings: Partial<Layer>) {
    super('update_layer')
  }

  do(paint: Paint) {
    super.do(paint)
    this.referenceLayer = paint.layersManager!.getLayer(this.layerId)
    if (!this.referenceLayer) return
    for (let _i in this.settings) {
      let i = _i as keyof Layer
      if (i === 'id' || i === 'order') {
        continue
      }
      this.oldSettings[i] = this.referenceLayer![i] as any
      //@ts-ignore-next
      this.referenceLayer[i] = this.settings[i] as any
    }

    paint.layersManager?.render(false)
  }

  undo(paint: Paint) {
    super.undo(paint)
    if (!this.referenceLayer) return
    for (let i in this.oldSettings) {
      // @ts-ignore-next
      this.referenceLayer[i] = this.oldSettings[i]
    }
    this.oldSettings = {}
    this.referenceLayer = null
    paint.layersManager?.render(false)
  }

  free() {
    this.oldSettings = {}
    this.settings = {}
    this.referenceLayer = null
  }
}
