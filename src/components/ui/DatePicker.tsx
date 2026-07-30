import React, { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { Calendar, X } from 'lucide-react';
import './DatePicker.css';

interface DatePickerProps {
  value: string; // 'YYYY-MM-DD' string from <input type="date">
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  ariaLabel?: string;
}

/**
 * DatePicker — English-locale date input with click-to-open calendar popover.
 *
 * - Click the input or calendar icon to open a DayPicker popover.
 * - Outside-click or Esc closes it.
 * - Picker is locked to enUS so the calendar never shows system-locale text.
 * - Internal state is a Date object; we serialize to 'YYYY-MM-DD' for the form.
 */
export function DatePicker({ value, onChange, placeholder = 'YYYY-MM-DD', className, id, ariaLabel }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Parse current value into a Date, default to undefined for placeholder behavior
  const selected = value ? new Date(value + 'T00:00:00') : undefined;

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      // Defer to next tick — by then any DayPicker onSelect/onDayClick has already fired
      setTimeout(() => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      }, 0);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    // Use 'click' not 'mousedown' — mousedown fires BEFORE DayPicker's button click,
    // so mousedown handler can close the popover before onSelect fires.
    document.addEventListener('click', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSelect = (date: Date | undefined) => {
    // eslint-disable-next-line no-console
    console.log('[DatePicker] handleSelect', date);
    if (!date) {
      onChange('');
    } else {
      // Use local-time components (not UTC) to avoid TZ drift
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      onChange(`${y}-${m}-${d}`);
    }
    setOpen(false);
  };

  // DayPicker v8 fires onDayClick on every cell click, including outside-days.
  // We use it as a more reliable trigger than onSelect (which can be no-op in some configs).
  const handleDayClick = (day: Date) => {
    // eslint-disable-next-line no-console
    console.log('[DatePicker] handleDayClick', day);
    handleSelect(day);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const displayValue = value
    ? format(new Date(value + 'T00:00:00'), 'EEE, MMM d, yyyy', { locale: enUS })
    : '';

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <div className="flex items-stretch">
        <button
          type="button"
          id={id}
          aria-label={ariaLabel || placeholder}
          onClick={() => setOpen((o) => !o)}
          className={`flex-1 text-left px-3 py-2 rounded-l-lg border border-gray-200 bg-white/80 text-sm flex items-center gap-2 hover:bg-white transition-colors ${
            value ? 'text-gray-800' : 'text-gray-400'
          }`}
        >
          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="flex-1 truncate">{displayValue || placeholder}</span>
        </button>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear date"
            className="px-2 border-t border-b border-r border-gray-200 bg-white/80 rounded-r-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Choose date"
          className="absolute z-50 mt-1 bg-white rounded-lg shadow-lg border border-pink-100 p-2 min-w-[280px]"
        >
          <DayPicker
            mode="single"
            selected={selected}
            onDayClick={handleDayClick}
            onSelect={handleSelect}
            locale={enUS}
            showOutsideDays
            weekStartsOn={0}
            required
          />
        </div>
      )}
    </div>
  );
}
