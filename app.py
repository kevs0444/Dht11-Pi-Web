from flask import Flask, render_template, jsonify
import time
import board
import adafruit_dht

app = Flask(__name__)

# Initialize DHT11 sensor on GPIO4 (Pin 7)
dhtDevice = adafruit_dht.DHT11(board.D4)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data')
def data():
    try:
        temperature_c = dhtDevice.temperature
        humidity = dhtDevice.humidity
        if temperature_c is None or humidity is None:
            raise RuntimeError("Failed to get reading")
        return jsonify({
            'temperature': temperature_c,
            'humidity': humidity,
            'time': time.strftime('%H:%M:%S')
        })
    except RuntimeError as error:
        # Sometimes sensor fails, try again next request
        return jsonify({'error': str(error)}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {e}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
