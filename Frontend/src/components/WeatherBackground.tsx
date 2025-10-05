import { WeatherType } from '../types/weather';

interface WeatherBackgroundProps {
  weatherType: WeatherType;
  isNight?: boolean;
}

export default function WeatherBackground({ weatherType, isNight }: WeatherBackgroundProps) {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none transition-all duration-1000">
      <div className={`absolute inset-0 transition-opacity duration-1000 ${(isNight ? false : weatherType === 'sunny') ? 'opacity-100' : 'opacity-0'}`}>
        <SunnyBackground />
      </div>
      <div className={`absolute inset-0 transition-opacity duration-1000 ${(isNight ? true : weatherType === 'clear') ? 'opacity-100' : 'opacity-0'}`}>
        <ClearBackground />
      </div>
      <div className={`absolute inset-0 transition-opacity duration-1000 ${(isNight ? false : weatherType === 'cloudy') ? 'opacity-100' : 'opacity-0'}`}>
        <CloudyBackground />
      </div>
      <div className={`absolute inset-0 transition-opacity duration-1000 ${(isNight ? false : weatherType === 'rainy') ? 'opacity-100' : 'opacity-0'}`}>
        <RainyBackground />
      </div>
      <div className={`absolute inset-0 transition-opacity duration-1000 ${(isNight ? false : weatherType === 'snowy') ? 'opacity-100' : 'opacity-0'}`}>
        <SnowyBackground />
      </div>
      <div className={`absolute inset-0 transition-opacity duration-1000 ${(isNight ? false : weatherType === 'windy') ? 'opacity-100' : 'opacity-0'}`}>
        <WindyBackground />
      </div>
      <div className={`absolute inset-0 transition-opacity duration-1000 ${(isNight ? false : weatherType === 'stormy') ? 'opacity-100' : 'opacity-0'}`}>
        <StormyBackground />
      </div>
    </div>
  );
}

function SunnyBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-300 to-amber-200">
      <div className="absolute top-20 right-20 w-32 h-32 bg-yellow-400 rounded-full animate-pulse shadow-2xl shadow-yellow-300">
        <div className="absolute inset-0 rounded-full bg-yellow-300 animate-ping opacity-75"></div>
      </div>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full opacity-70 animate-float"
          style={{
            width: `${60 + i * 20}px`,
            height: `${40 + i * 10}px`,
            left: `${10 + i * 15}%`,
            top: `${60 + i * 5}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${6 + i}s`,
          }}
        ></div>
      ))}
    </div>
  );
}

function ClearBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-blue-900 via-blue-700 to-blue-500">
      {[...Array(100)].map((_, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full animate-twinkle"
          style={{
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        ></div>
      ))}
      <div className="absolute top-10 left-20 w-24 h-24 bg-gray-100 rounded-full shadow-2xl shadow-gray-300"></div>
    </div>
  );
}

function CloudyBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-gray-400 via-gray-300 to-gray-200">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${i * 15 - 10}%`,
            top: `${20 + (i % 3) * 20}%`,
            animationDelay: `${i * 0.8}s`,
          }}
        >
          <div className="flex items-center animate-drift">
            <div className="w-24 h-16 bg-white rounded-full opacity-90 shadow-lg"></div>
            <div className="w-32 h-20 bg-white rounded-full opacity-90 -ml-12 shadow-lg"></div>
            <div className="w-20 h-14 bg-white rounded-full opacity-90 -ml-10 shadow-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RainyBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-gray-700 via-gray-600 to-gray-500">
      {[...Array(100)].map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 bg-blue-300 animate-rain"
          style={{
            height: `${Math.random() * 20 + 15}px`,
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${Math.random() * 0.5 + 0.5}s`,
            opacity: 0.6,
          }}
        ></div>
      ))}
      {[...Array(5)].map((_, i) => (
        <div
          key={`cloud-${i}`}
          className="absolute"
          style={{
            left: `${i * 25}%`,
            top: `${10 + i * 8}%`,
          }}
        >
          <div className="flex items-center animate-drift">
            <div className="w-20 h-14 bg-gray-800 rounded-full opacity-70"></div>
            <div className="w-28 h-16 bg-gray-800 rounded-full opacity-70 -ml-10"></div>
            <div className="w-16 h-12 bg-gray-800 rounded-full opacity-70 -ml-8"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SnowyBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-slate-300 via-slate-200 to-white">
      {[...Array(100)].map((_, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full animate-snow"
          style={{
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 8 + 4}px`,
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 3 + 3}s`,
            opacity: 0.8,
          }}
        ></div>
      ))}
      {[...Array(4)].map((_, i) => (
        <div
          key={`cloud-${i}`}
          className="absolute"
          style={{
            left: `${i * 30}%`,
            top: `${5 + i * 10}%`,
          }}
        >
          <div className="flex items-center animate-drift-slow">
            <div className="w-24 h-16 bg-gray-300 rounded-full opacity-60"></div>
            <div className="w-32 h-20 bg-gray-300 rounded-full opacity-60 -ml-12"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function WindyBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-teal-400 via-cyan-300 to-blue-200">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute h-1 bg-white rounded-full animate-wind"
          style={{
            width: `${Math.random() * 100 + 50}px`,
            left: `-10%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${Math.random() * 2 + 2}s`,
            opacity: 0.4,
          }}
        ></div>
      ))}
      {[...Array(6)].map((_, i) => (
        <div
          key={`cloud-${i}`}
          className="absolute"
          style={{
            left: `${i * 20 - 10}%`,
            top: `${15 + i * 10}%`,
          }}
        >
          <div className="flex items-center animate-wind-fast">
            <div className="w-20 h-12 bg-white rounded-full opacity-70"></div>
            <div className="w-28 h-16 bg-white rounded-full opacity-70 -ml-10"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StormyBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-700">
      {[...Array(120)].map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 bg-blue-200 animate-rain-heavy"
          style={{
            height: `${Math.random() * 30 + 20}px`,
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}%`,
            animationDelay: `${Math.random() * 1}s`,
            animationDuration: `${Math.random() * 0.3 + 0.3}s`,
            opacity: 0.7,
          }}
        ></div>
      ))}
      {[...Array(3)].map((_, i) => (
        <div
          key={`lightning-${i}`}
          className="absolute w-1 bg-yellow-300 animate-lightning"
          style={{
            height: '100%',
            left: `${20 + i * 30}%`,
            animationDelay: `${i * 2 + 1}s`,
            opacity: 0,
          }}
        ></div>
      ))}
      {[...Array(5)].map((_, i) => (
        <div
          key={`cloud-${i}`}
          className="absolute"
          style={{
            left: `${i * 25}%`,
            top: `${5 + i * 5}%`,
          }}
        >
          <div className="flex items-center">
            <div className="w-24 h-16 bg-gray-950 rounded-full opacity-90"></div>
            <div className="w-32 h-20 bg-gray-950 rounded-full opacity-90 -ml-12"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
