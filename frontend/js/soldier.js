let Soldier = {

    init : function(player, id, x, z, speed) {
      this.id = id;
      this.x = x;
      this.z = z;
      this.y = 0;
      this.ax = 0;
      this.az = 0;
      this.speed = speed;
      this.color = new THREE.Color(player.color);
      this.player = player;
      this.index  = 0;
      this.function_map = {
        "die"             : this.die,
        "move"            : this.move,
        "moveTo"         : this.moveTo
      };
      this.currentAction = this.noAction;
      soldiersNew.push(this);

      this.wait = 0;
      this.clientTick = 0;
      this.lastDeadTick = 0;
      this.dieDelay = Math.random() * 0.5;
    },

    blinkOut : function() {
      this.color.multiplyScalar(0.8);
      if (this.color.toArray()[(this.player.roomid * -2.0) + 2.0] < 0.4) {
        this.currentAction = this.blinkIn;
      }
    },

    blinkIn : function(dt) {
      this.color.multiplyScalar(1.2);
      if (this.color.toArray()[(this.player.roomid * -2.0) + 2.0] > 1) {
        this.currentAction = this.blinkOut;
      }
    },

    noAction : function(dt) {
    },

    move : function(dt) {
      let dx = this.vx * dt;
      let dz = this.vz * dt;
      // let dy = this.vy * dt;

      dx = Math.min(dx, 1);
      dz = Math.min(dz, 1);

      dx = Math.max(dx, -1);
      dz = Math.max(dz, -1);

      let nx = this.x + dx + (this.ax * dt);
      let nz = this.z + dz + (this.az * dt);
      // let ny = this.y + dy;

      this.x = nx;
      // this.y = ny;
      this.z = nz;

      mapsDel(this);
      mapsSet(this);

      if (this.vx * (this.tx - this.x) < 0 ||
          this.vz * (this.tz - this.z) < 0 &&
          this.localMove) {
          this.localMove = null;
      }

    },

    moveTo : function() {
      let dx = this.tx - this.x,
          dz = this.tz - this.z,
          dy = 0; //this.ty - this.y,
          mag = Math.sqrt(dx * dx + dz * dz + dy * dy);

      if (mag === 0 ) {
        this.currentAction = this.noAction;
        return;
      }

      this.vx = (dx / mag) * this.speed / (1 + (this.player.latency || 0));
      this.vy = 0; //(dy / mag) * this.speed / (1 + (this.player.latency || 0));
      this.vz = (dz / mag) * this.speed / (1 + (this.player.latency || 0));

      this.localMove = globalTime;
      this.currentAction = this.move;
    },

    worldTicksUpdate : function() {
            let currentSnapshot = sUpdatesFromServer[clientTick];
            let nextSnapshot    = sUpdatesFromServer[clientTick + 1];

            if (!currentSnapshot || !nextSnapshot) {
              this.currentAction = this.noAction;
              return;
            }

            if (!nextSnapshot.updates) {
              return;
            }

            this.isNext = nextSnapshot.updates[this.id];

            if (!this.isNext) {
                if (!this.chosen && !this.localMove) {
                  if (this.lastRemoteX && this.lastRemoteZ) {
                    this.x = this.lastRemoteX;
                    this.z = this.lastRemoteZ;
                    mapsDel(this);
                    mapsSet(this);
                    this.lastRemoteX = null;
                    this.lastRemoteZ = null;
                  }
                  this.currentAction = this.noAction;
                }
              }

            if (this.isNext) {
                  let remoteX = nextSnapshot.updates[this.id][0];
                  let remoteZ = nextSnapshot.updates[this.id][1];
                  if (this.localMove) {
                    if (currentSnapshot.timestamp - this.localMove > 0.350) {
                      this.ax = (remoteX - this.x);
                      this.az = (remoteZ - this.z);
                      if ((this.vx * this.ax) >= 0 && (this.vz * this.az) >= 0) {
                          this.ax = 0;
                          this.az = 0;
                          this.localMove = null;
                      }
                    }
                  } else {
                    if (Math.abs(remoteX - this.x) < 0.1) this.x = remoteX;
                    if (Math.abs(remoteZ - this.z) < 0.1) this.z = remoteZ;
                    this.vx = (remoteX - this.x) * (1 / (nextSnapshot.timestamp - currentSnapshot.timestamp));
                    this.vz = (remoteZ - this.z) * (1 / (nextSnapshot.timestamp - currentSnapshot.timestamp));
                    this.currentAction = (this.vx === 0 && this.vz === 0) ? this.chosen ? this.currentAction : this.noAction : this.move;
                  }
                  this.lastRemoteX = remoteX;
                  this.lastRemoteZ = remoteZ;
                  this.lastUpdateTimestamp = nextSnapshot.timestamp;
              }
            this.clientTick = clientTick;
      },

      worldDeadUpdate : function() {
        if (sDeadUpdatesFromServer[this.id]) {
            this.currentAction = this.player.population === 1 ? this.die : this.dieDelayed;
        }
      },

      update : function(dt) {
        this.chosen = (this.currentAction === this.blink_in || this.currentAction === this.blinkOut);
        if (this.clientTick !== clientTick) {
          this.worldTicksUpdate();
          this.worldDeadUpdate();
        }
        this.currentAction(dt);
        buffersSet(this);

      },

      die : function() {
        this.color.set(0xffffff);
        if (Math.random() > 0.9) audioPlay.push('die');
        soldiersDead.push(this);
      },

      dieDelayed : function(dt) {
        if ((this.wait += dt) > this.dieDelay) {
          this.wait = 0;
          this.currentAction = this.die;
        }
      }
}
