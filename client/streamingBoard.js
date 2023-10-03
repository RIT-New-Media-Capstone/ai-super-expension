const {
  // boardHeight,
  // boardWidth,
  browserDoesntSupportCanvas,
  initCtxLineProps,
  endLine,
  moveLine,
  startLine,
  drawImageDataBuffer,
  clear,
} = require('../common/boardCommon.js');

let streamingBoard;
let ctx;

const startLineSB = (mouse) => {
  startLine(ctx, mouse);
};

const moveLineSB = (mouse) => {
  moveLine(ctx, mouse);
};

const endLineSB = () => {
  endLine(ctx);
};

const toDataURL = () => streamingBoard.toDataURL();

const drawImageDataBufferSB = (imageDataBuffer) => drawImageDataBuffer(ctx, imageDataBuffer);

const clearSB = () => clear(ctx);

const init = () => {
  streamingBoard = document.querySelector('#streamingBoard');
  if (browserDoesntSupportCanvas(streamingBoard)) {
    return false;
  }
  ctx = streamingBoard.getContext('2d');

  initCtxLineProps(ctx);

  return true;
};

module.exports = {
  init,
  startLine: startLineSB,
  moveLine: moveLineSB,
  endLine: endLineSB,
  toDataURL,
  drawImageDataBuffer: drawImageDataBufferSB,
  clear: clearSB,
};
