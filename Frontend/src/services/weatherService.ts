import { WeatherData } from '../types/weather';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:5000';

const mapConditionToCode = (condition: string): number => {
  const c = (condition || '').toLowerCase();
  if (c.includes('thunder')) return 95;
  if (c.includes('storm')) return 95;
  if (c.includes('rain')) return 61;
  if (c.includes('drizzle')) return 51;
  if (c.includes('snow')) return 71;
  if (c.includes('clear') || c.includes('sunny')) return 1;
  if (c.includes('overcast')) return 3;
  if (c.includes('cloud')) return 3;
  return 3;
};

export const getWeatherType = (code: number): string => {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'sunny';
  if (code === 3) return 'cloudy';
  if (code >= 51 && code <= 67) return 'rainy';
  if (code >= 71 && code <= 77) return 'snowy';
  if (code >= 80 && code <= 82) return 'rainy';
  if (code >= 95) return 'stormy';
  return 'cloudy';
};

export const fetchWeather = async (location: string, date?: string, signal?: AbortSignal): Promise<WeatherData> => {
  const params = new URLSearchParams({ city: location, days: '7' });
  if (date) params.set('date', date);
  const url = `${API_BASE}/api/weather/enhanced?${params.toString()}`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Backend error ${response.status}`);
  }

  const data = await response.json();

  // City info
  const cityInfo = data.city || {};
  const cityName: string = cityInfo.name || location;
  const country: string = cityInfo.country || '';

  // Live forecast
  const live: any[] = data.live_forecast || [];

  // Choose the selected day if a date is provided; otherwise default to the first entry
  const normalizeToYmd = (d: any): string => {
    const raw = typeof d === 'string' ? d : d?.date;
    if (!raw) return '';
    // Accept ISO like 2025-10-06 or with time, or Date-like
    const m = String(raw).match(/(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const dd = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${mm}-${dd}`;
    }
    return '';
  };

  const requestedYmd = date ? normalizeToYmd(date) : '';
  const selectedIndex = requestedYmd
    ? Math.max(
        0,
        live.findIndex((d) => normalizeToYmd(d) === requestedYmd)
      )
    : 0;
  const selected = live[selectedIndex] || {};

  const todayTempAvg = selected.temperature?.avg ?? selected.temperature ?? 0;
  const rawHumidity = selected.humidity ?? 0;
  const todayHumidity = rawHumidity <= 1 ? Math.round(rawHumidity * 100) : Math.round(rawHumidity);
  const todayWind = selected.wind_speed ?? 0;
  const todayPrecip = selected.precipitation ?? 0;
  const todayCondition = selected.condition || 'Cloudy';
  const todayCode = mapConditionToCode(todayCondition);

  // Weekly forecast mapping
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const isSpecificDate = Boolean(requestedYmd);
  const weeklyForecast = live.slice(0, 7).map((d, index) => {
    const dateVal = new Date(d.date || Date.now());
    const label = isSpecificDate ? days[dateVal.getDay()].slice(0, 3) : index === 0 ? 'Today' : days[dateVal.getDay()].slice(0, 3);
    return {
      day: label,
      temp: Math.round((d.temperature?.max ?? d.temperature) || 0),
      condition: d.condition || 'Cloudy',
      weatherCode: mapConditionToCode(d.condition || ''),
    };
  });

  // Rain chance is not provided; approximate from precipitation sums
  const rainChance = live.slice(0, 24).map((d) => {
    const p = d.precipitation ?? 0;
    return Math.max(0, Math.min(100, Math.round(p * 10))); // rough visualization only
  });

  // Historical trend for chart - aggregate by year so X-axis shows distinct years
  const historical = data.historical_data || [];
  const yearToAgg: Record<string, { tempSum: number; tempCount: number; rainSum: number }> = {};
  for (const d of historical) {
    const dateStr = String(d?.date || '');
    const yr = dateStr.match(/^(\d{4})/)?.[1] || '----';
    const t = typeof d?.temperature?.avg === 'number' ? d.temperature.avg : 0;
    const r = typeof d?.precipitation === 'number' ? d.precipitation : 0;
    if (!yearToAgg[yr]) yearToAgg[yr] = { tempSum: 0, tempCount: 0, rainSum: 0 };
    yearToAgg[yr].tempSum += t;
    yearToAgg[yr].tempCount += 1;
    yearToAgg[yr].rainSum += r;
  }
  const historicalTrend = Object.keys(yearToAgg)
    .filter((y) => y !== '----')
    .map((y) => {
      const agg = yearToAgg[y];
      const avgTemp = agg.tempCount > 0 ? agg.tempSum / agg.tempCount : 0;
      const avgRain = agg.tempCount > 0 ? agg.rainSum / agg.tempCount : 0;
      return { year: y, temperature: avgTemp, rainfall: avgRain };
    })
    .sort((a, b) => Number(a.year) - Number(b.year));

  const climateInsights: string[] = Array.isArray(data.insights) ? data.insights : [];

  // Sunrise / Sunset fallbacks (prefer per-forecast, then top-level, then defaults)
  const rawSunrise: string = selected.sunrise || data.sunrise || '';
  const rawSunset: string = selected.sunset || data.sunset || '';
  const normalizeTime = (t: string, fallback: string) => {
    if (typeof t !== 'string' || !t) return fallback;
    // Accept formats like "06:12", "06:12:30", or ISO "2025-10-05T06:12:30Z"
    const match = t.match(/(\d{2}:\d{2})/);
    return match ? match[1] : fallback;
  };
  const sunriseStr = normalizeTime(rawSunrise, '06:00');
  const sunsetStr = normalizeTime(rawSunset, '18:00');

  return {
    city: cityName,
    location: cityName,
    country,
    timeZone: (data && (data.timezone || data.timezone_abbreviation)) || undefined,
    temperature: Math.round(todayTempAvg),
    condition: todayCondition,
    humidity: todayHumidity,
    windSpeed: Math.round(todayWind * 3.6), // km/h
    uvIndex: 0,
    precipitation: todayPrecip,
    rainChance,
    date: (() => {
      // Always reflect user-selected date if provided, and format in the location's timezone when available
      const baseStr = requestedYmd || (selected.date ? normalizeToYmd(selected) : '');
      const base = baseStr ? new Date(baseStr) : new Date();
      const tz = (data && data.timezone) || Intl.DateTimeFormat().resolvedOptions().timeZone;
      try {
        return base.toLocaleDateString('en-US', { timeZone: tz, weekday: 'long', day: '2-digit', month: 'short' });
      } catch {
        return base.toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'short' });
      }
    })(),
    weatherCode: todayCode,
    sunrise: sunriseStr,
    sunset: sunsetStr,
    weeklyForecast,
    historicalTrend,
    climateInsights,
  } as WeatherData;
};
