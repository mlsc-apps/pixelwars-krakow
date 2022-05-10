const Ai = require('./ai-robot');

module.exports = {

  wait : 0,
  currentState : null,
  robot : null,

  init : function() {
    this.currentState = this.waitSpawnRobot;
  },

  waitGameStart : function() {
    if (gameStartedAt) this.currentState = this.think;
  },

  think : function(dt){
    this.robot.think(dt);
    if (gameStartedAt === null) {
      this.robot = null;
      this.currentState = this.waitSpawnRobot;
    }
  },

  waitUntilCreated : function(dt) {
    this.wait += dt;
    if (this.wait > 1) {
      this.wait = 0;
      if (Object.values(players).length === 1) {
        this.currentState = this.waitGameStart;
      }
    }
  },

  waitSpawnRobot : function(dt) {
      this.wait += dt;
      if (this.wait > (process.env.WAIT_PLAYER_ONE || 10)) {
        this.wait = 0;
        if (Object.values(players).length === 0) {
          this.robot = new Ai();
          this.robot.init();
          this.currentState = this.waitUntilCreated;
        }
      }
    // }
  },

  update : function(dt) {
    this.currentState(dt);
  }
}
