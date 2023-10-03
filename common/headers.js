const clientHeaders = {
  newGame: 0,
  joinGame: 1,
  submitDrawing: 2,
  // BYTE STRUCTURE FOR PEN ACTIONS:
  // 1x header
  // Serial number not necessary apparently
  // https://stackoverflow.com/questions/11804721/can-websocket-messages-arrive-out-of-order
  // 8x X float (64 bit)
  // 8x Y float " "
  penDown: 3,
  penMove: 4,
  penUp: 5,
  updateReady: 6,
};

const serverHeaders = {
  errorMsg: 0,
  newGameCreated: 1,
  gameStarting: 2,
  drawingDone: 3,
  // PEN ACTIONS FROM SERVER:
  // 1x player number between header and XY floats
  penDown: 4,
  penMove: 5,
  penUp: 6,
};

module.exports = { clientHeaders, serverHeaders };
