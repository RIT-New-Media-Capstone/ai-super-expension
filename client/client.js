const gameCode = require('../common/gameCode.js');
const drawingBoard = require('./drawingBoard.js');
const { clientHeaders, serverHeaders } = require('../common/headers.js');
const { drawingBoardWidth, drawingBoardHeight } = require('../common/drawingBoardDimensions.js');

const webSocketURL = `ws://${window.location.hostname}:443`;
let screens = {};
let els = {};
let finalScribbleURL;
let finalExpensionURL;

// Parse header, and relevant data according to header, from buffer from server
const parseServerBuffer = (bufferWithHeader) => {
  const arrayWithHeader = new Uint8Array(bufferWithHeader);
  const header = arrayWithHeader[0];
  const arrayNoHeader = arrayWithHeader.slice(1);
  const returnObject = { header };
  switch (header) {
    // case clientHeaders.newGame:
    case serverHeaders.errorMsg:
    case serverHeaders.newGameCreated:
      returnObject.string = String.fromCharCode(...arrayNoHeader);
      break;
    case serverHeaders.gameStarting:
      [returnObject.round, returnObject.whoScribbles] = arrayNoHeader;
      break;
    case serverHeaders.scribbleDone:
    case serverHeaders.expensionDone:
      returnObject.imageData = new ImageData(
        new Uint8ClampedArray(arrayNoHeader),
        drawingBoardWidth,
        drawingBoardHeight,
      );
      break;
    default:
      break;
  }
  return returnObject;
};

// https://askjavascript.com/how-to-convert-string-to-char-code-in-javascript/
const stringBufferWithHeader = (header, [...string]) => new Uint8Array(
  [header, ...string.map((c) => c.charCodeAt(0))],
).buffer;

// Create an object that whose keys point to corresponding document elements
const elementDictionary = (propNames, propNameToElementID) => {
  // If there is no no provided function translating the dictionary key name
  // to its corresponding element id, just use the key name as is
  const propNameToElementIdFinalized = propNameToElementID || ((e) => e);
  const dict = {};

  for (let i = 0; i < propNames.length; i++) {
    const propName = propNames[i];
    dict[propName] = document.querySelector(`#${propNameToElementIdFinalized(propName)}`);
  }

  return dict;
};

const setScreen = (name) => {
  // Avoid hiding all of the screens when there is no such screen with the given name
  if (!screens[name]) return;

  // Only the screen with the given name should be shown
  // https://stackoverflow.com/questions/33946567/iterate-over-values-of-object
  Object.keys(screens).forEach((key) => {
    screens[key].classList.toggle('activeScreen', key === name);
  });
};

// Have the client download a list of files of given URLs and filenames to download them as
// https://github.com/robertdiers/js-multi-file-download/blob/master/src/main/resources/static/multidownload.js
const downloadFiles = (files) => {
  const downloadNext = (i) => {
    if (i >= files.length) return;
    const file = files[i];
    const a = document.createElement('a');
    a.href = file.url;
    a.target = '_parent';
    if ('download' in a) a.download = file.filename;
    (document.body || document.documentElement).appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => downloadNext(i + 1), 500);
  };
  downloadNext(0);
};

