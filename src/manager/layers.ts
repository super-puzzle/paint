import Image from 'image-js'
import Paint from '..'
import { Layer } from '../types'

class LayersManager {
  canvas!: HTMLCanvasElement
  ctx!: CanvasRenderingContext2D
  lastZoom = 100
  autoIncrement = 1
  frameId = 0

  constructor(readonly paint: Paint) {
    const $el = paint.$el
    this.canvas = $el
    this.ctx = $el.getContext('2d')!
  }

  destroy() {
    cancelAnimationFrame(this.frameId)

    // reset zoom
    // TODO 在zoomView做这件事情, 重置他的矩阵
    this.paint.zoomView.scaleAt(
      this.paint.ctx.zoom.x,
      this.paint.ctx.zoom.y,
      1 / this.paint.ctx.zoom.multiple
    )
  }

  init() {
    this.paint.zoomView.setContext(this.ctx)
    this.paint.zoomView.setBounds(
      0,
      0,
      this.paint.ctx.WIDTH,
      this.paint.ctx.HEIGHT
    )
    this.render(true)
  }

  render(force?: boolean) {
    if (force === true) {
      this.paint.ctx.needRender = true
    }

    if (this.paint.ctx.needRender === true) {
      this.preRender()

      const sortedLayers = this.getSortedLayers()
      this.renderObjects(this.ctx, sortedLayers)

      this.renderBottomImage(this.ctx)
      // 定位角 debug 用
      // this.ctx.save()
      // this.ctx.fillStyle = 'red'
      // this.ctx.fillRect(0, 0, 100, 100)
      // this.ctx.fillRect(540, 0, 100, 100)
      // this.ctx.fillRect(0, 226, 100, 100)
      // this.ctx.fillRect(540, 226, 100, 100)
      // this.ctx.restore()
      this.afterRender()
      this.lastZoom = this.paint.ctx.zoom.multiple

      this.paint.emitter.emit('canvasUpdate')
    }

    this.frameId = requestAnimationFrame(() => {
      this.render(false)
    })
  }

  preRender() {
    this.paint.zoomView.scaleAt(
      this.paint.ctx.zoom.x,
      this.paint.ctx.zoom.y,
      this.paint.ctx.zoom.multiple / this.lastZoom
    )
    this.paint.zoomView.move(this.paint.ctx.move.x, this.paint.ctx.move.y)
    // reset move
    this.paint.ctx.move.x = 0
    this.paint.ctx.move.y = 0
    this.paint.zoomView.apply()

    this.ctx.save()
    this.ctx.clearRect(0, 0, this.paint.ctx.WIDTH, this.paint.ctx.HEIGHT)
  }

  afterRender() {
    this.ctx.restore()
    this.paint.ctx.needRender = false
  }

