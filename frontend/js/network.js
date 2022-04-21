let connection_alive = false;
let maxl = 0;
let bytes_per_soldier = 10;
let bytes_per_player = 20;
let timeout = 5 * 60 * 1000;

let network = {

  connection : null,
  pid : null,
  socket : null,

  init_ws : function() {
    show_loading(true);
    this.socket = io('https://' + ws_host + ':' + ws_port);
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

    socket.on('gss', function(buffer_compressed) {

      let uint8 = window.pako.inflate(buffer_compressed);
      let buffer = uint8.buffer;

      if (buffer.byteLength > 0) {
          let p1  = parsePlayerFromBuffer(new DataView(buffer, 0, bytes_per_player));
          if (p1 && !players[p1.id]) {
            parseSoldiersFromBuffer(new DataView(buffer, bytes_per_player, (p1.population * bytes_per_soldier)), p1) ;
            add_planes(p1);
            if (p1) players[p1.id] = p1;
          }

          let p2_byte_offset = (p1.population * bytes_per_soldier) + bytes_per_player;
          if (p2_byte_offset === buffer.byteLength) {
            show_loading(false);
            ack_send = true;
            return;
          }

          let p2 = parsePlayerFromBuffer(new DataView(buffer, p2_byte_offset, bytes_per_player));
          parseSoldiersFromBuffer(new DataView(buffer, p2_byte_offset + bytes_per_player, (p2.population * bytes_per_soldier)), p2);
          add_planes(p2);
          if (p2) players[p2.id] = p2;
          ack_send = true;
      }
      show_loading(false);
    });

    socket.on('create_bullets', function(buffer) {
      let i = 0;
      while (i < buffer.byteLength) {
        let bullet_buffer = new DataView(buffer, i + bytes_per_soldier);
        let id = bullet_buffer.getUint16(0);
        if (id === 0) break;
        parseBulletFromBuffer(bullet_buffer);
        i += bytes_per_soldier;
      }

    });

    socket.on('update_soldier', function(buffer_compressed) {
              if (buffer_compressed.byteLength === 9) {
                let data = new DataView(buffer_compressed);
                // console.log("zero_buffer");
                s_updates_from_server[world_tick] = {
                  timestamp : data.getFloat32(0),
                  0 : data.getUint16(4),
                  1 : data.getUint16(6),
                  world_update : data.getUint8(8),
                  updates: null,
                }
              } else {
                let uint8 = window.pako.inflate(buffer_compressed);
                let buffer = uint8.buffer;
                let data = new DataView(buffer);
                let s_updates = new DataView(buffer, 9);

                s_updates_from_server[world_tick] = {
                      timestamp : data.getFloat32(0),
                      0 : data.getUint16(4),
                      1 : data.getUint16(6),
                      world_update : data.getUint8(8),
                      updates: function(buffer) {
                        dict = {};
                        let i = 0;
                        while (i < buffer.byteLength) {
                          dict[buffer.getUint16(i)] = [buffer.getUint16(i+2), buffer.getUint16(i+4)];
                          i += 6;
                        }
                        return dict;
                      }(s_updates)
                 };
              }
              global_time = s_updates_from_server[world_tick].timestamp - 0.700;
              world_tick++;
    });

    socket.on('update_dead_soldiers', function(buffer_compressed) {
         let data = window.pako.inflate(buffer_compressed);
         let d_updates = new DataView(data.buffer);
           let i = 0;
           while (i < d_updates.byteLength) {
             s_dead_updates_from_server[i] = d_updates.getUint8(i++);
           }
    });

    socket.on('update_time', function(time) {
      to_go = time.time;
    });

    socket.on('memo', function(memo) {
      show_info(memo.msg);
    });

    socket.on('disconnect', function() {
    });

    socket.on("chat", function(msg) {
      add_chat_message(msg);
    });
  },

  init : function() {
    let network = this;
    var url = new URL(window.location.href);
    this.pid = url.searchParams.get("id");
    this.nonick = url.searchParams.get("nick");
    this.nocountry = url.searchParams.get("country");
    var mode = ((this.pid || this.nonick) ? 'play' : 'watch');
    fetch('//' + location.host + location.pathname + mode)
      .then(function(response) {
        return (response.ok ? response.json() : null);
     })
      .then(function(pixel_server) {
        show_loading(false);
        if (pixel_server) {
          ws_host = pixel_server.ws_host;
          ws_port = pixel_server.ws_port;
          return true;
        } else {
          show_info(mode === "play" ? 'Sorry! All rooms currently busy<br>Please try again later...' : 'Sorry!<br>Currently no games available to watch<br>Please reload the page...');
          return false;
        }
     })
      .then(function (status) {
        if (status) network.init_ws();
    });
  },

  update : function(dt) {
      if (send_planes_sid) {
        this.socket.emit("planes", send_planes_sid);
        send_planes_sid = null;
      }

      if (orders_to_server.length > 0) {
        let u16 = new Uint16Array(orders_to_server.slice(0, 3600));
        this.socket.emit("order", u16.buffer);
        orders_to_server.length = 0;
      }

      if (send_chat_msg) {
        this.socket.emit("chat", send_chat_msg);
        send_chat_msg = null;
      };

      if (ack_send && me) {
        this.socket.emit("ack", me);
        ack_send = false;
      }
    }

}
