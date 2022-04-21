let loop_running = true;
let nonregi = null;

let controller = {

  wait : 0,
  current_state : null,
  winner : null,

  wait_for_players : function() {
    if (Object.values(players).length === 2) {
      this.current_state = this.wait_for_server_start;
    }
  },

  wait_for_server_start : function() {
    if (to_go !== null) this.current_state = this.wait_for_end;
  },

  stop_loop : function() {
    loop_running = false;
  },

  wait_for_end : function(dt){
    Object.values(players).forEach( p => {

      if (p.population === 0) {
        let winner = Object.values(players).filter( e => { return e !== p; })[0];
        if (me) {
          if (p.id === me) {
            show_info(`Sorry.. You lost!`);
          } else {
            show_info(`Congratulations! You Win!`);
          }
        } else {
            show_info(winner.nick + ' wins!');
        }
        this.winner = winner;
      }

    });

    if (this.winner) {
      this.current_state = this.stop_loop;
      return;
    }

    if (to_go !== null && to_go <= 0) {
      if (me) {
        show_info(`Sorry.. Time is Up!`);
      } else {
        show_info(`Sorry.. Time is Up!`);
      }
      this.current_state = this.stop_loop;
      return;
    }

    global_time += dt;
    if (!(s_updates_from_server[client_tick + 1])) {
      this.last_world_tick = world_tick;
      show_loading(true);
      this.current_state = this.wait_for_world_ticks;
      return;
    }
    if (global_time > s_updates_from_server[client_tick + 1].timestamp) {
      s_updates_from_server[client_tick] = null;
      client_tick++;
    }
  },

  wait_for_world_ticks : function() {
    if (world_tick - this.last_world_tick > 1 ||
        to_go !== null && to_go <= 0) {
      show_loading(false);
      this.current_state = this.wait_for_end;
    }
  },

  init : function() {
    this.current_state = this.wait_for_players;
  },

  update : function(dt) {
    this.current_state(dt);
  }

}
