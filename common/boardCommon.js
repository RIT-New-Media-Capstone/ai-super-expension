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

module.exports = {
  boardHeight,
  boardWidth,
  endLine,
  moveLine,
  startLine,
};
