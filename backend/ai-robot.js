const wpsApi  = require('./wps-api');
let thinkTable = [0.4, 0.5, 0.6, 0.7]; //, 0.9, 1.0, 1.1];
let multiorder  = [0,0,0,1,-1];

function Ai () {
}

Ai.prototype = {

  wait : 0,
  wait2 : 0,
  evalWait : 0,
  player : null,
  thinkTime : null,
  actions : null,
  lastShot : 0,
  around : [ [0,0], [1,0], [1,1], [0,1], [0,-1], [1,-1], [-1,1], [-1,0], [-1,-1], [0,-1], [1,-1] ],

  aiSettings : {
    0 : {
      weight : 1,
      startrow: 5,
      startrowend: 5,
      enemyWeight : -1,
      enemyStartRow: 9,
      enemyStartRowend: 9
    },
    1 : {
      weight: -1,
      startrow: 9,
      startrowend: 9,
      enemyWeight: 1,
      enemyStartRow: 5,
      enemyStartRowend: 5
    }
  },

  initModes : function(p) {
    p.modes = [
      [p.attack, p.attack,  p.attack, p.attack, p.consolidate, p.shoot, p.callPlanes],
      [p.mergeAll, p.attack, p. attack, p. attack, p.callPlanes]
    ]
  },

  callPlanes : function(dt) {
    let pp = Object.values(players);
    let thisPlayer = pp[0]  === this.player ? pp[0] : pp[1];
    let enemyPlayer = pp[0] === this.player ? pp[1] : pp[0];
    let sentProbability = Math.random() > 0.3;

    let sendWhenUnder = (enemyPlayer.population - thisPlayer.population > (enemyPlayer.population * 0.1) && thisPlayer.population > 500);  // && sentProbability);
    if (sendWhenUnder) {
      this.wait2 += dt;
      if (this.wait2 > 1) {
        this.wait2 = 0;
        let us = this.getGridUs();
        if (us) {
          let ss = gridmapGet(us.x * selectGrid, us.z * selectGrid);
          if (ss && ss.length > 0) {
            let s = rand(ss);
            s.currentAction = s.sendPlanes;
          }
          this.modes[1].pop(this.callPlanes);
          this.currentAction = this.chooseAction;
        } else {
          this.currentAction = this.chooseAction;
        }
      }
    } else {
      this.currentAction = this.chooseAction;
    }
  },

  shoot : function() {
    let now = Date.now();
    if (now - this.lastShot > maxLaunchDelay) {
          let us = this.getGridUs();
          let ss = gridmapGet(us.x * selectGrid, us.z * selectGrid);
          if (ss && ss.length > 0) {
            let s = rand(ss);
            s.currentAction = s.shoot;
          }
          this.lastShot = now;
    }
    this.currentAction = this.chooseAction;
  },

  order : function(us, them) {
    let ss = gridmapGet(us.x * selectGrid, us.z * selectGrid);
    if (ss) {
      ss.forEach( s => {
        if (s.player === this.player && s.currentAction !== s.move && s.currentAction !== s.fight) {
          let xingrid = s.x - (s.fx * selectGrid);
          let zingrid = s.z - (s.fz * selectGrid);
          s.tx = (them.x * selectGrid) + xingrid;
          s.tz = (them.z * selectGrid) + zingrid;
          s.ty = 0;
          s.currentAction = s.moveTo;

        }
      });
    }
  },

  chooseAction : function() {
    this.currentAction = rand(this.modes[this.player.population < 3000 ? 1 : 0]);
  },

  mergeAll : function() {
    let ww = gridweights.filter( g => { return g.w === this.aiSettings[this.player.roomid].weight });
    ww.forEach(us => {
        for (var i = 0; i < this.around.length; i++) {
          this.order({ "x" : us.x + this.around[i][0], "z" : us.z + this.around[i][1] }, us);
        }
    });
    this.currentAction = this.chooseAction;
  },

  init : function(except) {
    let obj = this;
    wpsApi.find_robot(except, function(id) {
      addPlayer({"id" : id}, function(np) {
        np.robot = true;
        obj.thinkTime = rand(thinkTable);
        console.log(new Date() + `: Robot player ${np.nick} (${np.id}), ${np.country}, ${np.wins}/${np.games} (${np.record}) joined with think time: ${obj.thinkTime}`);
        obj.player = np;

        obj.initModes(obj);
        obj.mode = obj.modes[0];
        obj.currentAction = obj.chooseAction;
      });
    });
  },

  noAction : function(){
    this.currentAction = this.chooseAction;
  },

  filterDistance : function(gl, from, r) {
    let ww = gl;
    let filterx = ww.filter( g => { return (Math.abs(g.x - from.x) < (r ? r : gridX)) });
    if (filterx.length > 0) ww = filterx;

    let filterz = ww.filter( g => { return (Math.abs(g.z - from.z) < (r ? r : gridX)) });
    if (filterz.length > 0) ww = filterz;
    return ww;
  },

  getGridUs : function(from, r) {
    let w = this.aiSettings[this.player.roomid].weight; //(this.player.roomid * -2.0) + 1.0;
    return this.getGrid(w, from ,r);
  },

  getGridThem : function(from, r) {
    let w = this.aiSettings[this.player.roomid].enemyWeight; //(this.player.roomid * 2.0) - 1.0;
    return this.getGrid(w, from ,r);
  },

  getGrid : function(w, from, r) {
      let ww = gridweights.filter( g => { return g.w === w  });
      if (ww.length > 0) {
        if (from) ww = this.filterDistance(ww, from, r);
        return rand(ww);
    }
  },

  getGridW : function(w, filter) {
      let ww = gridweights.filter( g => { return g.w === w  });
      if (ww.length > 0) {
        if (filter) ww = filter(ww);
        return rand(ww);
    }
  },

  getGridFromRows : function(w, sr, er) {
      let wc = this.getGridW(w, function(grids) {
          return grids.filter( g => {
            return (g.z >= sr && g.z <= er);
          });
      });
      return wc;
   },

  consolidate : function() {
    let us1 = this.getGridUs();
    let us2 = this.getGridUs(us1, 2);
    if (us1 && us2) this.order(us2, us1);
    this.currentAction = this.chooseAction;
  },

  merge : function(){
      let us = this.getGridUs();
      for (var i = 0; i < this.around.length; i++) {
        if (us) this.order({ "x" : us.x + this.around[i][0], "z" : us.z + this.around[i][1] }, us);
      }
    this.currentAction = this.chooseAction;
  },

  attack : function(){
    let us, them = null;
    let set = this.aiSettings[this.player.roomid];
    them = this.getGridFromRows(set.enemyWeight, set.enemyStartRow, set.enemyStartRowend);
    us   = this.getGridFromRows(set.weight, set.startrow, set.startrowend);
    if (!(us && them)) {
      us = this.getGridUs();
      them = this.getGridThem(us, 3);
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
    this.currentAction = this.chooseAction;
  },

  think : function(dt) {
    this.wait += dt;
    if (this.wait > this.thinkTime) {
      this.wait = 0;
      this.currentAction(dt);
    }
  },
}

module.exports = Ai;
