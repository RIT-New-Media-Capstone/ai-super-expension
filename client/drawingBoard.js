// Much of the code here is from IGME 330's canvas exercieses
// There should be another screen with a "streaming board",
// code will probably be in a different file
// And the socket will interface with it within its listeners
// On the other hand, drawing board will have drawing mode and socket
// as stateful variables to determine what happens when an action is performed

const { clientHeaders } = require('../common/headers.js');
const {
  boardHeight,
  boardWidth,
  endLine,
  moveLine,
  startLine,
} = require('../common/boardCommon.js');

const lineWidth = 3;
const lineColor = 'black';

let drawingBoard;
let drawingBoardOuter;
let ctx;
let dragging = false;
let socket;

const sendXYBuffer = (header, { x, y }) => {
  const xyBuffer = new ArrayBuffer(17);
  const xyView = new DataView(xyBuffer);
  xyView.setUint8(0, header);
  xyView.setFloat64(1, x);
  xyView.setFloat64(9, y);
  socket.send(xyBuffer);
};

const getMouse = (e) => {
  const mouse = {};
  let rawX;
  let rawY;

  // https://stackoverflow.com/questions/60688935/my-canvas-drawing-app-wont-work-on-mobile/60689429#60689429
  switch (e.type) {
    case 'touchdown':
    case 'touchmove':
      rawX = e.touches[0].pageX;
      rawY = e.touches[0].pageY;
      break;
    case 'mousedown':
    case 'mousemove':
    default:
      rawX = e.pageX;
      rawY = e.pageY;
      break;
  }

  mouse.x = (rawX - drawingBoardOuter.offsetLeft)
    * (boardWidth / drawingBoardOuter.offsetWidth);
  mouse.y = (rawY - drawingBoardOuter.offsetTop)
    * (boardHeight / drawingBoardOuter.offsetHeight);

  return mouse;
};

const startLineDB = (e) => {
  if (dragging) return;
  dragging = true;
  const mouse = getMouse(e);
  startLine(ctx, mouse);
  sendXYBuffer(clientHeaders.penDown, mouse);
};

const moveLineDB = (e) => {
  if (!dragging) return;
  const mouse = getMouse(e);
  moveLine(ctx, mouse);
  sendXYBuffer(clientHeaders.penMove, mouse);
};

const endLineDB = () => {
  if (!dragging) return;
  dragging = false;
  endLine(ctx);
  socket.send(new Uint8Array([clientHeaders.penUp]).buffer);
};

const toDataURL = () => drawingBoard.toDataURL();

const drawImageDataBuffer = (imageDataBuffer) => {
  ctx.putImageData(new ImageData(
    new Uint8ClampedArray(imageDataBuffer),
    boardWidth,
    boardHeight,
  ), 0, 0);
};

const submitDrawing = () => {
  socket.send(new Uint8Array([
    clientHeaders.submitDrawing, ...ctx.getImageData(0, 0, boardWidth, boardHeight).data,
  ]).buffer);
};

const clear = () => {
  const prevFillStyle = ctx.fillStyle;
  // The board should be cleared with the color white instead of transparency,
  // as the images shouldn't be downloaded as black lines on a transparent background
  ctx.fillStyle = 'white';
  // https://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
  ctx.fillRect(0, 0, boardWidth, boardHeight);
  ctx.fillStyle = prevFillStyle;
};

const setSocket = (newSocket) => {
  socket = newSocket;
};

const init = () => {
  drawingBoard = document.querySelector('#drawingBoard');
  drawingBoardOuter = document.querySelector('#drawingBoardOuter');
  // Some (really old) browsers don't support Canvas's toDataUrl behavior or even
  // Canvas itself for that matter, and both are vital to the game, so the game
  // shouldn't even bother starting on the off chance that the user has an unsupportive browser
  // https://caniuse.com/?search=canvas
  // https://stackoverflow.com/questions/2745432/best-way-to-detect-that-html5-canvas-is-not-supported
  if (!(drawingBoard.getContext && drawingBoard.getContext('2d') && drawingBoard.toDataURL && drawingBoard.toDataURL())) {
    return false;
  }
  ctx = drawingBoard.getContext('2d');

  drawingBoardOuter.onmousedown = startLineDB;
  drawingBoardOuter.onmousemove = moveLineDB;
  drawingBoardOuter.onmouseup = endLineDB;
  drawingBoardOuter.onmouseout = endLineDB;

  drawingBoardOuter.ontouchstart = startLineDB;
  drawingBoardOuter.ontouchend = endLineDB;
  drawingBoardOuter.ontouchmove = moveLineDB;
  drawingBoardOuter.ontouchcancel = endLineDB;

  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = lineColor;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  return true;
};

module.exports = {
  init,
  toDataURL,
  drawImageData: drawImageDataBuffer,
  submitDrawing,
  clear,
  setSocket,
};
