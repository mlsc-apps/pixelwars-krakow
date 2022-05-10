const https = require('https');
const fs    = require('fs');
const socket_io = require('socket.io');
const zlib      = require('zlib');

global.maxPlayers = 2;
global.updateSoldierSendBuf = null;
global.zeroBuffer = null;
global.updateBufferIndex = null;
global.soldiersDeadBuffer = null;
global.bulletsNewBuf = null;
global.bulletsNewBufIndex = 0;

global.maxPlayersUpdate = process.env.maxPlayersUpdate || 6000; //25000/6 bytes per player
global.bytesPerSoldier = 6;
global.bytesPerTimestamp  = 4;
global.bytesPerPopulation = 4;
global.bytesPerWorldFlag = 1;
global.bytesToSpare = 2;
global.worldUpdate = false;
global.additionalBytes = 0;

global.ordersReceiveQ = [];
global.ackReceived = null;

global.maxSoldiers = 32000;
global.maxBullets = 1000;

global.planesSid = null;


global.network = {

    wait : 0,
    wait2 : 0,
    maxBytesSent : 36000,
    bytesSent : 0,
    dBytesSent : 0,

    init : function() {

      const options = {
        key:  fs.readFileSync('./engine/' + process.env.SSL + '/key.pem'),
        cert: fs.readFileSync('./engine/' + process.env.SSL + '/cert.pem')
      };

      this.port = process.env.WS_PORT || 1337;

      const server = https.createServer(options, function(request, response) {});
      server.listen(this.port);

      this.io = socket_io(server, {
        pingInterval: 10000,
        pingTimeout: 50000,
      });
      console.log(new Date() + `: socket io server started on port ${this.port}`);

      this.io.on('connection', function(socket) {
          console.log(new Date() + `: Guest connected (${socket.id}) from ${socket.handshake.address} Total: ${Object.values(network.io.sockets.connected).length} `);

          socket.on('join', function(premote) {
            let l = Object.keys(players).length;
            if (playersDictLocked) {
              console.log(new Date() + `: Guest (${socket.id}) wanted to join but game already locked`)
            }
            if (l < maxPlayers && !playersDictLocked) {
                  if (l === 1 && Object.values(players)[0].id === premote.id) {
                    socket.disconnect(true);
                    return;
                  }
                  if (l === 1) playersDictLocked = true;
                  addPlayer(premote, function(np) {
                        np.connection = socket;
                        socket.player = np;
                        console.log(new Date() + `: Player ${np.nick} (${np.id}), ${np.country},  joined ( ${socket.id} )`);
                        socket.emit('pid', np.id);
                    });
                }
          });

          socket.on('disconnect', function() {
              console.log(new Date() + `: Player ${(socket.player ? socket.player.nick : 'guest')} disconnected ${socket.id} Total: ${Object.values(network.io.sockets.connected).length} `);
          });

          socket.on('chat', function(msg) {
             if (players[msg.to] && players[msg.to].connection) players[msg.to].connection.emit('chat', msg);
          });

          socket.on('getgss', function() {
            zlib.deflate(getGameState(), function(err, buffer) {
              socket.emit('gss', buffer);
            });
          });

          socket.on('ack', function(pid) {
            ackReceived = pid;
          });

          socket.on('planes', function(sid) {
            planesSid = sid;
          });

          socket.on('order', function(buffer) {
            let buf = Buffer.from(buffer);
            ordersReceiveQ[sOrdersTick] = function(buffer) {
              dict = {};
              let i = 0;
              while (i < buffer.byteLength) {
                dict[buffer.readInt16LE(i)] = [buffer.readInt16LE(i+2), buffer.readInt16LE(i+4)];
                i += 6;
              }
              return dict;
            }(buf);
            sOrdersTick++;
          });

      });

      additionalBytes      = bytesPerTimestamp + bytesPerPopulation + bytesPerWorldFlag;
      updateSoldierSendBuf = Buffer.alloc((maxPlayersUpdate * bytesPerSoldier) + additionalBytes);
      soldiersDeadBuffer = Buffer.alloc(maxSoldiers + maxBullets); //+1000 bullets
      bulletsNewBuf      = Buffer.alloc(maxBullets * 10); // 1000 bullets
      updateBufferIndex  = additionalBytes;
  },

    processQueue : function(q, type) {
      if (Object.keys(q).length > 0) {
        this.io.emit(type, q);
      }
    },

    processUpdateQueue : function() {
      let pp = Object.values(players);
      if (!this.lastGlobalTime) this.lastGlobalTime = globalTime;
      let insec = globalTime - this.lastGlobalTime < 1;
      if (insec) {
        this.bytesLeft = this.maxBytesSent - this.bytesSent;
        this.allowToSend = this.bytesLeft > 0;
      }
      if (!(insec && this.allowToSend)) {
        this.dBytesSent = 0;
        this.bytesSent = 0;
        this.lastGlobalTime = globalTime;
        this.bytesLeft = this.maxBytesSent;
      }

      if (updateBufferIndex < updateSoldierSendBuf.length) updateSoldierSendBuf.fill(0, updateBufferIndex);
      updateSoldierSendBuf.writeFloatBE(globalTime, 0);
      updateSoldierSendBuf.writeUInt16BE(pp[0].population, 4);
      updateSoldierSendBuf.writeUInt16BE(pp[1].population, 6);
      updateSoldierSendBuf.writeUInt8(worldUpdate, 8);

      if (this.allowToSend) {
        zlib.deflate(updateSoldierSendBuf.buffer, function(err, buffer) {
          network.bytesSent += buffer.byteLength;
          network.io.emit("update_soldier", buffer);
        });
      } else {
          network.io.emit("update_soldier", Buffer.from(updateSoldierSendBuf.buffer, 0, additionalBytes));
      }
      updateBufferIndex = additionalBytes;
    },

    processDeadQueue : function() {
      if (this.allowToSend) {
        zlib.deflate(soldiersDeadBuffer.buffer, function(err, buffer) {
          network.dBytesSent += buffer.byteLength;
          network.io.emit("update_dead_soldiers", buffer);
        });
      }
    },

    processBulletsQueue : function() {
        if (this.allowToSend && bulletsNewBufIndex > 0) {
            if (bulletsNewBufIndex < bulletsNewBuf.length) bulletsNewBuf.fill(0, bulletsNewBufIndex);
            network.io.emit("create_bullets", bulletsNewBuf);
            network.dBytesSent += bulletsNewBuf.byteLength;
        }
        bulletsNewBufIndex = 0;
    },

    update : function() {
      if (sWorldTick)  {
        this.processUpdateQueue();
        this.processDeadQueue();
        this.processBulletsQueue();
      }
      this.processQueue(updatePlayerSendQ, "update_player");
      this.processQueue(updateTimeSendQ,   "update_time");

      updatePlayerSendQ = {};
      updateTimeSendQ   = {};

      if (sendGameState) {
        zlib.deflate(getGameState(), function(err, buffer) {
          network.io.emit('gss', buffer);
        });
        sendGameState = false;
      }
    },

    reset : function() {
      updatePlayerSendQ = {};
      updateTimeSendQ   = {};
      ordersReceiveQ    = [];
      soldiersDeadBuffer.fill(0);
      updateSoldierSendBuf.fill(0);
      bulletsNewBuf.fill(0);
      updateBufferIndex = additionalBytes;

      Object.values(this.io.sockets.connected).forEach( s => {
         s.disconnect(true);
      });
    }

}
