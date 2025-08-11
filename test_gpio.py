from gpiozero import LED
import time

led = LED(4)

try:
    while True:
        led.on()
        time.sleep(1)
        led.off()
        time.sleep(1)
except KeyboardInterrupt:
    pass
