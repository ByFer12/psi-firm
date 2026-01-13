// src/components/ui/DateRangePicker.tsx
import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangePickerProps {
  value: { start: Date; end: Date };
  onChange: (dates: { start: Date; end: Date }) => void;
}

export const DateRangePicker = ({ value, onChange }: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const presetRanges = [
    { label: 'Hoy', getRange: () => ({ start: new Date(), end: new Date() }) },
    { label: 'Esta semana', getRange: () => {
      const now = new Date();
      const start = new Date(now.setDate(now.getDate() - now.getDay()));
      const end = new Date(now.setDate(start.getDate() + 6));
      return { start, end };
    }},
    { label: 'Últimos 7 días', getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 7);
      return { start, end };
    }},
    { label: 'Últimos 30 días', getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      return { start, end };
    }},
    { label: 'Este mes', getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start, end };
    }},
  ];

  const handlePresetClick = (getRange: () => { start: Date; end: Date }) => {
    onChange(getRange());
    setIsOpen(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Calendar size={16} className="text-slate-500" />
        <span className="text-sm font-medium text-slate-700">
          {formatDate(value.start)} - {formatDate(value.end)}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border rounded-xl shadow-lg z-50 p-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Rangos predefinidos</p>
            <div className="grid grid-cols-2 gap-2">
              {presetRanges.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handlePresetClick(preset.getRange)}
                  className="px-3 py-2 text-sm text-slate-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            
            <div className="pt-3 border-t">
              <p className="text-sm font-medium text-slate-700 mb-2">Personalizado</p>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Desde</label>
                  <input
                    type="date"
                    value={value.start.toISOString().split('T')[0]}
                    onChange={(e) => onChange({ ...value, start: new Date(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Hasta</label>
                  <input
                    type="date"
                    value={value.end.toISOString().split('T')[0]}
                    onChange={(e) => onChange({ ...value, end: new Date(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};