const startRound = (code, webSocket, round, playerWhoScribbles, myPlayerNumber) => {
  const seeResult = () => {
    // Display the round's scribble and exPENsion on the "done" screen,
    // and allow the user to download them both at once
    els.finalScribble.src = finalScribbleURL;
    els.finalExpension.src = finalExpensionURL;
    els.saveDrawingsButton.onclick = () => {
      downloadFiles([
        {
          url: finalScribbleURL,
          filename: `expensiongame_${code}_round${round + 1}_1`,
        },
        {
          url: finalExpensionURL,
          filename: `expensiongame_${code}_round${round + 1}_2`,
        },
      ]);
    };
    setScreen('done');

    // Wait for a message from the server that the next round is starting
    const gotNextRoundStarting = (nextRoundEvent) => {
      const nextRoundMessage = parseServerBuffer(nextRoundEvent.data);
      const nextRoundHeader = nextRoundMessage.header;
      if (nextRoundHeader === serverHeaders.gameStarting) {
        webSocket.removeEventListener('message', gotNextRoundStarting);
        startRound(...[
          code, webSocket, nextRoundMessage.round,
          nextRoundMessage.whoScribbles, myPlayerNumber,
        ]);
      }
    };
    webSocket.addEventListener('message', gotNextRoundStarting);
  };

  // Reset the "done" screen to display the final scribble and not yet be ready for the next round
  els.finalScribble.classList.remove('finalDrawingActive');
  els.finalExpension.classList.add('finalDrawingActive');
  els.finalScribbleOrExpension.checked = true;
  els.playAgainCheckbox.checked = false;

  // Keep a local record of the scribble/exPENsion data URL's
  // (if I'm the scribbler I can simply save finalScribbleURL from the canvas when I submit
  // and then save finalExpensionURL from the server when it's done, and vice-versa if I'm not
  // the scribbler)
  finalScribbleURL = undefined;
  finalExpensionURL = undefined;

  // Regardless of whether I do the scribble or not, the "waiting" and "drawing" screen
  // each have their own message for when the game is in the "waiting for scribble" state
  els.whyAmIWaiting.innerHTML = 'Waiting for the other player to make a scribble...';
  els.whatAmIDrawing.innerHTML = 'Make a scribble!';
  drawingBoard.clear();

  // Update whether or not I am ready to play again when I say so by toggling the checkbox
  els.playAgainCheckbox.onclick = (e) => {
    webSocket.send(new Uint8Array([clientHeaders.updateReady, e.target.checked ? 1 : 0]).buffer);
  };

  // If Player 1 scribbles and I am Player 1, then I scribble.
  // If Player 1 *doesn't* scribble (meaning Player 2 scribbles),
  // and I am *not* Player 1 (meaning I am Player 2), then I scribble.
  // Otherwise I don't scribble.
  // I scribble if and only if the player who I am is the player who scribbles.
  const iScribble = playerWhoScribbles === myPlayerNumber;

  if (iScribble) {
    // Go to drawing screen, and set submit button to submit the drawing as the scribble
    // and start the wait for the exPENsion
    setScreen('drawing');
    els.submitDrawingButton.onclick = () => {
      finalScribbleURL = drawingBoard.toDataURL();
      webSocket.send(new Uint8Array([
        clientHeaders.submitScribble, ...drawingBoard.getImageArray(),
      ]).buffer);
      els.whyAmIWaiting.innerHTML = 'Waiting for the other player to make an exPENsion of your scribble...';
      setScreen('waiting');
      // Wait for exPENsion, and upon reception write it to the canvas and save it back as
      // a data URL
      const gotExpensionDoneResponse = (expensionDoneEvent) => {
        const expensionDoneMessage = parseServerBuffer(expensionDoneEvent.data);
        const expensionDoneHeader = expensionDoneMessage.header;
        if (expensionDoneHeader === serverHeaders.expensionDone) {
          webSocket.removeEventListener('message', gotExpensionDoneResponse);
          drawingBoard.drawImageData(expensionDoneMessage.imageData);
          finalExpensionURL = drawingBoard.toDataURL();
          seeResult();
        }
      };
      webSocket.addEventListener('message', gotExpensionDoneResponse);
    };
  } else {
    // Go to waiting screen until scribble is received, upon which write it to the canvas to
    // be drawn over (not before saving it back as a data URL though)
    setScreen('waiting');
    const gotScribbleDoneResponse = (scribbleDoneEvent) => {
      const scribbleDoneMessage = parseServerBuffer(scribbleDoneEvent.data);
      const scribbleDoneHeader = scribbleDoneMessage.header;
      if (scribbleDoneHeader === serverHeaders.scribbleDone) {
        webSocket.removeEventListener('message', gotScribbleDoneResponse);
        drawingBoard.drawImageData(scribbleDoneMessage.imageData);
        finalScribbleURL = drawingBoard.toDataURL();
        // When submitting final exPENsion, no further server messages are needed before
        // proceeding to the result (until AI is added, that is)
        els.submitDrawingButton.onclick = () => {
          finalExpensionURL = drawingBoard.toDataURL();
          webSocket.send(new Uint8Array([
            clientHeaders.submitExpension, ...drawingBoard.getImageArray(),
          ]).buffer);
          seeResult();
        };
        els.whatAmIDrawing.innerHTML = 'It\'s exPENsion time! Turn this scribble into a coherent drawing!';
        setScreen('drawing');
      }
    };
    webSocket.addEventListener('message', gotScribbleDoneResponse);
  }
};

