// GAME STATES
// 0: Waiting for other player to join
// 1: Waiting for scribble
// 2: Waiting for exPENsion
// 3: Waiting for AI image variation
// 4: Waiting for both players' approval to start next round

const gameStates = {
    waitingForOtherPlayer: 0,
    waitingForScribble: 1,
    waitingForExpension: 2,
    waitingForAiImageVariation: 3,
    waitingForNextRound: 4,
}

module.exports = { gameStates };