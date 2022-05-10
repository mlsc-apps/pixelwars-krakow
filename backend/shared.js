const Soldier   = require('./soldier');
const Player    = require('./player');
const Plane     = require('./plane')
const crypto    = require('crypto');
const algorithm = 'aes-256-cbc';

global.wsPort = null;

global.playersNew    = [];
global.playersDead   = [];
global.playersRemove = [];
global.gameState  = {};
global.players    = {};
global.vertexgrid = {};
global.messages   = [];
global.messages_1   = [];
global.soldiersDead = [];
global.soldiersNew  = [];
global.soldiersLoad = [];
global.bulletsNew   = [];
global.bulletsHit   = [];
global.planesNew    = [];
global.pcIndex  = 0;
global.mouse    = [];
global.around   = [];

global.segmentsX = 0;
global.segmentsY = 0;
global.gridsizeX = 150;
global.gridsizeY = 150;
global.scaleY = 25;
global.sizeX  = 0;
global.sizeY  = 0;

global.loop = null;
global.terrainInitialized = false;

global.modesReceiveq = {};
global.createSoldierSendq = [];
global.updatePlayerSendq = {};
global.createPlayerSendq = [];
global.chatPlayerSendq = [];
global.createBulletSendq = [];
global.updateTimeSendq = [];
global.soldiersDeadSendq = [];

global.dbconn = null;

global.maxSoldiersX = 360;
global.maxSoldiersZ = 240;
global.selectGrid = 40;
global.gridX = maxSoldiersX / selectGrid;
global.gridZ = (maxSoldiersZ * 3) / selectGrid;
global.fightmap = {};
global.gridmap  = {};

global.gameStartedAt = null;
global.toGo = null;
global.loopRunning = true;
global.resetLoop   = false;
global.gameMaxTime = 300;
global.gridweights = [];
global.seed = 1;

global.globalTime  = 0;
global.sWorldTick  = false;
global.sDeadTick   = false;
global.sOrdersTick = 0;

global.idIndex = 0;
global.bulletIndex = 0;
global.maxLaunchDelay = 5000;
global.maxPlanes = 5;

global.playersDictLocked = false;

function getSoldiers() {
  let ps = {};
  for (var i = 0; i < gameloop.gos.length; i++) {
    let s = gameloop.gos[i];
    if (s instanceof Soldier) {
      let pid = s.player.id;
      if (!ps[pid]) ps[pid] = Buffer.alloc(0);
      ps[pid] = Buffer.concat([ps[pid], s.toBuffer()]);
    }
  }
  return ps;
}

global.getGameState = function() {
        let gssBuffer = Buffer.alloc(0);
        let ps = getSoldiers();
        for (var i = 0; i < Object.values(players).length; i++) {
          let p = Object.values(players)[i];
          let pbuf   = p.toBuffer();
          let sbuf   = Buffer.from(ps[p.id]);
          gssBuffer  = Buffer.concat([gssBuffer, pbuf, sbuf]);
        }
        return gssBuffer;
}

global.planes = {};

global.addPlanes = function(p) {
  planes[p.roomid] = [];
  for (var i = 0; i < max_planes; i++) {
    let plane = new Plane();
    plane.init((p.roomid * max_planes) + i + 1, p, (i * 2 * selectGrid) + (selectGrid / 2), 0, p.roomid * 600);
    planes[p.roomid].push(plane);
  }
}

global.addSoldiers = function(p, callback) {
  let bx = 0; //size_x/2 + (1500 * p.roomid);
  let bz = maxSoldiersZ * 1.5 * p.roomid; //maxSoldiersZ * 2 * p.roomid; //size_y/2;
  let playerPopulation = 0;
  for (i=1; i < maxSoldiersX; i++) {
    for (j=1; j < maxSoldiersZ; j++) {
        if (Math.random() < 0.820) continue;
        let s = new Soldier();
        s.init(p, bx + i, 0, bz + j, "no_action");
        playerPopulation++;
    }
  }
  callback(playerPopulation);
}

global.addPlayer = function(p, callbackWhenDone) {
    let pl = new Player();
    pl.init(p, callbackWhenDone);
    return pl;
}

global.loadSoldiers = function(p) {
  p.soldiers.forEach( (s) => {
    let sol = new Soldier();
    sol.load(p, s);
  });
  p.soldiers = null;
}

global.loadPlayer = function(p) {
    let pl = new Player();
    pl.load(p);
    return pl;
}

global.getY = function(x, z) {
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

global.createVertexgrid = function(x, z) {
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

global.updateField = function(f, x, z) {
  let w = (f.room0 - f.room1) / f.ss.length;
  f.w = Math.round(w * 10) / 10;
}

global.mapsSet = function(s) {
  let x = ~~(s.x / selectGrid);
  let z = ~~(s.z / selectGrid);
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
  updateField(gridmap[x][z], x, z);
  s.fx = x;
  s.fz = z;

  s.fix = ~~(s.x);
  s.fiz = ~~(s.z);

  if (!fightmap[s.fix]) fightmap[s.fix] = {};
  if (!fightmap[s.fix][s.fiz]) fightmap[s.fix][s.fiz] = [];
  fightmap[s.fix][s.fiz].push(s); // = s; /// = s;
}

global.gridmapGet = function(x, z) {
  x = ~~(x / selectGrid);
  z = ~~(z / selectGrid);
  return gridmap[x] && gridmap[x][z] && gridmap[x][z].ss;
}

global.fightmapGet = function(x, z) {
  return fightmap[x] && fightmap[x][z];
}

global.mapsDel = function(s) {
     let x = s.fx;
     let z = s.fz;
     pop(gridmap[x][z].ss, s);
     gridmap[x][z]['room'+s.player.roomid]--;
     updateField(gridmap[x][z], x, z);
     pop(fightmap[s.fix][s.fiz], s); // = null;
  }

global.positionLerp = function(min, max) {
   return ((max - min) / 2) + min;
}

global.rand = function(a) {
  return a[Math.floor(Math.random() * a.length)];
}

global.rint = function(a) {
  return Math.floor(Math.random() * a);
}

global.guid = function() {
  return idIndex++;
}

global.random = function(){
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

global.encrypt = function(text){
  var cipher = crypto.createCipheriv(algorithm, '2w3e2w3e4r2wdd')
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}

global.decrypt = function(text){
  var decipher = crypto.createDecipheriv(algorithm, '2w3e2w3e4r2wdd')
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}
