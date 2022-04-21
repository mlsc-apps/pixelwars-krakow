let fps = 30;
let then = Date.now(),
    now,
    interval = 1000/fps,
    delta;

let gameloop = {

  gos : [],
  pixel : null,
  context : null,
  date : new Date(),

  go_add : function(id, go) {
    this.gos.push(go);
  },

  go_remove : function(go) {
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

        if (loop_running) {

            if (soldiers_dead.length > 0) {
              soldiers_dead.forEach( (ds) => {
                  this.go_remove(ds);
                  maps_del(ds);
              });
              soldiers_dead.length = 0;
            }

            if (soldiers_new.length > 0) {
              soldiers_new.forEach ( (ns) => {
                this.go_add(this.gos.length, ns);
                maps_set(ns);
                buffers_set(ns);
              });
              soldiers_new.length = 0;
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
