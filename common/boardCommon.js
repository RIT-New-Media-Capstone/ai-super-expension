const boardWidth = 640;
const boardHeight = 480;

const moveLine = (ctx, { x, y }) => {
  ctx.lineTo(x, y);
  ctx.stroke();
};

const startLine = (ctx, { x, y }) => {
  ctx.beginPath();
  ctx.moveTo(x, y);
  moveLine(ctx, { x, y });
};

const endLine = (ctx) => {
  ctx.closePath();
};

const getImageDataBuffer = (ctx) => ctx.getImageData(0, 0, boardWidth, boardHeight).data;

const drawImageDataBuffer = (ctx, imageDataBuffer) => {
  ctx.putImageData(new ImageData(
    new Uint8ClampedArray(imageDataBuffer),
    boardWidth,
    boardHeight,
  ), 0, 0);
};

const clear = (ctx) => {
  const prevFillStyle = ctx.fillStyle;
  // The board should be cleared with the color white instead of transparency,
  // as the images shouldn't be downloaded as black lines on a transparent background
  ctx.fillStyle = 'white';
  // https://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
  ctx.fillRect(0, 0, boardWidth, boardHeight);
  ctx.fillStyle = prevFillStyle;
};

// Some (really old) browsers don't support Canvas's toDataUrl behavior or even
// Canvas itself for that matter, and both are vital to the game, so the game
// shouldn't even bother starting on the off chance that the user has an unsupportive browser
// https://caniuse.com/?search=canvas
// https://stackoverflow.com/questions/2745432/best-way-to-detect-that-html5-canvas-is-not-supported
const browserDoesntSupportCanvas = (boardElement) => !(boardElement.getContext && boardElement.getContext('2d') && boardElement.toDataURL && boardElement.toDataURL());

const initCtxLineProps = (ctx) => {
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
};

module.exports = {
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
};
