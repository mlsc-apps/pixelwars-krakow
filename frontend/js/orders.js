let order = {

  around : [ [1,-1], [1,1], [-1,-1], [-1,1] ],
  cursor : 5,
  chosen : [],
  last_order_sent : null,
  click_time : null,

  order_to : function() {
    if (click_coords) {
      this.to = click_coords;
      this.chosen.forEach( (s) => {
            s.color.set(s.player.color);
            let xingrid = s.x - (s.fx * select_grid);
            let zingrid = s.z - (s.fz * select_grid);
            let tx = (~~(this.to.x / select_grid) * select_grid) + xingrid;
            let tz = (~~(this.to.z / select_grid) * select_grid) + zingrid;

            s.tx = tx;
            s.tz = tz;
            s.ty = 0;
            s.order_x = s.x;
            s.order_z = s.z;
            s.current_action = s.move_to;

            // Send planes
            let now = Date.now();
            let ftx = ~~(this.to.x / select_grid);
            let ftz = ~~(this.to.z / select_grid);
            if ( (now - this.click_time) > 3000 && s.fx === ftx && s.fz === ftz && !s.player.sent_planes && s.player.air_strike_ready) {
              send_planes_sid = s.id;
            } else {
              orders_to_server.push(s.id, tx, tz);
            }

      });
      if (this.chosen.length > 0) { audio_play.push('ack') };
      this.chosen.length = 0;
      sent_order = this.from;
      this.current_state = this.wait_for_click;
      click_coords = null;
      this.last_order_sent = Date.now();
    }
  },

  wait_for_click : function() {
    if (this.last_order_sent && (Date.now() - this.last_order_sent < 400)) {
      click_coords = null;
      return;
    }

    if (click_coords) {
      this.chosen.length = 0;
      this.click_time = Date.now();
      if (this.click_time - click_time_start < 300) {
        for (var i = 0; i < this.around.length; i++) {
          let ss = gridmap_get(click_coords.x + (this.around[i][0] * this.cursor), click_coords.z + (this.around[i][1] * this.cursor));
          if (ss) {
            ss.forEach( (sb) => {
              if (sb && sb.player.id === me) {
                if (this.chosen.indexOf(sb) === -1 && (this.chosen.length < max_players_update)) {
                  this.chosen.push(sb);
                  sb.current_action = sb.blink_out;
                }
              }
            });
          }
        }

        this.from = click_coords;
        this.current_state = this.order_to;
      }
      click_coords = null;
    }
  },

  init : function(){
    this.current_state = this.wait_for_click;
  },

  update : function() {
    if (to_go && me) this.current_state();
  }

}
