import { describe, expect, it } from "vitest";
import { chooseControllerAddress,friendlyNetworkError } from "../electron/services/network";
import { readFile } from "node:fs/promises";
describe("controller address selection", () => {
  it("prefers the default route source", () =>
    expect(
      chooseControllerAddress([{ dev: "wlan0", prefsrc: "192.168.4.20" }], {
        wlan0: [],
      }),
    ).toBe("192.168.4.20"));
  it("uses the interface on the default route before unrelated adapters", () =>
    expect(
      chooseControllerAddress([{ dev: "wlan0" }], {
        tailscale0: [
          {
            address: "100.1.2.3",
            family: "IPv4",
            internal: false,
            netmask: "",
            cidr: null,
            mac: "",
            scopeid: 0,
          },
        ],
        wlan0: [
          {
            address: "10.42.0.1",
            family: "IPv4",
            internal: false,
            netmask: "",
            cidr: null,
            mac: "",
            scopeid: 0,
          },
        ],
      }),
    ).toBe("10.42.0.1"));
  it("falls back safely when offline", () =>
    expect(chooseControllerAddress([], {})).toBe("127.0.0.1"));
});
it("uses a private password file and contains no old fixed address",async()=>{const source=await readFile(new URL("../electron/services/network.ts",import.meta.url),"utf8"),server=await readFile(new URL("../electron/services/phone-server.ts",import.meta.url),"utf8");expect(source).toContain("--passwd-file");expect(source).toContain("mode: 0o600");expect(source+server).not.toContain("10.0.0.219")});
describe("safe connection errors",()=>{it("reports rejected credentials and successful rollback",()=>expect(friendlyNetworkError(new Error("Secrets were required"),true)).toContain("password was rejected"));it("reports timeout and failed rollback",()=>{const value=friendlyNetworkError(new Error("activation timeout"),false);expect(value).toContain("timed out");expect(value).toContain("could not be restored")})});
it("ships the complete controller-driven Wi-Fi screen",async()=>{const source=await readFile(new URL("../src/main.tsx",import.meta.url),"utf8");for(const text of["Wi-Fi & Network","Available Wi-Fi Networks","Scan Again","Show password","Connect and save securely","Return to Home","Authorize connection to"])expect(source).toContain(text)});
