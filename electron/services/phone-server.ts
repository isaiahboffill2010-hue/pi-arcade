import { createServer, type Server } from "node:http";
import { networkInterfaces } from "node:os";
import { WebSocketServer, type WebSocket } from "ws";
import QRCode from "qrcode";
import {
  PhoneSessions,
  phonePlayerLimit,
  type PhoneControl,
} from "./phone-sessions.js";
import type { Game } from "../../src/types.js";
type PhoneEvent = { slot: number; control: PhoneControl; pressed: boolean };
export class PhoneControllerServer {
  readonly sessions = new PhoneSessions();
  private server?: Server;
  private wss?: WebSocketServer;
  private sockets = new Map<WebSocket, string>();
  private current?: Game;
  private listeners = new Set<(e: PhoneEvent) => void>();
  url = "";
  qr = "";
  port = 3765;
  onInput(fn: (e: PhoneEvent) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  setGame(game?: Game) {
    this.current = game;
    this.broadcast();
  }
  async start() {
    this.server = createServer((req, res) => {
      if (req.url === "/" || req.url?.startsWith("/?")) {
        res.writeHead(200, {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
          "content-security-policy":
            "default-src 'self' 'unsafe-inline'; connect-src ws: wss:",
        });
        res.end(page());
      } else if (req.url === "/status") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(this.status()));
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    this.wss = new WebSocketServer({
      server: this.server,
      path: "/controller",
      maxPayload: 2048,
    });
    this.wss.on("connection", (ws) => this.connected(ws));
    await new Promise<void>((resolve, reject) => {
      this.server!.once("error", reject);
      this.server!.listen(this.port, "0.0.0.0", resolve);
    });
    this.url = `http://${lanAddress()}:${this.port}`;
    this.qr = await QRCode.toDataURL(this.url, { margin: 1, width: 280 });
    return this.status();
  }
  private connected(ws: WebSocket) {
    let token = "";
    let count = 0,
      windowAt = Date.now();
    ws.on("message", (raw) => {
      if (Date.now() - windowAt > 1000) {
        count = 0;
        windowAt = Date.now();
      }
      if (++count > 120) return;
      let m: Record<string, unknown>;
      try {
        m = JSON.parse(String(raw)) as Record<string, unknown>;
      } catch {
        return;
      }
      if (m.type === "hello") {
        const c = this.sessions.claim(
          Number(m.slot) || undefined,
          typeof m.token === "string" ? m.token : undefined,
        );
        if (!c) return send(ws, { type: "full" });
        token = c.token;
        this.sockets.set(ws, token);
        send(ws, {
          type: "welcome",
          token,
          slot: c.slot,
          status: this.status(),
        });
        this.broadcast();
        return;
      }
      const c = this.sessions.touch(token);
      if (!c) return;
      if (
        m.type === "input" &&
        typeof m.control === "string" &&
        controls.has(m.control as PhoneControl) &&
        typeof m.pressed === "boolean"
      ) {
        const control=m.control as PhoneControl;
        const allowed = c.slot <= phonePlayerLimit(this.current);
        if (!allowed) return;
        if (m.pressed) c.held.add(control);
        else c.held.delete(control);
        for (const fn of this.listeners)
          fn({ slot: c.slot, control, pressed: m.pressed });
      }
      if (m.type === "ping") send(ws, { type: "pong" });
    });
    ws.on("close", () => {
      const c = this.sessions.get(token);
      if (c)
        for (const control of c.held)
          for (const fn of this.listeners)
            fn({ slot: c.slot, control, pressed: false });
      this.sessions.disconnect(token);
      this.sockets.delete(ws);
      this.broadcast();
    });
  }
  status() {
    return {
      url: this.url,
      players: this.sessions.snapshot(),
      game: this.current
        ? {
            title: this.current.title,
            maxPlayers: phonePlayerLimit(this.current),
          }
        : undefined,
      serverReady: Boolean(this.server),
    };
  }
  private broadcast() {
    const m = { type: "status", status: this.status() };
    for (const ws of this.sockets.keys()) send(ws, m);
  }
  async stop() {
    for (const ws of this.sockets.keys()) ws.close();
    await new Promise<void>((r) => this.wss?.close(() => r()) ?? r());
    await new Promise<void>((r) => this.server?.close(() => r()) ?? r());
  }
}
const controls = new Set<PhoneControl>([
  "up",
  "down",
  "left",
  "right",
  "a",
  "b",
  "x",
  "y",
  "l",
  "r",
  "start",
  "select",
]);
const send = (ws: WebSocket, v: unknown) => {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(v));
};
function lanAddress() {
  for (const list of Object.values(networkInterfaces()))
    for (const x of list ?? [])
      if (x.family === "IPv4" && !x.internal && x.address.startsWith("10."))
        return x.address;
  for (const list of Object.values(networkInterfaces()))
    for (const x of list ?? [])
      if (x.family === "IPv4" && !x.internal) return x.address;
  return "127.0.0.1";
}
function page() {
  return `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><title>Pi Arcade Controller</title><style>*{box-sizing:border-box;touch-action:none;-webkit-user-select:none;user-select:none}body{margin:0;background:#060816;color:white;font:700 16px system-ui;overflow:hidden}#top{height:54px;display:flex;align-items:center;justify-content:space-between;padding:8px 18px;background:#11162d}#pad{height:calc(100vh - 54px);display:grid;grid-template-columns:42% 1fr;gap:3vw;padding:3vh 4vw}.d{display:grid;grid-template:repeat(3,1fr)/repeat(3,1fr);gap:5px}.d button:nth-child(1){grid-area:1/2}.d button:nth-child(2){grid-area:2/1}.d button:nth-child(3){grid-area:2/3}.d button:nth-child(4){grid-area:3/2}.buttons{display:grid;grid-template:1fr 1fr 1fr/1fr 1fr 1fr;gap:10px}.buttons [data-c=a]{grid-area:2/3}.buttons [data-c=b]{grid-area:3/2}.buttons [data-c=x]{grid-area:1/2}.buttons [data-c=y]{grid-area:2/1}.system{grid-area:3/1/4/4;display:flex;justify-content:center;gap:12px}button{border:2px solid #465078;border-radius:24px;color:white;background:#18203c;font:900 20px system-ui}button.on{background:#25d9ff;color:#041019;transform:scale(.96)}.system button{padding:6px 22px;font-size:12px}#state{color:#ffd25a}.bad{color:#ff5577}@media(orientation:portrait){#pad{filter:blur(5px);pointer-events:none}body:after{content:'Rotate your phone sideways';position:fixed;inset:0;display:grid;place-items:center;font-size:24px;background:#060816dd}}</style><div id=top><b>PI ARCADE · <span id=player>JOINING</span></b><span id=state>CONNECTING</span></div><div id=pad><div class=d><button data-c=up>▲</button><button data-c=left>◀</button><button data-c=right>▶</button><button data-c=down>▼</button></div><div class=buttons><button data-c=x>X</button><button data-c=y>Y</button><button data-c=a>A</button><button data-c=b>B</button><div class=system><button data-c=select>SELECT</button><button data-c=start>START</button></div></div></div><script>let ws,slot=0,token=localStorage.piArcadeToken||'',held=new Set;const state=document.querySelector('#state'),player=document.querySelector('#player');function connect(){ws=new WebSocket((location.protocol==='https:'?'wss':'ws')+'://'+location.host+'/controller');ws.onopen=()=>ws.send(JSON.stringify({type:'hello',token}));ws.onmessage=e=>{let m=JSON.parse(e.data);if(m.type==='welcome'){token=m.token;slot=m.slot;localStorage.piArcadeToken=token;player.textContent='P'+slot;state.textContent='READY';state.className=''}if(m.type==='full'){state.textContent='LOBBY FULL';state.className='bad'}if(m.type==='status'&&m.status.game){state.textContent=m.status.game.title+' · '+m.status.game.maxPlayers+'P'}};ws.onclose=()=>{state.textContent='RECONNECTING';state.className='bad';setTimeout(connect,800)}}function send(c,p){if(ws?.readyState===1)ws.send(JSON.stringify({type:'input',control:c,pressed:p}))}document.querySelectorAll('button').forEach(b=>{let c=b.dataset.c;const down=e=>{e.preventDefault();if(!held.has(c)){held.add(c);b.classList.add('on');send(c,true)}};const up=e=>{e.preventDefault();if(held.delete(c)){b.classList.remove('on');send(c,false)}};b.addEventListener('pointerdown',down);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',up)});document.addEventListener('visibilitychange',()=>{if(document.hidden){for(const c of held)send(c,false);held.clear()}});setInterval(()=>ws?.readyState===1&&ws.send('{"type":"ping"}'),5000);connect()</script>`;
}
