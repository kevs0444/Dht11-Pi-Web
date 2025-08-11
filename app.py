import time
from datetime import datetime
from flask import Flask, render_template, jsonify
import board
import adafruit_dht

app = Flask(__name__)

# Initialize sensor on GPIO4 (Pin 7)
try:
    dht = adafruit_dht.DHT11(board.D4)
except Exception as e:
    print(f"Failed to initialize DHT11 sensor: {e}")
    dht = None

sensor_data = []

def read_sensor():
    """Read temperature and humidity from DHT11 sensor."""
    if dht is None:
        return {'success': False, 'error': 'Sensor not initialized'}

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
        else:
            return {'success': False, 'error': 'Sensor returned None'}
    except RuntimeError as e:
        # Sensor read errors are common, just return failure
        return {'success': False, 'error': str(e)}
    except Exception as e:
        return {'success': False, 'error': f"Unexpected error: {e}"}

def store_reading(data):
    """Store sensor data and maintain a max length."""
    if data.get('success'):
        sensor_data.append(data)
        if len(sensor_data) > 288:  # keep last 24 hours (5 min intervals)
            sensor_data.pop(0)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/current')
def current_reading():
    reading = read_sensor()
    store_reading(reading)
    return jsonify(reading)

@app.route('/api/history')
def history():
    return jsonify(sensor_data)

@app.route('/api/stats')
def stats():
    if not sensor_data:
        return jsonify({'error': 'No data available'})

    temps = [d['temperature'] for d in sensor_data if d.get('success')]
    humidity_vals = [d['humidity'] for d in sensor_data if d.get('success')]

    if not temps or not humidity_vals:
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
        'last_updated': sensor_data[-1]['timestamp']
    }
    return jsonify(stats)

if __name__ == '__main__':
    print("Starting DHT11 Flask server...")
    print("Access the API at http://<your_pi_ip>:5000")
    # Take initial reading
    initial = read_sensor()
    store_reading(initial)
    
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
