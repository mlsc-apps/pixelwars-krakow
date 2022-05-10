const Ai = require('./ai-robot');
const controller = require('./controller');

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
      if (Object.values(players).length === 2) {
        this.currentState = this.waitGameStart;
      }
    }
  },

  waitSpawnRobot : function(dt) {
      if (controller.currentState === controller.waitForPlayer2) {
        this.wait += dt;
        if (this.wait > (process.env.WAIT_PLAYER_TWO || 10) && !playersDictLocked) {
          playersDictLocked = true;
          console.log(new Date() + `: Game locked`)
          let pp = Object.values(players);
          this.wait = 0;
          this.robot = new Ai();
          this.robot.init(pp[0].id);
          this.currentState = this.waitUntilCreated;
      }
    }
  },

  update : function(dt) {
    this.currentState(dt);
  }
}
