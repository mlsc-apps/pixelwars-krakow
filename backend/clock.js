let start = 0;

module.exports = {

  wait : 0,

  update : function(dt) {
    if (!gameStartedAt) return;
    this.wait += dt;
    if (this.wait > 1) {
      this.wait = 0;
      toGo = Math.round(gameMaxTime - ((Date.now() - gameStartedAt) / 1000));
      updateTimeSendq = { time : toGo };
    }
  }
}
