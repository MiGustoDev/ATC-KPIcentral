import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import gsap from 'gsap';

export function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  className = '',
  dropdownClassName = '',
  icon: Icon
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const menuRef = useRef(null);

  // Normalize options to { value, label, color, subtext }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return {
      value: opt.id ?? opt.value,
      label: opt.name ?? opt.label ?? opt.value,
      color: opt.color,
      subtext: opt.subtext
    };
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value) || {
    value,
    label: value || placeholder
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // GSAP animation on dropdown open
  useEffect(() => {
    if (isOpen && menuRef.current) {
      gsap.fromTo(
        menuRef.current,
        { opacity: 0, y: -6, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: 'power2.out' }
      );
    }
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${isOpen ? 'z-50' : 'z-20'}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center justify-between gap-2.5 bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-white text-xs sm:text-sm font-semibold rounded-xl px-3.5 py-2 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:shadow-black/40 focus:outline-none focus:border-amber-500 ${className}`}
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          {selectedOption.color && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          <span className="truncate">{selectedOption.label}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu (fully opaque, elevated z-50, scrollbar hidden) */}
      {isOpen && (
        <div
          ref={menuRef}
          className={`absolute left-0 mt-1.5 min-w-[240px] w-full max-h-72 overflow-y-auto no-scrollbar z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black p-1.5 space-y-0.5 font-sans ring-1 ring-white/10 ${dropdownClassName}`}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm text-left transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/25 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {opt.color ? (
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: opt.color }}
                    />
                  ) : null}
                  <div className="truncate">
                    <span className="block truncate">{opt.label}</span>
                    {opt.subtext && (
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {opt.subtext}
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
