let order = {

  around : [ [1,-1], [1,1], [-1,-1], [-1,1] ],
  cursor : 5,
  chosen : [],
  lastOrderSent : null,
  clickTime : null,

  orderTo : function() {
    if (clickCoords) {
      this.to = clickCoords;
      this.chosen.forEach( (s) => {
            s.color.set(s.player.color);
            let xingrid = s.x - (s.fx * selectGrid);
            let zingrid = s.z - (s.fz * selectGrid);
            let tx = (~~(this.to.x / selectGrid) * selectGrid) + xingrid;
            let tz = (~~(this.to.z / selectGrid) * selectGrid) + zingrid;

            s.tx = tx;
            s.tz = tz;
            s.ty = 0;
            s.orderX = s.x;
            s.orderZ = s.z;
            s.currentAction = s.moveTo;

            // Send planes
            let now = Date.now();
            let ftx = ~~(this.to.x / selectGrid);
            let ftz = ~~(this.to.z / selectGrid);
            if ( (now - this.clickTime) > 3000 && s.fx === ftx && s.fz === ftz && !s.player.sentPlanes && s.player.airStrikeReady
            ) {
              sendPlanesSid = s.id;
            } else {
              ordersToServer.push(s.id, tx, tz);
            }

      });
      if (this.chosen.length > 0) { audioPlay.push('ack') };
      this.chosen.length = 0;
      sentOrder = this.from;
      this.currentState = this.waitForClick;
      clickCoords = null;
      this.lastOrderSent = Date.now();
    }
  },

  wait_for_click : function() {
    if (this.lastOrderSent && (Date.now() - this.lastOrderSent < 400)) {
      clickCoords = null;
      return;
    }

    if (clickCoords) {
      this.chosen.length = 0;
      this.clickTime = Date.now();
      if (this.clickTime - clickTimeStart < 300) {
        for (var i = 0; i < this.around.length; i++) {
          let ss = gridmapGet(clickCoords.x + (this.around[i][0] * this.cursor), clickCoords.z + (this.around[i][1] * this.cursor));
          if (ss) {
            ss.forEach( (sb) => {
              if (sb && sb.player.id === me) {
                if (this.chosen.indexOf(sb) === -1 && (this.chosen.length < maxPlayersUpdate)) {
                  this.chosen.push(sb);
                  sb.currentAction = sb.blinkOut;
                }
              }
            });
          }
        }

        this.from = clickCoords;
        this.currentState = this.orderTo;
      }
      clickCoords = null;
    }
  },

  init : function(){
    this.currentState = this.waitForClick;
  },

  update : function() {
    if (toGo && me) this.currentState();
  }

}
