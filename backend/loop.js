const Soldier = require('./soldier');
const Player  = require('./player');
const Bullet  = require('./bullet');
const Plane   = require('./plane');

let then = Date.now(),
    now,
    interval = 1000/30,
    delta,
    avg=0, index=0;

global.sendGameState = false;

global.gameLoop = {

  gos : [],

  goAdd : function(id, go) {
    this.gos.push(go);
  },

  goRemove : function(go) {
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

        if (loopRunning) {

            if (playersNew.length > 0) {
              playersNew.forEach ( (np) => {
                  np.roomid = Object.values(players).length;
                  np.weight = (np.roomid * -2.0) + 1.0;
                  this.goAdd(this.gos.length, np);
                  players[np.id] = np;
                  addSoldiers(np, function(pop) {
                    np.population = pop;
                  });
                  add_planes(np);
                });
              playersNew.length = 0;
            }

            if (soldiersDead.length > 0) {
                soldiersDead.forEach( (ds) => {
                soldiersDeadBuffer[ds.id] = 1;
                this.goRemove(ds);
                mapsDel(ds);
                if (!(ds instanceof Bullet)) ds.player.population--;

            });
            soldiersDead.length = 0;
            }

            if (soldiersNew.length > 0) {
              soldiersNew.forEach ( (ns) => {
              this.goAdd(this.gos.length, ns);
              mapsSet(ns);
              if (!ns.player.newPopulation) ns.player.newPopulation = 0;
              ns.player.newPopulation++;
              if (ns.player.newPopulation === ns.player.population) {
                sendGameState = true;
              }
            });
              soldiersNew.length = 0;
            }

            if (planesNew.length > 0) {
              planesNew.forEach( plane => {
                this.goAdd(this.gos.length, plane);
              });
              planesNew.length = 0;
            }

            if (bulletsNew.length > 0) {
              bulletsNew.forEach ( (bu) => {
              if (bulletsNewBufIndex < bulletsNewBuf.length) {
                  bu.to_buffer(bulletsNewBuf, bulletsNewBufIndex);
                  bulletsNewBufIndex += 10;

                  this.goAdd(this.gos.length, bu);
                  mapsSet(bu);
              }
            });
                bulletsNew.length = 0;
            }

            for (var i = 0; i < this.gos.length; i++) {
              let go = this.gos[i];
              if (go && go.update) go.update(delta / 1000);
            }

            if (resetLoop) {
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
              playersDictLocked   = false;
              playersNew.length   = 0;
              playersDead.length  = 0;
              soldiersDead.length = 0;
              soldiersNew.length  = 0;
              fightmap = {};
              gridmap  = {};
              gridweights = [];
              idIndex = 0;
              planes  = {};


              console.log(new Date() + ": Game restarted");
              resetLoop = false;
            }
         }

       }

  }
}
