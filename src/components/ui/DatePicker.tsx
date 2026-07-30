import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
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
 * Uses a custom calendar grid (no external picker library) for full control
 * over locale and click behavior. Hardcoded enUS weekday / month names.
 */
export function DatePicker({ value, onChange, placeholder = 'Pick a date', className, id, ariaLabel }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const today = new Date();
  const initial = value ? new Date(value + 'T00:00:00') : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      setTimeout(() => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      }, 0);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const selectDate = (day: number) => {
    const y = viewYear;
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setOpen(false);
  };

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const isToday = (day: number) =>
    viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();

  const isSelected = (day: number) =>
    value &&
    viewYear === new Date(value + 'T00:00:00').getFullYear() &&
    viewMonth === new Date(value + 'T00:00:00').getMonth() &&
    day === new Date(value + 'T00:00:00').getDate();

  const displayValue = value
    ? format(new Date(value + 'T00:00:00'), 'EEE, MMM d, yyyy', { locale: enUS })
    : '';

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Build grid: leading nulls + day numbers
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

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
            onClick={clearDate}
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
          className="absolute z-50 mt-1 bg-white rounded-lg shadow-lg border border-pink-100 p-3 min-w-[280px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous month"
              className="p-1.5 hover:bg-pink-50 rounded-full transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div className="text-sm font-semibold text-gray-800">
              {monthNames[viewMonth]} {viewYear}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
              className="p-1.5 hover:bg-pink-50 rounded-full transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 mb-1">
            {weekdayNames.map((wd) => (
              <div key={wd} className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide py-1">
                {wd}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) =>
              day === null ? (
                <div key={i} />
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDate(day)}
                  className={`h-9 rounded-full text-sm transition-colors ${
                    isSelected(day)
                      ? 'bg-[#FFB7B2] text-white font-semibold'
                      : isToday(day)
                      ? 'text-[#FF6B61] font-bold hover:bg-pink-50'
                      : 'text-gray-700 hover:bg-pink-50'
                  }`}
                  aria-label={`${monthNames[viewMonth]} ${day}, ${viewYear}`}
                >
                  {day}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}