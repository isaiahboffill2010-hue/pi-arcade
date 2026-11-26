#!/usr/bin/env python3
import fcntl, json, os, struct, sys, time

UI_SET_EVBIT, UI_SET_KEYBIT, UI_SET_ABSBIT = 1074025828, 1074025829, 1074025831
UI_DEV_CREATE, UI_DEV_DESTROY = 21761, 21762
EV_SYN, EV_KEY, EV_ABS, SYN_REPORT, ABS_X, ABS_Y = 0, 1, 3, 0, 0, 1
KEY = {"a":304,"b":305,"x":307,"y":308,"l":310,"r":311,"select":314,"start":315}
AXIS = {"left":(ABS_X,-32767),"right":(ABS_X,32767),"up":(ABS_Y,-32767),"down":(ABS_Y,32767)}

def emit(fd, event_type, code, value):
    os.write(fd, struct.pack("llHHi", int(time.time()), 0, event_type, code, value))

def make(slot):
    fd = os.open("/dev/uinput", os.O_WRONLY | os.O_NONBLOCK)
    for event_type in (EV_KEY, EV_ABS, EV_SYN): fcntl.ioctl(fd, UI_SET_EVBIT, event_type)
    for key in KEY.values(): fcntl.ioctl(fd, UI_SET_KEYBIT, key)
    for axis in (ABS_X, ABS_Y): fcntl.ioctl(fd, UI_SET_ABSBIT, axis)
    name = ("Pi Arcade Phone P%d" % slot).encode()[:79]
    header = struct.pack("80sHHHHi", name, 3, 0x1209, 0x5041 + slot, 1, 0)
    zeros = [0] * 64
    maximum = [32767 if i in (0,1) else 0 for i in range(64)]
    minimum = [-32767 if i in (0,1) else 0 for i in range(64)]
    fuzz = [16 if i in (0,1) else 0 for i in range(64)]
    os.write(fd, header + struct.pack("i"*64,*zeros) + struct.pack("i"*64,*maximum) + struct.pack("i"*64,*minimum) + struct.pack("i"*64,*fuzz))
    fcntl.ioctl(fd, UI_DEV_CREATE)
    return fd

fds = [make(i) for i in range(1,5)]
held = [set() for _ in fds]

def update(slot, control, pressed):
    fd = fds[slot]
    held[slot].add(control) if pressed else held[slot].discard(control)
    if control in KEY:
        emit(fd, EV_KEY, KEY[control], 1 if pressed else 0)
    elif control in AXIS:
        code, _ = AXIS[control]
        negative = "left" if code == ABS_X else "up"
        positive = "right" if code == ABS_X else "down"
        emit(fd, EV_ABS, code, -32767 if negative in held[slot] else 32767 if positive in held[slot] else 0)
    emit(fd, EV_SYN, SYN_REPORT, 0)

def release(slot):
    for control in list(held[slot]): update(slot, control, False)

print("READY", flush=True)
try:
    for line in sys.stdin:
        try:
            message = json.loads(line)
            slot = int(message["slot"]) - 1
            if 0 <= slot < 4:
                if message.get("release"): release(slot)
                elif message.get("control") in KEY or message.get("control") in AXIS:
                    update(slot, message["control"], bool(message.get("pressed")))
        except Exception as error:
            print("WARN " + str(error), file=sys.stderr, flush=True)
finally:
    for slot, fd in enumerate(fds):
        release(slot)
        fcntl.ioctl(fd, UI_DEV_DESTROY)
        os.close(fd)
