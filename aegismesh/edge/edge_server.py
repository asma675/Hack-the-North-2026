#!/usr/bin/env python3
"""Aegis Edge enforcement service.
Verifies one-time, short-lived HMAC capabilities before toggling a LOW-VOLTAGE demo relay.
Runs without third-party packages. GPIO is optional and automatically simulated when unavailable.
"""
import os, json, hmac, hashlib, time
from http.server import BaseHTTPRequestHandler, HTTPServer
from datetime import datetime, timezone

HOST=os.getenv('EDGE_HOST','0.0.0.0'); PORT=int(os.getenv('EDGE_PORT','8090'))
SECRET=os.getenv('EDGE_SHARED_SECRET','aegis-edge-demo-secret-change-me').encode()
TOKEN=os.getenv('EDGE_DEVICE_TOKEN','')
RELAY_PIN=int(os.getenv('EDGE_RELAY_PIN','17')); USED=set()
try:
    from gpiozero import OutputDevice
    relay=OutputDevice(RELAY_PIN, active_high=True, initial_value=False)
    GPIO_MODE=True
except Exception:
    relay=None; GPIO_MODE=False

LED_PIN=int(os.getenv('EDGE_LED_PIN','27'))
BUZZER_PIN=int(os.getenv('EDGE_BUZZER_PIN','22'))
try:
    from gpiozero import LED, Buzzer
    led=LED(LED_PIN) if GPIO_MODE else None
    buzzer=Buzzer(BUZZER_PIN) if GPIO_MODE else None
except Exception:
    led=None; buzzer=None

FIELDS=['capability_id','action_id','incident_id','target','command','approved_by','issued_at','expires_at','nonce']

def canonical(cap):
    ordered={k:cap.get(k) for k in FIELDS}
    return json.dumps(ordered,separators=(',',':'),ensure_ascii=False)

def verify(cap):
    if not isinstance(cap,dict): return False,'missing capability'
    sig=cap.get('signature','')
    expected=hmac.new(SECRET,canonical(cap).encode(),hashlib.sha256).hexdigest()
    if not sig or not hmac.compare_digest(sig,expected): return False,'invalid signature'
    if cap.get('capability_id') in USED: return False,'capability already consumed'
    try:
        exp=datetime.fromisoformat(cap['expires_at'].replace('Z','+00:00'))
        if exp < datetime.now(timezone.utc): return False,'capability expired'
    except Exception: return False,'invalid expiry'
    if cap.get('command') not in {'network.isolate','power.cut','service.restart','credential.rotate'}: return False,'unsupported command'
    return True,'verified'

def execute(cap):
    # Hackathon hardware uses LOW-VOLTAGE demo relay only. Production adapters should
    # map commands to properly authenticated network/EDR APIs rather than raw power.
    if relay:
        relay.on()
    USED.add(cap['capability_id'])
    return {'ok':True,'result':f"{cap['command']} accepted for {cap['target']}",'relay':'ENGAGED' if relay else 'SIMULATED','gpio':GPIO_MODE,'capability_id':cap['capability_id']}

class Handler(BaseHTTPRequestHandler):
    def sendj(self,code,obj):
        data=json.dumps(obj).encode();self.send_response(code);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
    def auth(self): return (not TOKEN) or self.headers.get('X-Aegis-Token')==TOKEN
    def do_GET(self):
        if self.path=='/status': return self.sendj(200,{'ok':True,'service':'Aegis Edge','gpio':GPIO_MODE,'relay_pin':RELAY_PIN,'consumed_capabilities':len(USED)})
        self.sendj(404,{'error':'not found'})
    def do_POST(self):
        if not self.auth(): return self.sendj(401,{'error':'invalid edge token'})
        if self.path=='/test':
            try:
                length=int(self.headers.get('Content-Length','0')); body=json.loads(self.rfile.read(length) or b'{}'); test=str(body.get('test','')).upper()
            except Exception as e: return self.sendj(400,{'error':str(e)})
            if test not in {'LED','BUZZER','NFC','RELAY'}: return self.sendj(400,{'error':'unsupported test'})
            if test=='LED' and led:
                led.on(); time.sleep(.15); led.off(); return self.sendj(200,{'ok':True,'test':test,'result':'LED pulse completed','gpio':True})
            if test=='BUZZER' and buzzer:
                buzzer.on(); time.sleep(.12); buzzer.off(); return self.sendj(200,{'ok':True,'test':test,'result':'Buzzer chirp completed','gpio':True})
            if test=='RELAY' and relay:
                if os.getenv('EDGE_ALLOW_RELAY_TEST','false').lower() not in {'1','true','yes','on'}:
                    return self.sendj(200,{'ok':True,'test':test,'result':'Relay test intentionally simulated. Set EDGE_ALLOW_RELAY_TEST=true to actuate low-voltage relay.','gpio':True,'relay':'SIMULATED'})
                relay.on(); time.sleep(.15); relay.off(); return self.sendj(200,{'ok':True,'test':test,'result':'Low-voltage relay pulse completed','gpio':True,'relay':'PULSED'})
            if test=='NFC':
                return self.sendj(200,{'ok':True,'test':test,'result':'NFC reader endpoint ready; reader-specific driver integration is not configured in this generic edge service.','gpio':GPIO_MODE,'nfc':'READY'})
            return self.sendj(200,{'ok':True,'test':test,'result':f'{test} test simulated safely','gpio':False})
        if self.path!='/execute': return self.sendj(404,{'error':'not found'})
        try: length=int(self.headers.get('Content-Length','0')); body=json.loads(self.rfile.read(length) or b'{}'); cap=body.get('capability'); ok,reason=verify(cap)
        except Exception as e: return self.sendj(400,{'error':str(e)})
        if not ok:return self.sendj(403,{'error':reason})
        self.sendj(200,execute(cap))
    def log_message(self,fmt,*args): print('[edge]',fmt%args)

if __name__=='__main__':
    print(f'Aegis Edge listening on http://{HOST}:{PORT} | GPIO={GPIO_MODE}')
    HTTPServer((HOST,PORT),Handler).serve_forever()
