let start = 0;

module.exports = {

  wait : 0,
  current_action: null,

  init : function(){
    this.current_action = this.set_timer_to_0;
  },

  do_nothing : function() {
    to_go = null;
  },

  set_timer_to_0 : function(dt) {
    this.wait += dt;
    if (this.wait > 10) {
      let pll = Object.values(players);
      if (pll.length === 2) to_go = 0;
      update_time_sendq.push({ time : to_go });
      // loop_running = false;
      this.current_action = this.do_nothing;
    }
  },

  update : function(dt) {
    this.current_action(dt);
  }
}
