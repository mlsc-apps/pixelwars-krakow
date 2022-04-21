let ws_port   = 1337;
let http_port = 3000;
let ws_host = null;

let me = null;
let new_players = [];
let check_if_player = [];
let standing   = [];
let players = {};
let soldiers  = {};
let fightmap = {};

let vertexgrid = {};
let vertex_index = [];
let soldiers_dead = [];
let soldiers_new  = [];
let pc_index = 0;

let mouse    = {};
let orders   = [];
let around   = [];
let chosen   = [];

let segments_x = 0;
let segments_y = 0;
let gridsize_X = 1.5;
let gridsize_Y = 1.5;
let scale_y = 0.25;

// let musicon = true;

let orders_to_server = [];
let s_updates_from_server = {};
let s_updates_from_server_ids = [];
let s_updates_from_server_q = [];
let p_updates_from_server = {};
let s_dead_updates_from_server = {};
let ack_send = false;

let send_chat_msg = null;
let chats = {};
let openchat_pid = null;
let chat_pid_opened = null;

let scale = 5;

let loop = null;
let reset_controls = false;
let sent_order = null;
let select_grid = 40;

let mindex = 0;
let controls = null;
let camera = null;

let colors = [new THREE.Color(0x0000ff), new THREE.Color(0xff0000)];
let white = new THREE.Color(0xffffff);

let world_tick = 0;
let world_dead_tick = 0;
let client_tick = 0;
let global_time = 0;
let max_players_update = 1000;

let max_launch_delay = 3000;

let to_go = null;

let max_planes = 5;
let send_planes_sid = null;

function parsePlayerFromBuffer(data) {
    let p = {};
    p.id  = data.getUint32(0);
    p.population = parseInt(data.getUint16(4));
    p.nick = String.fromCharCode.apply(null, new Uint8Array(data.buffer).slice(6 + data.byteOffset, 16 + data.byteOffset));
    p.country = String.fromCharCode.apply(null, new Uint8Array(data.buffer).slice(16 + data.byteOffset, 18 + data.byteOffset));
    p.robot = data.getUint8(18);
    p.roomid = data.getUint8(19);
    p.color = colors[p.roomid];
    p.new_mail = false;
    p.local_population = 0;


    // console.log(p);
    return p;
}

function parseSoldierFromBuffer(data, player) {
  let s = Object.create(Soldier);
  let p = player;
  s.init(p, data.getUint16(3), data.getUint16(5), data.getUint16(7), data.getUint8(9));
}

function parseBulletFromBuffer(data) {
  let s = Object.create(Bullet);
  let pid = data.getUint16(0);
  let p = players[pid];
  if (p) {
    s.init(p, data.getUint16(3), data.getUint16(5), data.getUint16(7), data.getUint8(9));
  } else {
    s = null;
  }
}

function parseSoldiersFromBuffer(data, player) {
  for (var i = 0; i < data.byteLength; i+=bytes_per_soldier) {
      parseSoldierFromBuffer(new DataView(data.buffer, data.byteOffset + i, bytes_per_soldier), player);
    }
}

function add_planes(p) {
  for (var i = 0; i < max_planes; i++) {
    let plane = Object.create(Plane);
    plane.init((p.roomid * max_planes) + i + 1, p, (i * 2 * select_grid) + (select_grid / 2), 0, (p.roomid * 600) + (p.roomid === 0 ? -40 : 40));
    // console.log ( plane );
  }
}

function get_y(x, z) {
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

function position_lerp (min, max) {
   return ((max - min) / 2) + min;
}

function create_vertexgrid(x, z) {
  if (!vertexgrid[x]) vertexgrid[x] = {};
  if (!vertexgrid[x][z]) vertexgrid[x][z] = {};
  return vertexgrid[x][z];
}

function pop(array, e) {
  var index = array.indexOf(e);
  if (index > -1) {
    array.splice(index, 1);
  }
}

function maps_set(s) {
  let x = ~~(s.x / select_grid);
  let z = ~~(s.z / select_grid);
  if (soldiers[x] == null) soldiers[x] = {};
  if (soldiers[x][z] == null) soldiers[x][z] = [];
  soldiers[x][z].push(s);
  s.fx = x;
  s.fz = z;

  s.fix = ~~(s.x);
  s.fiz = ~~(s.z);

  if (!fightmap[s.fix]) fightmap[s.fix] = {};
  if (!fightmap[s.fix][s.fiz]) fightmap[s.fix][s.fiz] = [];
  fightmap[s.fix][s.fiz].push(s); // = s; /// = s;
}

function gridmap_get(x, z) {
  x = ~~(x / select_grid);
  z = ~~(z / select_grid);
  return soldiers[x] && soldiers[x][z];
}

function fightmap_get(x, z) {
  x = ~~(x);
  z = ~~(z);
  return fightmap[x] && fightmap[x][z];
}

function maps_del(s) {
   pop(soldiers[s.fx][s.fz], s);
   fightmap[s.fix][s.fiz] = null;
}

function buffers_set(s) {
  positionsbuffer[pc_index] = s.x;
  positionsbuffer[pc_index+1] = 0; //s.y;
  positionsbuffer[pc_index+2] = s.z;
  colorsbuffer[pc_index] = s.color.r;
  colorsbuffer[pc_index+1] = s.color.g;
  colorsbuffer[pc_index+2] = s.color.b;
  pc_index+=3;
}

function ra(a) {
  return a[Math.floor(Math.random() * a.length)];
}

function ri(a) {
  return Math.floor(Math.random() * a);
}
