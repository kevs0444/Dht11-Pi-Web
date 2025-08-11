from flask import Flask, render_template, jsonify
import Adafruit_DHT
import time

app = Flask(__name__)

# Sensor settings
DHT_SENSOR = Adafruit_DHT.DHT11
DHT_PIN = 4  # GPIO pin where your DHT11 data pin is connected

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data')
def data():
    humidity, temperature = Adafruit_DHT.read(DHT_SENSOR, DHT_PIN)
    if humidity is not None and temperature is not None:
        return jsonify({
            'temperature': temperature,
            'humidity': humidity,
            'time': time.strftime('%H:%M:%S')
        })
    else:
        return jsonify({'error': 'Failed to retrieve data'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
