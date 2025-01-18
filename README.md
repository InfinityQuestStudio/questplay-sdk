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
<script src="https://cdn.jsdelivr.net/gh/InfinityQuestStudio/questplay-sdk@[version]/questplay-sdk.js"></script>
```
The SDK will be available globally.


## Usage
### Initialization
To initialize the SDK on your website, use the init method with the required configuration options:

```javascript
  const sdk = new QuestPlaySDK(true);

  const gameConfig = {
      gameId: 'game_id', (string, required)
      iframeUrl: 'game_url', (string, required)
      userId: 'user_id', (string, required)
      balance: balance, (number, required)
      locale: 'en-US', (string, optional - default en-US)
      currency: 'TZS', (string, optional - default TZS)
      containerId: 'game_container_id', (string, required)
      onError: (errorMessage) => {
        console.error('[QuestPlaySDK] Game error:', errorMessage);
      },
      onGameResult: (result) => {
        console.log('[QuestPlaySDK] Game result:', result);
      },
      onGameLoad: () => {
        console.log('[QuestPlaySDK] Game loaded successfully');
      }
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