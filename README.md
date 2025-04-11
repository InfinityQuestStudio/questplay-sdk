# QuestPlay SDK

## Description
QuestPlay SDK is a lightweight JavaScript SDK designed to seamlessly embed and manage our games in your web application. It handles game initialization, iframe embedding, and event handling, making it easier to integrate our games into any website or platform.


## Features
- **Easy Initialization:** Quickly set up with a few configuration options.
- **Game Embedding:** Embeds games using an iframe within a specified container.
- **Event Handling:** Supports event-driven interactions with custom callbacks.


## Installation
### Using a Script Tag
Include the SDK in your project by adding the following script tag:

```javascript
<script src="https://cdn.jsdelivr.net/gh/InfinityQuestStudio/questplay-sdk@latest/questplay-sdk.js"></script>
```
The SDK will be available globally.


## Usage
### Initialization
To initialize the SDK on your website, use the init method with the required configuration options:

```javascript
  const sdk = new QuestPlaySDK(true);

  const gameConfig = {
      tenantName: "tenant123",
      gameId: "game123",
      containerId: "gameContainer",
      iframeUrl: "http://example.com/game",
      userId: "user789",
      getUserBalance: async (userId) => {
        try {
          const response = await $apis.users.getPlayer({ userId });
          return response.balance;
        } catch (error) {
          console.error("Error fetching balance:", error);
          return 0;
        }
      },
      onGameResult: (result) => console.log("Game result:", result),
      onError: (error) => console.error("Game error:", error),
      onGameLoad: () => console.log("Game loaded!"),
  };

  sdk.addGame(gameConfig);
```


## Embedding a Game
The SDK automatically embeds the game into the specified container using the provided configurations.


## Event Handling
You can listen to SDK events using the on method:

```javascript
    onError: (errorMessage) => {
      console.error('[QuestPlaySDK] Game error:', errorMessage);
    },
    onGameResult: (result) => {
      console.log('[QuestPlaySDK] Game result:', result);
    },
    onGameLoad: () => {
      console.log('[QuestPlaySDK] Game loaded successfully');
    }
```