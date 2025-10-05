import { Cloud, CloudRain, CloudSnow, Sun, Wind } from 'lucide-react';

interface DayForecast {
  day: string;
  temp: number;
  condition: string;
  weatherCode: number;
}

interface WeeklyForecastProps {
  forecast: DayForecast[];
}

export default function WeeklyForecast({ forecast }: WeeklyForecastProps) {
  const getWeatherIcon = (code: number) => {
    if (code === 0 || code === 1 || code === 2) return <Sun className="w-6 h-6 text-yellow-400" />;
    if (code === 3) return <Cloud className="w-6 h-6 text-gray-300" />;
    if (code >= 51 && code <= 67) return <CloudRain className="w-6 h-6 text-blue-400" />;
    if (code >= 71 && code <= 86) return <CloudSnow className="w-6 h-6 text-blue-200" />;
    if (code >= 95) return <CloudRain className="w-6 h-6 text-gray-400" />;
    return <Cloud className="w-6 h-6 text-gray-300" />;
  };

  const temps = forecast.map(d => d.temp);
  const maxTemp = Math.max(...temps);
  const minTemp = Math.min(...temps);
  const range = Math.max(1, maxTemp - minTemp);

  return (
    <div className="backdrop-blur-xl bg-white/20 rounded-3xl p-6 shadow-2xl border border-white/30">
      <div className="flex items-center gap-4 mb-6">
        {forecast.map((day, index) => (
          <div
            key={day.day}
            className="flex-1 flex flex-col items-center gap-3 animate-slide-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span className="text-sm text-white/80 font-medium">{day.day}</span>
            <div className="animate-bounce-slow" style={{ animationDelay: `${index * 0.2}s` }}>
              {getWeatherIcon(day.weatherCode)}
            </div>
            <span className="text-2xl font-bold text-white">{day.temp}°</span>
          </div>
        ))}
      </div>

      <div className="relative h-32 mt-4">
        <svg className="w-full h-full" viewBox="0 0 700 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.6)" />
              <stop offset="50%" stopColor="rgba(255, 255, 255, 0.9)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.6)" />
            </linearGradient>
          </defs>

          <path
            d={generatePath(forecast, maxTemp, minTemp)}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            className="animate-draw-line"
          />

          {forecast.map((day, index) => {
            const x = (index / (forecast.length - 1)) * 100;
            const normalizedTemp = ((day.temp - minTemp) / range) * 60 + 20;
            const y = 80 - normalizedTemp;

            return (
              <circle
                key={index}
                cx={`${x}%`}
                cy={y}
                r="6"
                fill="white"
                className="animate-pop-in"
                style={{ animationDelay: `${index * 100 + 500}ms` }}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function generatePath(forecast: DayForecast[], maxTemp: number, minTemp: number): string {
  const points = forecast.map((day, index) => {
    const x = (index / (forecast.length - 1)) * 100;
    const denom = Math.max(1, maxTemp - minTemp);
    const normalizedTemp = ((day.temp - minTemp) / denom) * 60 + 20;
    const y = 80 - normalizedTemp;
    return { x, y };
  });

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    path += ` Q ${points[i].x} ${points[i].y} ${xc} ${yc}`;
  }

  path += ` T ${points[points.length - 1].x} ${points[points.length - 1].y}`;

  return path;
}
