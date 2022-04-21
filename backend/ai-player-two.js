const Ai = require('./ai-robot');
const controller = require('./controller');

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
    if (game_started_at === null) {
      this.robot = null;
      this.current_state = this.wait_spawn_robot;
    }
  },

  wait_until_created : function(dt) {
    this.wait += dt;
    if (this.wait > 1) {
      this.wait = 0;
      if (Object.values(players).length === 2) {
        this.current_state = this.wait_game_start;
      }
    }
  },

  wait_spawn_robot : function(dt) {
      if (controller.current_state === controller.wait_for_player_2) {
        this.wait += dt;
        if (this.wait > (process.env.WAIT_PLAYER_TWO || 10) && !players_dict_locked) {
          players_dict_locked = true;
          console.log(new Date() + `: Game locked`)
          let pp = Object.values(players);
          this.wait = 0;
          this.robot = new Ai();
          this.robot.init(pp[0].id);
          this.current_state = this.wait_until_created;
      }
    }
  },

  update : function(dt) {
    this.current_state(dt);
  }
}
