#!/usr/bin/env python3
"""
DHT11 Temperature & Humidity Web Monitor for Raspberry Pi
Requirements: pip install flask adafruit-circuitpython-dht
Wiring: DHT11 data pin to GPIO 4 (pin 7), VCC to 3.3V, GND to GND
"""

import time
import json
from datetime import datetime
from flask import Flask, render_template, jsonify
import board
import adafruit_dht

# Initialize Flask app
app = Flask(__name__)

# Initialize DHT11 sensor (connected to GPIO 4)
dht = adafruit_dht.DHT11(board.D4)

# Store recent readings (last 24 hours max)
sensor_data = []

def read_sensor():
    """Read temperature and humidity from DHT11"""
    try:
        temperature = dht.temperature
        humidity = dht.humidity
        
        if temperature is not None and humidity is not None:
            return {
                'temperature': round(temperature, 1),
                'humidity': round(humidity, 1),
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'success': True
            }
    except RuntimeError as e:
        # DHT sensors can be finicky, this is normal
        print(f"Reading error: {e.args[0]}")
    
    return {'success': False}

def store_reading(data):
    """Store sensor reading and maintain history"""
    if data['success']:
        sensor_data.append(data)
        # Keep only last 288 readings (24 hours at 5min intervals)
        if len(sensor_data) > 288:
            sensor_data.pop(0)

@app.route('/')
def index():
    """Main dashboard page"""
    return render_template('index.html')

@app.route('/api/current')
def get_current():
    """Get current sensor reading"""
    reading = read_sensor()
    store_reading(reading)
    return jsonify(reading)

@app.route('/api/history')
def get_history():
    """Get historical data"""
    return jsonify(sensor_data)

@app.route('/api/stats')
def get_stats():
    """Get basic statistics"""
    if not sensor_data:
        return jsonify({'error': 'No data available'})
    
    temps = [d['temperature'] for d in sensor_data if d['success']]
    humidity_vals = [d['humidity'] for d in sensor_data if d['success']]
    
    if not temps:
        return jsonify({'error': 'No valid readings'})
    
    stats = {
        'temperature': {
            'current': temps[-1],
            'min': min(temps),
            'max': max(temps),
            'avg': round(sum(temps) / len(temps), 1)
        },
        'humidity': {
            'current': humidity_vals[-1],
            'min': min(humidity_vals),
            'max': max(humidity_vals),
            'avg': round(sum(humidity_vals) / len(humidity_vals), 1)
        },
        'readings_count': len(sensor_data),
        'last_updated': sensor_data[-1]['timestamp'] if sensor_data else None
    }
    
    return jsonify(stats)

if __name__ == '__main__':
    print("Starting DHT11 Web Monitor...")
    print("Wiring: DHT11 data pin -> GPIO 4 (Pin 7)")
    print("Access at: http://your-pi-ip:5000")
    
    # Take initial reading
    initial = read_sensor()
    store_reading(initial)
    
    # Run Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)