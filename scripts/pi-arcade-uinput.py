#!/usr/bin/env python3
import fcntl,json,os,struct,sys,time
UI_SET_EVBIT=1074025828;UI_SET_KEYBIT=1074025829;UI_SET_ABSBIT=1074025831;UI_DEV_CREATE=21761;UI_DEV_DESTROY=21762
EV_SYN=0;EV_KEY=1;EV_ABS=3;SYN_REPORT=0;ABS_X=0;ABS_Y=1
KEY={'a':304,'b':305,'x':307,'y':308,'l':310,'r':311,'select':314,'start':315}; AX={'left':(ABS_X,-32767),'right':(ABS_X,32767),'up':(ABS_Y,-32767),'down':(ABS_Y,32767)}
def emit(fd,t,c,v): os.write(fd,struct.pack('llHHi',int(time.time()),0,t,c,v))
def make(slot):
 fd=os.open('/dev/uinput',os.O_WRONLY|os.O_NONBLOCK);fcntl.ioctl(fd,UI_SET_EVBIT,EV_KEY);fcntl.ioctl(fd,UI_SET_EVBIT,EV_ABS);fcntl.ioctl(fd,UI_SET_EVBIT,EV_SYN)
 for k in KEY.values():fcntl.ioctl(fd,UI_SET_KEYBIT,k)
 for a in (ABS_X,ABS_Y):fcntl.ioctl(fd,UI_SET_ABSBIT,a)
 name=('Pi Arcade Phone P%d'%slot).encode()[:79];setup=struct.pack('80sHHHHi',name,3,0x1209,0x5041+slot,1,0)
 os.write(fd,setup+struct.pack('i'*64,*([0]*64))+struct.pack('i'*64,*([32767 if i in (0,1) else 0 for i in range(64)]))+struct.pack('i'*64,*([-32767 if i in (0,1) else 0 for i in range(64)]))+struct.pack('i'*64,*([16 if i in (0,1) else 0 for i in range(64)]));fcntl.ioctl(fd,UI_DEV_CREATE);return fd
fds=[make(i) for i in range(1,5)]; held=[set() for _ in fds];print('READY',flush=True)
def release(slot):
 fd=fds[slot];
 for c in list(held[slot]): update(slot,c,False)
def update(slot,c,p):
 fd=fds[slot]; (held[slot].add(c) if p else held[slot].discard(c))
 if c in KEY: emit(fd,EV_KEY,KEY[c],1 if p else 0)
 elif c in AX:
  code,val=AX[c]; neg='left' if code==ABS_X else 'up';pos='right' if code==ABS_X else 'down';emit(fd,EV_ABS,code,(-32767 if neg in held[slot] else 32767 if pos in held[slot] else 0))
 emit(fd,EV_SYN,SYN_REPORT,0)
try:
 for line in sys.stdin:
  try:
   m=json.loads(line);s=int(m['slot'])-1
   if 0<=s<4:
    if m.get('release'):release(s)
    elif m.get('control') in KEY or m.get('control') in AX:update(s,m['control'],bool(m.get('pressed')))
  except Exception as e: print('WARN '+str(e),file=sys.stderr,flush=True)
finally:
 for i,fd in enumerate(fds):release(i);fcntl.ioctl(fd,UI_DEV_DESTROY);os.close(fd)
