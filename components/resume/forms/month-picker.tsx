"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarIcon, ChevronLeft, ChevronRight } from "@/components/ui/icons"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface MonthPickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

function parseMonthYear(value: string): Date | undefined {
  const yearOnlyMatch = value.match(/^(\d{4})$/)
  if (yearOnlyMatch) {
    const year = Number(yearOnlyMatch[1])
    if (year < 1000 || year > 9999) return undefined
    return new Date(year, 0, 1)
  }

  const match = value.match(/^(\d{2})\/(\d{4})$/)
  if (!match) return undefined

  const month = Number(match[1])
  const year = Number(match[2])
  if (month < 1 || month > 12 || year < 1000 || year > 9999) return undefined

  return new Date(year, month - 1, 1)
}

function formatMonthYear(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${month}/${date.getFullYear()}`
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

export function MonthPicker({
  value,
  onChange,
  placeholder = "MM/YYYY or YYYY",
  disabled = false,
}: MonthPickerProps) {
  const [open, setOpen] = useState(false)
  const [manualValue, setManualValue] = useState(value)
  const selectedDate = useMemo(() => parseMonthYear(value), [value])
  const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() ?? new Date().getFullYear())

  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear())
    }
  }, [selectedDate])

  useEffect(() => {
    setManualValue(value)
  }, [value])

  const commitManualValue = () => {
    const next = manualValue.trim()
    if (!next) {
      onChange("")
      return
    }

    const isYearOnly = /^\d{4}$/.test(next)
    const isMonthYear = /^(0[1-9]|1[0-2])\/\d{4}$/.test(next)
    if (isYearOnly || isMonthYear) {
      onChange(next)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-2 border-b">
          <Input
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            onBlur={commitManualValue}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                commitManualValue()
                setOpen(false)
              }
            }}
            placeholder="MM/YYYY or YYYY"
            className="h-8"
          />
        </div>
        <div className="p-3 w-[280px]">
          <div className="mb-3 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setViewYear((prev) => prev - 1)}
              aria-label="Previous year"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{viewYear}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setViewYear((prev) => prev + 1)}
              aria-label="Next year"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((month, index) => {
              const formatted = `${String(index + 1).padStart(2, "0")}/${viewYear}`
              const isActive = value === formatted
              return (
                <Button
                  key={month}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setManualValue(formatted)
                    onChange(formatted)
                    setOpen(false)
                  }}
                >
                  {month}
                </Button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
