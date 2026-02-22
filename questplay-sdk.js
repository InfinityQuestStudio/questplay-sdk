class QuestPlaySDK {
  constructor(options = {}) {
    this.debug = !!options.debug;
    this.inspectorEnabled = !!options.inspector;

    this.games = {};
    this.defaultLocale = "en-US";
    this.defaultCurrency = "TZS";

    this._boundMessageHandler = this._handleMessage.bind(this);
    window.addEventListener("message", this._boundMessageHandler);

    if (this.inspectorEnabled) {
      this._initInspector();
    }
  }

  /* -------------------------------------------------- */
  /*                     ADD GAME                      */
  /* -------------------------------------------------- */

  async addGame(config) {
    const {
      tenantName,
      gameId,
      containerId,
      iframeUrl,
      userId,
      getUserBalance,
      onError,
      onGameResult,
      locale,
      currency,
      callbackUrl,
      onGameLoad,
    } = config || {};

    if (!tenantName || !gameId || !containerId || !iframeUrl || !callbackUrl) {
      return this._fail("Missing required game configuration");
    }

    if (this.games[gameId]) {
      return this._fail(`Game ${gameId} already exists`);
    }

    const container = document.getElementById(containerId);
    if (!container) return this._fail(`Container ${containerId} not found`);

    let balance = 0;
    try {
      balance = await getUserBalance(userId);
    } catch {
      balance = 0;
    }

    const iframe = document.createElement("iframe");
    iframe.src = iframeUrl;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    container.appendChild(iframe);

    this.games[gameId] = {
      iframe,
      iframeUrl,
      tenantName,
      gameId,
      userId,
      callbackUrl,
      locale: locale || this.defaultLocale,
      currency: currency || this.defaultCurrency,
      balance,
      onError: onError || (() => {}),
      onGameResult: onGameResult || (() => {}),
      ready: false,
    };

    this._inspector?.addGame(gameId);

    iframe.onload = () => {
      this._send(gameId, "setParentDomain", window.location.origin);
      this._send(gameId, "userDetails", {
        tenantName,
        gameId,
        userId,
        balance,
        callbackUrl,
        locale: this.games[gameId].locale,
        currency: this.games[gameId].currency,
      });

      onGameLoad?.();
    };
  }

  /* -------------------------------------------------- */
  /*                   POST MESSAGE                    */
  /* -------------------------------------------------- */

  _send(gameId, action, data) {
    const game = this.games[gameId];
    if (!game?.iframe?.contentWindow) return;

    const payload = { action, data };
    game.iframe.contentWindow.postMessage(payload, "*");

    this._log(`→ ${action}`, payload);
    this._inspector?.log(gameId, "SEND", action, data);
  }

  _handleMessage(event) {
    const { action, data, message } = event.data || {};
    if (!action) return;

    const game = Object.values(this.games).find(
      g => g.iframe.contentWindow === event.source
    );
    if (!game) return;

    this._log(`← ${action}`, data);
    this._inspector?.log(game.gameId, "RECV", action, data);

    switch (action) {
      case "gameLoaded":
        game.ready = true;
        break;

      case "gameResult":
        game.onGameResult(data);
        break;

      case "error":
        game.onError(message);
        this._inspector?.error(game.gameId, message);
        break;
    }
  }

  /* -------------------------------------------------- */
  /*                  DEV INSPECTOR                    */
  /* -------------------------------------------------- */

  _initInspector() {
    const panel = document.createElement("div");
    panel.style.cssText = `
      position:fixed;
      bottom:10px;
      right:10px;
      width:340px;
      max-height:70vh;
      background:#0f172a;
      color:#e5e7eb;
      font-family:monospace;
      font-size:12px;
      border-radius:8px;
      box-shadow:0 10px 30px rgba(0,0,0,.4);
      overflow:hidden;
      z-index:999999;
    `;

    panel.innerHTML = `
      <div style="padding:8px;background:#020617;font-weight:bold">
        QuestPlay SDK Inspector
      </div>
      <div id="qp-games" style="padding:8px;overflow:auto"></div>
    `;

    document.body.appendChild(panel);

    this._inspector = {
      games: {},
      addGame: (id) => {
        this._inspector.games[id] = { logs: [] };
        this._renderInspector();
      },
      log: (id, dir, action, data) => {
        this._inspector.games[id]?.logs.unshift({
          time: new Date().toLocaleTimeString(),
          dir,
          action,
          data
        });
        this._renderInspector();
      },
      error: (id, msg) => {
        this._inspector.games[id]?.logs.unshift({
          time: new Date().toLocaleTimeString(),
          dir: "ERR",
          action: msg
        });
        this._renderInspector();
      }
    };
  }

  _renderInspector() {
    const root = document.getElementById("qp-games");
    if (!root) return;

    root.innerHTML = Object.entries(this._inspector.games).map(
      ([id, g]) => `
        <div style="margin-bottom:10px">
          <div style="font-weight:bold">${id}</div>
          ${g.logs.slice(0, 5).map(l => `
            <div>
              ${l.time} ${l.dir} <b>${l.action}</b>
            </div>
          `).join("")}
        </div>
      `
    ).join("");
  }

  /* -------------------------------------------------- */

  _log(msg, data) {
    if (this.debug) {
      console.log(`[QuestPlaySDK] ${msg}`, data || "");
    }
  }

  _fail(msg) {
    console.error(`[QuestPlaySDK] ${msg}`);
  }
}

window.QuestPlaySDK = QuestPlaySDK;