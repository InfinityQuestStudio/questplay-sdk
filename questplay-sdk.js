/**
 * Class representing QuestPlaySDK
 * This SDK manages multiple game instances embedded in iframes and provides methods
 * to interact with the games and manage their configurations.
 */
class QuestPlaySDK {
  /**
   * Creates an instance of SDK.
   * @param {boolean} [debug=false] - Whether to enable debug logging.
   */
  constructor(debug = false) {
    this.games = {};
    this.defaultLocale = "en-US";
    this.defaultCurrency = "TZS";
    this.debug = debug;
  }

  /**
   * Adds a new game instance to the SDK.
   * This will embed the game in an iframe and provide communication hooks.
   * 
   * @param {Object} gameConfig - The configuration object for the game.
   * @param {string} gameConfig.gameId - Unique ID for the game.
   * @param {string} gameConfig.containerId - The ID of the container where the game iframe will be embedded.
   * @param {string} gameConfig.iframeUrl - URL of the game iframe.
   * @param {string} gameConfig.userId - User ID associated with the game.
   * @param {number} gameConfig.getUserBalance - Async function that fetches the user's balance.
   * @param {function} [gameConfig.onError] - Callback function to handle errors.
   * @param {function} [gameConfig.onGameResult] - Callback function to handle game result.
   * @param {string} [gameConfig.locale="en-US"] - Locale for the game.
   * @param {string} [gameConfig.currency="USD"] - Currency for the game.
   * @param {function} [gameConfig.onGameLoad] - Callback to be triggered once the game iframe has loaded.
   */
  async addGame({
    gameId,
    containerId,
    iframeUrl,
    userId,
    getUserBalance,
    onError,
    onGameResult,
    locale,
    currency,
    onGameLoad,
  }) {
    // Validate inputs
    if (!gameId || typeof gameId !== "string") {
      console.error("[QuestPlaySDK] Invalid or missing gameId.");
      return;
    }
    if (this.games[gameId]) {
      console.warn(`[QuestPlaySDK] Game with ID "${gameId}" already exists.`);
      return;
    }
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`[QuestPlaySDK] Container with ID "${containerId}" not found.`);
      return;
    }
    if (!iframeUrl || !iframeUrl.startsWith("http")) {
      console.error("[QuestPlaySDK] Invalid iframe URL.");
      return;
    }
    if (typeof getUserBalance !== "function") {
      console.error("[QuestPlaySDK] getUserBalance must be a function.");
      return;
    }

    // Fetch the user's balance asynchronously
    let balance;
    try {
      balance = await getUserBalance(userId);
    } catch (error) {
      console.error("[QuestPlaySDK] Failed to fetch user balance:", error);
      balance = 0;
    }

    // Create the iframe and append it to the container
    const iframe = document.createElement("iframe");
    iframe.src = iframeUrl;
    iframe.width = "100%";
    iframe.height = "600";
    container.appendChild(iframe);

    // Store game-specific details and configuration in the SDK
    this.games[gameId] = {
      iframe,
      iframeUrl,
      userId,
      locale: locale || this.defaultLocale,
      currency: currency || this.defaultCurrency,
      onError: onError || (() => {}),
      onGameResult: onGameResult || (() => {}),
    };

    // Send user details to the game iframe once it has loaded
    iframe.onload = () => {
      this.postMessage(gameId, {
        action: "setParentDomain",
        domain: window.location.origin,
      });
      this.postMessage(gameId, {
        action: "userDetails",
        userId,
        balance,
        locale: this.games[gameId].locale,
        currency: this.games[gameId].currency,
      });
      if (onGameLoad) onGameLoad();
    };

    // Listen for messages from the iframe and handle them
    window.addEventListener("message", this.handleMessage.bind(this, gameId));
  }


  // Removes a game from the SDK, deleting its instance and removing the iframe.
  removeGame(gameId) {
    const game = this.games[gameId];
    if (!game) {
      console.warn(`[QuestPlaySDK] Game with ID "${gameId}" does not exist.`);
      return;
    }
    game.iframe.parentElement.removeChild(game.iframe);
    delete this.games[gameId];
    console.log(`[QuestPlaySDK] Game with ID "${gameId}" removed.`);
    window.removeEventListener("message", this.handleMessage.bind(this, gameId));
  }

  /**
   * Sends a message to a specific game iframe.
   * 
   * @param {string} gameId - The unique ID of the game to send the message to.
   * @param {Object} data - The data to be sent in the message.
   */
  postMessage(gameId, data) {
    const game = this.games[gameId];
    if (game && game.iframe && game.iframe.contentWindow) {
      // Send a message to the game's iframe window
      game.iframe.contentWindow.postMessage(data, game.iframeUrl);
      this.log(`Message sent to Game ID "${gameId}":`, data);
    }
  }

  /**
   * Handles messages received from the game iframe.
   * Processes actions like game results, updates to locale and currency, and error messages.
   * 
   * @param {string} gameId - The unique ID of the game the message is associated with.
   * @param {MessageEvent} event - The message event from the iframe.
   */
  handleMessage(gameId, event) {
    const game = this.games[gameId];
    if (!game) return;

    // Ensure the message comes from the correct origin (security check)
    const allowedOrigin = new URL(game.iframeUrl).origin;
    if (event.origin !== allowedOrigin) {
      console.warn(`[QuestPlaySDK] Ignoring message from unauthorized origin: ${event.origin}`);
      return;
    }

    const {
      action,
      data,
      message,
      locale,
      currency
    } = event.data;

    // Handle the game result action
    if (action === "gameResult") {
      game.onGameResult(data);
    }

    if (action === "updateLocaleAndCurrency") {
      if (locale) game.locale = locale;
      if (currency) game.currency = currency;
      this.log(`[QuestPlaySDK] Locale and currency updated for Game ID "${gameId}":`, {
        locale,
        currency
      });
    }

    if (action === "error") {
      console.error(`[QuestPlaySDK] Error from Game ID "${gameId}":`, message);
      game.onError(message);
    }
  }

  log(message, data) {
    if (this.debug) {
      console.log(`[QuestPlaySDK] ${message}`, data || "");
    }
  }
}

window.QuestPlaySDK = QuestPlaySDK;