const init = () => {
  // List of screens that will be seen during gameplay (entering game code, drawing, waiting, etc.)
  screens = elementDictionary([
    'start',
    'displayCode',
    'inputCode',
    'waiting',
    'drawing',
    'done',
    'noCanvas',
  ], (e) => `${e}Screen`);

  // List of elements that will be interfaced with
  els = elementDictionary([
    'newGameButton',
    'newGameError',
    'joinGameButton',
    'codeDisplay',
    'codeInput',
    'submitJoinCodeButton',
    'joinError',
    'whyAmIWaiting',
    'whatAmIDrawing',
    'submitDrawingButton',
    'finalScribble',
    'finalExpension',
    'finalScribbleOrExpension',
    'saveDrawingsButton',
    'playAgainCheckbox',
  ]);

  // setScreen('drawing'); // Uncomment this line to debug a specific screen

  // Don't bother starting the game if canvas is not supported (see module for further explanation)
  if (!drawingBoard.init()) {
    setScreen('noCanvas');
  }

  const setJoinControlsDisabled = (value) => {
    els.newGameButton.disabled = value;
    els.joinGameButton.disabled = value;
    els.submitJoinCodeButton.disabled = value;
    els.codeInput.disabled = value;
  };

  const connectionLost = () => {
    setJoinControlsDisabled(false);
    setScreen('start');
    els.newGameError.innerHTML = 'Connection lost.';
  };

  const requestNewGame = () => {
    // Avoid asking for more than one new game code at once
    els.newGameError.innerHTML = '';
    setJoinControlsDisabled(true);

    const webSocket = new WebSocket(webSocketURL);
    webSocket.binaryType = 'arraybuffer';
    webSocket.addEventListener('open', () => {
      webSocket.send(new Uint8Array([clientHeaders.newGame]).buffer);
    });
    webSocket.addEventListener('close', connectionLost);

    const gotGameCode = (gameCodeEvent) => {
      const gameCodeMessage = parseServerBuffer(gameCodeEvent.data);
      const { header } = gameCodeMessage;
      webSocket.removeEventListener('message', gotGameCode);
      if (header === serverHeaders.errorMsg) {
        setJoinControlsDisabled(false);
        els.newGameError.innerHTML = gameCodeMessage.string;
        webSocket.removeEventListener('close', connectionLost);
        webSocket.close();
      } else if (header === serverHeaders.newGameCreated) {
        const code = gameCodeMessage.string;
        els.codeDisplay.innerHTML = code;
        setScreen('displayCode');

        const otherPlayerJoined = (gameStartEvent) => {
          const gameStartMessage = parseServerBuffer(gameStartEvent.data);
          webSocket.removeEventListener('message', otherPlayerJoined);

          startRound(code, webSocket, gameStartMessage.round, gameStartMessage.whoScribbles, 0);
        };
        webSocket.addEventListener('message', otherPlayerJoined);
      }
    };
    webSocket.addEventListener('message', gotGameCode);
  };
  els.newGameButton.onclick = requestNewGame;

  els.joinGameButton.onclick = () => setScreen('inputCode');

  const submitJoinCode = async () => {
    els.joinError.innerHTML = '';
    // Avoid trying to join more than one game at once (or the same one more than once)
    setJoinControlsDisabled(true);
    // User input is only *displayed* as forced uppercase,
    // so the actual value string needs to be translated a such
    const code = els.codeInput.value.toUpperCase();
    // Validate code client-side before sending, just to ensure the request is "sanitized"
    const codeError = gameCode.validateCode(code);
    if (codeError) {
      setJoinControlsDisabled(false);
      els.joinError.innerHTML = codeError.message;
    } else {
      const webSocket = new WebSocket(webSocketURL);
      webSocket.binaryType = 'arraybuffer';
      webSocket.addEventListener('open', () => {
        webSocket.send(stringBufferWithHeader(clientHeaders.joinGame, code));
      });
      webSocket.addEventListener('close', connectionLost);

      const gotJoinResponse = (joinResponseEvent) => {
        const joinResponseMessage = parseServerBuffer(joinResponseEvent.data);
        const { header } = joinResponseMessage;
        webSocket.removeEventListener('message', gotJoinResponse);
        if (header === serverHeaders.errorMsg) {
          setJoinControlsDisabled(false);
          els.joinError.innerHTML = joinResponseMessage.string;
          console.log(joinResponseMessage);
          webSocket.removeEventListener('close', connectionLost);
          webSocket.close();
        } else if (header === serverHeaders.gameStarting) {
          els.codeInput.value = '';
          startRound(...[
            code, webSocket, joinResponseMessage.round, joinResponseMessage.whoScribbles, 1,
          ]);
        }
      };
      webSocket.addEventListener('message', gotJoinResponse);
    }
  };
  els.submitJoinCodeButton.onclick = submitJoinCode;
  // https://stackoverflow.com/questions/11365632/how-to-detect-when-the-user-presses-enter-in-an-input-field
  els.codeInput.onkeypress = (e) => {
    if ((e.code || e.key) === 'Enter') {
      submitJoinCode();
    }
  };

  els.finalScribbleOrExpension.onclick = (e) => {
    // If the switch is checked, the exPENsion is to be seen and the scribble is not.
    const showExpension = e.target.checked;
    els.finalScribble.classList[showExpension ? 'remove' : 'add']('finalDrawingActive');
    els.finalExpension.classList[showExpension ? 'add' : 'remove']('finalDrawingActive');
  };
};

window.onload = init;
