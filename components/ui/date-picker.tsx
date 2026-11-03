"use client";

import { useState } from "react";
import { format, parse } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const STORED = "yyyy-MM-dd";

type DatePickerProps = {
  /** YYYY-MM-DD, or "" for no date. Kept as typed text so no timezone can shift it. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
};

/** A date field that opens the calendar in a popover; reads and writes the same YYYY-MM-DD text a native date input does. */
export function DatePicker({ value, onChange, id, placeholder = "Pick a date", className, ...props }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? parse(value, STORED, new Date()) : undefined;
  const valid = selected && !Number.isNaN(selected.getTime()) ? selected : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-label={props["aria-label"]}
          className={cn("w-full justify-start gap-2 px-3 font-normal", !valid && "text-muted-foreground", className)}
        >
          <CalendarIcon className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{valid ? format(valid, "MMM d, yyyy") : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={valid}
          defaultMonth={valid}
          onSelect={(date) => {
            onChange(date ? format(date, STORED) : "");
            setOpen(false);
          }}
        />
        {valid ? (
          <div className="border-t border-border p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