  // 绘制底图
  renderBottomImage(canvasCtx: CanvasRenderingContext2D) {
    if (!this.paint.ctx.bottomImage) {
      return
    }

    const imgW = this.paint.ctx.bottomImage.naturalWidth
    const imgH = this.paint.ctx.bottomImage.naturalHeight
    const canvasW = this.paint.ctx.WIDTH
    const canvasH = this.paint.ctx.HEIGHT

    let drawW = imgW
    let drawH = imgH

    if (imgW / imgH > canvasW / canvasH) {
      drawW = canvasW
      drawH = (canvasW / imgW) * imgH
    } else {
      drawW = (canvasH / imgH) * imgW
      drawH = canvasH
    }

    canvasCtx.save()
    canvasCtx.translate(this.paint.ctx.WIDTH / 2, this.paint.ctx.HEIGHT / 2)
    canvasCtx.globalCompositeOperation = 'destination-over'
    canvasCtx.drawImage(
      this.paint.ctx.bottomImage,
      -drawW / 2,
      -drawH / 2,
      drawW,
      drawH
    )
    canvasCtx.restore()

    // 根据图片坐标，绘制全局的 mask，只展示 mask 后的 canvas
    canvasCtx.save()
    canvasCtx.translate(this.paint.ctx.WIDTH / 2, this.paint.ctx.HEIGHT / 2)
    canvasCtx.globalCompositeOperation = 'destination-in'
    canvasCtx.fillStyle = 'rgba(255, 255, 255, 1)'
    canvasCtx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH)
    canvasCtx.restore()
  }

  saveMaskCanvas(
    fillColor: string = '#000000',
    maskColor: [number, number, number, number] = [255, 255, 255, 255]
  ) {
    const newCanvas = document.createElement('canvas')
    newCanvas.width = this.canvas.width
    newCanvas.height = this.canvas.height
    const newCtx = newCanvas.getContext('2d')!

    newCtx.save()
    newCtx.fillStyle = fillColor
    newCtx.fillRect(0, 0, newCanvas.width, newCanvas.height)
    const sortedLayers = this.getSortedLayers()
    const newLayers = sortedLayers.map(item => {
      if (item.type === 'brush') {
        return {
          ...item,
          color: `rgba(${maskColor.slice(0, 3).join(',')}, ${
            maskColor[3] / 255
          })`,
        }
      }
      if (item.type === 'image' && item.linkCanvas) {
        const maskCanvas = document.createElement('canvas')
        maskCanvas.width = item.width
        maskCanvas.height = item.height
        const maskCtx = maskCanvas.getContext('2d')!
        const linkCtx = item.linkCanvas.getContext('2d')!
        const oldData = linkCtx.getImageData(0, 0, item.width, item.height)
        const newData = new Uint8ClampedArray(oldData.data.length)
        /**
         * 将蒙版颜色转化为白色
         * 其他色转为透明
         */
        for (let i = 0; i < oldData.data.length; i += 4) {
          const r = oldData.data[i]
          const g = oldData.data[i + 1]
          const b = oldData.data[i + 2]
          const a = oldData.data[i + 3]
          if (r + g + b + a !== 0) {
            newData[i] = maskColor[0]
            newData[i + 1] = maskColor[1]
            newData[i + 2] = maskColor[2]
            newData[i + 3] = maskColor[3]
          } else {
            newData[i] = 0
            newData[i + 1] = 0
            newData[i + 2] = 0
            newData[i + 3] = 0
          }
        }
        maskCtx.save()
        maskCtx.putImageData(
          new ImageData(newData, item.width, item.height),
          0,
          0
        )
        maskCtx.restore()
        return {
          ...item,
          linkCanvas: maskCanvas,
        }
      }
      return item
    })
    this.renderObjects(newCtx, newLayers)
    newCtx.restore()

    return newCanvas
  }

  saveMask() {
    if (this.paint.ctx.bottomImage === null) {
      return
    }

    const newCanvas = this.saveMaskCanvas()

    /** save image */
    const imgW = this.paint.ctx.bottomImage.naturalWidth
    const imgH = this.paint.ctx.bottomImage.naturalHeight
    const canvasW = Math.floor(newCanvas.width)
    const canvasH = Math.floor(newCanvas.height)
    let drawW = imgW
    let drawH = imgH
    if (imgW / imgH > canvasW / canvasH) {
      drawW = canvasW
      drawH = (canvasW / imgW) * imgH
    } else {
      drawW = (canvasH / imgH) * imgW
      drawH = canvasH
    }
    let srcX = canvasW / 2 - drawW / 2
    let srcY = canvasH / 2 - drawH / 2
    srcX = Math.max(0, srcX)
    srcY = Math.max(0, srcY)
    drawW = Math.min(drawW, canvasW)
    drawH = Math.min(drawH, canvasH)
    const image = Image.fromCanvas(newCanvas)
    let newImage = image.crop({
      x: srcX,
      y: srcY,
      width: drawW,
      height: drawH,
    })
    newImage = newImage.resize({ width: imgW, height: imgH })
    return newImage.toBlob()
  }

  getSortedLayers() {
    return this.paint.ctx.layers.concat().sort(
      //sort function
      (a, b) => b.order - a.order
    )
  }

  renderObjects(
    ctx: CanvasRenderingContext2D,
    layers: Layer[],
    shouldSkip?: () => boolean
  ) {
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i]

      if (shouldSkip?.()) {
        continue
      }

      ctx.globalAlpha = layer.opacity / 100
      ctx.globalCompositeOperation = layer.globalCompositeOperation
      this.renderObject(ctx, layer)
    }
  }

  renderObject(ctx: CanvasRenderingContext2D, layer: Layer) {
    if (layer.visible === false || layer.type === null) return

    if (layer.type === 'image') {
      ctx.save()
      ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2)
      ctx.rotate((layer.rotate / 180) * Math.PI)
      ctx.drawImage(
        layer.linkCanvas ? layer.linkCanvas : layer.link!,
        -layer.width / 2,
        -layer.height / 2,
        layer.width,
        layer.height
      )
      ctx.restore()
    } else {
      layer.render?.(ctx, layer)
    }
  }

  getWorldCoords(x: number, y: number) {
    return this.paint.zoomView.toWorld(x, y)
  }

  getLayer(id: number) {
    if (!id) {
      return this.paint.ctx.layer
    }
    for (let i in this.paint.ctx.layers) {
      if (this.paint.ctx.layers[i].id === id) {
        return this.paint.ctx.layers[i]
      }
    }
    return null
  }
}

export default LayersManager
