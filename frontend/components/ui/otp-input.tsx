"use client"

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react"
import { cn } from "@/lib/utils"

export interface OtpInputRef {
  focus: () => void
  clear: () => void
  getValue: () => string
}

interface OtpInputProps {
  /** Number of OTP digits (default: 6) */
  length?: number
  /**
   * Group size for visual separation (e.g. 4 splits 8-digit into two groups of 4).
   * Set to 0 to disable grouping. Defaults to automatic (4 if length > 6, else 0).
   */
  groupSize?: number
  /** Called whenever the value changes */
  onChange?: (value: string) => void
  /** Called when all digits are filled */
  onComplete?: (value: string) => void
  /** Whether the input is disabled */
  disabled?: boolean
  /** Whether to mask input (like a password) */
  masked?: boolean
  /** Autofocus the first cell on mount */
  autoFocus?: boolean
  /** Additional className for the container */
  className?: string
  /** aria-label for the group */
  ariaLabel?: string
  /** Controlled value */
  value?: string
}

const OtpInput = forwardRef<OtpInputRef, OtpInputProps>(
  (
    {
      length = 6,
      groupSize: groupSizeProp,
      onChange,
      onComplete,
      disabled = false,
      masked = false,
      autoFocus = false,
      className,
      ariaLabel = "One-time password",
      value: controlledValue,
    },
    ref
  ) => {
    // Auto-group: split 8-digit codes as 4+4; leave others ungrouped
    const groupSize = groupSizeProp !== undefined ? groupSizeProp : length > 6 ? 4 : 0

    const [digits, setDigits] = useState<string[]>(Array(length).fill(""))
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    // ─── Sync controlled value ───────────────────────────────────────────
    useEffect(() => {
      if (controlledValue !== undefined) {
        setDigits((prev) => {
          const current = prev.join("")
          if (controlledValue === current) return prev // no-op
          const chars = controlledValue.split("").slice(0, length)
          return [...chars, ...Array(length - chars.length).fill("")]
        })
      }
    }, [controlledValue, length])

    // ─── Imperative handle ───────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      focus: () => inputRefs.current[0]?.focus(),
      clear: () => {
        const empty = Array(length).fill("")
        setDigits(empty)
        onChange?.("")
        inputRefs.current[0]?.focus()
      },
      getValue: () => digits.join(""),
    }))

    // ─── Notify parent ───────────────────────────────────────────────────
    const notifyChange = useCallback(
      (newDigits: string[]) => {
        const value = newDigits.join("")
        onChange?.(value)
        if (newDigits.every((d) => d !== "")) {
          onComplete?.(value)
        }
      },
      [onChange, onComplete]
    )

    // ─── Focus helpers ───────────────────────────────────────────────────
    const focusAt = useCallback(
      (index: number) => {
        const clamped = Math.max(0, Math.min(length - 1, index))
        const el = inputRefs.current[clamped]
        if (el) {
          el.focus()
          // Schedule select so it runs after focus event settles
          requestAnimationFrame(() => el.select())
        }
      },
      [length]
    )

    // ─── Key down ────────────────────────────────────────────────────────
    // We intercept typed digits HERE so we can use maxLength={1} cleanly.
    const handleKeyDown = useCallback(
      (index: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return

        const key = e.key

        if (key === "ArrowLeft") {
          e.preventDefault()
          focusAt(index - 1)
          return
        }

        if (key === "ArrowRight") {
          e.preventDefault()
          focusAt(index + 1)
          return
        }

        if (key === "Backspace") {
          e.preventDefault()
          const next = [...digits]
          if (next[index] !== "") {
            // Clear current cell, stay here
            next[index] = ""
            setDigits(next)
            notifyChange(next)
          } else if (index > 0) {
            // Clear previous cell and move back
            next[index - 1] = ""
            setDigits(next)
            notifyChange(next)
            focusAt(index - 1)
          }
          return
        }

        if (key === "Delete") {
          e.preventDefault()
          const next = [...digits]
          next[index] = ""
          setDigits(next)
          notifyChange(next)
          return
        }

        // Intercept numeric keys directly — prevent onChange from firing twice on mobile
        if (/^\d$/.test(key)) {
          e.preventDefault()
          const next = [...digits]
          next[index] = key
          setDigits(next)
          notifyChange(next)
          if (index < length - 1) focusAt(index + 1)
          return
        }

        // Allow: Tab, Shift+Tab, meta/ctrl combos (copy/paste etc.)
        if (
          key === "Tab" ||
          e.metaKey ||
          e.ctrlKey ||
          key === "Enter"
        ) return

        // Block any other non-printable / non-digit key from reaching onChange
        if (key.length === 1) {
          e.preventDefault()
        }
      },
      [digits, disabled, focusAt, length, notifyChange]
    )

    // ─── Input change (handles paste-via-keyboard-shortcut on mobile) ────
    const handleChange = useCallback(
      (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return
        const numeric = e.target.value.replace(/\D/g, "")
        if (!numeric) {
          // Field cleared (e.g. mobile backspace emitted via onChange)
          const next = [...digits]
          next[index] = ""
          setDigits(next)
          notifyChange(next)
          return
        }
        // Spread pasted/autofilled multi-char string across cells
        if (numeric.length > 1) {
          const next = [...digits]
          let lastFilled = index
          for (let i = 0; i < numeric.length && index + i < length; i++) {
            next[index + i] = numeric[i]
            lastFilled = index + i
          }
          setDigits(next)
          notifyChange(next)
          focusAt(Math.min(lastFilled + 1, length - 1))
          return
        }
        // Single digit — keyDown already handled this for desktop; this path handles
        // mobile IME-based inputs where keyDown key is "Unidentified"
        const next = [...digits]
        next[index] = numeric[0]
        setDigits(next)
        notifyChange(next)
        if (index < length - 1) focusAt(index + 1)
      },
      [digits, disabled, focusAt, length, notifyChange]
    )

    // ─── Paste ───────────────────────────────────────────────────────────
    const handlePaste = useCallback(
      (index: number) => (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (disabled) return
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length)
        if (!pasted) return
        const next = [...digits]
        let lastFilled = index
        for (let i = 0; i < pasted.length && index + i < length; i++) {
          next[index + i] = pasted[i]
          lastFilled = index + i
        }
        setDigits(next)
        notifyChange(next)
        focusAt(Math.min(lastFilled + 1, length - 1))
      },
      [digits, disabled, focusAt, length, notifyChange]
    )

    // ─── Focus / blur ────────────────────────────────────────────────────
    const handleFocus = useCallback(
      (index: number) => () => {
        setFocusedIndex(index)
        // requestAnimationFrame avoids a race with the browser's own focus behaviour
        requestAnimationFrame(() => inputRefs.current[index]?.select())
      },
      []
    )

    const handleBlur = useCallback(() => {
      setFocusedIndex(null)
    }, [])

    // ─── Click (re-select on re-click to allow overwrite) ────────────────
    const handleClick = useCallback(
      (index: number) => () => {
        inputRefs.current[index]?.select()
      },
      []
    )

    // ─── Sizing — smaller cells for longer codes ─────────────────────────
    const cellSize =
      length <= 6
        ? "w-11 h-11 sm:w-12 sm:h-12 text-xl"
        : "w-9 h-9 sm:w-10 sm:h-10 text-base"

    // ─── Gap — tighter for more cells ────────────────────────────────────
    const gapClass = length <= 6 ? "gap-2.5 sm:gap-3" : "gap-1.5 sm:gap-2"

    // ─── Render ──────────────────────────────────────────────────────────
    const cells = Array.from({ length }, (_, index) => {
      const isFocused = focusedIndex === index
      const isFilled = digits[index] !== ""
      const showGroupGap = groupSize > 0 && index > 0 && index % groupSize === 0

      return (
        <div key={index} className="flex items-center">
          {/* Group divider — wider gap between groups */}
          {showGroupGap && (
            <div
              aria-hidden="true"
              className="mx-1 sm:mx-2 w-3 h-0.5 rounded-full bg-border/50 shrink-0"
            />
          )}

          <input
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type={masked ? "password" : "text"}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digits[index]}
            autoFocus={autoFocus && index === 0}
            disabled={disabled}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${index + 1} of ${length}`}
            onChange={handleChange(index)}
            onKeyDown={handleKeyDown(index)}
            onPaste={handlePaste(index)}
            onClick={handleClick(index)}
            onFocus={handleFocus(index)}
            onBlur={handleBlur}
            className={cn(
              // Size
              cellSize,
              // Base
              "shrink-0 rounded-xl border-2 bg-background text-center font-bold font-mono tabular-nums",
              "transition-all duration-150 ease-out",
              "focus:outline-none caret-transparent",
              // z-index so focused cell (scale) sits above neighbours
              "relative z-0",
              // Idle border
              "border-border/60",
              // Hover
              "hover:border-border",
              // Focused
              isFocused && [
                "border-primary",
                "ring-4 ring-primary/15",
                "scale-[1.08]",
                "shadow-lg shadow-primary/10",
                "z-10",              // lift above siblings
              ],
              // Filled (not focused)
              !isFocused && isFilled && "border-primary/40 bg-primary/5",
              // Disabled
              disabled && "cursor-not-allowed"
            )}
          />
        </div>
      )
    })

    return (
      <div
        className={cn(
          "flex items-center",
          gapClass,
          disabled && "opacity-50 pointer-events-none",
          className
        )}
        role="group"
        aria-label={ariaLabel}
      >
        {cells}
      </div>
    )
  }
)

OtpInput.displayName = "OtpInput"

export { OtpInput }
