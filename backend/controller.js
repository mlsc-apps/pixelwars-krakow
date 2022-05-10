const wpsApi = require('./wps-api');
const timeout_1 = 30; //120;
const timeout_2 = 30; //60;

module.exports = {

  wait : 0,
  currentState : null,
  counttable : ['3..', '2..', '1..', 'GO!'],
  count : 0,

  waitForPlayerOne : function() {
    let pp = Object.values(players);
    if (pp.length === 1) {
      console.debug(new Date() + `: Player ${pp[0].nick} waiting for ack`);
      this.currentState = this.ackPlayerOne;
    }
  },

  ackPlayerOne : function(dt) {
    let pp = Object.values(players);
    if (pp[0].robot || (ackReceived === pp[0].id)) {
      pp[0].send("memo", { msg  : 'Waiting for opponent...' });
      ackReceived = null;
      this.wait = 0;
      this.currentState = this.waitForPlayerTwo;
    } else {
      if ((this.wait += dt) > timeout_1) {
        pp[0].send("memo", { msg  : 'Waiting for opponent...' });
        ackReceived = null;
        this.wait = 0;
        console.log(new Date() + ': Timeout waiting for ack');
        this.currentState = this.waitForPlayerTwo;
      }
    }
  },

  waitForPlayerTwo : function() {
    let pp = Object.values(players);
    if (pp.length === 2) {
      pp[0].opponent = pp[1];
      pp[1].opponent = pp[0];
      console.log(new Date() + ': Waiting for ack players ready');
      this.currentState = this.ackPlayersReady;
    }
  },

  ackPlayersReady : function(dt) {
    let pp = Object.values(players);
    if (pp[0].robot || (ackReceived === pp[0].id)) pp[0].ready = true;
    if (pp[1].robot || (ackReceived === pp[1].id)) pp[1].ready = true;
    if (pp[0].ready && pp[1].ready) {
      ackReceived = null;
      this.wait = 0;
      console.log(new Date() + ': Acks received. Starting game...');
      this.currentState = this.countdown;
    } else {
      if ((this.wait += dt) > timeout_2) {
        ackReceived = null;
        this.wait = 0;
        console.log(new Date() + ': Timeout waiting for ack. Starting game...');
        this.currentState = this.countdown;
      }
    }
  },

  countdown : function(dt) {
    this.wait += dt;
    if (this.wait > 1.5) {
          this.wait = 0;
          let pp = Object.values(players);
          pp[0].send("memo", { msg  : this.counttable[this.count] });
          pp[1].send("memo", { msg  : this.counttable[this.count] });
          console.log(this.counttable[this.count]);
          this.count++;
          if (this.count === 4) {
            this.currentState = this.startGame;
          }
    }
  },

  startGame : function(){
    gameStartedAt = Date.now();
    console.log(new Date() + ": Game started");
    this.currentState = this.waitForEnd;
  },

  waitForRestart : function(dt) {
    sWorldTick = false;
    this.currentState = this.restart;
  },

  sendLastTick : function() {
      sWorldTick = true;
      this.currentState = this.waitForRestart;
  },

  restart : function() {
    resetLoop = true;
    gameStartedAt = null;
    this.count = 0;
    this.wait = 0;
    toGo = game_max_time;
    updateBufferIndex = additionalBytes;
    this.currentState = this.waitForPlayerOne;
  },

  waitForEnd : function(dt) {
    let pp = Object.values(players);
    for (var i = 0; i < pp.length; i++) {
      let loser = pp[i];
      if (loser.population === 0) {

        let winner = Object.values(players).filter( e => { return e.id !== loser.id; })[0];
        let winnerGames  = winner.games + 1;
        let winnerWins   = winner.wins + 1;
        let winnerRecord = winnerWins / winnerGames;

        let loserGames  = loser.games + 1;
        let loserWins   = loser.wins;
        let loserRecord = loserWins / loserGames;

        if (!winner.nonreg) wpsApi.updateRecord(winnerGames, winnerWins, winnerRecord, winner);
        if (!loser.nonreg)  wpsApi.updateRecord(loserGames, loserWins, loserRecord, loser);

        console.log(new Date() + ": Game ended");
        console.log(new Date() + `: ${winner.nick} wins by ${winner.population}`);
        this.currentState = this.sendLastTick;
        return;
      }
    }

    if (toGo !== null && toGo <= 0) {
      console.log(new Date() + ": Game ended with timeout");
      this.currentState = this.sendLastTick;
      return;
    }

    globalTime += dt;
    sWorldTick = ((this.wait += dt) > 0.350);
    if (sWorldTick) this.wait = 0;
  },

  init : function() {
    this.currentState = this.waitForPlayerOne;
  },

  update : function(dt) {
    this.currentState(dt);
  }

}
