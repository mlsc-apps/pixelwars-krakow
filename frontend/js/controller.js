let loopRunning = true;
let nonregi = null;

let controller = {

  wait : 0,
  currentState : null,
  winner : null,

  waitForPlayers : function() {
    if (Object.values(players).length === 2) {
      this.currentState = this.waitForServerStart;
    }
  },

  waitForServerStart : function() {
    if (toGo !== null) this.currentState = this.waitForEnd;
  },

  stopLoop : function() {
    loopRunning = false;
  },

  waitForEnd : function(dt){
    Object.values(players).forEach( p => {

      if (p.population === 0) {
        let winner = Object.values(players).filter( e => { return e !== p; })[0];
        if (me) {
          if (p.id === me) {
            showInfo(`Sorry.. You lost!`);
          } else {
            showInfo(`Congratulations! You Win!`);
          }
        } else {
            showInfo(winner.nick + ' wins!');
        }
        this.winner = winner;
      }

    });

    if (this.winner) {
      this.currentState = this.stopLoop;
      return;
    }

    if (toGo !== null && toGo <= 0) {
      if (me) {
        showInfo(`Sorry.. Time is Up!`);
      } else {
        showInfo(`Sorry.. Time is Up!`);
      }
      this.currentState = this.stopLoop;
      return;
    }

    globalTime += dt;
    if (!(sUpdateFromServer[clientTick + 1])) {
      this.lastWorldTick = worldTick;
      show_loading(true);
      this.currentState = this.waitForWorldTicks;
      return;
    }
    if (globalTime > sUpdateFromServer[clientTick + 1].timestamp) {
      sUpdateFromServer[clientTick] = null;
      clientTick++;
    }
  },

  waitForWorldTicks : function() {
    if (worldTick - this.lastWorldTick > 1 ||
        toGo !== null && toGo <= 0) {
      show_loading(false);
      this.currentState = this.waitForEnd;
    }
  },

  init : function() {
    this.currentState = this.waitForPlayers;
  },

  update : function(dt) {
    this.currentState(dt);
  }

}
