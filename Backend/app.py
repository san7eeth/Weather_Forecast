from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

class EnhancedWeatherService:
    def __init__(self):
        # Geocoding
        self.openmeteo_geocoding_url = "https://geocoding-api.open-meteo.com/v1/search"
        
        # Live Weather API
        self.openmeteo_weather_url = "https://api.open-meteo.com/v1/forecast"
        
        # NASA Historical Climate Data
        self.nasa_power_url = "https://power.larc.nasa.gov/api/temporal/daily/point"
        
    def get_coordinates(self, city_name):
        """Convert city name to coordinates using Open-Meteo Geocoding API"""
        try:
            params = {
                'name': city_name,
                'count': 5,  # Get more results to find the best match
                'language': 'en',
                'format': 'json'
            }
            
            response = requests.get(self.openmeteo_geocoding_url, params=params, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            
            if 'results' in data and len(data['results']) > 0:
                # Try to find the best match (prefer cities with higher population)
                best_result = None
                for result in data['results']:
                    if result.get('feature_code') == 'PPL':  # Populated place
                        best_result = result
                        break
                
                # If no populated place found, use the first result
                if not best_result:
                    best_result = data['results'][0]
                
                return {
                    'latitude': best_result['latitude'],
                    'longitude': best_result['longitude'],
                    'name': best_result['name'],
                    'country': best_result.get('country', ''),
                    'admin1': best_result.get('admin1', '')
                }
            else:
                return None
                
        except Exception as e:
            print(f"Geocoding error: {e}")
            return None
    
    def get_live_weather_data(self, latitude, longitude, days=7):
        """Get live weather forecast from Open-Meteo API"""
        try:
            params = {
                'latitude': latitude,
                'longitude': longitude,
                'daily': 'temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_max,wind_speed_10m_max,uv_index_max',
                'timezone': 'auto',
                'forecast_days': days
            }
            
            response = requests.get(self.openmeteo_weather_url, params=params, timeout=15)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            print(f"Live weather API error: {e}")
            return None
    
    def get_nasa_historical_data(self, latitude, longitude, start_date, end_date):
        """Fetch historical climate data from NASA POWER API"""
        try:
            # Convert date format from YYYY-MM-DD to YYYYMMDD
            start_date_int = int(start_date.replace('-', ''))
            end_date_int = int(end_date.replace('-', ''))
            
            params = {
                'parameters': 'T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,WS2M,ALLSKY_SFC_SW_DWN',
                'community': 'RE',
                'longitude': longitude,
                'latitude': latitude,
                'start': start_date_int,
                'end': end_date_int,
                'format': 'JSON'
            }
            
            response = requests.get(self.nasa_power_url, params=params, timeout=30)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            print(f"NASA API error: {e}")
            return None
    
    def process_weather_data(self, nasa_data):
        """Process NASA data and generate weather conditions"""
        if not nasa_data or 'properties' not in nasa_data:
            return None
            
        properties = nasa_data['properties']
        parameter_data = properties.get('parameter', {})
        
        # Process the data for each day
        processed_days = []
        
        # Get all available dates from the first parameter
        dates = set()
        for param_name, param_info in parameter_data.items():
            if isinstance(param_info, dict):
                # Find date keys (8-digit numbers)
                date_keys = [k for k in param_info.keys() if k.isdigit() and len(k) == 8]
                dates.update(date_keys)
        
        dates = sorted(dates)
        
        for date in dates:
            # Get raw values
            temp_avg = parameter_data.get('T2M', {}).get(date)
            temp_max = parameter_data.get('T2M_MAX', {}).get(date)
            temp_min = parameter_data.get('T2M_MIN', {}).get(date)
            precipitation = parameter_data.get('PRECTOTCORR', {}).get(date)
            humidity = parameter_data.get('RH2M', {}).get(date)
            wind_speed = parameter_data.get('WS2M', {}).get(date)
            solar_radiation = parameter_data.get('ALLSKY_SFC_SW_DWN', {}).get(date)
            
            # Check if data is missing (NASA uses -999.0 as fill value)
            has_missing_data = any(val == -999.0 for val in [temp_avg, temp_max, temp_min, precipitation, humidity, wind_speed, solar_radiation])
            
            if has_missing_data:
                # Skip this date if data is missing
                continue
            
            day_data = {
                'date': date,
                'temperature': {
                    'avg': temp_avg,
                    'max': temp_max,
                    'min': temp_min
                },
                'precipitation': precipitation,
                'humidity': humidity,
                'wind_speed': wind_speed,
                'solar_radiation': solar_radiation,
                'air_quality': {
                    'aqi': 0,
                    'pm2_5': 0,
                    'pm10': 0,
                    'ozone': 0,
                    'status': 'Not Available (Historical Data)'
                }
            }
            
            # Generate weather condition
            day_data['condition'] = self.generate_weather_condition(day_data)
            processed_days.append(day_data)
        
        return processed_days
    
    def estimate_air_quality(self, uv_index, humidity):
        """Estimate air quality based on UV index and humidity"""
        # Simple estimation based on available parameters
        # Higher UV index and lower humidity generally indicate better air quality
        base_aqi = 50  # Start with moderate air quality
        
        # Adjust based on UV index (higher UV = clearer air)
        if uv_index > 8:
            base_aqi -= 20  # Very clear air
        elif uv_index > 6:
            base_aqi -= 10  # Clear air
        elif uv_index < 3:
            base_aqi += 20  # Cloudy/polluted air
        
        # Adjust based on humidity (very high humidity can trap pollutants)
        if humidity > 80:
            base_aqi += 15  # High humidity can trap pollutants
        elif humidity < 30:
            base_aqi += 5   # Very dry air can have more dust
        
        # Ensure AQI is within reasonable bounds
        aqi = max(0, min(300, base_aqi))
        
        return {
            'aqi': aqi,
            'pm2_5': round(aqi * 0.4, 1),  # Rough estimate
            'pm10': round(aqi * 0.6, 1),   # Rough estimate
            'ozone': round(aqi * 0.3, 1),  # Rough estimate
            'status': self.get_aqi_status(aqi)
        }
    
    def calculate_aqi(self, pm2_5):
        """Calculate Air Quality Index from PM2.5 concentration"""
        if pm2_5 <= 12:
            return min(50, int(50 * pm2_5 / 12))
        elif pm2_5 <= 35.4:
            return min(100, int(50 + 50 * (pm2_5 - 12) / (35.4 - 12)))
        elif pm2_5 <= 55.4:
            return min(150, int(100 + 50 * (pm2_5 - 35.4) / (55.4 - 35.4)))
        elif pm2_5 <= 150.4:
            return min(200, int(150 + 50 * (pm2_5 - 55.4) / (150.4 - 55.4)))
        elif pm2_5 <= 250.4:
            return min(300, int(200 + 100 * (pm2_5 - 150.4) / (250.4 - 150.4)))
        else:
            return min(500, int(300 + 200 * (pm2_5 - 250.4) / (500.4 - 250.4)))
    
    def get_aqi_status(self, aqi):
        """Get air quality status from AQI value"""
        if aqi <= 50:
            return "Good"
        elif aqi <= 100:
            return "Moderate"
        elif aqi <= 150:
            return "Unhealthy for Sensitive Groups"
        elif aqi <= 200:
            return "Unhealthy"
        elif aqi <= 300:
            return "Very Unhealthy"
        else:
            return "Hazardous"
    
    def process_live_weather_data(self, live_data):
        """Process live weather data from Open-Meteo"""
        if not live_data or 'daily' not in live_data:
            return None
        
        daily = live_data['daily']
        processed_days = []
        
        # Get the number of days
        num_days = len(daily['time'])
        
        for i in range(num_days):
            # Calculate average temperature from max and min
            temp_avg = (daily['temperature_2m_max'][i] + daily['temperature_2m_min'][i]) / 2
            
            # Calculate basic air quality estimate based on UV index and humidity
            uv_index = daily.get('uv_index_max', [0] * num_days)[i]
            humidity = daily.get('relative_humidity_2m_max', [0] * num_days)[i]
            air_quality = self.estimate_air_quality(uv_index, humidity)
            
            day_data = {
                'date': daily['time'][i],
                'temperature': {
                    'avg': temp_avg,
                    'max': daily['temperature_2m_max'][i],
                    'min': daily['temperature_2m_min'][i]
                },
                'precipitation': daily['precipitation_sum'][i],
                'humidity': daily.get('relative_humidity_2m_max', [0] * num_days)[i],
                'wind_speed': daily.get('wind_speed_10m_max', [0] * num_days)[i] / 3.6,  # Convert km/h to m/s
                'solar_radiation': daily.get('uv_index_max', [0] * num_days)[i] * 0.1,  # Convert UV index to approximate solar radiation
                'air_quality': air_quality
            }
            
            # Generate weather condition
            day_data['condition'] = self.generate_weather_condition(day_data)
            processed_days.append(day_data)
        
        return processed_days
    
    def compare_with_historical(self, live_data, historical_data):
        """Compare live forecast with historical NASA data and always return useful insights.
        If historical data is missing, fall back to insights derived from the live forecast window."""
        insights = []

        if not live_data:
            return insights

        today_live = live_data[0]

        # If we have historical data, compute comparisons
        if historical_data:
            historical_avg = self.calculate_historical_average(historical_data)
            if historical_avg:
                temp_diff = today_live['temperature']['avg'] - historical_avg['temperature']['avg']
                precip_diff = today_live['precipitation'] - historical_avg['precipitation']
                humidity_diff = today_live['humidity'] - historical_avg['humidity']

                # Always include baseline comparisons (rounded to 1 decimal)
                insights.append(
                    f"Temperature today vs {len(historical_data)}-day historical avg: {temp_diff:+.1f}°C"
                )
                insights.append(
                    f"Precipitation today vs historical avg: {precip_diff:+.1f}mm"
                )
                insights.append(
                    f"Humidity today vs historical avg: {humidity_diff:+.1f}%"
                )

                # Highlight notable deviations
                if abs(temp_diff) > 2:
                    insights.append(
                        ("Significantly warmer" if temp_diff > 0 else "Significantly cooler") +
                        f" than average by {abs(temp_diff):.1f}°C"
                    )
                if abs(precip_diff) > 1:
                    insights.append(
                        ("Notably wetter" if precip_diff > 0 else "Notably drier") +
                        f" than average by {abs(precip_diff):.1f}mm"
                    )
                if abs(humidity_diff) > 10:
                    insights.append(
                        ("Much more humid" if humidity_diff > 0 else "Much less humid") +
                        f" than average by {abs(humidity_diff):.1f}%"
                    )

                return insights

        # Fallback: derive insights from the live forecast window when historical is unavailable
        try:
            temps = [d['temperature']['avg'] for d in live_data if 'temperature' in d]
            precs = [d.get('precipitation', 0) for d in live_data]
            winds = [d.get('wind_speed', 0) for d in live_data]

            if temps:
                insights.append(
                    f"Forecast temperature range this week: {min(temps):.1f}°C to {max(temps):.1f}°C"
                )
            if precs:
                total_prec = sum(precs)
                insights.append(
                    f"Total expected precipitation over the period: {total_prec:.1f}mm"
                )
            if winds:
                insights.append(
                    f"Peak wind speed expected: {max(winds)*3.6:.0f} km/h"
                )
        except Exception:
            # Keep insights empty if anything unexpected happens
            pass

        return insights
    
    def calculate_historical_average(self, historical_data):
        """Calculate average values from historical NASA data"""
        if not historical_data:
            return None
        
        temps = []
        precipitations = []
        humidities = []
        
        for day in historical_data:
            if day['temperature']['avg'] is not None:
                temps.append(day['temperature']['avg'])
            if day['precipitation'] is not None:
                precipitations.append(day['precipitation'])
            if day['humidity'] is not None:
                humidities.append(day['humidity'])
        
        if not temps:
            return None
        
        return {
            'temperature': {
                'avg': sum(temps) / len(temps),
                'max': max(temps),
                'min': min(temps)
            },
            'precipitation': sum(precipitations) / len(precipitations) if precipitations else 0,
            'humidity': sum(humidities) / len(humidities) if humidities else 0
        }
    
    def generate_weather_condition(self, day_data):
        """Generate weather condition based on data"""
        precipitation = day_data.get('precipitation', 0)
        solar_radiation = day_data.get('solar_radiation', 0)
        cloud_cover = day_data.get('cloud_cover', 0)
        
        # Simple condition logic based on precipitation and solar radiation
        if precipitation and precipitation > 2.5:  # > 2.5mm precipitation
            return "Rainy"
        elif precipitation and precipitation > 0.5:  # 0.5-2.5mm precipitation
            return "Light Rain"
        elif solar_radiation and solar_radiation < 10:  # Low solar radiation
            return "Cloudy"
        elif solar_radiation and solar_radiation > 20:  # High solar radiation
            return "Sunny"
        else:
            return "Partly Cloudy"

# Initialize the service
weather_service = EnhancedWeatherService()

@app.route('/api/weather', methods=['GET'])
def get_weather():
    """Get weather data for a city and date"""
    try:
        city = request.args.get('city')
        date = request.args.get('date')
        
        if not city:
            return jsonify({'error': 'City parameter is required'}), 400
        
        if not date:
            # Default to today
            date = datetime.now().strftime('%Y-%m-%d')
        
        # Validate date format
        try:
            datetime.strptime(date, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Step 1: Get coordinates
        coords = weather_service.get_coordinates(city)
        if not coords:
            return jsonify({'error': f'Could not find coordinates for city: {city}'}), 404
        
        # Step 2: Get NASA weather data
        nasa_data = weather_service.get_nasa_historical_data(
            coords['latitude'], 
            coords['longitude'], 
            date, 
            date
        )
        
        if not nasa_data:
            return jsonify({'error': 'Could not fetch weather data from NASA'}), 500
        
        # Step 3: Process the data
        processed_data = weather_service.process_weather_data(nasa_data)
        
        if not processed_data:
            return jsonify({'error': f'No weather data available for {city} on {date}. Try a different date or city.'}), 404
        
        # Return the result
        result = {
            'city': {
                'name': coords['name'],
                'country': coords['country'],
                'state': coords['admin1'],
                'coordinates': {
                    'latitude': coords['latitude'],
                    'longitude': coords['longitude']
                }
            },
            'date': date,
            'weather': processed_data[0] if processed_data else None
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/weather/forecast', methods=['GET'])
def get_forecast():
    """Get weather forecast for a city for the next 7 days"""
    try:
        city = request.args.get('city')
        
        if not city:
            return jsonify({'error': 'City parameter is required'}), 400
        
        # Get coordinates
        coords = weather_service.get_coordinates(city)
        if not coords:
            return jsonify({'error': f'Could not find coordinates for city: {city}'}), 404
        
        # Get forecast-like historical slice from the past 7 days up to today
        end_date = datetime.now()
        start_date = (end_date - timedelta(days=6)).strftime('%Y-%m-%d')
        end_date_str = end_date.strftime('%Y-%m-%d')
        
        nasa_data = weather_service.get_nasa_historical_data(
            coords['latitude'], 
            coords['longitude'], 
            start_date, 
            end_date_str
        )
        
        if not nasa_data:
            return jsonify({'error': 'Could not fetch forecast data from NASA'}), 500
        
        processed_data = weather_service.process_weather_data(nasa_data)
        
        if not processed_data:
            return jsonify({'error': f'No forecast data available for {city}. Try a different city.'}), 404
        
        result = {
            'city': {
                'name': coords['name'],
                'country': coords['country'],
                'state': coords['admin1'],
                'coordinates': {
                    'latitude': coords['latitude'],
                    'longitude': coords['longitude']
                }
            },
            'forecast': processed_data
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/weather/enhanced', methods=['GET'])
def get_enhanced_weather():
    """Get enhanced weather data with live forecast and historical comparison"""
    try:
        city = request.args.get('city')
        days = int(request.args.get('days', 7))  # Default to 7 days
        requested_date = request.args.get('date')  # Optional date to anchor historical window
        
        if not city:
            return jsonify({'error': 'City parameter is required'}), 400
        
        # Step 1: Get coordinates
        coords = weather_service.get_coordinates(city)
        if not coords:
            return jsonify({'error': f'Could not find coordinates for city: {city}'}), 404
        
        # Step 2: Get live weather forecast
        live_data = weather_service.get_live_weather_data(
            coords['latitude'], 
            coords['longitude'], 
            days
        )
        
        if not live_data:
            return jsonify({'error': 'Could not fetch live weather data'}), 500
        
        # Step 3: Get historical NASA data for comparison across multiple years
        # Anchor the window to the requested date (or today) and collect last N years for the same month/day window
        anchor = None
        if requested_date:
            try:
                anchor = datetime.strptime(requested_date, '%Y-%m-%d')
            except ValueError:
                anchor = datetime.now()
        else:
            anchor = datetime.now()

        # 7-day window starting at anchor's month/day
        window_length_days = 7
        month = anchor.month
        day = anchor.day

        years_back = 10  # include roughly last decade
        historical_all = []

        for i in range(1, years_back + 1):
            year = anchor.year - i
            try:
                start_dt = datetime(year, month, day)
            except ValueError:
                # Handle cases like Feb 29 on non-leap years by rolling to Feb 28
                if month == 2 and day == 29:
                    start_dt = datetime(year, 2, 28)
                else:
                    # Fallback to first of month
                    start_dt = datetime(year, month, 1)
            end_dt = start_dt + timedelta(days=window_length_days - 1)

            hist = weather_service.get_nasa_historical_data(
                coords['latitude'],
                coords['longitude'],
                start_dt.strftime('%Y-%m-%d'),
                end_dt.strftime('%Y-%m-%d')
            )
            if hist:
                processed = weather_service.process_weather_data(hist)
                if processed:
                    historical_all.extend(processed)

        # Step 4: Process the live data
        live_processed = weather_service.process_live_weather_data(live_data)
        historical_processed = historical_all if historical_all else None
        
        # Step 5: Generate insights
        insights = weather_service.compare_with_historical(live_processed, historical_processed) if historical_processed else []
        
        # Return the enhanced result
        result = {
            'city': {
                'name': coords['name'],
                'country': coords['country'],
                'state': coords['admin1'],
                'coordinates': {
                    'latitude': coords['latitude'],
                    'longitude': coords['longitude']
                }
            },
            'live_forecast': live_processed,
            'historical_data': historical_processed,
            'insights': insights,
            # Surface timezone information from the live weather provider so clients can format local time
            'timezone': live_data.get('timezone'),
            'timezone_abbreviation': live_data.get('timezone_abbreviation'),
            'utc_offset_seconds': live_data.get('utc_offset_seconds'),
            'data_sources': {
                'live_weather': 'Open-Meteo',
                'historical_climate': 'NASA POWER (MERRA-2)'
            }
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/weather/insights', methods=['GET'])
def get_weather_insights():
    """Get weather insights and climate analysis for a city"""
    try:
        city = request.args.get('city')
        
        if not city:
            return jsonify({'error': 'City parameter is required'}), 400
        
        # Get coordinates
        coords = weather_service.get_coordinates(city)
        if not coords:
            return jsonify({'error': f'Could not find coordinates for city: {city}'}), 404
        
        # Get live weather for today
        live_data = weather_service.get_live_weather_data(
            coords['latitude'], 
            coords['longitude'], 
            1
        )
        
        if not live_data:
            return jsonify({'error': 'Could not fetch live weather data'}), 500
        
        # Get historical data for the same date range over multiple years
        current_year = datetime.now().year
        historical_years = [current_year-1, current_year-2, current_year-3]
        all_historical_data = []
        
        for year in historical_years:
            start_date = f"{year}-01-15"
            end_date = f"{year}-01-21"
            
            hist_data = weather_service.get_nasa_historical_data(
                coords['latitude'], 
                coords['longitude'], 
                start_date, 
                end_date
            )
            
            if hist_data:
                processed = weather_service.process_weather_data(hist_data)
                if processed:
                    all_historical_data.extend(processed)
        
        # Process live data
        live_processed = weather_service.process_live_weather_data(live_data)
        
        # Generate comprehensive insights
        insights = weather_service.compare_with_historical(live_processed, all_historical_data) if all_historical_data else []
        
        # Add climate trend analysis
        if all_historical_data:
            historical_avg = weather_service.calculate_historical_average(all_historical_data)
            if historical_avg and live_processed:
                today = live_processed[0]
                
                # Add trend analysis
                trend_insights = []
                temp_trend = today['temperature']['avg'] - historical_avg['temperature']['avg']
                if abs(temp_trend) > 3:
                    trend_insights.append(f"Significant temperature anomaly: {temp_trend:+.1f}°C from historical average")
                
                precip_trend = today['precipitation'] - historical_avg['precipitation']
                if abs(precip_trend) > 2:
                    trend_insights.append(f"Notable precipitation difference: {precip_trend:+.1f}mm from historical average")
                
                insights.extend(trend_insights)
        
        result = {
            'city': {
                'name': coords['name'],
                'country': coords['country'],
                'coordinates': {
                    'latitude': coords['latitude'],
                    'longitude': coords['longitude']
                }
            },
            'current_weather': live_processed[0] if live_processed else None,
            'historical_average': weather_service.calculate_historical_average(all_historical_data),
            'insights': insights,
            'analysis_period': f"Comparing with {len(historical_years)} years of NASA historical data"
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'NASA Weather API'})

@app.route('/', methods=['GET'])
def home():
    """Home endpoint with API documentation"""
    return jsonify({
        'message': 'NASA Weather API',
        'endpoints': {
            '/api/weather': 'Get weather for a city and date (GET)',
            '/api/weather/forecast': 'Get 7-day forecast for a city (GET)',
            '/api/weather/enhanced': 'Get enhanced weather with live forecast + NASA historical data (GET)',
            '/api/weather/insights': 'Get weather insights and climate analysis (GET)',
            '/api/health': 'Health check (GET)'
        },
        'parameters': {
            'city': 'City name (required)',
            'date': 'Date in YYYY-MM-DD format (optional, defaults to today)'
        },
        'examples': {
            'current_weather': '/api/weather?city=New York&date=2024-01-15',
            'forecast': '/api/weather/forecast?city=London',
            'enhanced_weather': '/api/weather/enhanced?city=Tokyo&days=7',
            'weather_insights': '/api/weather/insights?city=Paris'
        }
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
