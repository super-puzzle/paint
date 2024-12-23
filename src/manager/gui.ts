import Paint from '..'

class Gui {
  canvasOffset = { x: 0, y: 0 }
  canvasWidth = 0
  canvasHeight = 0
  touch = {
    pageX: 0,
    pageY: 0,
    pageX2: 0,
    pageY2: 0,
    originScale: 1,
    scaleAble: false,
  }

  constructor(readonly paint: Paint) {
    this.computeCanvasOffset()
    this.bindEvents()
  }

  computeCanvasOffset() {
    const bodyRect = document.body.getBoundingClientRect()
    const $el = this.paint.$el
    const canvasRect = $el.getBoundingClientRect()
    this.canvasOffset.x = canvasRect.left - bodyRect.left
    this.canvasOffset.y = canvasRect.top - bodyRect.top
    this.canvasWidth = canvasRect.width * this.paint.ctx.DPR
    this.canvasHeight = canvasRect.height * this.paint.ctx.DPR
    $el.width = canvasRect.width * this.paint.ctx.DPR
    $el.height = canvasRect.height * this.paint.ctx.DPR
  }

  bindEvents() {
    this.paint.addEventToPool(this.paint.$el, 'wheel', _event => {
      const event = _event as WheelEvent
      event.preventDefault()
      this.paint.ctx.zoom.x = event.offsetX * this.paint.ctx.DPR
      this.paint.ctx.zoom.y = event.offsetY * this.paint.ctx.DPR

      const delta = Math.max(
        -1,
        Math.min(
          1,
          (event as any)?.wheelDelta || -event.detail || -event.deltaY
        )
      )
      if (delta > 0) {
        this.zoom(1)
      } else {
        this.zoom(-1)
      }
    })

    /** 双指拖放事件 */
    this.paint.addEventToPool(this.paint.$el, 'touchstart', _event => {
      if (this.paint.ctx.tool.name !== 'select') {
        return
      }
      const event = _event as TouchEvent
      const touches = event.touches
      const events = touches[0]
      const events2 = touches[1]

      event.preventDefault()

      // 第一个触摸点的坐标
      this.touch.pageX = events.pageX
      this.touch.pageY = events.pageY
      this.touch.scaleAble = true

      if (events2) {
        this.touch.pageX2 = events2.pageX
        this.touch.pageY2 = events2.pageY
      }
    })

    this.paint.addEventToPool(this.paint.$el, 'touchmove', _event => {
      const event = _event as TouchEvent
      if (!this.touch.scaleAble) {
        return
      }
      const touches = event.touches
      const events = touches[0]
      const events2 = touches[1]
      if (!events2) {
        return
      }
      // 第2个指头坐标在touchmove时候获取
      if (!this.touch.pageX2) {
        this.touch.pageX2 = events2.pageX
      }
      if (!this.touch.pageY2) {
        this.touch.pageY2 = events2.pageY
      }

      // 获取坐标之间的举例
      var getDistance = function (start: any, stop: any) {
        return Math.hypot(stop.x - start.x, stop.y - start.y)
      }
      // 双指缩放比例计算
      let zoom =
        getDistance(
          {
            x: events.pageX,
            y: events.pageY,
          },
          {
            x: events2.pageX,
            y: events2.pageY,
          }
        ) /
        getDistance(
          {
            x: this.touch.pageX,
            y: this.touch.pageY,
          },
          {
            x: this.touch.pageX2,
            y: this.touch.pageY2,
          }
        )

      // 平滑zoom
      if (zoom > 1.1) {
        zoom = 1.1
      }
      if (zoom < 0.9) {
        zoom = 0.9
      }

      //
      this.paint.ctx.zoom.x =
        ((this.touch.pageX + this.touch.pageX2) / 2 - this.canvasOffset.x) *
        this.paint.ctx.DPR
      this.paint.ctx.zoom.y =
        ((this.touch.pageY + this.touch.pageY2) / 2 - this.canvasOffset.y) *
        this.paint.ctx.DPR
      this.paint.ctx.zoom.multiple = Math.floor(
        this.paint.ctx.zoom.multiple * zoom
      )
      if (this.paint.ctx.zoom.multiple > 1000) {
        this.paint.ctx.zoom.multiple = 1000
      }
      if (this.paint.ctx.zoom.multiple < 100) {
        this.paint.ctx.zoom.multiple = 100
      }
      this.paint.emitter.emit('zoom', this.paint.ctx.zoom.multiple)
      this.paint.ctx.needRender = true
    })

    this.paint.addEventToPool(this.paint.$el, 'touchend', _event => {
      this.touch.scaleAble = false
      this.touch.pageX2 = 0
      this.touch.pageY2 = 0
    })

    this.paint.addEventToPool(this.paint.$el, 'touchcancel', _event => {
      this.touch.scaleAble = false
      this.touch.pageX2 = 0
      this.touch.pageY2 = 0
    })

    this.paint.addEventToPool(window, 'resize', _event => {
      this.computeCanvasOffset()
      this.paint.ctx.needRender = true
    })
  }

  zoom(n: number) {
    if (n === 1 || n === -1) {
      if (this.paint.ctx.zoom.multiple < 200) {
        this.paint.ctx.zoom.multiple += Math.sign(n) * 10
      } else if (this.paint.ctx.zoom.multiple < 400) {
        this.paint.ctx.zoom.multiple += Math.sign(n) * 50
      } else {
        this.paint.ctx.zoom.multiple += Math.sign(n) * 100
      }
    } else {
      this.paint.ctx.zoom.multiple = n
    }

    if (this.paint.ctx.zoom.multiple > 1000) {
      this.paint.ctx.zoom.multiple = 1000
    }
    if (this.paint.ctx.zoom.multiple < 100) {
      this.paint.ctx.zoom.multiple = 100
    }

    this.paint.emitter.emit('zoom', this.paint.ctx.zoom.multiple)

    // schedule render
    this.paint.ctx.needRender = true
  }

  centerZoom(n: number) {
    if (n === this.paint.ctx.zoom.multiple) return
    this.paint.ctx.zoom.x = this.canvasWidth / 2
    this.paint.ctx.zoom.y = this.canvasHeight / 2
    this.paint.ctx.zoom.multiple = n
    if (this.paint.ctx.zoom.multiple > 1000) {
      this.paint.ctx.zoom.multiple = 1000
    }
    if (this.paint.ctx.zoom.multiple < 100) {
      this.paint.ctx.zoom.multiple = 100
    }

    // schedule render
    this.paint.ctx.needRender = true
  }
}

export default Gui
