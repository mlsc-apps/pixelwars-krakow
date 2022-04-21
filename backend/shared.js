const Soldier = require('./soldier');
const Player  = require('./player');
const Plane   = require('./plane')
const crypto   = require('crypto');
const snappyjs = require('snappyjs')
const zlib = require('zlib');
const algorithm = 'aes-256-cbc';

global.ws_port = null;

global.players_new   = [];
global.players_dead  = [];
global.players_remove = [];
global.game_state = {};
global.players   = {};
global.vertexgrid = {};
global.messages  = [];
global.messages_1    = [];
global.soldiers_dead = [];
global.soldiers_new  = [];
global.soldiers_load = [];
global.bullets_new  = [];
global.bullets_hit  = [];
global.planes_new = [];
global.pc_index = 0;
global.mouse    = [];
global.around   = [];

global.segments_x = 0;
global.segments_y = 0;
global.gridsize_X = 150;
global.gridsize_Y = 150;
global.scale_y = 25;
global.size_x = 0;
global.size_y = 0;

global.loop = null;
global.terrain_initialized = false;

global.modes_receiveq = {};
global.create_soldier_sendq = [];
global.update_player_sendq = {};
global.create_player_sendq = [];
global.chat_player_sendq = [];
global.create_bullet_sendq = [];
global.update_time_sendq = [];
global.soldiers_dead_sendq = [];

global.dbconn = null;

global.max_soldiers_x = 360;
global.max_soldiers_z = 240;
global.select_grid = 40;
global.grid_x = max_soldiers_x / select_grid;
global.grid_z = (max_soldiers_z * 3) / select_grid;
global.fightmap = {};
global.gridmap = {};

global.game_started_at = null;
global.to_go = null;
global.loop_running = true;
global.reset_loop = false;
global.game_max_time = 300;
global.gridweights = [];
global.seed = 1;

global.global_time = 0;
global.s_world_tick = false;
global.s_dead_tick = false;
global.s_orders_tick = 0;

global.id_index = 0;
global.bullet_index = 0;
global.max_launch_delay = 5000;
// global.plane_index = 1;
global.max_planes = 5;

global.players_dict_locked = false;

function get_soldiers() {
  let ps = {};
  for (var i = 0; i < gameloop.gos.length; i++) {
    let s = gameloop.gos[i];
    if (s instanceof Soldier) {
      let pid = s.player.id;
      if (!ps[pid]) ps[pid] = Buffer.alloc(0);
      ps[pid] = Buffer.concat([ps[pid], s.to_buffer()]);
    }
  }
  return ps;
}

global.get_game_state = function() {
        let gss_buffer = Buffer.alloc(0);
        let ps = get_soldiers();
        for (var i = 0; i < Object.values(players).length; i++) {
          let p = Object.values(players)[i];
          let pbuf = p.to_buffer();
          let sbuf = Buffer.from(ps[p.id]);
          gss_buffer = Buffer.concat([gss_buffer, pbuf, sbuf]);
        }
        return gss_buffer;
}

global.planes = {};

global.add_planes = function(p) {
  planes[p.roomid] = [];
  for (var i = 0; i < max_planes; i++) {
    let plane = new Plane();
    plane.init((p.roomid * max_planes) + i + 1, p, (i * 2 * select_grid) + (select_grid / 2), 0, p.roomid * 600);
    planes[p.roomid].push(plane);
  }
}

global.add_soldiers = function(p, callback) {
  let bx = 0; //size_x/2 + (1500 * p.roomid);
  let bz = max_soldiers_z * 1.5 * p.roomid; //max_soldiers_z * 2 * p.roomid; //size_y/2;
  let player_population = 0;
  for (i=1; i < max_soldiers_x; i++) {
    for (j=1; j < max_soldiers_z; j++) {
        if (Math.random() < 0.820) continue;
        let s = new Soldier();
        s.init(p, bx + i, 0, bz + j, "no_action");
        player_population++;
    }
  }
  callback(player_population);
}

global.add_player = function(p, callback_when_done) {
    let pl = new Player();
    pl.init(p, callback_when_done);
    return pl;
}

global.load_soldiers = function(p) {
  p.soldiers.forEach( (s) => {
    let sol = new Soldier();
    sol.load(p, s);
  });
  p.soldiers = null;
}

global.load_player = function(p) {
    let pl = new Player();
    pl.load(p);
    return pl;
}

