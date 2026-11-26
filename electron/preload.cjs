"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("arcade", {
  platform: () => ipcRenderer.invoke("platform"),
  loadState: () => ipcRenderer.invoke("state:load"),
  saveSettings: (v) => ipcRenderer.invoke("settings:save", v),
  toggleFavorite: (id) => ipcRenderer.invoke("favorite:toggle", id),
  scanLibrary: (paths) => ipcRenderer.invoke("library:scan", paths),
  launchGame: (id) => ipcRenderer.invoke("game:launch", id),
  diagnostics: () => ipcRenderer.invoke("diagnostics"),
  runVerification: (id) => ipcRenderer.invoke("verify:run", id),
  exportData: () => ipcRenderer.invoke("data:export"),
  importData: () => ipcRenderer.invoke("data:import"),
  maintenanceDesktop: () => ipcRenderer.invoke("maintenance:desktop"),
  saveController: (v) => ipcRenderer.invoke("controller:save", v),
  controllerState: () => ipcRenderer.invoke("controller:state"),
  phoneStatus: () => ipcRenderer.invoke("phone:status"),
  networkStatus: (scan) => ipcRenderer.invoke("network:status",scan),
  networkPairStart: () => ipcRenderer.invoke("network:pair-start"),
  networkAuthorize: (code) => ipcRenderer.invoke("network:authorize",code),
  networkConnect: (ssid,password) => ipcRenderer.invoke("network:connect",ssid,password),
  networkDisconnect: () => ipcRenderer.invoke("network:disconnect"),
  networkHotspot: () => ipcRenderer.invoke("network:hotspot"),
  onPhoneInput: (callback) => {
    const fn = (_e, state) => callback(state);
    ipcRenderer.on("phone:input", fn);
    return () => ipcRenderer.removeListener("phone:input", fn);
  },
  onControllerState: (callback) => {
    const fn = (_e, state) => callback(state);
    ipcRenderer.on("controller:state", fn);
    return () => ipcRenderer.removeListener("controller:state", fn);
  },
  onGameExited: (callback) => {
    const fn = (_e, id) => callback(id);
    ipcRenderer.on("game-exited", fn);
    return () => ipcRenderer.removeListener("game-exited", fn);
  },
  onSessionReset: (callback) => {
    const fn = () => callback();
    ipcRenderer.on("session-reset", fn);
    return () => ipcRenderer.removeListener("session-reset", fn);
  },
});
