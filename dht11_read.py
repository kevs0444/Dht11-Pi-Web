import time
import board
import adafruit_dht
import firebase_admin
from firebase_admin import credentials
from firebase_admin import db

# Initialize DHT11 sensor on GPIO4
dht_device = adafruit_dht.DHT11(board.D4)

# Path to your Firebase service account JSON key
SERVICE_ACCOUNT_PATH = '/home/SystemShapers/Downloads/raspi-dht-dashboard-firebase-adminsdk-fbsvc-03061c83d8.json'

# Your Firebase Realtime Database URL
DATABASE_URL = 'https://raspi-dht-dashboard-default-rtdb.asia-southeast1.firebasedatabase.app/'

# Initialize Firebase Admin SDK
cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
firebase_admin.initialize_app(cred, {
    'databaseURL': DATABASE_URL
})

def push_sensor_data():
    try:
        temperature = dht_device.temperature
        humidity = dht_device.humidity
        if temperature is not None and humidity is not None:
            data = {
                'temperature': temperature,
                'humidity': humidity,
                'timestamp': int(time.time())
            }
            ref = db.reference('sensor_data')
            ref.set(data)
            print(f"Pushed data: {data}")
        else:
            print("Failed to retrieve sensor data")
    except RuntimeError as error:
        print(f"Runtime error: {error}")
    except Exception as error:
        print(f"Unexpected error: {error}")

if __name__ == '__main__':
    try:
        while True:
            push_sensor_data()
            time.sleep(1)  # Push data every 1 second
    except KeyboardInterrupt:
        print("\nStopping script...")
    finally:
        print("Cleaning up GPIO...")
        dht_device.exit()  # Release the DHT11 sensor resources
        print("GPIO cleanup complete.")

