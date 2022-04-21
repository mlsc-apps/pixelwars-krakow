let start = 0;

module.exports = {

  wait : 0,

  update : function(dt) {
    this.wait += dt;
    if (this.wait > 10) {
      let pll = Object.values(players);
      if (pll.length === 2) pll[0].population = 0;
    }
  }
}
