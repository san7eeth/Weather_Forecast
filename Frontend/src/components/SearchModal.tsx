import { useEffect, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { MapPin, X } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (location: string, date?: string) => void;
}

export default function SearchModal({ isOpen, onClose, onSearch }: SearchModalProps) {
  const [location, setLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ name: string; country?: string; admin1?: string }>>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      const ymd = selectedDate
        ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
        : undefined;
      const raw = selectedQuery || location;
      const query = raw.split(',')[0].trim();
      onSearch(query, ymd);
      setLocation('');
      setSelectedQuery('');
      setSuggestions([]);
      setSelectedDate(null);
      onClose();
    }
  };

  useEffect(() => {
    if (!location || location.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    setIsSuggesting(true);
    const handler = setTimeout(async () => {
      try {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const params = new URLSearchParams({ name: location.trim(), count: '5', language: 'en', format: 'json' });
        const url = `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`;
        const resp = await fetch(url, { signal: controller.signal });
        if (!resp.ok) throw new Error('suggestions failed');
        const data = await resp.json();
        const results = Array.isArray(data?.results) ? data.results : [];
        setSuggestions(
          results.map((r: any) => ({ name: r?.name || '', country: r?.country || '', admin1: r?.admin1 || '' }))
        );
      } catch (_) {
        setSuggestions([]);
      } finally {
        setIsSuggesting(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [location]);

  return !isOpen ? null : (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="backdrop-blur-2xl bg-white/30 rounded-3xl p-8 shadow-2xl border border-white/40">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-3xl font-bold text-white mb-2">Check Weather</h2>
          <p className="text-white/70 mb-6">Enter a location to see current conditions</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="text"
                placeholder="Enter city name..."
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setSelectedQuery('');
                }}
                className="w-full pl-12 pr-4 py-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
                autoFocus
              />

              {(isSuggesting || suggestions.length > 0) && (
                <div className="absolute left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 overflow-hidden z-50">
                  {isSuggesting && (
                    <div className="px-4 py-3 text-sm text-gray-700">Searching…</div>
                  )}
                  {!isSuggesting && suggestions.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-700">No matches</div>
                  )}
                  {!isSuggesting && suggestions.length > 0 && (
                    <ul className="max-h-64 overflow-auto">
                      {suggestions.map((s, idx) => {
                        const subtitle = [s.admin1, s.country].filter(Boolean).join(', ');
                        return (
                          <li
                            key={`${s.name}-${idx}`}
                            className="px-4 py-3 cursor-pointer hover:bg-white/60"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              const label = subtitle ? `${s.name}, ${subtitle}` : s.name;
                              setLocation(label);
                              setSelectedQuery(s.name);
                              setSuggestions([]);
                            }}
                          >
                            <div className="text-gray-900 font-medium">{s.name}</div>
                            {subtitle && <div className="text-gray-600 text-xs">{subtitle}</div>}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">Select date </label>
              <div className="w-full">
                <DatePicker
                  selected={selectedDate}
                  onChange={(d) => setSelectedDate(d)}
                  minDate={new Date()}
                  placeholderText="Pick a date"
                  className="w-full px-4 py-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
                  wrapperClassName="w-full"
                  calendarClassName="!bg-white/90 !backdrop-blur-xl !rounded-2xl !p-2 !shadow-2xl"
                  popperClassName="z-[60]"
                  dayClassName={() => 'hover:!bg-blue-500/20 !rounded-full'}
                  dateFormat="yyyy-MM-dd"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              Check Weather
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/20">
          </div>
        </div>
      </div>
    </div>
  );
}
