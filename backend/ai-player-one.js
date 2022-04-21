const Ai = require('./ai-robot');

module.exports = {

  wait : 0,
  current_state : null,
  robot : null,

  init : function() {
    this.current_state = this.wait_spawn_robot;
  },

  wait_game_start : function() {
    if (game_started_at) this.current_state = this.think;
  },

  think : function(dt){
    this.robot.think(dt);
    if (game_started_at===null) {
      this.robot = null;
      this.current_state = this.wait_spawn_robot;
    }
  },

  wait_until_created : function(dt) {
    this.wait += dt;
    if (this.wait > 1) {
      this.wait = 0;
      if (Object.values(players).length === 1) {
        this.current_state = this.wait_game_start;
      }
    }
  },

  wait_spawn_robot : function(dt) {
      this.wait += dt;
      if (this.wait > (process.env.WAIT_PLAYER_ONE || 10)) {
        this.wait = 0;
        if (Object.values(players).length === 0) {
          this.robot = new Ai();
          this.robot.init();
          this.current_state = this.wait_until_created;
        }
      }
    // }
  },

  update : function(dt) {
    this.current_state(dt);
  }
}
