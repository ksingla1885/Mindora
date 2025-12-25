"use client"

import * as React from "react"
import { cn } from "@/lib/cn"

const Slider = React.forwardRef(({ className, max = 100, min = 0, step = 1, value, defaultValue, onValueChange, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState(defaultValue ? defaultValue[0] : (value ? value[0] : 0))

    React.useEffect(() => {
        if (value) {
            setLocalValue(value[0])
        }
    }, [value])

    const handleChange = (e) => {
        const val = parseFloat(e.target.value)
        setLocalValue(val)
        if (onValueChange) {
            onValueChange([val])
        }
    }

    const percentage = ((localValue - min) / (max - min)) * 100

    return (
        <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={localValue}
                onChange={handleChange}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                ref={ref}
                {...props}
            />
            <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
                <div
                    className="absolute h-full bg-primary"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div
                className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors disabled:pointer-events-none disabled:opacity-50 shadow-sm"
                style={{
                    position: 'absolute',
                    left: `calc(${percentage}% - 10px)`
                }}
            />
        </div>
    )
})
Slider.displayName = "Slider"

export { Slider }
