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
  browserDoesntSupportCanvas,
  initCtxLineProps,
  endLine,
  moveLine,
  startLine,
  getImageDataBuffer,
  drawImageDataBuffer,
  clear,
} = require('../common/boardCommon.js');

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

const getImageDataBufferDB = () => getImageDataBuffer(ctx);

const drawImageDataBufferDB = (imageDataBuffer) => drawImageDataBuffer(ctx, imageDataBuffer);

const submitDrawing = () => {
  socket.send(new Uint8Array([
    clientHeaders.submitDrawing, ...getImageDataBufferDB(),
  ]).buffer);
};

const clearDB = () => clear(ctx);

const setSocket = (newSocket) => {
  socket = newSocket;
};

const init = () => {
  drawingBoard = document.querySelector('#drawingBoard');
  drawingBoardOuter = document.querySelector('#drawingBoardOuter');
  if (browserDoesntSupportCanvas(drawingBoard)) {
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

  initCtxLineProps(ctx);

  return true;
};

module.exports = {
  init,
  toDataURL,
  getImageDataBuffer: getImageDataBufferDB,
  drawImageDataBuffer: drawImageDataBufferDB,
  submitDrawing,
  clear: clearDB,
  setSocket,
};
