let toGo = null;
let toGoRemote = null;

const Clock = {

  wait : 0,

  update : function(dt) {
    this.wait += dt;
    if (this.wait > 1) {
      this.wait = 0;
      if (toGoRemote) {
        toGo = toGoRemote.time;
        toGoRemote = null;
      }
    }
  }
}
