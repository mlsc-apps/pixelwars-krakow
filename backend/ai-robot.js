const wps_api  = require('./wps-api');
let think_table = [0.4, 0.5, 0.6, 0.7]; //, 0.9, 1.0, 1.1];
let multiorder  = [0,0,0,1,-1];

function Ai () {
}

Ai.prototype = {

  wait : 0,
  wait2 : 0,
  eval_wait : 0,
  player : null,
  think_time : null,
  actions : null,
  last_shot : 0,
  around : [ [0,0], [1,0], [1,1], [0,1], [0,-1], [1,-1], [-1,1], [-1,0], [-1,-1], [0,-1], [1,-1] ],

  ai_settings : {
    0 : {
      weight : 1,
      startrow: 5,
      startrowend: 5,
      enemy_weight : -1,
      enemy_startrow: 9,
      enemy_startrowend: 9
    },
    1 : {
      weight: -1,
      startrow: 9,
      startrowend: 9,
      enemy_weight: 1,
      enemy_startrow: 5,
      enemy_startrowend: 5
    }
  },

  init_modes : function(p) {
    p.modes = [
      [p.attack, p.attack,  p.attack, p.attack, p.consolidate, p.shoot, p.call_planes],
      [p.merge_all, p.attack, p. attack, p. attack, p.call_planes]
    ]
  },

  call_planes : function(dt) {
    let pp = Object.values(players);
    let this_player = pp[0] === this.player ? pp[0] : pp[1];
    let enemy_player = pp[0] === this.player ? pp[1] : pp[0];
    let sent_probability = Math.random() > 0.3;

    let send_when_under = (enemy_player.population - this_player.population > (enemy_player.population * 0.1) && this_player.population > 500);  // && sent_probability);
    if (send_when_under) {
      this.wait2 += dt;
      if (this.wait2 > 1) {
        this.wait2 = 0;
        let us = this.get_grid_us();
        if (us) {
          let ss = gridmap_get(us.x * select_grid, us.z * select_grid);
          if (ss && ss.length > 0) {
            let s = rand(ss);
            s.current_action = s.send_planes;
          }
          this.modes[1].pop(this.call_planes);
          this.current_action = this.choose_action;
        } else {
          this.current_action = this.choose_action;
        }
      }
    } else {
      this.current_action = this.choose_action;
    }
  },

  shoot : function() {
    let now = Date.now();
    if (now - this.last_shot > max_launch_delay) {
          let us = this.get_grid_us();
          let ss = gridmap_get(us.x * select_grid, us.z * select_grid);
          if (ss && ss.length > 0) {
            let s = rand(ss);
            s.current_action = s.shoot;
          }
          this.last_shot = now;
    }
    this.current_action = this.choose_action;
  },

  order : function(us, them) {
    let ss = gridmap_get(us.x * select_grid, us.z * select_grid);
    if (ss) {
      ss.forEach( s => {
        if (s.player === this.player && s.current_action !== s.move && s.current_action !== s.fight) {
          let xingrid = s.x - (s.fx * select_grid);
          let zingrid = s.z - (s.fz * select_grid);
          s.tx = (them.x * select_grid) + xingrid;
          s.tz = (them.z * select_grid) + zingrid;
          s.ty = 0;
          s.current_action = s.move_to;

        }
      });
    }
  },

  choose_action : function() {
    this.current_action = rand(this.modes[this.player.population < 3000 ? 1 : 0]);
  },

  merge_all : function() {
    let ww = gridweights.filter( g => { return g.w === this.ai_settings[this.player.roomid].weight });
    ww.forEach(us => {
        for (var i = 0; i < this.around.length; i++) {
          this.order({ "x" : us.x + this.around[i][0], "z" : us.z + this.around[i][1] }, us);
        }
    });
    this.current_action = this.choose_action;
  },

  init : function(except) {
    let obj = this;
    wps_api.find_robot(except, function(id) {
      add_player({"id" : id}, function(np) {
        np.robot = true;
        obj.think_time = rand(think_table);
        console.log(new Date() + `: Robot player ${np.nick} (${np.id}), ${np.country}, ${np.wins}/${np.games} (${np.record}) joined with think time: ${obj.think_time}`);
        obj.player = np;

        obj.init_modes(obj);
        obj.mode = obj.modes[0];
        obj.current_action = obj.choose_action;
      });
    });
  },

  no_action : function(){
    this.current_action = this.choose_action;
  },

  filter_distance : function(gl, from, r) {
    let ww = gl;
    let filterx = ww.filter( g => { return (Math.abs(g.x - from.x) < (r ? r : grid_x)) });
    if (filterx.length > 0) ww = filterx;

    let filterz = ww.filter( g => { return (Math.abs(g.z - from.z) < (r ? r : grid_x)) });
    if (filterz.length > 0) ww = filterz;
    return ww;
  },

  get_grid_us : function(from, r) {
    let w = this.ai_settings[this.player.roomid].weight; //(this.player.roomid * -2.0) + 1.0;
    return this.get_grid(w, from ,r);
  },

  get_grid_them : function(from, r) {
    let w = this.ai_settings[this.player.roomid].enemy_weight; //(this.player.roomid * 2.0) - 1.0;
    return this.get_grid(w, from ,r);
  },

  get_grid : function(w, from, r) {
      let ww = gridweights.filter( g => { return g.w === w  });
      if (ww.length > 0) {
        if (from) ww = this.filter_distance(ww, from, r);
        return rand(ww);
    }
  },

  get_grid_w : function(w, filter) {
      let ww = gridweights.filter( g => { return g.w === w  });
      if (ww.length > 0) {
        if (filter) ww = filter(ww);
        return rand(ww);
    }
  },

  get_grid_from_rows : function(w, sr, er) {
      let wc = this.get_grid_w(w, function(grids) {
          return grids.filter( g => {
            return (g.z >= sr && g.z <= er);
          });
      });
      return wc;
   },

  consolidate : function() {
    let us1 = this.get_grid_us();
    let us2 = this.get_grid_us(us1, 2);
    if (us1 && us2) this.order(us2, us1);
    this.current_action = this.choose_action;
  },

  merge : function(){
      let us = this.get_grid_us();
      for (var i = 0; i < this.around.length; i++) {
        if (us) this.order({ "x" : us.x + this.around[i][0], "z" : us.z + this.around[i][1] }, us);
      }
    this.current_action = this.choose_action;
  },

  attack : function(){
    let us, them = null;
    let set = this.ai_settings[this.player.roomid];
    them = this.get_grid_from_rows(set.enemy_weight, set.enemy_startrow, set.enemy_startrowend);
    us = this.get_grid_from_rows(set.weight, set.startrow, set.startrowend);
    if (!(us && them)) {
      us = this.get_grid_us();
      them = this.get_grid_them(us, 3);
    }
    if (us && them) {
        this.order(us, them);

        let xx = rand(multiorder);
        let zz = rand(multiorder);

        if (xx !== 0) {
          this.order({ "x" : us.x + xx, "z" : us.z }, them);
        }
        if (zz !== 0) {
          if (xx !== 0) this.order({ "x" : us.x + xx, "z" : us.z + zz }, them);
          this.order({ "x" : us.x, "z" : us.z + zz }, them);
        }
    }
    this.current_action = this.choose_action;
  },

  think : function(dt) {
    this.wait += dt;
    if (this.wait > this.think_time) {
      this.wait = 0;
      this.current_action(dt);
    }
  },
}

module.exports = Ai;
