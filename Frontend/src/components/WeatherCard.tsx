import { Cloud, CloudRain, CloudSnow, Wind, Sun, Moon, CloudDrizzle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { WeatherData } from '../types/weather';

interface WeatherCardProps {
  weather: WeatherData;
}

export default function WeatherCard({ weather }: WeatherCardProps) {
  const [localTime, setLocalTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const tz = weather.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      try {
        const now = new Date();
        const str = now.toLocaleTimeString('en-US', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        setLocalTime(str);
      } catch {
        setLocalTime(new Date().toLocaleTimeString());
      }
    };

    updateTime();
    const id = setInterval(updateTime, 1000);
    return () => clearInterval(id);
  }, [weather.timeZone]);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Moon className="w-16 h-16 text-gray-100" />;
    if (code === 1 || code === 2) return <Sun className="w-16 h-16 text-yellow-400" />;
    if (code === 3) return <Cloud className="w-16 h-16 text-gray-300" />;
    if (code >= 51 && code <= 67) return <CloudDrizzle className="w-16 h-16 text-blue-300" />;
    if (code >= 71 && code <= 77) return <CloudSnow className="w-16 h-16 text-blue-100" />;
    if (code >= 80 && code <= 82) return <CloudRain className="w-16 h-16 text-blue-400" />;
    if (code >= 85 && code <= 86) return <CloudSnow className="w-16 h-16 text-blue-100" />;
    if (code >= 95) return <CloudRain className="w-16 h-16 text-gray-400" />;
    return <Cloud className="w-16 h-16 text-gray-300" />;
  };

  return (
    <div className="backdrop-blur-xl bg-white/20 rounded-3xl p-8 shadow-2xl border border-white/30 transition-all duration-500">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-white/90 mb-2">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-lg">{weather.location}, {weather.country}</p>
              <p className="text-sm opacity-80">{weather.date} • {localTime}</p>
            </div>
          </div>
        </div>
        <div className="animate-bounce-slow transition-all duration-500">
          {getWeatherIcon(weather.weatherCode)}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-2 transition-all duration-500">
        <span className="text-7xl font-bold text-white">{weather.temperature}°</span>
        <span className="text-3xl text-white/80">C</span>
      </div>
      <p className="text-2xl text-white/90 mb-8 transition-all duration-500">{weather.condition}</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="backdrop-blur-md bg-white/10 rounded-2xl p-4 border border-white/20 transition-all duration-300 hover:bg-white/20">
          <p className="text-sm text-white/70 mb-1">Wind Speed</p>
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-white" />
            <p className="text-2xl font-semibold text-white">{weather.windSpeed}</p>
            <p className="text-sm text-white/70">km/h</p>
          </div>
        </div>
        <div className="backdrop-blur-md bg-white/10 rounded-2xl p-4 border border-white/20 transition-all duration-300 hover:bg-white/20">
          <p className="text-sm text-white/70 mb-1">Humidity</p>
          <div className="flex items-center gap-2">
            <CloudDrizzle className="w-5 h-5 text-white" />
            <p className="text-2xl font-semibold text-white">{weather.humidity}</p>
            <p className="text-sm text-white/70">%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
