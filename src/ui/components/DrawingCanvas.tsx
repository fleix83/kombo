import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import { getStroke } from 'perfect-freehand'
import { de } from '../i18n/de'

// The one deliberately platform-specific component (PRD §6.1): everything
// else talks to it through the narrow exportPng()/isEmpty() handle, so the
// native app can swap in a Skia implementation.

// Internal resolution; export stays within the PRD's ~800×800 max.
// aspect = 1 → square (profile doodles); aspect ≈ 2.4 → card-header format,
// so new card doodles fill the deck card header edge-to-edge.
const SIZE = 800

const COLORS = ['#18181b', '#dc2626', '#ea580c', '#eab308', '#16a34a', '#2563eb', '#7c3aed', '#78350f']
const WIDTHS = [6, 12, 22]

interface Stroke {
  points: number[][]
  color: string
  size: number
  eraser: boolean
}

export interface DrawingCanvasHandle {
  exportPng: () => Promise<Blob | null> // null when nothing was drawn
  isEmpty: () => boolean
}

function strokePath(stroke: Stroke): Path2D {
  const outline = getStroke(stroke.points, {
    size: stroke.eraser ? stroke.size * 2 : stroke.size,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
  })
  const path = new Path2D()
  if (outline.length === 0) return path
  path.moveTo(outline[0][0], outline[0][1])
  for (const [x, y] of outline.slice(1)) path.lineTo(x, y)
  path.closePath()
  return path
}

function drawAll(canvas: HTMLCanvasElement, strokes: Stroke[], current: Stroke | null) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (const stroke of [...strokes, ...(current ? [current] : [])]) {
    ctx.globalCompositeOperation = stroke.eraser ? 'destination-out' : 'source-over'
    ctx.fillStyle = stroke.color
    ctx.fill(strokePath(stroke))
  }
  ctx.globalCompositeOperation = 'source-over'
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, { aspect?: number }>(
  function DrawingCanvas({ aspect = 1 }, ref) {
  const canvasWidth = SIZE
  const canvasHeight = Math.round(SIZE / aspect)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  // The in-progress stroke is drawn imperatively (no re-render per pointermove)
  const currentRef = useRef<Stroke | null>(null)
  const [color, setColor] = useState(COLORS[0])
  const [width, setWidth] = useState(WIDTHS[1])
  const [eraser, setEraser] = useState(false)

  useEffect(() => {
    if (canvasRef.current) drawAll(canvasRef.current, strokes, currentRef.current)
  }, [strokes])

  useImperativeHandle(ref, () => ({
    isEmpty: () => strokes.length === 0,
    exportPng: () =>
      new Promise((resolve) => {
        const canvas = canvasRef.current
        if (!canvas || strokes.length === 0) {
          resolve(null)
          return
        }
        drawAll(canvas, strokes, null)
        canvas.toBlob((blob) => resolve(blob), 'image/png')
      }),
  }))

  function pointFromEvent(e: PointerEvent<HTMLCanvasElement>): number[] {
    const rect = e.currentTarget.getBoundingClientRect()
    const scale = canvasWidth / rect.width
    return [(e.clientX - rect.left) * scale, (e.clientY - rect.top) * scale, e.pressure || 0.5]
  }

  function onPointerDown(e: PointerEvent<HTMLCanvasElement>) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // synthetic events have no active pointer — drawing still works
    }
    currentRef.current = { points: [pointFromEvent(e)], color, size: width, eraser }
    if (canvasRef.current) drawAll(canvasRef.current, strokes, currentRef.current)
  }

  function onPointerMove(e: PointerEvent<HTMLCanvasElement>) {
    const current = currentRef.current
    if (!current) return
    current.points.push(pointFromEvent(e))
    if (canvasRef.current) drawAll(canvasRef.current, strokes, current)
  }

  function onPointerUp() {
    const current = currentRef.current
    if (!current) return
    currentRef.current = null
    setStrokes((prev) => [...prev, current])
  }

  // Square canvas: rotate 90° clockwise (x, y) → (SIZE − y, x).
  // Wide canvas: 90° would leave the frame, so rotate 180° instead.
  function rotate() {
    setStrokes(
      strokes.map((s) => ({
        ...s,
        points:
          aspect === 1
            ? s.points.map(([x, y, p]) => [SIZE - y, x, p])
            : s.points.map(([x, y, p]) => [canvasWidth - x, canvasHeight - y, p]),
      })),
    )
  }

  const toolButton = (active: boolean) =>
    `flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-xs ${
      active ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 bg-white text-zinc-700'
    }`

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{ aspectRatio: String(aspect) }}
        className="w-full touch-none rounded-2xl border border-zinc-300 bg-white"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={de.drawing.pen}
            className={`h-7 w-7 rounded-full border-2 ${
              color === c && !eraser ? 'border-zinc-900' : 'border-transparent'
            }`}
            style={{ backgroundColor: c }}
            onClick={() => {
              setColor(c)
              setEraser(false)
            }}
          />
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {WIDTHS.map((w) => (
          <button
            key={w}
            type="button"
            className={toolButton(width === w)}
            onClick={() => setWidth(w)}
          >
            <span
              className="rounded-full bg-current"
              style={{ width: w / 2.5, height: w / 2.5 }}
            />
          </button>
        ))}
        <button type="button" className={toolButton(eraser)} onClick={() => setEraser(!eraser)}>
          {de.drawing.eraser}
        </button>
        <button
          type="button"
          className={toolButton(false)}
          onClick={() => setStrokes(strokes.slice(0, -1))}
          disabled={strokes.length === 0}
        >
          {de.drawing.undo}
        </button>
        <button type="button" className={toolButton(false)} onClick={rotate} disabled={strokes.length === 0}>
          {de.drawing.rotate}
        </button>
        <button
          type="button"
          className={toolButton(false)}
          onClick={() => setStrokes([])}
          disabled={strokes.length === 0}
        >
          {de.drawing.clear}
        </button>
      </div>
    </div>
  )
})
