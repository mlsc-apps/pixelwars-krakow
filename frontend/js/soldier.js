let Soldier = {

    init : function(player, id, x, z, speed) {
      this.id = id;
      this.x = x;
      this.z = z;
      this.y = 0;
      this.ax = 0;
      this.az = 0;
      this.speed = speed;
      this.color = new THREE.Color(player.color);
      this.player = player;
      this.index  = 0;
      this.function_map = {
        "die"             : this.die,
        "move"            : this.move,
        "move_to"         : this.move_to
      };
      this.current_action = this.no_action;
      soldiers_new.push(this);

      this.wait = 0;
      this.client_tick = 0;
      this.last_dead_tick = 0;
      this.die_delay = Math.random() * 0.5;
    },

    blink_out : function() {
      this.color.multiplyScalar(0.8);
      if (this.color.toArray()[(this.player.roomid * -2.0) + 2.0] < 0.4) {
        this.current_action = this.blink_in;
      }
    },

    blink_in : function(dt) {
      this.color.multiplyScalar(1.2);
      if (this.color.toArray()[(this.player.roomid * -2.0) + 2.0] > 1) {
        this.current_action = this.blink_out;
      }
    },

    no_action : function(dt) {
    },

    move : function(dt) {
      let dx = this.vx * dt;
      let dz = this.vz * dt;
      // let dy = this.vy * dt;

      dx = Math.min(dx, 1);
      dz = Math.min(dz, 1);

      dx = Math.max(dx, -1);
      dz = Math.max(dz, -1);

      let nx = this.x + dx + (this.ax * dt);
      let nz = this.z + dz + (this.az * dt);
      // let ny = this.y + dy;

      this.x = nx;
      // this.y = ny;
      this.z = nz;

      maps_del(this);
      maps_set(this);

      if (this.vx * (this.tx - this.x) < 0 ||
          this.vz * (this.tz - this.z) < 0 &&
          this.local_move) {
          this.local_move = null;
      }

    },

    move_to : function() {
      let dx = this.tx - this.x,
          dz = this.tz - this.z,
          dy = 0; //this.ty - this.y,
          mag = Math.sqrt(dx * dx + dz * dz + dy * dy);

      if (mag === 0 ) {
        this.current_action = this.no_action;
        return;
      }

      this.vx = (dx / mag) * this.speed / (1 + (this.player.latency || 0));
      this.vy = 0; //(dy / mag) * this.speed / (1 + (this.player.latency || 0));
      this.vz = (dz / mag) * this.speed / (1 + (this.player.latency || 0));

      this.local_move = global_time;
      this.current_action = this.move;
    },

    world_ticks_update : function() {
            let current_snapshot = s_updates_from_server[client_tick];
            let next_snapshot    = s_updates_from_server[client_tick + 1];

            if (!current_snapshot || !next_snapshot) {
              this.current_action = this.no_action;
              return;
            }

            if (!next_snapshot.updates) {
              return;
            }

            this.is_next = next_snapshot.updates[this.id];

            if (!this.is_next) {
                if (!this.chosen && !this.local_move) {
                  if (this.last_remote_x && this.last_remote_z) {
                    this.x = this.last_remote_x;
                    this.z = this.last_remote_z;
                    maps_del(this);
                    maps_set(this);
                    this.last_remote_x = null;
                    this.last_remote_z = null;
                  }
                  this.current_action = this.no_action;
                }
              }

            if (this.is_next) {
                  let remote_x = next_snapshot.updates[this.id][0];
                  let remote_z = next_snapshot.updates[this.id][1];
                  if (this.local_move) {
                    if (current_snapshot.timestamp - this.local_move > 0.350) {
                      this.ax = (remote_x - this.x);
                      this.az = (remote_z - this.z);
                      if ((this.vx * this.ax) >= 0 && (this.vz * this.az) >= 0) {
                          this.ax = 0;
                          this.az = 0;
                          this.local_move = null;
                      }
                    }
                  } else {
                    if (Math.abs(remote_x - this.x) < 0.1) this.x = remote_x;
                    if (Math.abs(remote_z - this.z) < 0.1) this.z = remote_z;
                    this.vx = (remote_x - this.x) * (1 / (next_snapshot.timestamp - current_snapshot.timestamp));
                    this.vz = (remote_z - this.z) * (1 / (next_snapshot.timestamp - current_snapshot.timestamp));
                    this.current_action = (this.vx === 0 && this.vz === 0) ? this.chosen ? this.current_action : this.no_action : this.move;
                  }
                  this.last_remote_x = remote_x;
                  this.last_remote_z = remote_z;
                  this.last_update_timestamp = next_snapshot.timestamp;
              }
            this.client_tick = client_tick;
      },

      world_dead_update : function() {
        if (s_dead_updates_from_server[this.id]) {
            this.current_action = this.player.population === 1 ? this.die : this.die_delayed;
        }
      },

      update : function(dt) {
        this.chosen = (this.current_action === this.blink_in || this.current_action === this.blink_out);
        if (this.client_tick !== client_tick) {
          this.world_ticks_update();
          this.world_dead_update();
        }
        this.current_action(dt);
        buffers_set(this);

      },

      die : function() {
        this.color.set(0xffffff);
        if (Math.random() > 0.9) audio_play.push('die');
        soldiers_dead.push(this);
      },

      die_delayed : function(dt) {
        if ((this.wait += dt) > this.die_delay) {
          this.wait = 0;
          this.current_action = this.die;
        }
      }
}
