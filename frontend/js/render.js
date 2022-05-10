let Raycaster = new THREE.Raycaster();
let mouseCoords = new THREE.Vector3();

let sizeX = 0;
let sizeZ = 0;

var positionsbuffer = null;
var colorsbuffer = null;
var zeroarray = null;

var points = null;
var plane = null;

var useGrid = false;
var useSound = true;
var useMusic = true;

let clickCoords = null;
let clickTimeStart = null;

let maxPlayers = 2;
let maxSoldiers = 33000; // + 1000 bullets
let maxBufferSize = maxSoldiers * 3;

let gwindowSizeX = 360;
let gwindowSizeZ = 600;

let arrowHelper = null;

let TouchId = null;

let maxAirplanes = 5;
let airplanes = {
  0 : {
    spriteFileFlying   : "plane_blue_fly.png",
    spriteFileShooting : "plane_blue_shoot.png",
    rotation : Math.PI,
    sprites : []
  },
  1 : {
    spriteFileFlying   : "plane_red_fly.png",
    spriteFileShooting : "plane_red_shoot.png",
    rotation : 0,
    sprites : []
  }
}

let render = {

touchStart : function(e) {
  e.preventDefault();
  if (me && e.touches.length === 1) {
    clickTimeStart = Date.now();
    clickCoords = render.translateToView(e.touches[0].clientX, e.touches[0].clientY);

    if (clickCoords) {
      arrowHelper.setPosition(clickCoords);
    }
  }
},

touchCancel : function(e) {
  e.preventDefault();
  arrowHelper.visible = false;
},

touchMove : function(e) {
  e.preventDefault();
  if (me && e.touches.length === 1) {
    let currentCoords = render.translateToView(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    if (currentCoords) {
      let dir = new THREE.Vector3().subVectors(currentCoords, arrowHelper.position );
      dir.normalize();
      let len = currentCoords.distanceTo(arrowHelper.position);
      arrowHelper.setDirection(dir);
      arrowHelper.setLength(len);
      arrowHelper.visible = true;
  }
}
},

touchEnd : function(e) {
  e.preventDefault();
    clickCoords = render.translateToView(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    if (clickCoords) arrowHelper.visible = false;
},

mouseDown : function(e) {
  e.preventDefault();
  clickTimeStart = Date.now();
},

mouseUp : function(e) {
  e.preventDefault();
  clickCoords = render.translateToView(e.clientX, e.clientY);
},

init : function() {

        let s = scale * 2;
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 10000 );
        console.log(window.innerWidth/window.innerHeight);
        controls = new THREE.OrbitControls( camera, viewport );

        sizeX = gwindowSizeX; //gwindow_size; //window.innerWidth;
        sizeZ = gwindowSizeZ; //gwindow_size; //* 0.5; //window.innerHeight;

        var positionsarray = new Float32Array(maxBufferSize);
        var colorsarray = new Float32Array(maxBufferSize);

        zeroarray = new Float32Array(maxBufferSize);

        for ( var i = 0; i < 20000; i += 3 ) {

          var x = Math.random() * sizeX;
          var y = 0; //Math.random() * 20;
          var z = Math.random() * sizeZ;
          positionsarray[i] = x;
          positionsarray[i + 1] = y;
          positionsarray[i + 2] = z;

          var r = 1;//Math.random();
          var g = 1;//Math.random();
          var b = 1;//Math.random();
          colorsarray[i] = r;
          colorsarray[i + 1] = g;
          colorsarray[i + 2] = b;
        }

        // Points
        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.Float32BufferAttribute( positionsarray, 3 ));
        geometry.addAttribute('color', new THREE.Float32BufferAttribute( colorsarray, 3 ));

        positionsbuffer = geometry.attributes.position.array;
        colorsbuffer = geometry.attributes.color.array;

        var material = new THREE.PointsMaterial( { size: 1, vertexColors: THREE.VertexColors } );
        points = new THREE.Points( geometry, material );
        scene.add( points );

        // Arrow
        var dir = new THREE.Vector3( 0, 0, 0 );
        dir.normalize();
        var origin = new THREE.Vector3( 0, 0, 0 );
        var length = 1;
        var hex = 0x888888;
        arrowHelper = new Arrow( dir, origin, length, hex );
        arrowHelper.visible = false;
        scene.add( arrowHelper );

        // Airplanes
        for (var i = 0; i < maxPlayers; i++) {
          for (var j = 0; j < maxAirplanes; j++) {
            const map       = new THREE.TextureLoader().load( "sprites/" + airplanes[i].spriteFileFlying );
            map.minfilter   = THREE.NearestMipmapNearestFilter;
            map.magfilter   = THREE.LinearFilter;
            const material  = new THREE.SpriteMaterial( { map: map } );
            material.rotation = airplanes[i].rotation;

            const map2       = new THREE.TextureLoader().load( "sprites/" + airplanes[i].spriteFileShooting );
            map2.minfilter   = THREE.NearestMipmapNearestFilter;
            map2.magfilter   = THREE.LinearFilter;
            const material2  = new THREE.SpriteMaterial( { map: map2 } );
            material2.rotation = airplanes[i].rotation;

            const sprite = new THREE.Sprite( material );
            sprite.materialFlying = material;
            sprite.materialShooting = material2;
            sprite.scale.set(40, 40, 1);
            sprite.visible = false;
            airplanes[i].sprites[j] = sprite;
            scene.add( sprite );
          }
        }

        // Plane
        var geometry = new THREE.PlaneGeometry( sizeX, sizeZ, sizeX / select_grid, sizeZ / select_grid );
        var material = new THREE.MeshBasicMaterial( {wireframe: true, color: useGrid ? 0x444444 : 0x000000, side: THREE.DoubleSide} );
        plane = new THREE.Mesh( geometry, material );
        plane.position.set(sizeX / 2, 0, sizeZ / 2);
        plane.rotateX( - Math.PI / 2);
        scene.add( plane );

        this.resetCamera();

        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        viewport.appendChild( renderer.domElement );

				window.addEventListener( 'resize', this.onWindowResize, false );

        viewport.addEventListener("mousedown",   this.mouseDown);
        viewport.addEventListener("mouseup",     this.mouseUp);
        viewport.addEventListener("mousemove",   this.mouseMove);
        viewport.addEventListener('touchstart',  this.touchStart);
        viewport.addEventListener('touchend',    this.touchEnd);
        viewport.addEventListener('touchmove',   this.touchMove);
        viewport.addEventListener('touchcancel', this.touchCancel);

        document.addEventListener('keydown', (event) => {
        if (document.getElementById('chat-input') === document.activeElement) return;
        let keyName = event.key;

        switch(keyName) {
          // case 's':
          //   on_key_modal('standings-modal');
          //   break;
          case 'c':
            onKeyModal('chat-modal');
            break;
          case ' ':
            this.resetCamera();
            break;
          case 'm':
            this.toggleMusic();
            showInfo("Music " + (useMusic ? "On" : "Off"));
            break;
          case 'g':
            this.toggleGrid();
            showInfo("Grid " + (useGrid ? "On" : "Off"));
            break;
          case 's':
            this.toggleSound();
            showInfo("Sound " + (useSound ? "On" : "Off"));
            break;
        }

        });

        activateLoop = true;
        startTime = Date.now();
},

toggleGrid : function(setGrid) {
  useGrid = !useGrid;
  if (setGrid !== undefined) useGrid = setGrid;
  if (plane) {
    plane.material.wireframe = true;
    plane.material.color = useGrid ? new THREE.Color(0x444444) : new THREE.Color(0x000000);
    plane.material.needsUpdate = true;
  }
  setCookie('urgrid', useGrid, 720);
  document.getElementById('grid_floating_button').innerHTML = `grid_${useGrid ? 'off' : 'on'}`;
},

toggleSound : function(setSound) {
  useSound = !useSound;
  if (setSound !== undefined) useSound = setSound;
  setCookie('ursound', useSound, 720);
},

toggleMusic : function(setMusic) {
  useMusic = !useMusic;
  if (setMusic !== undefined) useMusic = setMusic;
  setCookie('urmusic', useMusic, 720);
  document.getElementById('music_floating_button').innerHTML = `music_${useMusic ? 'note' : 'off'}`;
},

resetCamera : function() {
  let fov = camera.fov;
  dist = sizeZ / 2 / Math.tan(Math.PI * fov / 360);
  camera.position.set(sizeX/2, dist + 60, sizeZ/2);
  camera.lookAt( sizeX/2, 0, sizeZ/2 );
  controls.target = new THREE.Vector3( sizeX / 2, 0, sizeZ / 2);
  controls.maxDistance = dist + 60;
},

update : function(dt) {
      points.geometry.attributes.position.needsUpdate = true;
      points.geometry.attributes.color.needsUpdate = true;
      renderer.render(scene, camera);

      pcIndex = 0;
      points.geometry.attributes.position.copyArray( zeroarray );
      points.geometry.attributes.color.copyArray( zeroarray );
},

translateToView : function(x, y) {
      mouseCoords.x = (x / window.innerWidth ) * 2 - 1;
      mouseCoords.y = -( y / window.innerHeight ) * 2 + 1;

    	Raycaster.setFromCamera( mouseCoords, camera );
    	let intersects = Raycaster.intersectObject( plane );
      if (intersects[0]) return intersects[0].point;
},

onWindowResize : function() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
        render.resetCamera();
}
}