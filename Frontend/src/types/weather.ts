export interface WeatherData {
  city?: string;
  location: string;
  country: string;
  timeZone?: string;
  latitude?: number;
  longitude?: number;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  precipitation: number;
  rainChance: number[];
  date: string;
  weatherCode: number;
  sunrise: string;
  sunset: string;
  weeklyForecast: DayForecast[];
  historicalTrend?: HistoricalPoint[];
  climateInsights?: string[];
}

export interface DayForecast {
  day: string;
  temp: number;
  condition: string;
  weatherCode: number;
}

export type WeatherType = 'clear' | 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'stormy';

export interface HistoricalPoint {
  year: string;
  temperature: number;
  rainfall: number;
}
