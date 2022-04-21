let start = 0;

module.exports = {

  wait : 0,

  update : function(dt) {
    if (!game_started_at) return;
    this.wait += dt;
    if (this.wait > 1) {
      this.wait = 0;
      to_go = Math.round(game_max_time - ((Date.now() - game_started_at) / 1000));
      update_time_sendq = { time : to_go };
    }
  }
}
