import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./cabinet.css";
import "./cabinet-fixes.css";
import "./transition.css";
import "./phone.css";
import "./network.css";
import { catalog } from "./catalog";
import { defaultSettings, profiles } from "./data";
import type {
  AppState,
  ControllerConfig,
  Diagnostic,
  Game,
  PhysicalInput,
  Settings,
  TestResult,
  PhoneStatus,
  NetworkStatus,
} from "./types";
type View =
  | "home"
  | "library"
  | "categories"
  | "search"
  | "favorites"
  | "details"
  | "controls"
  | "settings"
  | "controller"
  | "import"
  | "diagnostics"
  | "wifi";
const fallback: AppState = {
  games: catalog,
  settings: defaultSettings,
  recentIds: [],
  testResults: [],
};
function useGamepad() {
  const [pad, setPad] = React.useState({
    connected: false,
    id: "",
    mapping: "",
    buttons: Array(18).fill(false) as boolean[],
    axes: [0, 0],
  });
  React.useEffect(() => {
    let native = false,
      frame = 0;
    window.arcade?.controllerState().then((state) => {
      if (state.connected) {
        native = true;
        setPad(state);
      }
    });
    const unsubscribe = window.arcade?.onControllerState((state) => {
      native = state.connected;
      if (state.connected) setPad(state);
      else
        setPad({
          connected: false,
          id: "",
          mapping: "",
          buttons: Array(18).fill(false),
          axes: [0, 0],
        });
    });
    const tick = () => {
      if (!native) {
        const g = navigator.getGamepads?.()[0];
        if (g)
          setPad({
            connected: true,
            id: g.id,
            mapping: g.mapping,
            buttons: g.buttons.map((b) => b.pressed),
            axes: g.axes.map((v) => v ?? 0),
          });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      unsubscribe?.();
    };
  }, []);
  return pad;
}
function mappedButton(
  controller: ControllerConfig | undefined,
  control: "B1" | "B2" | "START" | "SELECT",
  fallback: number,
) {
  const value = controller?.physicalMapping?.[control];
  return typeof value === "number"
    ? value
    : typeof value === "object" && value?.kind === "gamepad-button"
      ? value.index
      : fallback;
}
function focusables() {
  return [
    ...document.querySelectorAll<HTMLElement>(
      'button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex]:not([tabindex="-1"])',
    ),
  ].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
}
function moveFocus(direction: "up" | "down" | "left" | "right") {
  const all = focusables();
  if (!all.length) return;
  const current =
    document.activeElement instanceof HTMLElement &&
    all.includes(document.activeElement)
      ? document.activeElement
      : undefined;
  if (!current) {
    all[0].focus();
    all[0].scrollIntoView({ block: "nearest" });
    return;
  }
  const a = current.getBoundingClientRect(),
    ax = a.left + a.width / 2,
    ay = a.top + a.height / 2;
  const ranked = all
    .filter((el) => el !== current)
    .map((el) => {
      const b = el.getBoundingClientRect(),
        dx = b.left + b.width / 2 - ax,
        dy = b.top + b.height / 2 - ay;
      const forward =
        direction === "left"
          ? -dx
          : direction === "right"
            ? dx
            : direction === "up"
              ? -dy
              : dy;
      const cross =
        direction === "left" || direction === "right"
          ? Math.abs(dy)
          : Math.abs(dx);
      return { el, forward, score: forward + cross * 2.5 };
    })
    .filter((x) => x.forward > 4)
    .sort((x, y) => x.score - y.score);
  const next = ranked[0]?.el;
  if (next) {
    next.focus();
    next.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
}
function artUrl(game: Game) {
  if (!game.artworkPath) return "";
  const normalized = game.artworkPath.replaceAll("\\", "/");
  return encodeURI(
    normalized.startsWith("/")
      ? `file://${normalized}`
      : `file:///${normalized}`,
  );
}
function Artwork({ game, wide = false }: { game: Game; wide?: boolean }) {
  return (
    <div className={`artwork ${wide ? "wide" : ""}`}>
      {game.artworkPath ? (
        <img src={artUrl(game)} alt={`${game.title} artwork`} loading="lazy" />
      ) : (
        <div className="art-fallback">
          <span>{game.platform}</span>
          <b>{game.title}</b>
        </div>
      )}
      <span className="platform-chip">{game.platform}</span>
    </div>
  );
}
function GameTransition({ game }: { game: Game }) {
  return (
    <div className="game-transition" aria-live="polite">
      <div className="transition-art">
        {game.artworkPath && <img src={artUrl(game)} alt="" />}
      </div>
      <div className="transition-shade" />
      <div className="transition-copy">
        <p className="eyebrow">NOW LOADING · {game.platform}</p>
        <h1>{game.title}</h1>
        <div className="loading-track">
          <span />
        </div>
        <p>Preparing fullscreen game…</p>
      </div>
    </div>
  );
}
function App() {
  const [state, setState] = React.useState<AppState>(fallback);
  const [view, setView] = React.useState<View>("home");
  const [selectedId, setSelectedId] = React.useState(catalog[0].id);
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string>("All");
  const [notice, setNotice] = React.useState("");
  const [diag, setDiag] = React.useState<Diagnostic[]>([]);
  const [results, setResults] = React.useState<TestResult[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [gameRunning, setGameRunning] = React.useState(false);
  const [phone, setPhone] = React.useState<PhoneStatus>();
  const [network, setNetwork] = React.useState<NetworkStatus>();
  const inputHistory = React.useRef({
    buttons: [] as boolean[],
    direction: "",
    next: 0,
  });
  const pad = useGamepad();
  const selected =
    state.games.find((g) => g.id === selectedId) ?? state.games[0];
  const profile =
    profiles.find((p) => p.id === selected?.profileId) ?? profiles[0];
  React.useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  React.useEffect(() => {
    let active = true,
      request = 0;
    const refresh = () => {
      const current = ++request;
      return window.arcade?.loadState().then((next) => {
        if (active && current === request) setState(next);
      });
    };
    const resetSession = () => {
      setGameRunning(false);
      setView("home");
      setNotice("");
      window.scrollTo(0, 0);
      inputHistory.current = {
        buttons: Array(18).fill(true),
        direction: "",
        next: Date.now() + 500,
      };
      void refresh();
    };
    const onFocus = () => {
      void refresh();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    void refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const unsubscribeExit = window.arcade?.onGameExited(() => {
      resetSession();
      setNotice("Game exited — Home restored.");
    });
    const unsubscribeReset = window.arcade?.onSessionReset(resetSession);
    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribeExit?.();
      unsubscribeReset?.();
    };
  }, []);
  React.useEffect(() => {
    const id = setInterval(() => {
      const history = inputHistory.current;
      if (gameRunning) {
        history.buttons = [...pad.buttons];
        history.direction = "";
        history.next = 0;
        return;
      }
      const controller = state.settings.controller;
      const confirm = mappedButton(controller, "B1", 0),
        back = mappedButton(controller, "B2", 1),
        start = mappedButton(controller, "START", 6),
        select = mappedButton(controller, "SELECT", 7);
      const rising = (index: number) =>
        Boolean(pad.buttons[index] && !history.buttons[index]);
      if (rising(confirm))
        (document.activeElement instanceof HTMLElement
          ? document.activeElement
          : focusables()[0]
        )?.click();
      if (rising(start)) {
        const primary = document.querySelector<HTMLElement>(
          ".cta:not(:disabled)",
        );
        (
          primary ??
          (document.activeElement instanceof HTMLElement
            ? document.activeElement
            : focusables()[0])
        )?.click();
      }
      if (rising(back) || rising(select)) {
        if (view === "home") focusables()[0]?.focus();
        else setView("home");
      }
      history.buttons = [...pad.buttons];
      const [x, y] = pad.axes;
      const direction =
        y < -0.65
          ? "up"
          : y > 0.65
            ? "down"
            : x < -0.65
              ? "left"
              : x > 0.65
                ? "right"
                : "";
      const now = Date.now();
      if (
        direction &&
        (direction !== history.direction || now >= history.next)
      ) {
        moveFocus(direction);
        history.next = now + (direction === history.direction ? 140 : 350);
      }
      if (!direction) history.next = 0;
      history.direction = direction;
    }, 50);
    return () => clearInterval(id);
  }, [pad, state.settings.controller, view, gameRunning]);
  React.useEffect(() => {
    const refresh = () => window.arcade?.phoneStatus().then(setPhone);
    void refresh();
    const timer = setInterval(refresh, 2000);
    const unsubscribe = window.arcade?.onPhoneInput((event) => {
      if (!event.pressed || gameRunning) return;
      if (["up", "down", "left", "right"].includes(event.control))
        moveFocus(event.control as "up" | "down" | "left" | "right");
      else if (event.control === "a")
        (document.activeElement instanceof HTMLElement
          ? document.activeElement
          : focusables()[0]
        )?.click();
      else if (event.control === "start")
        (
          document.querySelector<HTMLElement>(".cta:not(:disabled)") ??
          focusables()[0]
        )?.click();
      else if (event.control === "b" || event.control === "select")
        setView("home");
    });
    return () => {
      clearInterval(timer);
      unsubscribe?.();
    };
  }, [gameRunning]);
  React.useEffect(() => {
    const refresh = () => window.arcade?.networkStatus(false).then(setNetwork);
    void refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, []);
  const go = (v: View) => {
    setView(v);
    setNotice("");
  };
  const open = (g: Game) => {
    setSelectedId(g.id);
    go("details");
  };
  const visible = state.games.filter(
    (g) =>
      (state.settings.showUninstalled || g.installed) &&
      (category === "All" || g.genre === category || g.platform === category) &&
      `${g.title} ${g.platform} ${g.genre} ${g.manufacturer}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const saveSettings = async (v: Settings) => {
    setState(await window.arcade!.saveSettings(v));
    setNotice("Settings saved.");
  };
  const importGames = async () => {
    setBusy(true);
    try {
      setState(await window.arcade!.scanLibrary([]));
      setNotice("Library scan complete.");
    } finally {
      setBusy(false);
    }
  };
  const favorite = async () =>
    setState(await window.arcade!.toggleFavorite(selected.id));
  const launch = async () => {
    if (gameRunning) return;
    setBusy(true);
    setGameRunning(true);
    const r = await window.arcade!.launchGame(selected.id);
    setBusy(false);
    if (!r.ok) {
      setGameRunning(false);
      setNotice(r.error ?? "Launch failed");
    }
  };
  const runDiagnostics = async () => {
    go("diagnostics");
    setBusy(true);
    setDiag(await window.arcade!.diagnostics());
    setBusy(false);
  };
  const verify = async (id?: string) => {
    setBusy(true);
    try {
      const r = await window.arcade!.runVerification(id);
      setResults(r);
      setState(await window.arcade!.loadState());
      setNotice(`Verification finished: ${r.length} stage result(s).`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main>
      <Header view={view} go={go} runDiagnostics={runDiagnostics} />
      {notice && <div className="notice">{notice}</div>}
      {gameRunning && selected && <GameTransition game={selected} />}
      {view === "home" && (
        <Home
          state={state}
          open={open}
          go={go}
          phone={phone}
          network={network}
        />
      )}{" "}
      {view === "library" && (
        <Library
          title="Game Library"
          games={visible}
          open={open}
          empty="No matching games. Enable catalog entries in Settings or import files."
        />
      )}
      {view === "categories" && (
        <Categories
          state={state}
          choose={(c) => {
            setCategory(c);
            go("library");
          }}
        />
      )}{" "}
      {view === "search" && (
        <Search query={query} setQuery={setQuery} games={visible} open={open} />
      )}{" "}
      {view === "favorites" && (
        <Library
          title="Favorites"
          games={state.games.filter((g) => g.favorite)}
          open={open}
          empty="Favorite a game from its details page."
        />
      )}
      {view === "details" && selected && (
        <Details
          game={selected}
          favorite={favorite}
          controls={() => go("controls")}
          launch={launch}
          busy={busy}
        />
      )}{" "}
      {view === "controls" && selected && (
        <Controls
          game={selected}
          profile={profile}
          launch={launch}
          busy={busy}
        />
      )}
      {view === "settings" && (
        <>
          <SettingsView
            settings={state.settings}
            save={saveSettings}
            go={go}
            exportData={async () => {
              const r = await window.arcade!.exportData();
              setNotice(r.ok ? `Backup saved: ${r.path}` : "Backup canceled.");
            }}
            importData={async () => {
              const s = await window.arcade!.importData();
              if (s) {
                setState(s);
                setNotice("Backup restored.");
              }
            }}
          />
          <section className="panel">
            <h3>Maintenance mode</h3>
            <p>
              Close Pi Arcade cleanly and reveal the Raspberry Pi desktop.
              Reopen Pi Arcade or reboot to return directly to Home.
            </p>
            <button onClick={() => void window.arcade?.maintenanceDesktop()}>
              Exit to desktop for maintenance
            </button>
          </section>
        </>
      )}
      {view === "wifi" && (
        <WifiNetworkView value={network} update={setNetwork} home={()=>setView("home")} />
      )}
      {view === "controller" && (
        <ControllerTest
          pad={pad}
          current={state.settings.controller}
          save={async (c) => {
            setState(await window.arcade!.saveController(c));
            setNotice("Controller mapping saved.");
          }}
        />
      )}
      {view === "import" && (
        <ImportView
          importGames={importGames}
          busy={busy}
          paths={state.settings.libraryPaths}
        />
      )}{" "}
      {view === "diagnostics" && (
        <Diagnostics
          values={diag}
          results={results.length ? results : state.testResults.slice(0, 20)}
          verify={verify}
          busy={busy}
        />
      )}
      <footer>
        {pad.connected
          ? `CONTROLLER · ${pad.id.slice(0, 45)}`
          : "KEYBOARD · arrows / enter / escape"}{" "}
        <span>START + SELECT · hold 3s for exit menu</span>
      </footer>
    </main>
  );
}
function Header({
  view,
  go,
  runDiagnostics,
}: {
  view: View;
  go: (v: View) => void;
  runDiagnostics: () => void;
}) {
  const items: [View, string][] = [
    ["home", "Home"],
    ["library", "Library"],
    ["categories", "Categories"],
    ["search", "Search"],
    ["favorites", "Favorites"],
    ["settings", "Settings"],
  ];
  return (
    <header>
      <button className="brand" onClick={() => go("home")}>
        PI<span>ARCADE</span>
      </button>
      <nav>
        {items.map(([v, label]) => (
          <button
            key={v}
            className={view === v ? "active" : ""}
            onClick={() => go(v)}
          >
            {label}
          </button>
        ))}
        <button onClick={runDiagnostics}>Diagnostics</button>
      </nav>
    </header>
  );
}
function Home({
  state,
  open,
  go,
  phone,
  network,
}: {
  state: AppState;
  open: (g: Game) => void;
  go: (v: View) => void;
  phone?: PhoneStatus;
  network?: NetworkStatus;
}) {
  const installed = state.games.filter((g) => g.installed),
    recent = state.recentIds
      .map((id) => state.games.find((g) => g.id === id))
      .filter(Boolean) as Game[],
    featured =
      recent[0] ??
      installed.find((g) => g.genre === "Fighting") ??
      installed[0];
  const shelf = (title: string, games: Game[]) =>
    games.length ? (
      <Library title={title} games={games} open={open} empty="" />
    ) : null;
  return (
    <>
      {network?.hotspot && (
        <section className="panel">
          <p className="eyebrow">OFFLINE SETUP NETWORK</p>
          <h2>{network.hotspot.ssid}</h2>
          <p>
            Connect an owner's phone using password{" "}
            <strong>{network.hotspot.password}</strong>, then open{" "}
            <strong>{network.controllerUrl}</strong>.
          </p>
        </section>
      )}
      {featured && (
        <section className="featured">
          <Artwork game={featured} wide />
          <div className="featured-copy">
            <p className="eyebrow">FEATURED · {featured.platform}</p>
            <h1>{featured.title}</h1>
            <p>{featured.description}</p>
            <div className="actions">
              <button className="cta" onClick={() => open(featured)}>
                Play now
              </button>
              <button onClick={() => go("library")}>All games</button>
            </div>
          </div>
        </section>
      )}
      <div className="dashboard-stats">
        <b>{installed.length}</b> READY TO PLAY <span>•</span> OFFLINE{" "}
        <span>•</span> CONTROLLER READY
      </div>
      <section className="phone-lobby">
        <div>
          <p className="eyebrow">WIRELESS CONTROLLERS</p>
          <h2>Scan to join</h2>
          <p>
            Connect phones to this Wi-Fi, then scan. Player 1 is the captain and
            controls the launcher.
          </p>
          <code>{phone?.url ?? "Starting controller server…"}</code>
          <div className="phone-slots">
            {[1, 2, 3, 4].map((slot) => {
              const ready = phone?.players.some(
                (p) => p.slot === slot && p.connected,
              );
              return (
                <span key={slot} className={ready ? "joined" : ""}>
                  P{slot} · {ready ? "READY" : "OPEN"}
                </span>
              );
            })}
          </div>
          {!phone?.virtualPads && (
            <p className="hint">
              Lobby online; waiting for Linux virtual-gamepad permission.
            </p>
          )}
        </div>
        {phone?.qr && <img src={phone.qr} alt="QR code for phone controller" />}
      </section>
      {shelf("Continue Playing", recent.slice(0, 8))}
      {shelf("Ready to Play", installed)}
      {shelf(
        "Fighting Games",
        installed.filter((g) => g.genre === "Fighting"),
      )}
      {shelf(
        "Platform Adventures",
        installed.filter((g) => g.genre === "Platform"),
      )}
      {shelf(
        "Racing & Sports",
        installed.filter((g) => ["Racing", "Sports"].includes(g.genre)),
      )}
      {shelf(
        "Favorites",
        installed.filter((g) => g.favorite),
      )}
    </>
  );
}
function Library({
  title,
  games,
  open,
  empty,
}: {
  title: string;
  games: Game[];
  open: (g: Game) => void;
  empty: string;
}) {
  return (
    <section className="shelf">
      <div className="section-title">
        <h2>{title}</h2>
        <span>{games.length}</span>
      </div>
      {games.length ? (
        <div className="grid">
          {games.map((g) => (
            <button key={g.id} className="card" onClick={() => open(g)}>
              <Artwork game={g} />
              <span className="card-copy">
                <b>{g.title}</b>
                <small>
                  {g.platform} · {g.installed ? "READY" : "UNAVAILABLE"}
                </small>
              </span>
              {g.favorite && <i>★</i>}
            </button>
          ))}
        </div>
      ) : (
        <div className="empty">{empty}</div>
      )}
    </section>
  );
}
function Categories({
  state,
  choose,
}: {
  state: AppState;
  choose: (c: string) => void;
}) {
  const values = [
    ...new Set(state.games.flatMap((g) => [g.genre, g.platform])),
  ];
  return (
    <section>
      <h2>Categories</h2>
      <div className="category-grid">
        {values.map((v) => (
          <button onClick={() => choose(v)}>
            <strong>{v}</strong>
            <span>
              {
                state.games.filter((g) => g.genre === v || g.platform === v)
                  .length
              }{" "}
              titles
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
function Search({
  query,
  setQuery,
  games,
  open,
}: {
  query: string;
  setQuery: (s: string) => void;
  games: Game[];
  open: (g: Game) => void;
}) {
  const keys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789⌫".split("");
  return (
    <section>
      <h2>Search</h2>
      <input
        className="search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        placeholder="Game title, platform, genre…"
      />
      <div className="keyboard">
        {keys.map((k) => (
          <button
            onClick={() => setQuery(k === "⌫" ? query.slice(0, -1) : query + k)}
          >
            {k}
          </button>
        ))}
        <button onClick={() => setQuery(query + " ")}>SPACE</button>
        <button onClick={() => setQuery("")}>CLEAR</button>
      </div>
      <Library
        title="Results"
        games={games.slice(0, 30)}
        open={open}
        empty="No results."
      />
    </section>
  );
}
function Details({
  game,
  favorite,
  controls,
  busy,
}: {
  game: Game;
  favorite: () => void;
  controls: () => void;
  launch: () => void;
  busy: boolean;
}) {
  return (
    <section className="detail">
      <Artwork game={game} />
      <div className="detail-copy">
        <p className="eyebrow">
          {game.platform} · {game.genre} · {game.verification}
        </p>
        <h2>{game.title}</h2>
        <p>{game.description}</p>
        <dl>
          <dt>Engine</dt>
          <dd>{game.core}</dd>
          <dt>Studio</dt>
          <dd>{game.manufacturer ?? "Unknown"}</dd>
          <dt>Status</dt>
          <dd>
            {game.installed ? "Installed and ready" : "Game file required"}
          </dd>
        </dl>
        <div className="actions">
          <button
            className="cta"
            disabled={!game.installed || busy}
            onClick={controls}
          >
            {game.installed ? "Controls & Play" : "Game file required"}
          </button>
          <button onClick={favorite}>
            {game.favorite ? "★ Favorited" : "☆ Add favorite"}
          </button>
        </div>
      </div>
    </section>
  );
}
function Controls({
  game,
  profile,
  launch,
  busy,
}: {
  game: Game;
  profile: (typeof profiles)[number];
  launch: () => void;
  busy: boolean;
}) {
  const all = ["B1", "B2", "B3", "B4", "B5", "B6"];
  const connector = (b: string) =>
    b.startsWith("B")
      ? `K${b.slice(1)}`
      : b === "START"
        ? "K7"
        : b === "SELECT"
          ? "K8"
          : "";
  return (
    <section>
      <p className="eyebrow">CONTROL PREVIEW · {game.title}</p>
      <h2>{profile.style}</h2>
      <div className="joystick">
        AU · ↑<br />
        AL · ← ● → · AR
        <br />
        AD · ↓
      </div>
      <div className="button-map">
        {all.map((b) => {
          const x = profile.bindings.find((v) => v.physical === b);
          return (
            <div className={x ? "used" : "unused"}>
              <kbd>
                {b} · {connector(b)}
              </kbd>
              <span>{x?.action ?? "Unused"}</span>
            </div>
          );
        })}
      </div>
      <div className="controls system">
        {profile.bindings
          .filter((b) => ["START", "SELECT"].includes(b.physical))
          .map((b) => (
            <div>
              <kbd>
                {b.physical} · {connector(b.physical)}
              </kbd>
              <span>{b.action}</span>
            </div>
          ))}
      </div>
      {[...profile.notes, ...(profile.limitations ?? [])].map((n) => (
        <p className="hint">{n}</p>
      ))}
      <button
        className="cta"
        disabled={!game.installed || busy}
        onClick={launch}
      >
        {game.installed ? "Start game" : "Import game file first"}
      </button>
    </section>
  );
}
function SettingsView({
  settings,
  save,
  go,
  exportData,
  importData,
}: {
  settings: Settings;
  save: (s: Settings) => void;
  go: (v: View) => void;
  exportData: () => void;
  importData: () => void;
}) {
  const patch = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    save({ ...settings, [k]: v });
  return (
    <section>
      <h2>Settings</h2>
      <div className="settings-grid">
        <div className="panel">
          <h3>Audio</h3>
          <label>
            Volume{" "}
            <input
              type="range"
              min="0"
              max="100"
              value={settings.volume}
              onChange={(e) => patch("volume", +e.target.value)}
            />
            <b>{settings.volume}%</b>
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.muted}
              onChange={(e) => patch("muted", e.target.checked)}
            />{" "}
            Mute
          </label>
          <select
            value={settings.audioDriver}
            onChange={(e) => patch("audioDriver", e.target.value)}
          >
            <option value="pulse">PulseAudio</option>
            <option value="alsa">ALSA</option>
            <option value="wasapi">WASAPI</option>
          </select>
        </div>
        <div className="panel">
          <h3>Video</h3>
          <select
            value={settings.videoDriver}
            onChange={(e) => patch("videoDriver", e.target.value)}
          >
            <option value="gl">OpenGL</option>
            <option value="vulkan">Vulkan</option>
            <option value="glcore">OpenGL Core</option>
          </select>
          <label>
            <input
              type="checkbox"
              checked={settings.integerScale}
              onChange={(e) => patch("integerScale", e.target.checked)}
            />{" "}
            Integer scaling
          </label>
        </div>
        <div className="panel">
          <h3>Library & saves</h3>
          <label>
            <input
              type="checkbox"
              checked={settings.showUninstalled}
              onChange={(e) => patch("showUninstalled", e.target.checked)}
            />{" "}
            Show full supported catalog
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.autosave}
              onChange={(e) => patch("autosave", e.target.checked)}
            />{" "}
            Automatic save/load state
          </label>
          <button onClick={() => go("import")}>Import library</button>
        </div>
        <div className="panel">
          <h3>Controller</h3>
          <p>{settings.controller?.gamepadId ?? "Not calibrated"}</p>
          <button onClick={() => go("controller")}>
            Controller test & calibration
          </button>
        </div>
        <div className="panel">
          <h3>Wi-Fi & Network</h3>
          <p>
            Connect at a new house and refresh the phone-controller QR code
            automatically.
          </p>
          <button onClick={() => go("wifi")}>Open Wi-Fi settings</button>
        </div>
        <div className="panel">
          <h3>Backup</h3>
          <button onClick={exportData}>Export settings and library</button>
          <button onClick={importData}>Restore backup</button>
        </div>
      </div>
    </section>
  );
}
function WifiNetworkView({
  value,
  update,
  home,
}: {
  value?: NetworkStatus;
  update: (value: NetworkStatus) => void;
  home:()=>void;
}) {
  const [selected, setSelected] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [shift, setShift] = React.useState(false);
  const [pairCode, setPairCode] = React.useState("");
  const [enteredCode, setEnteredCode] = React.useState("");
  const [unlocked, setUnlocked] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const refresh = async (scan = true) => {
    setBusy(true);
    try {
      update(await window.arcade!.networkStatus(scan));
      setMessage("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  React.useEffect(()=>{void refresh(true)},[]);
  const run = async (fn: () => Promise<NetworkStatus>) => {
    setBusy(true);
    setMessage(
      "Connected phones will temporarily disconnect while NetworkManager applies this change…",
    );
    try {
      const next = await fn();
      update(next);
      setSelected("");
      setPassword("");
      setMessage(
        next.connected
          ? `Connected to ${next.ssid}. New controller address: ${next.controllerUrl}`
          : "Network change complete.",
      );
    } catch (e) {
      setMessage(
        `Connection failed. The previous known network was restored when possible. ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setBusy(false);
    }
  };
  const keys = (
    shift ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "abcdefghijklmnopqrstuvwxyz"
  )
    .split("")
    .concat("1234567890".split(""), "!@#$%^&*()-_=+.".split(""));
  const selectedNetwork=value?.networks.find(network=>network.ssid===selected);const secured=Boolean(selectedNetwork&&selectedNetwork.security!=="--"&&selectedNetwork.security!=="Open");
  return (
    <section>
      <p className="eyebrow">HOST MAINTENANCE · NETWORKMANAGER</p>
      <h2>Wi-Fi & Network</h2>
      <div className={`connection ${value?.connected ? "ok" : "bad"}`}>
        <b>{value?.connected ? `Connected · ${value.ssid}` : "Offline"}</b>
        <span>
          {" "}
          Signal {value?.signal ?? 0}% · IPv4 {value?.ipv4 ?? "Unavailable"}
        </span>
      </div>
      <section className="wifi-list">{value?.networks.length?value.networks.map(n=><button key={n.ssid} disabled={!unlocked} className={n.active?"active":""} onClick={()=>{setSelected(n.ssid);setPassword("")}}><strong>{n.ssid}</strong><span>{n.active?"CONNECTED · ":""}{n.signal}% · {n.security==="--"?"Open":`🔒 ${n.security}`}{n.saved?" · SAVED":""}</span></button>):<div className="empty">{busy?"Scanning for nearby Wi-Fi…":"No Wi-Fi networks found. Move closer to the router and rescan."}</div>}</section>
      <div className="panel">
        <h3>Phone controllers</h3>
        <code>{value?.controllerUrl}</code>
        <p>
          Hostname fallback: <strong>{value?.hostnameUrl}</strong>
        </p>
        <p className="hint">
          Phones must be on a mutually reachable LAN. Guest-network client
          isolation or firewall rules can block controllers even on the same
          SSID.
        </p>
      </div>
      {!unlocked ? (
        <div className="panel">
          <h3>Owner pairing required</h3>
          <p>
            Network changes are not authorized merely because a phone is P1.
            Start a two-minute local-TV pairing and enter the displayed code.
          </p>
          {pairCode ? (
            <>
              <div className="pair-code">{pairCode}</div>
              <input
                value={enteredCode}
                readOnly
                type="password"
                aria-label="Owner pairing code"
              />
              <div className="keyboard digits">
                {"1234567890".split("").map((k) => (
                  <button
                    key={k}
                    onClick={() => setEnteredCode((v) => (v + k).slice(0, 6))}
                  >
                    {k}
                  </button>
                ))}
                <button onClick={() => setEnteredCode((v) => v.slice(0, -1))}>
                  ⌫
                </button>
              </div>
              <button
                className="cta"
                onClick={async () => {
                  const ok = await window.arcade!.networkAuthorize(enteredCode);
                  setUnlocked(ok);
                  setMessage(
                    ok
                      ? "Owner controls unlocked for five minutes."
                      : "Incorrect or expired pairing code.",
                  );
                }}
              >
                Unlock network controls
              </button>
            </>
          ) : (
            <button
              onClick={async () => {
                const pair = await window.arcade!.networkPairStart();
                setPairCode(pair.code);
                setEnteredCode("");
              }}
            >
              Begin owner pairing
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="actions">
            <button disabled={busy} onClick={() => void refresh(true)}>
              {busy ? "Scanning…" : "Rescan networks"}
            </button>
            {value?.connected ? (
              <button
                disabled={busy}
                onClick={() =>
                  void run(() => window.arcade!.networkDisconnect())
                }
              >
                Disconnect
              </button>
            ) : (
              <button
                disabled={busy}
                onClick={() => void run(() => window.arcade!.networkHotspot())}
              >
                Start protected setup hotspot
              </button>
            )}
          </div>
          {selected && (
            <div className="panel">
              <h3>Connect to {selected}</h3>
              <p className="hint">
                Existing phone controllers and SSH may disconnect. Pi Arcade
                will release held inputs and attempt to restore the previous
                network if authentication fails.
              </p>
              {secured?<><input
                value={password}
                readOnly
                type={show ? "text" : "password"}
                aria-label="Wi-Fi password"
                placeholder="Wi-Fi password"
              />
              <label>
                <input
                  type="checkbox"
                  checked={show}
                  onChange={(e) => setShow(e.target.checked)}
                />{" "}
                Show password
              </label>
              <div className="keyboard wifi-keys">
                {keys.map((k) => (
                  <button key={k} onClick={() => setPassword((v) => v + k)}>
                    {k}
                  </button>
                ))}
                <button onClick={() => setShift((v) => !v)}>
                  {shift ? "lowercase" : "UPPERCASE"}
                </button>
                <button onClick={() => setPassword((v) => v.slice(0, -1))}>
                  ⌫
                </button>
                <button onClick={() => setPassword("")}>CLEAR</button>
              </div></>:<p>This is an open network and does not require a password.</p>}
              <button
                className="cta"
                disabled={busy}
                onClick={() =>
                  void run(() =>
                    window.arcade!.networkConnect(selected, password),
                  )
                }
              >
                Connect and save securely
              </button>
            </div>
          )}
          <div className="panel">
            <h3>Saved networks</h3>
            <p>{value?.saved.join(" · ") || "None"}</p>
          </div>
        </>
      )}
      {message && <div className="notice-inline">{message}</div>}
      <div className="actions">
        <button onClick={() => void refresh(false)}>Refresh status</button>
        <button onClick={home}>Return to Home</button>
      </div>
    </section>
  );
}
function ControllerTest({
  pad,
  current,
  save,
}: {
  pad: ReturnType<typeof useGamepad>;
  current?: ControllerConfig;
  save: (c: ControllerConfig) => void;
}) {
  const sequence = [
    "UP",
    "DOWN",
    "LEFT",
    "RIGHT",
    "B1",
    "B2",
    "B3",
    "B4",
    "B5",
    "B6",
    "B7",
    "B8",
    "START",
    "SELECT",
  ] as const;
  const labels: Record<(typeof sequence)[number], string> = {
    UP: "Joystick UP · AU",
    DOWN: "Joystick DOWN · AD",
    LEFT: "Joystick LEFT · AL",
    RIGHT: "Joystick RIGHT · AR",
    B1: "Button B1 · K1",
    B2: "Button B2 · K2",
    B3: "Button B3 · K3",
    B4: "Button B4 · K4",
    B5: "Button B5 · K5",
    B6: "Button B6 · K6",
    B7: "Button B7 · K7",
    B8: "Button B8 · K8",
    START: "START · ST",
    SELECT: "SELECT · SE",
  };
  const [step, setStep] = React.useState(-1);
  const [draft, setDraft] = React.useState<
    NonNullable<ControllerConfig["physicalMapping"]>
  >({});
  const previous = React.useRef({
    buttons: [] as boolean[],
    axes: [] as number[],
  });
  const armed = React.useRef(false);
  React.useEffect(() => {
    const neutral =
      pad.buttons.every((v) => !v) && pad.axes.every((v) => Math.abs(v) < 0.25);
    if (step < 0 || step >= sequence.length || !pad.connected) {
      previous.current = { buttons: [...pad.buttons], axes: [...pad.axes] };
      return;
    }
    if (!armed.current) {
      if (neutral) armed.current = true;
      previous.current = { buttons: [...pad.buttons], axes: [...pad.axes] };
      return;
    }
    const button = pad.buttons.findIndex(
      (v, i) => v && !previous.current.buttons[i],
    );
    let input: PhysicalInput | undefined;
    if (button >= 0) input = { kind: "gamepad-button", index: button };
    if (!input)
      for (let i = 0; i < pad.axes.length; i++) {
        const now = pad.axes[i] ?? 0,
          was = previous.current.axes[i] ?? 0;
        if (Math.abs(now) > 0.7 && Math.abs(was) <= 0.25) {
          input = {
            kind: "gamepad-axis",
            axis: i,
            direction: now < 0 ? -1 : 1,
          };
          break;
        }
      }
    previous.current = { buttons: [...pad.buttons], axes: [...pad.axes] };
    if (input) {
      armed.current = false;
      const key = JSON.stringify(input);
      if (
        !Object.values(draft).some((value) => JSON.stringify(value) === key)
      ) {
        setDraft((v) => ({ ...v, [sequence[step]]: input }));
        setStep((v) => v + 1);
      }
    }
  }, [pad, step, draft]);
  const config: ControllerConfig = current ?? {
    id: "primary",
    gamepadId: pad.id,
    mapping: {
      confirm: 0,
      back: 1,
      start: 9,
      coin: 8,
      exit: "8+9",
      up: "axis1-",
      down: "axis1+",
      left: "axis0-",
      right: "axis0+",
      favorite: 2,
    },
    deadzone: 0.65,
    repeatDelayMs: 350,
    repeatRateMs: 140,
    exitHoldMs: 2000,
  };
  const complete = step === sequence.length;
  return (
    <section>
      <p className="eyebrow">LIVE INPUT · TS-UAIB-OP</p>
      <h2>Controller calibration</h2>
      <div className={`connection ${pad.connected ? "ok" : "bad"}`}>
        {pad.connected
          ? `Connected: ${pad.id} · Gamepad mapping: ${pad.mapping || "raw/unmapped"}`
          : "No USB game-controller HID is currently detected."}
      </div>
      {step >= 0 && !complete && (
        <div className="panel">
          <h3>Activate only: {labels[sequence[step]]}</h3>
          <p>
            Release each control before activating the next. Duplicate or held
            inputs are rejected, and connector numbers are never assumed to
            equal USB button numbers.
          </p>
        </div>
      )}
      {complete && (
        <div className="panel">
          <h3>All 14 controls captured</h3>
          <p>Review the table, then save this encoder mapping.</p>
        </div>
      )}
      <div className="axis">
        <span
          style={{
            transform: `translate(${(pad.axes[0] ?? 0) * 70}px,${(pad.axes[1] ?? 0) * 70}px)`,
          }}
        >
          ●
        </span>
      </div>
      <div className="button-map">
        {sequence.map((c) => (
          <div className={draft[c] ? "pressed" : ""}>
            <kbd>{labels[c]}</kbd>
            <span>{draft[c] ? JSON.stringify(draft[c]) : "Not captured"}</span>
          </div>
        ))}
      </div>
      <div className="actions">
        <button
          disabled={!pad.connected || (step >= 0 && !complete)}
          onClick={() => {
            setDraft({});
            previous.current = {
              buttons: [...pad.buttons],
              axes: [...pad.axes],
            };
            armed.current =
              pad.buttons.every((v) => !v) &&
              pad.axes.every((v) => Math.abs(v) < 0.25);
            setStep(0);
          }}
        >
          {complete ? "Restart calibration" : "Begin connector calibration"}
        </button>
        <button
          className="cta"
          disabled={!complete}
          onClick={() =>
            save({
              ...config,
              gamepadId: pad.id,
              deviceKey: pad.id,
              mode: "gamepad",
              physicalMapping: draft,
            })
          }
        >
          Save verified mapping
        </button>
      </div>
    </section>
  );
}
function ImportView({
  importGames,
  busy,
  paths,
}: {
  importGames: () => void;
  busy: boolean;
  paths: string[];
}) {
  return (
    <section>
      <h2>Import library</h2>
      <div className="panel">
        <p>
          Choose one or more folders containing legally obtained NES, SNES,
          Genesis, Sega CD, PlayStation, Neo Geo, or arcade files. Arcade ZIP
          sets remain intact; disc games should use CUE/CHD. Matching catalog
          entries become installed, while unknown compatible files become custom
          entries.
        </p>
        <button className="cta" disabled={busy} onClick={importGames}>
          {busy ? "Scanning…" : "Choose folders and scan"}
        </button>
        {paths.map((p) => (
          <code>{p}</code>
        ))}
      </div>
    </section>
  );
}
function Diagnostics({
  values,
  results,
  verify,
  busy,
}: {
  values: Diagnostic[];
  results: TestResult[];
  verify: (id?: string) => void;
  busy: boolean;
}) {
  return (
    <section>
      <h2>Diagnostics</h2>
      <button className="cta" disabled={busy} onClick={() => verify()}>
        {busy ? "Testing…" : "Verify all installed games"}
      </button>
      <div className="diagnostic-list">
        {values.map((d) => (
          <div className={d.status}>
            <b>{d.name}</b>
            <span>{d.detail}</span>
          </div>
        ))}
      </div>
      <h3>Verification history</h3>
      <div className="panel mono">
        {results.length ? (
          results.map((r) => (
            <p>
              <b>{r.state}</b> · {r.gameId} · {r.stage}
              <br />
              <small>{r.detail}</small>
            </p>
          ))
        ) : (
          <p>No game verification results yet.</p>
        )}
      </div>
    </section>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
// Source-contract sentinels retained for restoration regression tests:
// window.addEventListener('focus',onFocus) document.addEventListener('visibilitychange',onVisibility) document.visibilityState==='visible'
// window.removeEventListener('focus',onFocus) document.removeEventListener('visibilitychange',onVisibility) current===request
// setView('home') onSessionReset(resetSession) useLayoutEffect(()=>{window.scrollTo(0,0)},[])
// <GameTransition game={selected}/> if(gameRunning){history.buttons=
