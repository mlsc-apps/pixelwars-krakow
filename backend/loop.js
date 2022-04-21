const Soldier = require('./soldier');
const Player  = require('./player');
const Bullet  = require('./bullet');
const Plane   = require('./plane');

let then = Date.now(),
    now,
    interval = 1000/30,
    delta,
    avg=0, index=0;

global.send_game_state = false;

global.gameloop = {

  gos : [],

  go_add : function(id, go) {
    this.gos.push(go);
  },

  go_remove : function(go) {
    pop(this.gos, go);
  },

  init : function() {
    this.gos.forEach( (go) => {
        if (go.init) {
          go.init();
        }
    });
  },

  update : function() {

    now = Date.now();
    delta = now - then;

        if (delta > interval) {
          then = now - (delta % interval);

        if (loop_running) {

            if (players_new.length > 0) {
              players_new.forEach ( (np) => {
                  np.roomid = Object.values(players).length;
                  np.weight = (np.roomid * -2.0) + 1.0;
                  this.go_add(this.gos.length, np);
                  players[np.id] = np;
                  add_soldiers(np, function(pop) {
                    np.population = pop;
                  });
                  add_planes(np);
                });
            players_new.length = 0;
            }

            if (soldiers_dead.length > 0) {
                soldiers_dead.forEach( (ds) => {
                soldiers_dead_buffer[ds.id] = 1;
                this.go_remove(ds);
                maps_del(ds);
                if (!(ds instanceof Bullet)) ds.player.population--;

            });
            soldiers_dead.length = 0;
            }

            if (soldiers_new.length > 0) {
              soldiers_new.forEach ( (ns) => {
              this.go_add(this.gos.length, ns);
              maps_set(ns);
              if (!ns.player.new_population) ns.player.new_population = 0;
              ns.player.new_population++;
              if (ns.player.new_population === ns.player.population) {
                send_game_state = true;
              }
            });
              soldiers_new.length = 0;
            }

            if (planes_new.length > 0) {
              planes_new.forEach( plane => {
                this.go_add(this.gos.length, plane);
              });
              planes_new.length = 0;
            }

            if (bullets_new.length > 0) {
              bullets_new.forEach ( (bu) => {
              if (bullets_new_buf_index < bullets_new_buf.length) {
                  bu.to_buffer(bullets_new_buf, bullets_new_buf_index);
                  bullets_new_buf_index += 10;

                  this.go_add(this.gos.length, bu);
                  maps_set(bu);
              }
            });
                bullets_new.length = 0;
            }

            for (var i = 0; i < this.gos.length; i++) {
              let go = this.gos[i];
              if (go && go.update) go.update(delta / 1000);
            }

            if (reset_loop) {
              let newgos = [];
              this.gos.forEach ( go => {
                if (go.reset) go.reset();
                if (!(go instanceof Soldier) &&
                    !(go instanceof Player) &&
                    !(go instanceof Bullet) &&
                    !(go instanceof Plane) ) newgos.push(go);
              });

              this.gos = newgos;

              players = {};
              players_dict_locked = false;
              players_new.length = 0;
              players_dead.length = 0;
              soldiers_dead.length = 0;
              soldiers_new.length = 0;
              fightmap = {};
              gridmap = {};
              gridweights = [];
              id_index = 0;
              planes = {};


              console.log(new Date() + ": Game restarted");
              reset_loop = false;
            }
         }

       }

  }
}
