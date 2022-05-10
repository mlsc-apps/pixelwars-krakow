let wsPort   = 1337;
let httpPort = 3000;
let wsHost = null;

let me = null;
let newPlayers    = [];
let checkIfPlayer = [];
let standing      = [];
let players       = {};
let soldiers      = {};
let fightmap      = {};

let vertexgrid   = {};
let vertexIndex  = [];
let soldiersDead = [];
let soldiersNew  = [];
let pcIndex = 0;

let mouse    = {};
let orders   = [];
let around   = [];
let chosen   = [];

let segmentsX = 0;
let segmentsY = 0;
let gridsizeX = 1.5;
let gridsizeY = 1.5;
let scaleY    = 0.25;

let ordersToServer        = [];
let sUpdatesFromServer    = {};
let sUpdatesFromServerIds = [];
let sUpdatesFromServerQ    = [];
let pUpdatesFromServer     = {};
let sDeadUpdatesFromServer = {};
let ackSend = false;

let sendChatMsg = null;
let chats = {};
let openchatPid = null;
let chatPidOpened = null;

let scale = 5;

let loop = null;
let resetControls = false;
let sentOrder = null;
let selectGrid = 40;

let mindex = 0;
let controls = null;
let camera = null;

let colors = [new THREE.Color(0x0000ff), new THREE.Color(0xff0000)];
let white  = new THREE.Color(0xffffff);

let worldTick = 0;
let worldDeadTick = 0;
let clientTick = 0;
let globalTime = 0;
let maxPlayersUpdate = 1000;

let maxLaunchDelay = 3000;

let toGo = null;

let maxPlanes = 5;
let sendPlanesSid = null;

function parsePlayerFromBuffer(data) {
    let p = {};
    p.id  = data.getUint32(0);
    p.population = parseInt(data.getUint16(4));
    p.nick    = String.fromCharCode.apply(null, new Uint8Array(data.buffer).slice(6 + data.byteOffset, 16 + data.byteOffset));
    p.country = String.fromCharCode.apply(null, new Uint8Array(data.buffer).slice(16 + data.byteOffset, 18 + data.byteOffset));
    p.robot  = data.getUint8(18);
    p.roomid = data.getUint8(19);
    p.color  = colors[p.roomid];
    p.newMail = false;
    p.localPopulation = 0;
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
  for (var i = 0; i < data.byteLength; i+=bytesPerSoldier) {
      parseSoldierFromBuffer(new DataView(data.buffer, data.byteOffset + i, bytesPerSoldier), player);
    }
}

function add_planes(p) {
  for (var i = 0; i < maxPlanes; i++) {
    let plane = Object.create(Plane);
    plane.init((p.roomid * maxPlanes) + i + 1, p, (i * 2 * selectGrid) + (selectGrid / 2), 0, (p.roomid * 600) + (p.roomid === 0 ? -40 : 40));
  }
}

function get_y(x, z) {
  let px = ~~(x / gridsizeX);
  let pz = ~~(z / gridsizeY);

  let rx = (x - (px * gridsizeX)) / gridsizeX;
  let rz = (z - (pz * gridsizeY)) / gridsizeY;

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

function positionLerp (min, max) {
   return ((max - min) / 2) + min;
}

function createVertexgrid(x, z) {
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

function mapsSet(s) {
  let x = ~~(s.x / selectGrid);
  let z = ~~(s.z / selectGrid);
  if (soldiers[x] == null) soldiers[x] = {};
  if (soldiers[x][z] == null) soldiers[x][z] = [];
  soldiers[x][z].push(s);
  s.fx = x;
  s.fz = z;

  s.fix = ~~(s.x);
  s.fiz = ~~(s.z);

  if (!fightmap[s.fix]) fightmap[s.fix] = {};
  if (!fightmap[s.fix][s.fiz]) fightmap[s.fix][s.fiz] = [];
  fightmap[s.fix][s.fiz].push(s);
}

function gridmapGet(x, z) {
  x = ~~(x / selectGrid);
  z = ~~(z / selectGrid);
  return soldiers[x] && soldiers[x][z];
}

function fightmapGet(x, z) {
  x = ~~(x);
  z = ~~(z);
  return fightmap[x] && fightmap[x][z];
}

function mapsDel(s) {
   pop(soldiers[s.fx][s.fz], s);
   fightmap[s.fix][s.fiz] = null;
}

function buffersSet(s) {
  positionsbuffer[pcIndex] = s.x;
  positionsbuffer[pcIndex+1] = 0; //s.y;
  positionsbuffer[pcIndex+2] = s.z;
  colorsbuffer[pcIndex] = s.color.r;
  colorsbuffer[pcIndex+1] = s.color.g;
  colorsbuffer[pcIndex+2] = s.color.b;
  pcIndex+=3;
}

function ra(a) {
  return a[Math.floor(Math.random() * a.length)];
}

function ri(a) {
  return Math.floor(Math.random() * a);
}
