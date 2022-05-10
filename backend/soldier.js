const Bullet = require('./bullet');

function Soldier () {
}

Soldier.prototype = {

    around : [ [0,0], [1,0], [1,1], [0,1], [0,-1], [1,-1] ],
    asString : [],

    x : 0,     z : 0,     y : 0,
    vx : 0,    vz : 0,    vy : 0,
    tx : 0,    tz : 0,    ty : 0,
    fz : 0,    fy : 0,    fx : 0,

    wait        : 0,
    updateTick  : 0,
    ordersTick  : 0,

    init : function(player, x, y, z, action) {
      this.id = guid() + (maxPlanes * 2) + 1;
      this.x = x; this.sentX = x;
      this.z = z; this.sentZ = z;
      this.y = 0;
      this.color    = player.color;
      this.speed    = (Math.random() * 5) + 20;
      this.power    = (this.id % 100) / 100; //random();
      this.player = player;
      this.currentAction = this.noAction;
      soldiersNew.push(this);
    },

    chosen : function() {
    },

    noAction : function(dt) {
    },

    lookFight : function(dt) {
      let ss = null;
      for (var i = 0; i < this.around.length; i++) {
        let gr = gridmapGet(this.x + (this.around[i][0] * select_grid), this.z + (this.around[i][1] * select_grid));
        if (gr) ss = gr.filter( e => { return (!(e instanceof Bullet) && e.player !== this.player) });
        if (ss && ss.length > 0) break;
      }

      if (ss && ss.length > 0) {
        let s = rand(ss); //ss[i];
        if (s.player !== this.player && s.currentAction !== s.die) {
          if (s.fix === this.fix && s.fiz === this.fiz) {
            this.enemy = s;
            s.enemy = this;
            this.currentAction = this.fight;
          } else {
            this.tx = s.x;
            this.ty = s.y;
            this.tz = s.z;
            this.currentAction = this.moveTo;

          }
        }
      } else {
        this.currentAction = this.noAction;
      }
    },

    move : function(dt) {

      let dx = this.vx * dt;
      let dz = this.vz * dt;
      let dy = this.vy * dt;

      dx = Math.min(dx, 1);
      dz = Math.min(dz, 1);

      dx = Math.max(dx, -1);
      dz = Math.max(dz, -1);

      let nx = this.x + dx;
      let nz = this.z + dz;
      let ny = this.y + dy;

      let inx = ~~(nx);
      let inz = ~~(nz);
      this.moving = inx != this.fix || inz != this.fiz;
      if (this.moving) {
        let ss = fightmapGet(inx, inz);
        if (ss) {
              let ee = ss.filter( s => {
                return s.player !== this.player;
              });
              if (ee.length > 0) {
                let s = ee[0];
                    this.enemy = s;
                    this.power += 0.1;
                    this.currentAction = this.fight;
                    s.enemy = this;
                    s.currentAction = s.noAction;
                    return;
                }
        }
      }

      this.x = nx;
      this.y = ny;
      this.z = nz;

      mapsDel(this);
      mapsSet(this);

      if (this.vx * (this.tx - this.x) < 0 ||
          this.vz * (this.tz - this.z) < 0) {
          this.x = this.tx;
          this.z = this.tz;
          mapsDel(this);
          mapsSet(this);
          this.currentAction = this.lookFight;
          return;
      }

    },

    moveTo : function() {
      if (updateBufferIndex === updateSoldierSendBuf.length) return;
      let dx = this.tx - this.x,
          dz = this.tz - this.z,
          dy = this.ty - this.y,
          mag = Math.sqrt(dx * dx + dz * dz + dy * dy);

      if (mag === 0 ) {
        this.currentAction = this.lookFight;
        return;
      }

      this.vx = (dx / mag) * this.speed;
      this.vy = (dy / mag) * this.speed;
      this.vz = (dz / mag) * this.speed;
      this.currentAction = this.move;
    },

    sendPlanes : function() {
          planes[this.player.roomid].forEach( plane => {
              plane.currentAction = plane.move;
          });
      // }
      this.currentAction = this.noAction;
    },

    ordersFromClient : function() {
      let order = ordersReceiveQ[this.ordersTick] && ordersReceiveQ[this.ordersTick][this.id];
      if (order) {
        this.tx = order[0];
        this.tz = order[1];
        this.ty = 0;
        if (this.tx === this.x && this.tz === this.z) {
            let now = Date.now();
            if (!this.player.lastShot || (now - this.player.lastShot) > maxLaunchDelay) {
                this.player.lastShot = now;
                this.currentAction = this.shoot;
            }
        } else {
            this.currentAction = this.moveTo;
        }

        delete ordersReceiveQ[this.ordersTick][this.id];
        if (Object.keys(ordersReceiveQ[this.ordersTick]).length === 0) {
          ordersReceiveQ[this.ordersTick] = null;
        }
      }
      this.ordersTick = sOrdersTick;
    },

    checkPlanes : function() {
      if (planesSid && this.id === planesSid) {
          this.currentAction = this.sendPlanes;
          planesSid = null;
      }
    },

    update : function(dt) {
          if (this.ordersTick !== sOrdersTick) this.ordersFromClient();
          this.checkPlanes();
          this.currentAction(dt);

            if (sWorldTick) {
              let bufferFull = updateBufferIndex === updateSoldierSendBuf.length;
              let actionChanged = (this.sentX !== this.x || this.sentZ !== this.z);

              if (!bufferFull && actionChanged) {

                  this.x = Math.max(0, this.x);
                  this.z = Math.max(0, this.z);

                  this.x = Math.min(360, this.x);
                  this.z = Math.min(600, this.z);

                  updateSoldierSendBuf.writeUInt16BE(this.id, updateBufferIndex);
                  updateSoldierSendBuf.writeUInt16BE(this.x,  updateBufferIndex + 2);
                  updateSoldierSendBuf.writeUInt16BE(this.z,  updateBufferIndex + 4);
                  updateBufferIndex += bytes_per_soldier;
                  this.sentX = this.x;
                  this.sentZ = this.z;
              }
            }
    },

    die : function() {
      soldiersDead.push(this);
    },

    shoot : function() {
      let bullet = null;
      for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 6; j++) {
          bullet = new Bullet();
          bullet.init(this.player, this.x + i, 0, this.z + j, "move");
        }
      }
      this.currentAction = this.noAction;
    },

    fight : function() {
      let winner = null;
      let loser = null;

      let result = (this.player.population - this.player.opponent.population);
      let f = -(result / 2000) * 0.2;

      if ( (this.power + f) > this.enemy.power ) {
        winner = this;
        loser = this.enemy;
      } else {
        winner = this.enemy;
        loser = this;
      }

      winner.power -= 0.1;
      winner.enemy = null;
      winner.currentAction = (winner instanceof Bullet) ? winner.move : winner.lookFight;

      loser.enemy = null;
      loser.currentAction = loser.die;
    },

    to_buffer : function() {
      let buf = Buffer.alloc(10);
      buf.writeUInt8(this.player.roomid, 0);
      buf.writeUInt16BE(this.player.population, 1);
      buf.writeUInt16BE(this.id, 3);
      buf.writeUInt16BE(this.x, 5);
      buf.writeUInt16BE(this.z, 7);
      buf.writeUInt8(this.speed, 9);
      return buf;
    }
}

module.exports = Soldier;
