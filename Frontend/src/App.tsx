import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Area,
  Bar,
} from 'recharts';

import WeatherBackground from './components/WeatherBackground';
import WeatherCard from './components/WeatherCard';
import RainChart from './components/RainChart';
import SearchModal from './components/SearchModal';
import WeeklyForecast from './components/WeeklyForecast';
import SunCycle from './components/SunCycle';

import { WeatherData, WeatherType } from './types/weather';
import { fetchWeather, getWeatherType } from './services/weatherService';

function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherType, setWeatherType] = useState<WeatherType>('sunny');
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(0);
  const requestAbortRef = (globalThis as any).__weatherAbortRef || { current: null as AbortController | null };
  ;(globalThis as any).__weatherAbortRef = requestAbortRef;
  const requestSeqRef = useRef(0);
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const localNowString = (() => {
    const tz = weather?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      return new Date().toLocaleString(undefined, { timeZone: tz, weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return now.toLocaleString(undefined, { weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: true });
    }
  })();

  const localHour = (() => {
    const tz = weather?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', hour12: false }).formatToParts(new Date());
      const hh = parts.find((p) => p.type === 'hour')?.value || String(now.getHours());
      return parseInt(hh, 10);
    } catch {
      return now.getHours();
    }
  })();

  const isNight = (() => {
    const sunriseH = weather ? Number(String(weather.sunrise).split(':')[0]) : 6;
    const sunsetH = weather ? Number(String(weather.sunset).split(':')[0]) : 19;
    return localHour < sunriseH || localHour >= sunsetH;
  })();

  // Initial load disabled: wait for user to search

  // default load disabled; wait for user search

  const handleSearch = async (location: string, date?: string) => {
    try {
      setLoading(true);
      setError(null);
      requestAbortRef.current?.abort();
      const controller = new AbortController();
      requestAbortRef.current = controller;
      const seq = ++requestSeqRef.current;
      const data = await fetchWeather(location, date, controller.signal);
      if (seq === requestSeqRef.current) {
        setWeather(data);
        setWeatherType(getWeatherType(data.weatherCode) as WeatherType);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setError('Location not found. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      if (requestSeqRef.current === requestSeqRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-all duration-1000 ${isNight ? 'bg-blue-900' : ''}`}>
      <WeatherBackground weatherType={weatherType} isNight={isNight} />

      <div className="relative z-10 min-h-screen p-6 md:p-12">
        <div className="max-w-7xl mx-auto">
          <header className="flex items-center justify-between mb-12 animate-slide-down">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                Skylens
              </h1>
              <p className="text-white/80 mt-2">{weather ? weather.date : localNowString}</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-2xl transition-all transform hover:scale-105 active:scale-95 border border-white/30 shadow-lg"
            >
              <Search className="w-5 h-5" />
              <span className="font-medium">Search</span>
            </button>
          </header>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-2xl text-white animate-shake">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white"></div>
            </div>
          )}

          {!loading && weather && (
            <div className="space-y-8 animate-fade-in">
              {/* Weather Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <WeatherCard weather={weather} />
                <SunCycle
                  sunrise={weather.sunrise}
                  sunset={weather.sunset}
                  currentMinutes={localHour * 60 + Number(new Intl.DateTimeFormat('en-US', { timeZone: weather.timeZone, minute: '2-digit' }).format(new Date()))}
                />
              </div>

              <WeeklyForecast forecast={weather.weeklyForecast} />

              {/* Rain chart + Historical insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RainChart rainChance={weather.rainChance} />

                {/* Historical Climate Insights */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="backdrop-blur-xl bg-white/20 rounded-3xl p-8 shadow-2xl border border-white/30"
                >
                  {(() => {
                    const sorted = [...(weather.historicalTrend || [])].sort(
                      (a: any, b: any) => Number(a.year) - Number(b.year)
                    );
                    const PAGE_SIZE = 7;
                    const total = sorted.length;
                    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
                    const currentPage = Math.min(historyPage, totalPages - 1);
                    const start = Math.max(0, total - (currentPage + 1) * PAGE_SIZE);
                    const end = total - currentPage * PAGE_SIZE;
                    const visible = sorted.slice(start, end);
                    const startYear = visible[0]?.year ?? '';
                    const endYear = visible[visible.length - 1]?.year ?? '';

                    return (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold text-white">
                            Historical Climate Insights
                          </h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setHistoryPage(currentPage + 1)}
                              disabled={currentPage >= totalPages - 1}
                              className={`px-3 py-1 rounded-xl border border-white/30 text-white/80 hover:text-white hover:bg-white/10 transition ${
                                currentPage >= totalPages - 1 ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title="Older years"
                            >
                              Older
                            </button>
                            <span className="text-white/70 text-sm min-w-[92px] text-center">
                              {startYear}–{endYear}
                            </span>
                            <button
                              onClick={() => setHistoryPage(Math.max(0, currentPage - 1))}
                              disabled={currentPage <= 0}
                              className={`px-3 py-1 rounded-xl border border-white/30 text-white/80 hover:text-white hover:bg-white/10 transition ${
                                currentPage <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title="Newer years"
                            >
                              Newer
                            </button>
                          </div>
                        </div>
                        <p className="text-white/60 text-sm mb-6">
                          Climate trend for{' '}
                          <span className="font-medium text-white">{weather.city}</span>{' '}
                          on this date over the past years
                        </p>

                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={visible}>
                              <defs>
                                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ff8c00" stopOpacity={0.9} />
                                  <stop offset="95%" stopColor="#ff8c00" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.9} />
                                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.1} />
                                </linearGradient>
                              </defs>

                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                              <XAxis dataKey="year" stroke="white" />
                              <YAxis yAxisId="left" stroke="#ff8c00" />
                              <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'rgba(255,255,255,0.1)',
                                  backdropFilter: 'blur(12px)',
                                  border: '1px solid rgba(255,255,255,0.3)',
                                  borderRadius: '1rem',
                                  color: 'white',
                                }}
                              />
                              <Legend />

                              <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="temperature"
                                stroke="#ff8c00"
                                fill="url(#tempGradient)"
                                name="Temperature (°C)"
                                strokeWidth={3}
                                dot={{ r: 3 }}
                              />
                              <Bar
                                yAxisId="right"
                                dataKey="rainfall"
                                fill="url(#rainGradient)"
                                name="Rainfall (mm)"
                                barSize={14}
                                radius={[6, 6, 0, 0]}
                              />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </>
                    );
                  })()}

                  {/* Insight Summary */}
                  <div className="mt-6 border-t border-white/20 pt-4">
                    <h4 className="text-lg font-medium text-white mb-2">
                      Insights
                    </h4>
                    {(() => {
                      const insights = weather.climateInsights ?? [];
                      return insights.length > 0 ? (
                        <ul className="list-disc list-inside text-white/80 space-y-1">
                          {insights.map((insight, idx) => (
                            <li key={idx}>{insight}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-white/70 text-sm">
                          No insights available for this location.
                        </p>
                      );
                    })()}
                  </div>
                </motion.div>
              </div>

              {/* Weather Tips */}
              <div className="backdrop-blur-xl bg-white/20 rounded-3xl p-8 shadow-2xl border border-white/30">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Weather Tips
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getWeatherTips(weatherType).map((tip, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 animate-slide-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-white/90">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <SearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSearch={handleSearch}
      />
    </div>
  );
}

function getWeatherTips(weatherType: WeatherType): string[] {
  const tips: Record<WeatherType, string[]> = {
    sunny: [
      'Stay hydrated and drink plenty of water',
      'Apply sunscreen with high SPF',
      'Wear light, breathable clothing',
      'Seek shade during peak hours (10am-4pm)',
    ],
    clear: [
      'Perfect evening for stargazing',
      'Great time for outdoor activities',
      'Temperature drops at night, bring a jacket',
    ],
    cloudy: [
      'Good day for outdoor activities',
      'UV rays can still penetrate clouds',
      'Comfortable temperature expected',
    ],
    rainy: [
      'Carry an umbrella or raincoat',
      'Drive carefully, roads may be slippery',
      'Perfect weather to stay cozy indoors',
      'Watch for puddles and flooded areas',
    ],
    snowy: [
      'Bundle up in warm, layered clothing',
      'Watch for icy roads and sidewalks',
      'Keep emergency supplies in your car',
      'Perfect day for winter activities',
    ],
    windy: [
      'Secure loose outdoor items',
      'Be cautious of falling debris',
      'Great day for flying kites',
      'Wind chill may make it feel colder',
    ],
    stormy: [
      'Stay indoors if possible',
      'Avoid using electrical appliances',
      'Keep away from windows',
      'Have emergency supplies ready',
    ],
  };

  return tips[weatherType] || tips.cloudy;
}

export default App;
