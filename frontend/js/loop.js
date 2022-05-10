let fps = 30;
let then = Date.now(),
    now,
    interval = 1000/fps,
    delta;

let gameLoop = {

  gos : [],
  pixel   : null,
  context : null,
  date    : new Date(),

  goAdd : function(id, go) {
    this.gos.push(go);
  },

  goRemove : function(go) {
    pop(this.gos, go);
  },

  init : function() {
    loop = this;
    this.gos.forEach( (go) => {
        if (go.init) {
          go.init();
        }
    });
  },

  start : function() {
      requestAnimationFrame(this.loop.bind(this));
  },

  loop : function(dt){
    let gameframe = requestAnimationFrame(this.loop.bind(this));

    now = Date.now();
    delta = now - then;

    if (delta > interval) {
        then = now - (delta % interval);

        if (loopRunning) {

            if (soldiersDead.length > 0) {
              soldiersDead.forEach( (ds) => {
                  this.goRemove(ds);
                  mapsDel(ds);
              });
              soldiersDead.length = 0;
            }

            if (soldiersNew.length > 0) {
              soldiersNew.forEach ( (ns) => {
                this.goAdd(this.gos.length, ns);
                mapsSet(ns);
                buffersSet(ns);
              });
              soldiersNew.length = 0;
            }

            for (var i = 0; i < this.gos.length; i++) {
              let go = this.gos[i];
              if (go && go.update) go.update(delta / 1000);
            }
        } else {
          network.connection = null;
          window.localStorage.removeItem('sts');
          cancelAnimationFrame(gameframe);
        }
    }
  }
}
