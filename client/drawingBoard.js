// Much of the code here is from IGME 330's canvas exercieses

const { drawingBoardWidth, drawingBoardHeight } = require('../common/drawingBoardDimensions.js');

const lineWidth = 3;
const lineColor = 'black';

let drawingBoard;
let drawingBoardOuter;
let ctx;
let dragging = false;

const getMouse = (e) => {
  const mouse = {};
  let rawX;
  let rawY;

  // https://stackoverflow.com/questions/60688935/my-canvas-drawing-app-wont-work-on-mobile/60689429#60689429
  if (e.type === 'touchmove') {
    rawX = e.touches[0].pageX;
    rawY = e.touches[0].pageY;
  } else if (e.type === 'mousemove') {
    rawX = e.pageX;
    rawY = e.pageY;
  }

  mouse.x = (rawX - drawingBoardOuter.offsetLeft)
    * (drawingBoardWidth / drawingBoardOuter.offsetWidth);
  mouse.y = (rawY - drawingBoardOuter.offsetTop)
    * (drawingBoardHeight / drawingBoardOuter.offsetHeight);

  return mouse;
};

const startLine = (e) => {
  dragging = true;
  const { x, y } = getMouse(e);
  ctx.beginPath();
  ctx.moveTo(x, y);
  // Create a point as soon as the PEN is down
  ctx.lineTo(x, y);
  ctx.stroke();
};

const moveLine = (e) => {
  // Only draw a line if the PEN is down
  if (!dragging) return;
  const { x, y } = getMouse(e);
  ctx.lineTo(x, y);
  ctx.stroke();
};

const endLine = () => {
  dragging = false;
  ctx.closePath();
};

const toDataURL = () => drawingBoard.toDataURL();

const getImageArray = () => ctx.getImageData(0, 0, drawingBoardWidth, drawingBoardHeight).data;

const drawImageData = (imageData) => ctx.putImageData(imageData, 0, 0);

// https://www.fabiofranchino.com/log/load-an-image-with-javascript-using-await/
const loadImage = (url) => new Promise((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = url;
  img.onload = () => {
    resolve(img);
  };
  img.onerror = (e) => {
    reject(e);
  };
});

const drawImage = async (url) => {
  const img = await loadImage(url);
  ctx.drawImage(img, 0, 0);
};

const clear = () => {
  const prevFillStyle = ctx.fillStyle;
  // The board should be cleared with the color white instead of transparency,
  // as the images shouldn't be downloaded as black lines on a transparent background
  ctx.fillStyle = 'white';
  // https://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
  ctx.fillRect(0, 0, drawingBoardWidth, drawingBoardHeight);
  ctx.fillStyle = prevFillStyle;
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

  drawingBoardOuter.onmousedown = startLine;
  drawingBoardOuter.onmousemove = moveLine;
  drawingBoardOuter.onmouseup = endLine;
  drawingBoardOuter.onmouseout = endLine;

  drawingBoardOuter.ontouchstart = startLine;
  drawingBoardOuter.ontouchend = endLine;
  drawingBoardOuter.ontouchmove = moveLine;
  drawingBoardOuter.ontouchcancel = endLine;

  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = lineColor;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  return true;
};

module.exports = {
  init,
  toDataURL,
  getImageArray,
  drawImageData,
  drawImage,
  clear,
};
