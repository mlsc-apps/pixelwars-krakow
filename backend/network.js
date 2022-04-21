const http  = require('http');
const https = require('https');
const fs = require('fs');
const os = require('os');
const socket_io = require('socket.io');
const zlib = require('zlib');

global.max_players = 2;
global.update_soldier_send_buf = null;
global.zero_buffer = null;
global.update_buffer_index = null;
global.soldiers_dead_buffer = null;
global.bullets_new_buf = null;
global.bullets_new_buf_index = 0;

global.max_players_update = process.env.MAX_PLAYERS_UPDATE || 6000; //25000/6 bytes per player
global.bytes_per_soldier = 6;
global.bytes_per_timestamp  = 4;
global.bytes_per_populations = 4;
global.bytes_per_world_flag = 1;
global.bytes_to_spare = 2;
global.world_update = false;
global.additional_bytes = 0;

global.orders_receiveq = [];
global.ack_received = null;

global.max_soldiers = 32000;
global.max_bullets = 1000;

global.planes_sid = null;


global.network = {

    wait : 0,
    wait2 : 0,
    max_bytes_sent : 36000,
    bytes_sent : 0,
    d_bytes_sent : 0,

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
            if (players_dict_locked) {
              console.log(new Date() + `: Guest (${socket.id}) wanted to join but game already locked`)
            }
            if (l < max_players && !players_dict_locked) {
                  if (l === 1 && Object.values(players)[0].id === premote.id) {
                    socket.disconnect(true);
                    return;
                  }
                  if (l === 1) players_dict_locked = true;
                  add_player(premote, function(np) {
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
            zlib.deflate(get_game_state(), function(err, buffer) {
              socket.emit('gss', buffer);
            });
          });

          socket.on('ack', function(pid) {
            ack_received = pid;
          });

          socket.on('planes', function(sid) {
            planes_sid = sid;
          });

          socket.on('order', function(buffer) {
            let buf = Buffer.from(buffer);
            orders_receiveq[s_orders_tick] = function(buffer) {
              dict = {};
              let i = 0;
              while (i < buffer.byteLength) {
                dict[buffer.readInt16LE(i)] = [buffer.readInt16LE(i+2), buffer.readInt16LE(i+4)];
                i += 6;
              }
              return dict;
            }(buf);
            s_orders_tick++;
          });

      });

      additional_bytes = bytes_per_timestamp + bytes_per_populations + bytes_per_world_flag;
      update_soldier_send_buf = Buffer.alloc((max_players_update * bytes_per_soldier) + additional_bytes);
      soldiers_dead_buffer = Buffer.alloc(max_soldiers + max_bullets); //+1000 bullets
      bullets_new_buf = Buffer.alloc(max_bullets * 10); // 1000 bullets
      update_buffer_index = additional_bytes;
  },

    process_queue : function(q, type) {
      if (Object.keys(q).length > 0) {
        this.io.emit(type, q);
      }
    },

    process_update_queue : function() {
      let pp = Object.values(players);
      if (!this.last_global_time) this.last_global_time = global_time;
      let insec = global_time - this.last_global_time < 1;
      if (insec) {
        this.bytes_left = this.max_bytes_sent - this.bytes_sent;
        this.allow_to_send = this.bytes_left > 0;
      }
      if (!(insec && this.allow_to_send)) {
        this.d_bytes_sent = 0;
        this.bytes_sent = 0;
        this.last_global_time = global_time;
        this.bytes_left = this.max_bytes_sent;
      }

      if (update_buffer_index < update_soldier_send_buf.length) update_soldier_send_buf.fill(0, update_buffer_index);
      update_soldier_send_buf.writeFloatBE(global_time, 0);
      update_soldier_send_buf.writeUInt16BE(pp[0].population, 4);
      update_soldier_send_buf.writeUInt16BE(pp[1].population, 6);
      update_soldier_send_buf.writeUInt8(world_update, 8);

      if (this.allow_to_send) {
        zlib.deflate(update_soldier_send_buf.buffer, function(err, buffer) {
          network.bytes_sent += buffer.byteLength;
          // console.log ( buffer );
          network.io.emit("update_soldier", buffer);
        });
      } else {
          network.io.emit("update_soldier", Buffer.from(update_soldier_send_buf.buffer, 0, additional_bytes));
      }
      update_buffer_index = additional_bytes;
    },

    process_dead_queue : function() {
      if (this.allow_to_send) {
        zlib.deflate(soldiers_dead_buffer.buffer, function(err, buffer) {
          network.d_bytes_sent += buffer.byteLength;
          network.io.emit("update_dead_soldiers", buffer);
        });
      }
    },

    process_bullets_queue : function() {
        if (this.allow_to_send && bullets_new_buf_index > 0) {
            if (bullets_new_buf_index < bullets_new_buf.length) bullets_new_buf.fill(0, bullets_new_buf_index);
            network.io.emit("create_bullets", bullets_new_buf);
            network.d_bytes_sent += bullets_new_buf.byteLength;
        }
        bullets_new_buf_index = 0;
    },

    update : function() {
      if (s_world_tick)  {
        this.process_update_queue();
        this.process_dead_queue();
        this.process_bullets_queue();
      }
      this.process_queue(update_player_sendq, "update_player");
      this.process_queue(update_time_sendq,   "update_time");

      update_player_sendq = {};
      update_time_sendq = {};

      if (send_game_state) {
        zlib.deflate(get_game_state(), function(err, buffer) {
          network.io.emit('gss', buffer);
        });
        send_game_state = false;
      }
    },

    reset : function() {
      update_player_sendq = {};
      update_time_sendq = {};
      orders_receiveq = [];
      soldiers_dead_buffer.fill(0);
      update_soldier_send_buf.fill(0);
      bullets_new_buf.fill(0);
      update_buffer_index = additional_bytes;

      Object.values(this.io.sockets.connected).forEach( s => {
         s.disconnect(true);
      });
    }

}
