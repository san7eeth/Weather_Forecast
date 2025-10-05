import { Sunrise, Sunset } from 'lucide-react';

interface SunCycleProps {
  sunrise: string;
  sunset: string;
  currentMinutes?: number; // local minutes since midnight for the searched location
}

export default function SunCycle({ sunrise, sunset, currentMinutes }: SunCycleProps) {
  const formatTo12Hour = (t: string) => {
    const match = (t || '').match(/^(\d{1,2}):(\d{2})/);
    if (!match) return t;
    let hour = Math.max(0, Math.min(23, parseInt(match[1], 10)));
    const minutes = match[2];
    const period = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minutes} ${period}`;
  };

  // no-op helper removed (unused)

  const timeStrToMinutes = (t: string, fallbackMinutes: number) => {
    const match = (t || '').match(/^(\d{1,2}):(\d{2})/);
    if (!match) return fallbackMinutes;
    const hh = Math.max(0, Math.min(23, parseInt(match[1], 10)));
    const mm = Math.max(0, Math.min(59, parseInt(match[2], 10)));
    return hh * 60 + mm;
  };

  const currentHour = new Date().getHours();

  const sunriseMin = timeStrToMinutes(sunrise, 6 * 60);
  const sunsetMin = timeStrToMinutes(sunset, 18 * 60);
  const nowMin = typeof currentMinutes === 'number' ? currentMinutes : currentHour * 60;

  // Handle cases where current time is before sunrise or after sunset and ensure valid daylight window
  const totalDaylightMin = Math.max(1, (sunsetMin > sunriseMin ? sunsetMin - sunriseMin : 12 * 60));
  const rawProgress = (nowMin - sunriseMin) / totalDaylightMin;
  const t = Math.max(0, Math.min(1, rawProgress));
  const currentProgress = t * 100;

  return (
    <div className="backdrop-blur-xl bg-white/20 rounded-3xl p-8 shadow-2xl border border-white/30">
      <h3 className="text-xl font-semibold text-white mb-6">Sun Cycle</h3>

      <div className="relative h-40 mb-6">
        <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="sunGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(251, 191, 36, 0.3)" />
              <stop offset="50%" stopColor="rgba(251, 191, 36, 0.6)" />
              <stop offset="100%" stopColor="rgba(251, 191, 36, 0.3)" />
            </linearGradient>
          </defs>

          <path
            d="M 10 90 Q 100 10 190 90"
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          <path
            d="M 10 90 Q 100 10 190 90"
            fill="none"
            stroke="url(#sunGradient)"
            strokeWidth="3"
            strokeDasharray={`${currentProgress * 3.6} 360`}
            className="transition-all duration-1000"
          />

          <circle
            cx={10 + t * 180}
            cy={90 - Math.sin(t * Math.PI) * 80}
            r="8"
            fill="#FCD34D"
            className="animate-pulse-slow"
          >
            <animate
              attributeName="cy"
              dur="2s"
              repeatCount="indefinite"
              values={`${90 - Math.sin(t * Math.PI) * 80};${90 - Math.sin(t * Math.PI) * 80 - 3};${90 - Math.sin(t * Math.PI) * 80}`}
            />
          </circle>

          <circle
            cx={10 + t * 180}
            cy={90 - Math.sin(t * Math.PI) * 80}
            r="12"
            fill="rgba(252, 211, 77, 0.3)"
            className="animate-ping"
          />
        </svg>

        <div className="absolute left-0 bottom-0 text-white/70 text-xs">
          <Sunrise className="w-4 h-4 mb-1 text-orange-300" />
        </div>
        <div className="absolute right-0 bottom-0 text-white/70 text-xs">
          <Sunset className="w-4 h-4 mb-1 text-orange-400" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 backdrop-blur-md bg-white/10 rounded-2xl p-4 border border-white/20">
          <div className="w-10 h-10 rounded-full bg-orange-400/20 flex items-center justify-center">
            <Sunrise className="w-5 h-5 text-orange-300" />
          </div>
          <div>
            <p className="text-xs text-white/70">Sunrise</p>
            <p className="text-lg font-semibold text-white">{formatTo12Hour(sunrise)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 backdrop-blur-md bg-white/10 rounded-2xl p-4 border border-white/20">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Sunset className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-white/70">Sunset</p>
            <p className="text-lg font-semibold text-white">{formatTo12Hour(sunset)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
