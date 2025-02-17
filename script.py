import keyboard
import mouse 
import time

isClicking = False

def set_clicker():
    global isClicking
    if isClicking:
        isClicking = False
        print ("off")
    else:
        isClicking = True
        print("work")

keyboard.add_hotkey('alt+z', set_clicker )

while True:
    if isClicking:
        mouse.double_click(button = 'left')
        time.sleep(0.01)
    