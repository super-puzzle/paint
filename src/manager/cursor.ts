import Paint from '..'

class Cursor {
  $el: HTMLElement

  constructor(readonly paint: Paint) {
    this.paint = paint
    this.$el = this.paint.$cursorEl
    this.$el.style.borderRadius = '100px'
    this.$el.style.display = 'none'
    this.$el.style.border = '2px solid #ffffff'
    this.$el.style.transform = 'translate(-50%, -50%)'
    this.$el.style.pointerEvents = 'none'

    this.bindEvents()
  }

  bindEvents() {
    this.paint.addEventToPool(document, 'mousemove', _event => {
      const event = _event as MouseEvent
      if (
        (event.target as any) !== this.paint.$el ||
        (this.paint.ctx.tool.name !== 'brush' &&
          this.paint.ctx.tool.name !== 'erase')
      ) {
        this.$el.style.display = 'none'
        return
      }
      this.$el.style.display = 'block'
      this.$el.style.width = `${this.paint.ctx.lineWidth}px`
      this.$el.style.height = `${this.paint.ctx.lineWidth}px`
      this.$el.style.top = `${event.offsetY}px`
      this.$el.style.left = `${event.offsetX}px`
    })
  }
}

export default Cursor
