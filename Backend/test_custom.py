#!/usr/bin/env python3
"""
Custom Weather API Tester
Command-line tool for testing with custom location and date
Usage: python test_custom.py <city> [date] [days]
"""

import requests
import json
import sys
from datetime import datetime

def test_enhanced_api(city, days=3):
    """Test the enhanced weather API"""
    print(f"Testing Enhanced API for: {city} ({days} days)")
    print("-" * 50)
    
    try:
        url = f"http://localhost:5000/api/weather/enhanced"
        params = {'city': city, 'days': days}
        
        response = requests.get(url, params=params, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print("SUCCESS!")
            
            # City info
            city_info = data.get('city', {})
            print(f"Location: {city_info.get('name')}, {city_info.get('country')}")
            coords = city_info.get('coordinates', {})
            print(f"Coordinates: {coords.get('latitude')}°N, {coords.get('longitude')}°E")
            
            # Live forecast
            live_forecast = data.get('live_forecast', [])
            if live_forecast:
                print(f"\nLive Forecast:")
                for day in live_forecast:
                    temp = day.get('temperature', {})
                    air_quality = day.get('air_quality', {})
                    print(f"  {day.get('date')}: {day.get('condition')} - {temp.get('min', 0):.1f}°C to {temp.get('max', 0):.1f}°C - {day.get('precipitation', 0)}mm")
                    print(f"    Wind: {day.get('wind_speed', 0):.1f} m/s, Humidity: {day.get('humidity', 0):.1f}%")
                    print(f"    Air Quality: AQI {air_quality.get('aqi', 0)} ({air_quality.get('status', 'Unknown')})")
            
            # Historical data
            historical_data = data.get('historical_data', [])
            if historical_data:
                print(f"\nHistorical Data:")
                for day in historical_data[:3]:  # Show first 3 days
                    temp = day.get('temperature', {})
                    print(f"  {day.get('date')}: {day.get('condition')} - {temp.get('avg', 0):.1f}°C - {day.get('precipitation', 0)}mm")
                    print(f"    Wind: {day.get('wind_speed', 0):.1f} m/s, Humidity: {day.get('humidity', 0):.1f}%")
            
            # Insights
            insights = data.get('insights', [])
            if insights:
                print(f"\nInsights:")
                for insight in insights:
                    print(f"  • {insight}")
            
            return True
        else:
            print(f"ERROR: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_basic_weather(city, date=None):
    """Test basic weather API"""
    print(f"Testing Basic Weather for: {city}")
    if date:
        print(f"Date: {date}")
    print("-" * 50)
    
    try:
        url = f"http://localhost:5000/api/weather"
        params = {'city': city}
        if date:
            params['date'] = date
        
        response = requests.get(url, params=params, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print("SUCCESS!")
            
            weather_data = data.get('weather_data', [])
            if weather_data:
                day = weather_data[0]
                temp = day.get('temperature', {})
                air_quality = day.get('air_quality', {})
                print(f"Weather: {day.get('condition')} - {temp.get('avg', 0):.1f}°C")
                print(f"Precipitation: {day.get('precipitation', 0)}mm")
                print(f"Humidity: {day.get('humidity', 0):.1f}%")
                print(f"Wind Speed: {day.get('wind_speed', 0):.1f} m/s")
                print(f"Air Quality: AQI {air_quality.get('aqi', 0)} ({air_quality.get('status', 'Unknown')})")
            
            return True
        else:
            print(f"ERROR: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python test_custom.py <city> [date] [days]")
        print("Examples:")
        print("  python test_custom.py Kochi")
        print("  python test_custom.py New York 2024-01-15")
        print("  python test_custom.py London 2024-01-15 5")
        sys.exit(1)
    
    city = sys.argv[1]
    date = sys.argv[2] if len(sys.argv) > 2 else None
    days = int(sys.argv[3]) if len(sys.argv) > 3 else 3
    
    print("=" * 60)
    print("NASA WEATHER API - CUSTOM TESTER")
    print("=" * 60)
    print(f"City: {city}")
    if date:
        print(f"Date: {date}")
    print(f"Days: {days}")
    print()
    
    # Test enhanced API
    print("1. Testing Enhanced API...")
    test_enhanced_api(city, days)
    
    print("\n" + "=" * 60)
    
    # Test basic weather
    print("2. Testing Basic Weather...")
    test_basic_weather(city, date)
    
    print("\n" + "=" * 60)
    print("Testing completed!")

if __name__ == "__main__":
    main()
