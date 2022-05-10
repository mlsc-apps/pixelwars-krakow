let connection_alive = false;
let maxl = 0;
let bytesPerSoldier = 10;
let bytesPerPlayer = 20;
let timeout = 5 * 60 * 1000;

let network = {

  connection : null,
  pid : null,
  socket : null,

  initWs : function() {
    showLoading(true);
    this.socket = io('https://' + wsHost + ':' + wsPort);
    let socket = this.socket;


    if (this.pid) {
      nonregi = false;
      socket.emit('join', { id : this.pid });
    }
    if (this.nonick) {
      nonregi = true;
      socket.emit('join', { nick : this.nonick, country : this.nocountry });
    }

    if (!(this.pid || this.nonick)) {
      socket.emit('getgss');
    }

    socket.on('pid', function(pid) {
      me = parseInt(pid);
    });

    socket.on('gss', function(bufferCompressed) {

      let uint8 = window.pako.inflate(bufferCompressed);
      let buffer = uint8.buffer;

      if (buffer.byteLength > 0) {
          let p1  = parsePlayerFromBuffer(new DataView(buffer, 0, bytesPerPlayer));
          if (p1 && !players[p1.id]) {
            parseSoldiersFromBuffer(new DataView(buffer, bytesPerPlayer, (p1.population * bytesPerSoldier)), p1) ;
            addPlanes(p1);
            if (p1) players[p1.id] = p1;
          }

          let p2ByteOffset = (p1.population * bytesPerSoldier) + bytesPerPlayer;
          if (p2ByteOffset === buffer.byteLength) {
            showLoading(false);
            ackSend = true;
            return;
          }

          let p2 = parsePlayerFromBuffer(new DataView(buffer, p2ByteOffset, bytesPerPlayer));
          parseSoldiersFromBuffer(new DataView(buffer, p2ByteOffset + bytesPerPlayer, (p2.population * bytesPerSoldier)), p2);
          addPlanes(p2);
          if (p2) players[p2.id] = p2;
          ackSend = true;
      }
      showLoading(false);
    });

    socket.on('create_bullets', function(buffer) {
      let i = 0;
      while (i < buffer.byteLength) {
        let bulletBuffer = new DataView(buffer, i + bytesPerSoldier);
        let id = bulletBuffer.getUint16(0);
        if (id === 0) break;
        parseBulletFromBuffer(bulletBuffer);
        i += bytesPerSoldier;
      }

    });

    socket.on('update_soldier', function(bufferCompressed) {
              if (bufferCompressed.byteLength === 9) {
                let data = new DataView(bufferCompressed);
                // console.log("zero_buffer");
                sUpdatesFromServer[worldTick] = {
                  timestamp : data.getFloat32(0),
                  0 : data.getUint16(4),
                  1 : data.getUint16(6),
                  worldUpdate : data.getUint8(8),
                  updates: null,
                }
              } else {
                let uint8 = window.pako.inflate(bufferCompressed);
                let buffer = uint8.buffer;
                let data = new DataView(buffer);
                let sUpdates = new DataView(buffer, 9);

                sUpdatesFromServer[worldTick] = {
                      timestamp : data.getFloat32(0),
                      0 : data.getUint16(4),
                      1 : data.getUint16(6),
                      worldUpdate : data.getUint8(8),
                      updates: function(buffer) {
                        dict = {};
                        let i = 0;
                        while (i < buffer.byteLength) {
                          dict[buffer.getUint16(i)] = [buffer.getUint16(i+2), buffer.getUint16(i+4)];
                          i += 6;
                        }
                        return dict;
                      }(sUpdates)
                 };
              }
              globalTime = sUpdatesFromServer[worldTick].timestamp - 0.700;
              worldTick++;
    });

    socket.on('update_dead_soldiers', function(bufferCompressed) {
         let data = window.pako.inflate(bufferCompressed);
         let dUpdates = new DataView(data.buffer);
           let i = 0;
           while (i < dUpdates.byteLength) {
             sDeadUpdatesFromServer[i] = dUpdates.getUint8(i++);
           }
    });

    socket.on('update_time', function(time) {
      toGo = time.time;
    });

    socket.on('memo', function(memo) {
      showInfo(memo.msg);
    });

    socket.on('disconnect', function() {
    });

    socket.on("chat", function(msg) {
      addChatMessage(msg);
    });
  },

  init : function() {
    let network    = this;
    var url        = new URL(window.location.href);
    this.pid       = url.searchParams.get("id");
    this.nonick    = url.searchParams.get("nick");
    this.nocountry = url.searchParams.get("country");
    var mode = ((this.pid || this.nonick) ? 'play' : 'watch');
    fetch('//' + location.host + location.pathname + mode)
      .then(function(response) {
        return (response.ok ? response.json() : null);
     })
      .then(function(pixelServer) {
        showLoading(false);
        if (pixelServer) {
          wsHost = pixelServer.wsHost;
          wsPort = pixelServer.wsPort;
          return true;
        } else {
          showInfo(mode === "play" ? 'Sorry! All rooms currently busy<br>Please try again later...' : 'Sorry!<br>Currently no games available to watch<br>Please reload the page...');
          return false;
        }
     })
      .then(function (status) {
        if (status) network.initWs();
    });
  },

  update : function(dt) {
      if (sendPlanesSid) {
        this.socket.emit("planes", sendPlanesSid);
        sendPlanesSid = null;
      }

      if (ordersToServer.length > 0) {
        let u16 = new Uint16Array(ordersToServer.slice(0, 3600));
        this.socket.emit("order", u16.buffer);
        ordersToServer.length = 0;
      }

      if (sendChatMsg) {
        this.socket.emit("chat", sendChatMsg);
        sendChatMsg = null;
      };

      if (ackSend && me) {
        this.socket.emit("ack", me);
        ackSend = false;
      }
    }

}
