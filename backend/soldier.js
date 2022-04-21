const Bullet = require('./bullet');

function Soldier () {
}

Soldier.prototype = {

    around : [ [0,0], [1,0], [1,1], [0,1], [0,-1], [1,-1] ],
    as_string : [],

    x : 0,     z : 0,     y : 0,
    vx : 0,    vz : 0,    vy : 0,
    tx : 0,    tz : 0,    ty : 0,
    fz : 0,    fy : 0,    fx : 0,

    wait        : 0,
    update_tick : 0,
    orders_tick : 0,

    init : function(player, x, y, z, action) {
      this.id = guid() + (max_planes * 2) + 1;
      this.x = x; this.sent_x = x;
      this.z = z; this.sent_z = z;
      this.y = 0;
      this.color    = player.color;
      this.speed    = (Math.random() * 5) + 20;
      this.power    = (this.id % 100) / 100; //random();
      this.player = player;
      this.current_action = this.no_action;
      soldiers_new.push(this);
    },

    chosen : function() {
    },

    no_action : function(dt) {
    },

    look_fight : function(dt) {
      let ss = null;
      for (var i = 0; i < this.around.length; i++) {
        let gr = gridmap_get(this.x + (this.around[i][0] * select_grid), this.z + (this.around[i][1] * select_grid));
        if (gr) ss = gr.filter( e => { return (!(e instanceof Bullet) && e.player !== this.player) });
        if (ss && ss.length > 0) break;
      }

      if (ss && ss.length > 0) {
        let s = rand(ss); //ss[i];
        if (s.player !== this.player && s.current_action !== s.die) {
          if (s.fix === this.fix && s.fiz === this.fiz) {
            this.enemy = s;
            s.enemy = this;
            this.current_action = this.fight;
          } else {
            this.tx = s.x;
            this.ty = s.y;
            this.tz = s.z;
            this.current_action = this.move_to;

          }
        }
      } else {
        this.current_action = this.no_action;
      }
    },

    move : function(dt) {

      let dx = this.vx * dt;
      let dz = this.vz * dt;
      let dy = this.vy * dt;

      dx = Math.min(dx, 1);
      dz = Math.min(dz, 1);

      dx = Math.max(dx, -1);
      dz = Math.max(dz, -1);

      let nx = this.x + dx;
      let nz = this.z + dz;
      let ny = this.y + dy;

      let inx = ~~(nx);
      let inz = ~~(nz);
      this.moving = inx != this.fix || inz != this.fiz;
      if (this.moving) {
        let ss = fightmap_get(inx, inz);
        if (ss) {
              let ee = ss.filter( s => {
                return s.player !== this.player;
              });
              if (ee.length > 0) {
                let s = ee[0];
                    this.enemy = s;
                    this.power += 0.1;
                    this.current_action = this.fight;
                    s.enemy = this;
                    s.current_action = s.no_action;
                    return;
                }
        }
      }

      this.x = nx;
      this.y = ny;
      this.z = nz;

      maps_del(this);
      maps_set(this);

      if (this.vx * (this.tx - this.x) < 0 ||
          this.vz * (this.tz - this.z) < 0) {
          this.x = this.tx;
          this.z = this.tz;
          maps_del(this);
          maps_set(this);
          this.current_action = this.look_fight;
          return;
      }

    },

    move_to : function() {
      if (update_buffer_index === update_soldier_send_buf.length) return;
      let dx = this.tx - this.x,
          dz = this.tz - this.z,
          dy = this.ty - this.y,
          mag = Math.sqrt(dx * dx + dz * dz + dy * dy);

      if (mag === 0 ) {
        this.current_action = this.look_fight;
        return;
      }

      this.vx = (dx / mag) * this.speed;
      this.vy = (dy / mag) * this.speed;
      this.vz = (dz / mag) * this.speed;
      this.current_action = this.move;
    },

    send_planes : function() {
          planes[this.player.roomid].forEach( plane => {
              plane.current_action = plane.move;
          });
      // }
      this.current_action = this.no_action;
    },

    orders_from_client : function() {
      let order = orders_receiveq[this.orders_tick] && orders_receiveq[this.orders_tick][this.id];
      if (order) {
        this.tx = order[0];
        this.tz = order[1];
        this.ty = 0;
        if (this.tx === this.x && this.tz === this.z) {
            let now = Date.now();
            if (!this.player.last_shot || (now - this.player.last_shot) > max_launch_delay) {
                this.player.last_shot = now;
                this.current_action = this.shoot;
            }
        } else {
            this.current_action = this.move_to;
        }

        delete orders_receiveq[this.orders_tick][this.id];
        if (Object.keys(orders_receiveq[this.orders_tick]).length === 0) {
          orders_receiveq[this.orders_tick] = null;
        }
      }
      this.orders_tick = s_orders_tick;
    },

    check_planes : function() {
      if (planes_sid && this.id === planes_sid) {
          this.current_action = this.send_planes;
          planes_sid = null;
      }
    },

    update : function(dt) {
          if (this.orders_tick !== s_orders_tick) this.orders_from_client();
          this.check_planes();
          this.current_action(dt);

            if (s_world_tick) {
              let buffer_full = update_buffer_index === update_soldier_send_buf.length;
              let action_changed = (this.sent_x !== this.x || this.sent_z !== this.z);

              if (!buffer_full && action_changed) {

                  this.x = Math.max(0, this.x);
                  this.z = Math.max(0, this.z);

                  this.x = Math.min(360, this.x);
                  this.z = Math.min(600, this.z);

                  update_soldier_send_buf.writeUInt16BE(this.id, update_buffer_index);
                  update_soldier_send_buf.writeUInt16BE(this.x,  update_buffer_index + 2);
                  update_soldier_send_buf.writeUInt16BE(this.z,  update_buffer_index + 4);
                  update_buffer_index += bytes_per_soldier;
                  this.sent_x = this.x;
                  this.sent_z = this.z;
              }
            }
    },

    die : function() {
      soldiers_dead.push(this);
    },

    shoot : function() {
      let bullet = null;
      for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 6; j++) {
          bullet = new Bullet();
          bullet.init(this.player, this.x + i, 0, this.z + j, "move");
        }
      }
      this.current_action = this.no_action;
    },

    fight : function() {
      let winner = null;
      let loser = null;

      let result = (this.player.population - this.player.opponent.population);
      let f = -(result / 2000) * 0.2;

      if ( (this.power + f) > this.enemy.power ) {
        winner = this;
        loser = this.enemy;
      } else {
        winner = this.enemy;
        loser = this;
      }

      winner.power -= 0.1;
      winner.enemy = null;
      winner.current_action = (winner instanceof Bullet) ? winner.move : winner.look_fight;

      loser.enemy = null;
      loser.current_action = loser.die;
    },

    to_buffer : function() {
      let buf = Buffer.alloc(10);
      buf.writeUInt8(this.player.roomid, 0);
      buf.writeUInt16BE(this.player.population, 1);
      buf.writeUInt16BE(this.id, 3);
      buf.writeUInt16BE(this.x, 5);
      buf.writeUInt16BE(this.z, 7);
      buf.writeUInt8(this.speed, 9);
      return buf;
    }
}

module.exports = Soldier;