global.get_y = function(x, z) {
  let px = ~~(x / gridsize_X);
  let pz = ~~(z / gridsize_Y);

  let rx = (x - (px * gridsize_X)) / gridsize_X;
  let rz = (z - (pz * gridsize_Y)) / gridsize_Y;

  if (!vertexgrid[px]) return null;
  let vs = vertexgrid[px][pz];
  if (!vs) return null;
  if (!vs.a || !vs.b || !vs.c || !vs.d) return null;

  let triupper = (rx <= (1 - rz));

  if (triupper) {
    v1 = { "x" : 0,      "y" : vs.a.y, "z" : 0 };
    v2 = { "x" : 1,      "y" : vs.b.y, "z" : 0 };
    v3 = { "x" : 0,      "y" : vs.c.y, "z" : 1 };
  } else {
    v1 = { "x" : 0,      "y" : vs.c.y, "z" : 1 };
    v2 = { "x" : 1,      "y" : vs.b.y, "z" : 0 };
    v3 = { "x" : 1,      "y" : vs.d.y, "z" : 1 };
  }

  let det = (v2.z - v3.z) * (v1.x - v3.x) + (v3.x - v2.x) * (v1.z - v3.z);
  let wv1 = ((v2.z - v3.z)*(rx - v3.x) + (v3.x - v2.x)*(rz - v3.z)) / det;
  let wv2 = ((v3.z - v1.z)*(rx - v3.x) + (v1.x - v3.x)*(rz - v3.z)) / det;
  let wv3 = 1 - (wv1 + wv2);

  let yy = (v1.y * wv1) + (v2.y * wv2) + (v3.y * wv3);

  return yy;
}

global.create_vertexgrid = function(x, z) {
  if (!vertexgrid[x]) vertexgrid[x] = {};
  if (!vertexgrid[x][z]) vertexgrid[x][z] = {};
  return vertexgrid[x][z];
}

global.pop = function(array, e) {
  var index = array.indexOf(e);
  if (index > -1) {
    array.splice(index, 1);
  }
}

global.update_field = function(f, x, z) {
  let w = (f.room0 - f.room1) / f.ss.length;
  f.w = Math.round(w * 10) / 10;
}

global.maps_set = function(s) {
  let x = ~~(s.x / select_grid);
  let z = ~~(s.z / select_grid);
  if (!gridmap[x]) gridmap[x] = {};
  if (!gridmap[x][z]) {
    gridmap[x][z] = {};
    gridmap[x][z].room0 = 0;
    gridmap[x][z].room1 = 0;
    gridmap[x][z].ss = [];
    gridmap[x][z].x = x;
    gridmap[x][z].z = z;
    gridweights.push(gridmap[x][z]);
  }
  gridmap[x][z].ss.push(s);
  gridmap[x][z]['room'+s.player.roomid]++;
  update_field(gridmap[x][z], x, z);
  s.fx = x;
  s.fz = z;

  s.fix = ~~(s.x);
  s.fiz = ~~(s.z);

  if (!fightmap[s.fix]) fightmap[s.fix] = {};
  if (!fightmap[s.fix][s.fiz]) fightmap[s.fix][s.fiz] = [];
  fightmap[s.fix][s.fiz].push(s); // = s; /// = s;
}

global.gridmap_get = function(x, z) {
  x = ~~(x / select_grid);
  z = ~~(z / select_grid);
  return gridmap[x] && gridmap[x][z] && gridmap[x][z].ss;
}

global.fightmap_get = function(x, z) {
  return fightmap[x] && fightmap[x][z];
}

global.maps_del = function(s) {
     let x = s.fx;
     let z = s.fz;
     pop(gridmap[x][z].ss, s);
     gridmap[x][z]['room'+s.player.roomid]--;
     update_field(gridmap[x][z], x, z);
     pop(fightmap[s.fix][s.fiz], s); // = null;
  }

global.position_lerp = function(min, max) {
   return ((max - min) / 2) + min;
}

global.rand = function(a) {
  return a[Math.floor(Math.random() * a.length)];
}

global.rint = function(a) {
  return Math.floor(Math.random() * a);
}

global.guid = function() {
  return id_index++;
}

global.random = function(){
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

global.encrypt = function(text){
  var cipher = crypto.createCipher(algorithm, '2w3e2w3e4r2wdd')
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}

global.decrypt = function(text){
  var decipher = crypto.createDecipher(algorithm, '2w3e2w3e4r2wdd')
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}
