const { WebSocketServer } = require('ws');
const gameCode = require('../common/gameCode.js');
const { clientHeaders, serverHeaders } = require('../common/headers.js');

const games = {};
const playerInfos = {};

// Parse header, and relevant data according to header, from buffer from client
const parseClientBuffer = (bufferWithHeader) => {
  const header = bufferWithHeader[0];
  const buffer = bufferWithHeader.slice(1);
  const returnObject = { header };
  switch (header) {
    // case clientHeaders.newGame:
    case clientHeaders.joinGame:
      returnObject.string = buffer.toString();
      break;
    case clientHeaders.submitScribble:
    case clientHeaders.submitExpension:
      returnObject.buffer = buffer;
      break;
    case clientHeaders.updateReady:
      returnObject.bool = buffer[0] > 0;
      break;
    default:
      break;
  }
  return returnObject;
};

// https://stackoverflow.com/questions/37436824/convert-string-to-buffer-node
const stringBufferWithHeader = (header, string) => Buffer.from([header, ...Buffer.from(string)]);

const newGame = (playerId) => {
  const playerInfo = playerInfos[playerId];
  if (playerInfo !== undefined) {
    const { socket, gameCode: existingGameCode } = playerInfo;
    if (existingGameCode !== undefined && games[existingGameCode] !== undefined) {
      socket.send(stringBufferWithHeader(serverHeaders.errorMsg, `You are already in game ${existingGameCode}.`));
    } else {
      const newCode = gameCode.makeNewCode(games);

      playerInfo.gameCode = newCode;
      playerInfo.readyForNextRound = false;

      games[newCode] = {
        state: 0,
        playerIds: [
          playerId,
        ],
        round: 0,
      };

      socket.send(stringBufferWithHeader(serverHeaders.newGameCreated, newCode));
    }
  }
  // GAME STATES
  // 0: Waiting for other player to join
  // 1: Waiting for scribble
  // 2: Waiting for exPENsion
  // 3: Waiting for both players' approval to start next round
  // THIS WILL BE DIFFERENT IN THE AI GAMEMODE
};

const joinGame = (playerId, code) => {
  const playerInfo = playerInfos[playerId];
  if (playerInfo !== undefined) {
    const { socket, gameCode: existingGameCode } = playerInfo;
    if (existingGameCode !== undefined && games[existingGameCode] !== undefined) {
      socket.send(stringBufferWithHeader(serverHeaders.errorMsg, `You are already in game ${existingGameCode}.`));
    } else {
      const codeError = gameCode.validateCode(code, games, true);
      if (codeError) {
        socket.send(stringBufferWithHeader(serverHeaders.errorMsg, codeError));
      } else {
        playerInfo.gameCode = code;
        playerInfo.readyForNextRound = false;

        const game = games[code];
        const gamePlayerIds = game.playerIds;
        gamePlayerIds.push(playerId);
        const playerWhoScribbles = Math.floor(Math.random() * 2);
        game.playerWhoScribbles = playerWhoScribbles;
        game.state = 1;

        // Send both players the "game is starting" message
        for (let i = 0; i < gamePlayerIds.length; i++) {
          playerInfos[gamePlayerIds[i]].socket.send(
            Buffer.from([serverHeaders.gameStarting, game.round, playerWhoScribbles]),
          );
        }
      }
    }
  }
};

const submitDrawing = (playerId, buffer, isScribble) => {
  const playerInfo = playerInfos[playerId];
  if (playerInfo !== undefined) {
    const game = games[playerInfo.gameCode];
    // Verify that the game is in the appropriate state for the drawing,
    // and that the appropriate player is submitting the drawing
    if (game.state === isScribble ? 1 : 2
      && (game.playerWhoScribbles === game.playerIds.indexOf(playerId)) === isScribble) {
      // Resend the drawing to the other player and update the game state
      if (isScribble) {
        playerInfos[game.playerIds[game.playerWhoScribbles === 1 ? 0 : 1]].socket.send(
          Buffer.from([serverHeaders.scribbleDone, ...buffer]),
        );
        game.state = 2;
      } else {
        playerInfos[game.playerIds[game.playerWhoScribbles]].socket.send(
          Buffer.from([serverHeaders.expensionDone, ...buffer]),
        );
        game.state = 3;
      }
    }
  }
};

const updateReady = (playerId, value) => {
  const playerInfo = playerInfos[playerId];
  if (playerInfo !== undefined) {
    const game = games[playerInfo.gameCode];
    // Only accept "ready for next round" when appropriate
    if (game.state === 3) {
      playerInfo.readyForNextRound = value;
      const gamePlayerIds = game.playerIds;

      // See if all players in the game are ready for the next round...
      let allPlayersReady = true;
      for (let i = 0; i < gamePlayerIds.length; i++) {
        if (playerInfos[gamePlayerIds[i]].readyForNextRound === false) {
          allPlayersReady = false;
        }
      }

      // ...and if so, move to the next round and let them know of it.
      if (allPlayersReady) {
        const playerWhoScribbles = Math.floor(Math.random() * 2);
        game.playerWhoScribbles = playerWhoScribbles;
        game.round++;
        game.state = 1;
        for (let i = 0; i < gamePlayerIds.length; i++) {
          const currentPlayerInfo = playerInfos[gamePlayerIds[i]];
          currentPlayerInfo.readyForNextRound = false;
          currentPlayerInfo.socket.send(
            Buffer.from([serverHeaders.gameStarting, game.round, playerWhoScribbles]),
          );
        }
      }
    }
  }
};

const playerDropped = (playerId) => {
  console.log(`Player ${playerId} dropped`);
  const code = playerInfos[playerId].gameCode;
  if (code !== undefined) {
    const game = games[code];
    if (game !== undefined) {
      const gamePlayerIds = game.playerIds;
      for (let i = 0; i < gamePlayerIds.length; i++) {
        playerInfos[gamePlayerIds[i]].socket.close();
      }
      games[code] = undefined;
    }
  }
};

const startGameWebSockets = () => {
  const socketServer = new WebSocketServer({ port: 443 });
  socketServer.on('connection', (socket) => {
    const playerId = Date.now();
    playerInfos[playerId] = { socket };
    console.log(`Player ${playerId} joined`);
    socket.on('close', () => playerDropped(playerId));
    socket.on('message', (data) => {
      const message = parseClientBuffer(data);
      switch (message.header) {
        case clientHeaders.newGame:
          newGame(playerId);
          break;
        case clientHeaders.joinGame:
          joinGame(playerId, message.string);
          break;
        case clientHeaders.submitScribble:
          submitDrawing(playerId, message.buffer, true);
          break;
        case clientHeaders.submitExpension:
          submitDrawing(playerId, message.buffer, false);
          break;
        case clientHeaders.updateReady:
          updateReady(playerId, message.bool);
          break;
        default:
          break;
      }
    });
  });
};

module.exports = { startGameWebSockets };
