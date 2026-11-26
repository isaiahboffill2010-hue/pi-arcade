import { createServer, type Server } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import QRCode from "qrcode";
import { controllerAddress } from "./network.js";
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
    await this.refreshAddress();
    return this.status();
  }
  async refreshAddress(){const next=`http://${await controllerAddress()}:${this.port}`;if(next===this.url&&this.qr)return false;this.url=next;this.qr=await QRCode.toDataURL(this.url,{margin:1,width:280});this.broadcast();return true}
  disconnectClients(){for(const[ws,token]of this.sockets){const client=this.sessions.get(token);if(client){for(const control of client.held)for(const fn of this.listeners)fn({slot:client.slot,control,pressed:false});client.held.clear()}ws.close(1012,"Network changed")}}
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
            platform: this.current.platform,
            layout: controllerLayout(this.current.platform),
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
function controllerLayout(platform:string){if(["NES","Game Boy","Game Boy Color","GBA"].includes(platform))return"two";if(platform==="Genesis")return"six";if(platform==="PlayStation")return"playstation";if(platform==="Nintendo 64")return"n64";return"four"}
export function controllerPage() {
  return `<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><meta name=apple-mobile-web-app-capable content=yes><meta name=apple-mobile-web-app-status-bar-style content=black-translucent><meta name=theme-color content=#050712><title>Pi Arcade Controller</title><style>
html,body{position:fixed!important;inset:0!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;overflow:hidden!important;overflow:clip!important}#controller{position:fixed!important;inset:0!important;width:auto!important;height:auto!important;max-width:100%!important;max-height:100%!important;contain:strict;transform:none!important;touch-action:none!important;-webkit-overflow-scrolling:auto}button,[data-controls]{touch-action:none!important}
:root{--vvh:100dvh;--vvw:100vw;--ink:#f7f9ff;--cyan:#42dff5;--edge:#35405f}*{box-sizing:border-box;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}html,body{margin:0;width:100%;height:100%;overflow:hidden;overscroll-behavior:none;background:#050712;color:var(--ink);font-family:system-ui,-apple-system,sans-serif}body{width:var(--vvw);height:var(--vvh);position:fixed;inset:0;background:radial-gradient(circle at 18% 50%,#18274d 0,transparent 38%),radial-gradient(circle at 82% 50%,#351942 0,transparent 40%),#050712}#controller{width:100%;height:100%;display:grid;grid-template-columns:minmax(0,38fr) minmax(116px,24fr) minmax(0,38fr);align-items:center;gap:clamp(6px,1.7vw,18px);padding:max(6px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(6px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left));overflow:hidden}.dpad,.face{position:relative;width:min(100%,calc(var(--vvh) - max(14px,env(safe-area-inset-top)) - max(14px,env(safe-area-inset-bottom))));max-width:290px;aspect-ratio:1;justify-self:center}.dpad{display:grid;grid-template:repeat(3,1fr)/repeat(3,1fr);filter:drop-shadow(0 9px 16px #0009)}.dpad button{border:0;background:#1d2740;color:#cbd8ef;font-size:clamp(11px,4.2vh,24px);border-radius:10px}.dpad button.diag{font-size:clamp(8px,2.5vh,13px);color:#64728e;background:#162038}.dpad .center{display:grid;place-items:center;background:#111a2d;border-radius:12px;pointer-events:none}.dpad .center:after{content:'+';color:#35425e;font-size:clamp(18px,7vh,42px)}button{font:900 clamp(11px,4.4vh,24px) system-ui;border:2px solid var(--edge);color:white;background:linear-gradient(145deg,#222c49,#121a2e);box-shadow:inset 0 1px #ffffff18,0 6px 14px #0008;outline:0}.on{background:linear-gradient(145deg,#66eaff,#1599be)!important;color:#041018!important;transform:scale(.91);box-shadow:0 0 22px #31dff599!important}.middle{height:min(100%,260px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(5px,2vh,13px);min-width:0;text-align:center}.brand{font-size:clamp(9px,2.7vh,14px);letter-spacing:.12em;color:#a5b2cc;white-space:nowrap}.player{font-size:clamp(16px,7vh,38px);line-height:.9}.captain{display:none;color:#ffd15c;font-size:clamp(8px,2.3vh,12px);letter-spacing:.1em}.p1 .captain{display:block}#state{font-size:clamp(8px,2.4vh,12px);color:#6fffd2;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bad{color:#ff657f!important}.system{display:flex;gap:clamp(5px,1.2vw,10px);width:100%;justify-content:center}.system button{height:clamp(26px,10vh,45px);min-width:0;padding:0 clamp(8px,1.7vw,17px);border-radius:999px;font-size:clamp(8px,2.7vh,12px)}.face{display:grid;grid-template:repeat(5,1fr)/repeat(5,1fr);gap:clamp(3px,1vh,7px);filter:drop-shadow(0 9px 16px #0009)}.face button{border-radius:50%;min-width:0;min-height:0}.face .a{grid-area:3/5}.face .b{grid-area:4/4}.face .x{grid-area:2/4}.face .y{grid-area:3/3}.face .l{grid-area:1/1/2/3;border-radius:999px}.face .r{grid-area:1/4/2/6;border-radius:999px}.face .shoulder{font-size:clamp(8px,2.8vh,13px)}body[data-layout=two] .x,body[data-layout=two] .y,body[data-layout=two] .shoulder{display:none}body[data-layout=two] .a{grid-area:2/5/4/6}body[data-layout=two] .b{grid-area:3/3/5/5}body[data-layout=six] .l{grid-area:2/3}body[data-layout=six] .r{grid-area:2/4}body[data-layout=six] .x{grid-area:3/3}body[data-layout=six] .y{grid-area:3/4}body[data-layout=six] .b{grid-area:4/3}body[data-layout=six] .a{grid-area:4/4}body[data-layout=n64] .x,body[data-layout=n64] .y{display:none}.rotate{display:none}@media(orientation:portrait){#controller{visibility:hidden}.rotate{display:grid;position:fixed;inset:0;place-items:center;padding:30px;text-align:center;font-size:20px;background:#070a16}}@media(max-height:280px){#controller{grid-template-columns:minmax(0,40fr) minmax(104px,20fr) minmax(0,40fr);gap:5px}.middle{gap:3px}.face,.dpad{max-width:calc(var(--vvh) - 10px)}.brand{font-size:8px}}
</style></head><body data-layout=four><main id=controller><section class=dpad aria-label="Directional pad"><button class=diag data-controls="up left">↖</button><button data-controls=up>▲</button><button class=diag data-controls="up right">↗</button><button data-controls=left>◀</button><div class=center></div><button data-controls=right>▶</button><button class=diag data-controls="down left">↙</button><button data-controls=down>▼</button><button class=diag data-controls="down right">↘</button></section><section class=middle><div class=brand>PI ARCADE</div><div class=player id=player>JOINING</div><div class=captain>★ CAPTAIN</div><div id=state>CONNECTING</div><div class=system><button data-controls=select>SELECT</button><button data-controls=start>START</button></div></section><section class=face aria-label="Action buttons"><button class="shoulder l" data-controls=l>L</button><button class="shoulder r" data-controls=r>R</button><button class=x data-controls=x>X</button><button class=y data-controls=y>Y</button><button class=b data-controls=b>B</button><button class=a data-controls=a>A</button></section></main><div class=rotate>Rotate your phone sideways to play</div><script>
let ws,slot=0,token=localStorage.piArcadeToken||'';const state=document.querySelector('#state'),player=document.querySelector('#player'),active=new Map(),counts=new Map();function viewport(){const v=window.visualViewport;document.documentElement.style.setProperty('--vvh',(v?.height||innerHeight)+'px');document.documentElement.style.setProperty('--vvw',(v?.width||innerWidth)+'px')}visualViewport?.addEventListener('resize',viewport);visualViewport?.addEventListener('scroll',viewport);addEventListener('orientationchange',()=>setTimeout(viewport,80));viewport();function send(c,p){if(ws?.readyState===1)ws.send(JSON.stringify({type:'input',control:c,pressed:p}))}function controls(el){return new Set((el?.dataset.controls||'').split(' ').filter(Boolean))}function press(set){for(const c of set){const n=counts.get(c)||0;counts.set(c,n+1);if(!n)send(c,true)}}function release(set){for(const c of set){const n=counts.get(c)||0;if(n<=1){counts.delete(c);send(c,false)}else counts.set(c,n-1)}}function mark(){document.querySelectorAll('[data-controls]').forEach(el=>el.classList.toggle('on',[...active.values()].some(v=>v.el===el)))}function applyStatus(s){if(s?.game){state.textContent=s.game.title+' · '+s.game.maxPlayers+'P';document.body.dataset.layout=s.game.layout||'four'}else{state.textContent='READY';document.body.dataset.layout='four'}}function connect(){ws=new WebSocket((location.protocol==='https:'?'wss':'ws')+'://'+location.host+'/controller');ws.onopen=()=>ws.send(JSON.stringify({type:'hello',token}));ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='welcome'){token=m.token;slot=m.slot;localStorage.piArcadeToken=token;player.textContent='P'+slot;document.body.classList.toggle('p1',slot===1);state.className='';applyStatus(m.status)}if(m.type==='full'){state.textContent='LOBBY FULL';state.className='bad'}if(m.type==='status')applyStatus(m.status)};ws.onclose=()=>{releaseAll();state.textContent='RECONNECTING';state.className='bad';setTimeout(connect,800)}}function releaseAll(){for(const v of active.values())release(v.set);active.clear();counts.clear();mark()}document.querySelectorAll('[data-controls]').forEach(el=>el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture?.(e.pointerId);const set=controls(el);active.set(e.pointerId,{el,set,slide:el.closest('.dpad')});press(set);mark()}));addEventListener('pointermove',e=>{const old=active.get(e.pointerId);if(!old?.slide)return;const el=document.elementFromPoint(e.clientX,e.clientY)?.closest('.dpad [data-controls]');if(!el||el===old.el)return;release(old.set);const set=controls(el);press(set);active.set(e.pointerId,{el,set,slide:old.slide});mark()},{passive:false});function end(e){const old=active.get(e.pointerId);if(!old)return;release(old.set);active.delete(e.pointerId);mark();e.preventDefault()}addEventListener('pointerup',end,{passive:false});addEventListener('pointercancel',end,{passive:false});addEventListener('contextmenu',e=>e.preventDefault());addEventListener('touchmove',e=>e.preventDefault(),{passive:false});document.addEventListener('visibilitychange',()=>document.hidden&&releaseAll());setInterval(()=>ws?.readyState===1&&ws.send('{"type":"ping"}'),5000);connect();
const surface=document.querySelector('#controller'),block=e=>{if(e.cancelable)e.preventDefault()};surface.addEventListener('touchstart',block,{passive:false});surface.addEventListener('touchmove',block,{passive:false});surface.addEventListener('gesturestart',block,{passive:false});surface.addEventListener('gesturechange',block,{passive:false});surface.addEventListener('gestureend',block,{passive:false});surface.addEventListener('lostpointercapture',end,{passive:false});surface.addEventListener('touchcancel',releaseAll,{passive:false});addEventListener('pagehide',releaseAll);addEventListener('blur',releaseAll);addEventListener('scroll',()=>{if(scrollX||scrollY)scrollTo(0,0)},{passive:true});
</script></body></html>`;
}
const page=controllerPage;
