import Paint from '..'
import BundleAction from '../actions/bundle'
import InsertLayerAction from '../actions/insert-layer'
import UpdateLayerAction from '../actions/update-layer'
import { Layer } from '../types'
import BaseTool from './base'

class Brush extends BaseTool {
  name: 'brush' = 'brush'
  layer?: Partial<Layer>

  constructor(paint: Paint) {
    super(false, paint)
  }

  dragStart(event: MouseEvent | TouchEvent) {
    if (this.paint.ctx.tool.name !== this.name) {
      return
    }

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

    const layerHash = this.getLayerHash()

    // 将要生成的layerHash
    const lineWidth = this.paint.ctx.lineWidth / this.paint.zoomView.getScale()
    let nextLayerHash = `${lineWidth}-${this.paint.ctx.layer?.color}-${this.paint.ctx.layer?.opacity}`

    // start new layer
    if (
      this.paint.ctx.layer?.type !== this.name ||
      layerHash !== nextLayerHash
    ) {
      this.layer = {
        type: this.name,
        x: 0,
        y: 0,
        width: this.paint.ctx.WIDTH,
        height: this.paint.ctx.HEIGHT,
        data: [[]],
        lineWidth: lineWidth,
        render: this.render.bind(this),
      }

      this.paint.state?.doAction(
        new BundleAction('new_brush_layer', [new InsertLayerAction(this.layer)])
      )
    } else {
      const newData = JSON.parse(JSON.stringify(this.paint.ctx.layer.data))
      newData.push([])
      this.paint.state?.doAction(
        new BundleAction('update_brush_layer', [
          new UpdateLayerAction(this.paint.ctx.layer.id, { data: newData }),
        ])
      )
    }

    const segmentData =
      this.paint.ctx.layer?.data[this.paint.ctx.layer.data.length - 1]
    // TODO fix me
    segmentData?.push([mouse.x, mouse.y])

    this.paint.layersManager?.render(true)
  }

  dragMove(event: MouseEvent | TouchEvent) {
    if (this.paint.ctx.tool.name !== this.name) {
      return
    }
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

    // TODO show mouse curror???

    const segmentData =
      this.paint.ctx.layer?.data[this.paint.ctx.layer.data.length - 1]
    // TODO fix me
    segmentData?.push([mouse.x, mouse.y])

    this.paint.layersManager?.render(true)
  }

  dragEnd(event: MouseEvent | TouchEvent) {
    if (this.paint.ctx.tool.name !== this.name) {
      return
    }
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

    this.paint.layersManager?.render(true)
  }

  render(ctx: CanvasRenderingContext2D, layer: Layer) {
    if (layer.data.length === 0) {
      return
    }

    ctx.save()
    ctx.fillStyle = layer.color
    ctx.strokeStyle = layer.color
    ctx.lineWidth = layer.lineWidth * this.paint.ctx.DPR
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.translate(layer.x, layer.y)

    const data = layer.data

    for (let i = 0; i < data.length; i++) {
      const segmentData = data[i]
      this.renderSegment(ctx, segmentData, layer)
    }

    ctx.translate(-layer.x, -layer.y)
    ctx.stroke()
    ctx.restore()
  }

  renderSegment(
    ctx: CanvasRenderingContext2D,
    segmentData: [x: number, y: number][],
    layer: Layer
  ) {
    var data = JSON.parse(JSON.stringify(segmentData))
    var n = data.length

    if (data.length == 1) {
      //point
      var point = data[0]
      ctx.beginPath()
      ctx.lineTo(point[0], point[1])
      ctx.lineTo(point[0] + 0.5, point[1])
      ctx.stroke()
      return
    } else if (data.length <= 5) {
      //not enough points yet

      for (var i = 1; i < n; i++) {
        ctx.beginPath()
        ctx.moveTo(data[i - 1][0], data[i - 1][1])
        ctx.lineTo(data[i][0], data[i][1])
        ctx.stroke()
      }
      return
    }

    //fix for loose ending, so lets duplicate last point
    data.push([data[n - 1][0], data[n - 1][1]])

    ctx.beginPath()
    ctx.moveTo(data[0][0], data[0][1])

    //prepare
    var temp_data1 = [data[0]]
    var c, d
    for (var i = 1; i < data.length - 1; i = i + 1) {
      c = (data[i][0] + data[i + 1][0]) / 2
      d = (data[i][1] + data[i + 1][1]) / 2
      temp_data1.push([c, d])
    }

    var temp_data2 = [temp_data1[0]]
    for (var i = 1; i < temp_data1.length - 1; i = i + 1) {
      c = (temp_data1[i][0] + temp_data1[i + 1][0]) / 2
      d = (temp_data1[i][1] + temp_data1[i + 1][1]) / 2
      temp_data2.push([c, d])
    }

    var temp_data = [temp_data2[0]]
    for (var i = 1; i < temp_data2.length - 1; i = i + 1) {
      c = (temp_data2[i][0] + temp_data2[i + 1][0]) / 2
      d = (temp_data2[i][1] + temp_data2[i + 1][1]) / 2
      temp_data.push([c, d])
    }

    //draw
    for (var i = 1; i < temp_data.length - 2; i = i + 1) {
      c = (temp_data[i][0] + temp_data[i + 1][0]) / 2
      d = (temp_data[i][1] + temp_data[i + 1][1]) / 2
      ctx.quadraticCurveTo(temp_data[i][0], temp_data[i][1], c, d)
    }

    // For the last 2 points
    ctx.quadraticCurveTo(
      temp_data[i][0],
      temp_data[i][1],
      temp_data[i + 1][0],
      temp_data[i + 1][1]
    )
    ctx.stroke()
  }
}

export default Brush
