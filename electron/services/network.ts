import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { EventEmitter } from "node:events";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import os, { networkInterfaces } from "node:os";
const exec = promisify(execFile);
export interface WifiNetwork {
  ssid: string;
  signal: number;
  security: string;
  active: boolean;
  saved: boolean;
}
export interface NetworkSnapshot {
  connected: boolean;
  ssid: string;
  signal: number;
  ipv4: string;
  hostnameUrl: string;
  controllerUrl: string;
  device: string;
  activeConnection:string;
  networks: WifiNetwork[];
  saved: string[];
  hotspot?: { ssid: string; password: string };
}
function split(line: string) {
  const out: string[] = [];
  let value = "";
  for (let i = 0; i < line.length; i++) {
    if (line[i] === "\\" && i + 1 < line.length) {
      value += line[++i];
    } else if (line[i] === ":") {
      out.push(value);
      value = "";
    } else value += line[i];
  }
  out.push(value);
  return out;
}
export function chooseControllerAddress(
  routes: { dev?: string; prefsrc?: string }[],
  interfaces: ReturnType<typeof networkInterfaces>,
) {
  for (const route of routes) {
    if (route.prefsrc && !route.prefsrc.startsWith("127."))
      return route.prefsrc;
    if (route.dev)
      for (const item of interfaces[route.dev] ?? [])
        if (item.family === "IPv4" && !item.internal) return item.address;
  }
  const all = Object.values(interfaces)
    .flatMap((v) => v ?? [])
    .filter((v) => v.family === "IPv4" && !v.internal);
  return (
    all.find((v) =>
      /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(v.address),
    )?.address ??
    all[0]?.address ??
    "127.0.0.1"
  );
}
export async function controllerAddress() {
  try {
    const { stdout } = await exec(
      "ip",
      ["-j", "-4", "route", "show", "default"],
      { timeout: 3000 },
    );
    return chooseControllerAddress(JSON.parse(stdout), networkInterfaces());
  } catch {
    return chooseControllerAddress([], networkInterfaces());
  }
}
function validSsid(ssid: string) {
  const bytes = Buffer.byteLength(ssid);
  if (!ssid || bytes > 32 || /[\0\r\n]/.test(ssid))
    throw new Error("Invalid Wi-Fi network name");
}
export class NetworkManagerService extends EventEmitter {
  private monitor?: ReturnType<typeof import("node:child_process").spawn>;
  private hotspot?: { ssid: string; password: string };
  async start() {
    if (process.platform !== "linux") return;
    const { spawn } = await import("node:child_process");
    this.monitor = spawn("nmcli", ["monitor"], {
      stdio: ["ignore", "pipe", "ignore"],
    });
    let timer: NodeJS.Timeout | undefined;
    this.monitor.stdout?.on("data", () => {
      clearTimeout(timer);
      timer = setTimeout(() => this.emit("changed"), 500);
    });
    this.monitor.once("exit", () => {
      this.monitor = undefined;
    });
  }
  stop() {
    this.monitor?.kill();
  }
  async snapshot(scan = false): Promise<NetworkSnapshot> {
    let device = "wlan0",
      ssid = "",
      activeConnection="",
      connected = false,
      signal = 0;
    const saved: string[] = [];
    let networks: WifiNetwork[] = [];
    try {
      const { stdout } = await exec(
        "nmcli",
        ["-t", "-f", "DEVICE,TYPE,STATE,CONNECTION", "device"],
        { timeout: 5000 },
      );
      for (const line of stdout.trim().split("\n")) {
        const [d, t, s, c] = split(line);
        if (t === "wifi" && d && !d.startsWith("p2p-")) {
          device = d;
          connected = s === "connected";
          activeConnection=connected?c:"";
          break;
        }
      }
      const cons = await exec(
        "nmcli",
        ["-t", "-f", "NAME,TYPE", "connection", "show"],
        { timeout: 5000 },
      );
      for (const line of cons.stdout.trim().split("\n")) {
        const [n, t] = split(line);
        if (t === "802-11-wireless" && n){try{const detail=await exec("nmcli",["-g","802-11-wireless.ssid","connection","show",n],{timeout:3000});saved.push(detail.stdout.trim()||n)}catch{saved.push(n)}}
      }
      const list = await exec(
        "nmcli",
        [
          "-t",
          "-f",
          "IN-USE,SSID,SIGNAL,SECURITY",
          "device",
          "wifi",
          "list",
          "ifname",
          device,
          "--rescan",
          scan ? "yes" : "auto",
        ],
        { timeout: scan ? 20000 : 8000, maxBuffer: 1024 * 1024 },
      );
      const map = new Map<string, WifiNetwork>();
      for (const line of list.stdout.trim().split("\n")) {
        const [a, n, s, sec] = split(line);
        if (!n) continue;
        const item = {
          ssid: n,
          signal: Number(s) || 0,
          security: sec || "Open",
          active: a === "*",
          saved: saved.includes(n),
        };
        const existing=map.get(n);if(!existing||item.active||(!existing.active&&existing.signal<item.signal))map.set(n,item);
      }
      networks = [...map.values()].sort(
        (a, b) => Number(b.active) - Number(a.active) || b.signal - a.signal,
      );
      signal = networks.find((n) => n.active)?.signal ?? 0;
      ssid=networks.find(n=>n.active)?.ssid??activeConnection;
    } catch {
      /* status remains safely disconnected */
    }
    const ipv4 = await controllerAddress();
    return {
      connected,
      ssid,
      signal,
      ipv4,
      hostnameUrl: "http://piarcade2.local:3765",
      controllerUrl: `http://${ipv4}:3765`,
      device,
      activeConnection,
      networks,
      saved,
      hotspot: this.hotspot,
    };
  }
  async connect(ssid: string, password: string) {
    validSsid(ssid);
    if (password.length > 128 || /[\0\r\n]/.test(password))
      throw new Error("Invalid Wi-Fi password");
    const before = await this.snapshot();
    const runtime =
      process.env.XDG_RUNTIME_DIR ??
      path.join(os.tmpdir(), `pi-arcade-${process.getuid?.() ?? "user"}`);
    const dir = await mkdtemp(path.join(runtime, "wifi-"));
    const secrets = path.join(dir, "secrets");
    try {
      if (password)
        await writeFile(secrets, `802-11-wireless-security.psk:${password}\n`, {
          mode: 0o600,
        });
      const args = password
        ? [
            "--wait",
            "30",
            "--passwd-file",
            secrets,
            "device",
            "wifi",
            "connect",
            ssid,
            "ifname",
            before.device,
          ]
        : [
            "--wait",
            "30",
            "device",
            "wifi",
            "connect",
            ssid,
            "ifname",
            before.device,
          ];
      await exec("nmcli", args, { timeout: 40000, maxBuffer: 1024 * 1024 });
      this.hotspot = undefined;
      this.emit("changed");
      return await this.snapshot(true);
    } catch (error) {
      if (before.connected && before.activeConnection)
        try {
          await exec(
            "nmcli",
            ["--wait", "15", "connection", "up", before.activeConnection],
            { timeout: 20000 },
          );
        } catch {
          /* retain original error */
        }
      throw new Error(
        error instanceof Error ? error.message : "Wi-Fi connection failed",
        {cause:error},
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
  async disconnect() {
    const state = await this.snapshot();
    if (!state.connected) return state;
    await exec("nmcli", ["device", "disconnect", state.device], {
      timeout: 15000,
    });
    this.emit("changed");
    return this.snapshot();
  }
  async startHotspot() {
    const state = await this.snapshot();
    if (state.connected)
      throw new Error("Disconnect Wi-Fi before starting setup hotspot");
    const password = `Arcade-${Math.random().toString(36).slice(2, 10)}`;
    try{await exec("nmcli",["connection","delete","Pi Arcade Setup"],{timeout:10000})}catch{/* no previous setup profile */}
    await exec(
      "nmcli",
      [
        "device",
        "wifi",
        "hotspot",
        "ifname",
        state.device,
        "con-name",
        "Pi Arcade Setup",
        "ssid",
        "Pi Arcade Setup",
        "password",
        password,
      ],
      { timeout: 30000 },
    );
    await exec("nmcli",["connection","modify","Pi Arcade Setup","connection.autoconnect","no"],{timeout:10000});
    this.hotspot = { ssid: "Pi Arcade Setup", password };
    this.emit("changed");
    return this.snapshot(true);
  }
}
