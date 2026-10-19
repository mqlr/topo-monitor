import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import test from 'node:test'

const require = createRequire(import.meta.url)
const reactFlowRequire = createRequire(require.resolve('@xyflow/react'))
const systemRequire = createRequire(reactFlowRequire.resolve('@xyflow/system'))
const dragPath = systemRequire.resolve('d3-drag')
const dragRequire = createRequire(dragPath)
const { drag } = await import(pathToFileURL(dragPath).href)
const { select } = await import(pathToFileURL(dragRequire.resolve('d3-selection')).href)

function setup() {
  const view = new EventTarget()
  view.document = { documentElement: { style: { MozUserSelect: 'text' } } }
  const element = new EventTarget()
  element.parentNode = {
    clientLeft: 0, clientTop: 0,
    getBoundingClientRect: () => ({ left: 0, top: 0 }),
  }
  const events = []
  select(element).call(drag().touchable(false).on('start drag end', event => {
    events.push({ type: event.type, active: event.active, x: event.x, y: event.y })
  }))
  const event = (x = 10, y = 20) => ({
    view, target: element, button: 0, clientX: x, clientY: y,
    defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true },
    stopImmediatePropagation() {},
  })
  const handler = (target, type) => target.__on.find(item => item.type === type && item.name === 'drag').listener
  const start = () => {
    handler(element, 'mousedown').call(element, event())
    return { move: handler(view, 'mousemove'), up: handler(view, 'mouseup') }
  }
  return { view, events, event, start }
}

test('replayed mouseup and late mousemove are no-ops after a drag ends', () => {
  const { view, events, event, start } = setup()
  const { move, up } = start()
  move.call(view, event(30, 40))
  up.call(view, event(30, 40))
  const duplicate = event()
  const lateMove = event()
  assert.doesNotThrow(() => up.call(view, duplicate))
  assert.doesNotThrow(() => move.call(view, lateMove))
  assert.deepEqual(events.map(item => item.type), ['start', 'drag', 'end'])
  assert.equal(events.at(-1).active, 0)
  assert.equal(duplicate.defaultPrevented, false)
  assert.equal(lateMove.defaultPrevented, false)
  assert.equal(view.document.documentElement.style.MozUserSelect, 'text')
  assert.equal(view.__on?.some(item => ['mouseup', 'mousemove'].includes(item.type)), false)
})

test('a fresh drag still moves and ends exactly once after duplicate releases', () => {
  const { view, events, event, start } = setup()
  const first = start()
  first.up.call(view, event())
  first.up.call(view, event())
  first.move.call(view, event())
  const second = start()
  second.move.call(view, event(50, 60))
  second.up.call(view, event(50, 60))
  assert.deepEqual(events.map(item => item.type), ['start', 'end', 'start', 'drag', 'end'])
  assert.deepEqual(events.at(-1), { type: 'end', active: 0, x: 50, y: 60 })
  assert.equal(view.document.documentElement.style.MozUserSelect, 'text')
})
