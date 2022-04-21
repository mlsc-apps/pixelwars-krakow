let to_go = null;
let to_go_remote = null;

let clock = {

  wait : 0,

  update : function(dt) {
    this.wait += dt;
    if (this.wait > 1) {
      this.wait = 0;
      if (to_go_remote) {
        to_go = to_go_remote.time;
        to_go_remote = null;
      }
    }
  }
}
