const wps_api = require('./wps-api');
const timeout_1 = 30; //120;
const timeout_2 = 30; //60;

module.exports = {

  wait : 0,
  current_state : null,
  counttable : ['3..', '2..', '1..', 'GO!'],
  count : 0,

  wait_for_player_1 : function() {
    let pp = Object.values(players);
    if (pp.length === 1) {
      console.debug(new Date() + `: Player ${pp[0].nick} waiting for ack`);
      this.current_state = this.ack_player_1;
    }
  },

  ack_player_1 : function(dt) {
    let pp = Object.values(players);
    if (pp[0].robot || (ack_received === pp[0].id)) {
      pp[0].send("memo", { msg  : 'Waiting for opponent...' });
      ack_received = null;
      this.wait = 0;
      this.current_state = this.wait_for_player_2;
    } else {
      if ((this.wait += dt) > timeout_1) {
        pp[0].send("memo", { msg  : 'Waiting for opponent...' });
        ack_received = null;
        this.wait = 0;
        console.log(new Date() + ': Timeout waiting for ack');
        this.current_state = this.wait_for_player_2;
      }
    }
  },

  wait_for_player_2 : function() {
    let pp = Object.values(players);
    if (pp.length === 2) {
      pp[0].opponent = pp[1];
      pp[1].opponent = pp[0];
      console.log(new Date() + ': Waiting for ack players ready');
      this.current_state = this.ack_players_ready;
    }
  },

  ack_players_ready : function(dt) {
    let pp = Object.values(players);
    if (pp[0].robot || (ack_received === pp[0].id)) pp[0].ready = true;
    if (pp[1].robot || (ack_received === pp[1].id)) pp[1].ready = true;
    if (pp[0].ready && pp[1].ready) {
      ack_received = null;
      this.wait = 0;
      console.log(new Date() + ': Acks received. Starting game...');
      this.current_state = this.countdown;
    } else {
      if ((this.wait += dt) > timeout_2) {
        ack_received = null;
        this.wait = 0;
        console.log(new Date() + ': Timeout waiting for ack. Starting game...');
        this.current_state = this.countdown;
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
            this.current_state = this.start_game;
          }
    }
  },

  start_game : function(){
    game_started_at = Date.now();
    console.log(new Date() + ": Game started");
    this.current_state = this.wait_for_end;
  },

  wait_for_restart : function(dt) {
    s_world_tick = false;
    this.current_state = this.restart;
  },

  send_last_tick : function() {
      s_world_tick = true;
      this.current_state = this.wait_for_restart;
  },

  restart : function() {
    reset_loop = true;
    game_started_at = null;
    this.count = 0;
    this.wait = 0;
    to_go = game_max_time;
    update_buffer_index = additional_bytes;
    this.current_state = this.wait_for_player_1;
  },

  wait_for_end : function(dt) {
    let pp = Object.values(players);
    for (var i = 0; i < pp.length; i++) {
      let loser = pp[i];
      if (loser.population === 0) {

        let winner = Object.values(players).filter( e => { return e.id !== loser.id; })[0];
        let winner_games  = winner.games + 1;
        let winner_wins   = winner.wins + 1;
        let winner_record = winner_wins / winner_games;

        let loser_games  = loser.games + 1;
        let loser_wins   = loser.wins;
        let loser_record = loser_wins / loser_games;

        if (!winner.nonreg) wps_api.update_record(winner_games, winner_wins, winner_record, winner);
        if (!loser.nonreg)  wps_api.update_record(loser_games, loser_wins, loser_record, loser);

        console.log(new Date() + ": Game ended");
        console.log(new Date() + `: ${winner.nick} wins by ${winner.population}`);
        this.current_state = this.send_last_tick;
        return;
      }
    }

    if (to_go !== null && to_go <= 0) {
      console.log(new Date() + ": Game ended with timeout");
      this.current_state = this.send_last_tick;
      return;
    }

    global_time += dt;
    s_world_tick = ((this.wait += dt) > 0.350);
    if (s_world_tick) this.wait = 0;
  },

  init : function() {
    this.current_state = this.wait_for_player_1;
  },

  update : function(dt) {
    this.current_state(dt);
  }

}
