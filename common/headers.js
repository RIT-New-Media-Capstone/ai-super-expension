const clientHeaders = {
  newGame: 0,
  joinGame: 1,
  submitScribble: 4,
  submitExpension: 5,
  updateReady: 6,
};

const serverHeaders = {
  errorMsg: 0,
  newGameCreated: 1,
  gameStarting: 2,
  scribbleDone: 3,
  expensionDone: 4,
};

module.exports = { clientHeaders, serverHeaders };
