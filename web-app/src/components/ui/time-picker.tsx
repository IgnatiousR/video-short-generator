/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useRef } from 'react'
import { TimePickerInput } from './time-picker-input'

export function TimeInput({ value, onChange }: any) {
  const minuteRef = useRef(null)
  const hourRef = useRef(null)
  const secondRef = useRef(null)

  const date = useMemo(() => {
    const d = new Date()
    const parts = (value || '00:00:00').split(':')
    d.setHours(parseInt(parts[0] || '0', 10))
    d.setMinutes(parseInt(parts[1] || '0', 10))
    d.setSeconds(parseInt(parts[2] || '0', 10))
    return d
  }, [value])

  const setDate = (newDate: Date) => {
    if (!newDate) return
    const h = newDate.getHours().toString().padStart(2, '0')
    const m = newDate.getMinutes().toString().padStart(2, '0')
    const s = newDate.getSeconds().toString().padStart(2, '0')
    onChange(`${h}:${m}:${s}`)
  }

  return (
    <div className="flex items-center gap-1">
      <div className="grid gap-1 text-center">
        <TimePickerInput
          picker="hours"
          date={date}
          setDate={setDate}
          ref={hourRef}
          onRightFocus={() => minuteRef.current?.focus()}
        />
      </div>
      <span>:</span>
      <div className="grid gap-1 text-center">
        <TimePickerInput
          picker="minutes"
          date={date}
          setDate={setDate}
          ref={minuteRef}
          onLeftFocus={() => hourRef.current?.focus()}
          onRightFocus={() => secondRef.current?.focus()}
        />
      </div>
      <span>:</span>
      <div className="grid gap-1 text-center">
        <TimePickerInput
          picker="seconds"
          date={date}
          setDate={setDate}
          ref={secondRef}
          onLeftFocus={() => minuteRef.current?.focus()}
        />
      </div>
    </div>
  )
}
