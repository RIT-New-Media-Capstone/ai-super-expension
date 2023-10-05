const { WebSocketServer } = require('ws');
const gameCode = require('../common/gameCode.js');
const { clientHeaders, serverHeaders } = require('../common/headers.js');
const { gameStates } = require('../common/gameStates.js');
const { otherOfTwoPlayers } = require('../common/commonMisc.js');
const imageGen = require('./imageGen.js');

const games = {};
const playerInfos = {};

// TODO: Sanitize input (What if a buffer has length <= 1? What if a provided game code is invalid?)
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
    case clientHeaders.penDown:
    case clientHeaders.penMove:
      returnObject.xy = buffer;
      break;
    // case clientHeaders.penUp:
    case clientHeaders.submitDrawing:
      returnObject.buffer = buffer;
      break;
    case clientHeaders.updateReady:
      returnObject.bool = buffer[0] > 0;
      break;
    default:
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
        state: gameStates.waitingForOtherPlayer,
        playerIds: [
          playerId,
        ],
        round: 0,
      };

      socket.send(stringBufferWithHeader(serverHeaders.newGameCreated, newCode));
    }
  }
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

        game.state = gameStates.waitingForScribble;

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

const penXY = (playerId, header, xy) => {
  const playerInfo = playerInfos[playerId];
  if (playerInfo !== undefined) {
    const { playerIds } = games[playerInfo.gameCode];
    const playerNumber = playerIds.indexOf(playerId);
    playerInfos[playerIds[otherOfTwoPlayers(playerIds.indexOf(playerId))]].socket.send(
      Buffer.from([header, playerNumber, ...xy]),
    );
  }
};

const submitDrawing = async (playerId, buffer) => {
  const playerInfo = playerInfos[playerId];
  if (playerInfo !== undefined) {
    const game = games[playerInfo.gameCode];
    // Verify that the game is in the appropriate state for the drawing,
    // and that the appropriate player is submitting the drawing
    const { playerWhoScribbles } = game;
    const playerWhoMakesExpension = otherOfTwoPlayers(playerWhoScribbles);
    const shouldBeScribble = game.playerWhoScribbles === game.playerIds.indexOf(playerId);
    if (game.state === (shouldBeScribble ? gameStates.waitingForScribble : gameStates.waitingForExpension)) {
      // Resend the drawing to the other player and update the game state
      if (shouldBeScribble) {
        playerInfos[game.playerIds[playerWhoMakesExpension]].socket.send(
          Buffer.from([serverHeaders.drawingDone, playerWhoScribbles, ...buffer]),
        );
        game.state = gameStates.waitingForExpension;
      } else {
        playerInfos[game.playerIds[playerWhoScribbles]].socket.send(
          Buffer.from([serverHeaders.drawingDone, playerWhoMakesExpension, ...buffer]),
        );
        game.state = gameStates.waitingForNextRound;

        // game.state = gameStates.waitingForAiImageVariation;

        // turn this from raw rgba data into a png
        // buffer

        // send png to ai for variation
        // const newImage = await imageGen.getImageVariation();

        // send back to both players in the form of raw rgba data buffer

        // set game state to 4
        // game.state = gameStates.waitingForNextRound;
      }
    }
  }
};

const updateReady = (playerId, value) => {
  const playerInfo = playerInfos[playerId];
  if (playerInfo !== undefined) {
    const game = games[playerInfo.gameCode];
    // Only accept "ready for next round" when appropriate
    if (game.state === gameStates.waitingForNextRound) {
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
        game.state = gameStates.waitingForScribble;
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
        case clientHeaders.penDown:
          penXY(playerId, serverHeaders.penDown, message.xy);
          break;
        case clientHeaders.penMove:
          penXY(playerId, serverHeaders.penMove, message.xy);
          break;
        case clientHeaders.penUp:
          penXY(playerId, serverHeaders.penUp, []);
          break;
        case clientHeaders.submitDrawing:
          submitDrawing(playerId, message.buffer);
          break;
        case clientHeaders.updateReady:
          updateReady(playerId, message.bool);
          break;
        default:
      }
    });
  });
};

module.exports = { startGameWebSockets };
