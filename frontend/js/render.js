let raycaster = new THREE.Raycaster();
let mouse_coords = new THREE.Vector3();

let size_x = 0;
let size_z = 0;

var positionsbuffer = null;
var colorsbuffer = null;
var zeroarray = null;

var points = null;
var plane = null;

var use_grid = false;
var use_sound = true;
var use_music = true;

let click_coords = null;
let click_time_start = null;

let max_players = 2;
let max_soldiers = 33000; // + 1000 bullets
let max_buffer_size = max_soldiers * 3;

let gwindow_size_x = 360;
let gwindow_size_z = 600;

let arrowHelper = null;

let touch_id = null;

let max_airplanes = 5;
let airplanes = {
  0 : {
    sprite_file_flying   : "plane_blue_fly.png",
    sprite_file_shooting : "plane_blue_shoot.png",
    rotation : Math.PI,
    sprites : []
  },
  1 : {
    sprite_file_flying   : "plane_red_fly.png",
    sprite_file_shooting : "plane_red_shoot.png",
    rotation : 0,
    sprites : []
  }
}

let render = {

touch_start : function(e) {
  e.preventDefault();
  if (me && e.touches.length === 1) {
    click_time_start = Date.now();
    click_coords = render.translate_to_view(e.touches[0].clientX, e.touches[0].clientY);

    if (click_coords) {
      arrowHelper.setPosition(click_coords);
    }
  }
},

touch_cancel : function(e) {
  e.preventDefault();
  arrowHelper.visible = false;
},

touch_move : function(e) {
  e.preventDefault();
  if (me && e.touches.length === 1) {
    let current_coords = render.translate_to_view(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    if (current_coords) {
      let dir = new THREE.Vector3().subVectors(current_coords, arrowHelper.position );
      dir.normalize();
      let len = current_coords.distanceTo(arrowHelper.position);
      arrowHelper.setDirection(dir);
      arrowHelper.setLength(len);
      arrowHelper.visible = true;
  }
}
},

touch_end : function(e) {
  e.preventDefault();
    click_coords = render.translate_to_view(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    if (click_coords) arrowHelper.visible = false;
},

mouse_down : function(e) {
  e.preventDefault();
  click_time_start = Date.now();
},

mouse_up : function(e) {
  e.preventDefault();
  click_coords = render.translate_to_view(e.clientX, e.clientY);
},

init : function() {

        let s = scale * 2;
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 10000 );
        console.log(window.innerWidth/window.innerHeight);
        controls = new THREE.OrbitControls( camera, viewport );

        size_x = gwindow_size_x; //gwindow_size; //window.innerWidth;
        size_z = gwindow_size_z; //gwindow_size; //* 0.5; //window.innerHeight;

        var positionsarray = new Float32Array(max_buffer_size);
        var colorsarray = new Float32Array(max_buffer_size);

        zeroarray = new Float32Array(max_buffer_size);

        for ( var i = 0; i < 20000; i += 3 ) {

          var x = Math.random() * size_x;
          var y = 0; //Math.random() * 20;
          var z = Math.random() * size_z;
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
        for (var i = 0; i < max_players; i++) {
          for (var j = 0; j < max_airplanes; j++) {
            const map       = new THREE.TextureLoader().load( "sprites/" + airplanes[i].sprite_file_flying );
            map.minfilter   = THREE.NearestMipmapNearestFilter;
            map.magfilter   = THREE.LinearFilter;
            const material  = new THREE.SpriteMaterial( { map: map } );
            material.rotation = airplanes[i].rotation;

            const map2      = new THREE.TextureLoader().load( "sprites/" + airplanes[i].sprite_file_shooting );
            map2.minfilter   = THREE.NearestMipmapNearestFilter;
            map2.magfilter   = THREE.LinearFilter;
            const material2  = new THREE.SpriteMaterial( { map: map2 } );
            material2.rotation = airplanes[i].rotation;

            const sprite = new THREE.Sprite( material );
            sprite.material_flying = material;
            sprite.material_shooting = material2;
            sprite.scale.set(40, 40, 1);
            sprite.visible = false;
            airplanes[i].sprites[j] = sprite;
            scene.add( sprite );
          }
        }

        // Plane
        var geometry = new THREE.PlaneGeometry( size_x, size_z, size_x / select_grid, size_z / select_grid );
        var material = new THREE.MeshBasicMaterial( {wireframe: true, color: use_grid ? 0x444444 : 0x000000, side: THREE.DoubleSide} );
        plane = new THREE.Mesh( geometry, material );
        plane.position.set(size_x / 2, 0, size_z / 2);
        plane.rotateX( - Math.PI / 2);
        scene.add( plane );

        this.reset_camera();

        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        viewport.appendChild( renderer.domElement );

				window.addEventListener( 'resize', this.onWindowResize, false );

        viewport.addEventListener("mousedown", this.mouse_down);
        viewport.addEventListener("mouseup", this.mouse_up);
        viewport.addEventListener("mousemove", this.mouse_move);
        viewport.addEventListener('touchstart', this.touch_start);
        viewport.addEventListener('touchend', this.touch_end);
        viewport.addEventListener('touchmove', this.touch_move);
        viewport.addEventListener('touchcancel', this.touch_cancel);

        document.addEventListener('keydown', (event) => {
        if (document.getElementById('chat-input') === document.activeElement) return;
        let keyName = event.key;

        switch(keyName) {
          // case 's':
          //   on_key_modal('standings-modal');
          //   break;
          case 'c':
            on_key_modal('chat-modal');
            break;
          case ' ':
            this.reset_camera();
            break;
          case 'm':
            this.toggle_music();
            show_info("Music " + (use_music ? "On" : "Off"));
            break;
          case 'g':
            this.toggle_grid();
            show_info("Grid " + (use_grid ? "On" : "Off"));
            break;
          case 's':
            this.toggle_sound();
            show_info("Sound " + (use_sound ? "On" : "Off"));
            break;
        }

        });

        activate_loop = true;
        start_time = Date.now();
},

toggle_grid : function(set_grid) {
  use_grid = !use_grid;
  if (set_grid !== undefined) use_grid = set_grid;
  if (plane) {
    plane.material.wireframe = true;
    plane.material.color = use_grid ? new THREE.Color(0x444444) : new THREE.Color(0x000000);
    plane.material.needsUpdate = true;
  }
  setCookie('urgrid', use_grid, 720);
  document.getElementById('grid_floating_button').innerHTML = `grid_${use_grid ? 'off' : 'on'}`;
},

toggle_sound : function(set_sound) {
  use_sound = !use_sound;
  if (set_sound !== undefined) use_sound = set_sound;
  setCookie('ursound', use_sound, 720);
},

toggle_music : function(set_music) {
  use_music = !use_music;
  if (set_music !== undefined) use_music = set_music;
  setCookie('urmusic', use_music, 720);
  document.getElementById('music_floating_button').innerHTML = `music_${use_music ? 'note' : 'off'}`;
},

reset_camera : function() {
  let fov = camera.fov;
  dist = size_z / 2 / Math.tan(Math.PI * fov / 360);
  camera.position.set(size_x/2, dist + 60, size_z/2);
  camera.lookAt( size_x/2, 0, size_z/2 );
  controls.target = new THREE.Vector3( size_x / 2, 0, size_z / 2);
  controls.maxDistance = dist + 60;
},

update : function(dt) {
      points.geometry.attributes.position.needsUpdate = true;
      points.geometry.attributes.color.needsUpdate = true;
      renderer.render(scene, camera);

      pc_index = 0;
      points.geometry.attributes.position.copyArray( zeroarray );
      points.geometry.attributes.color.copyArray( zeroarray );
},

translate_to_view : function(x, y) {
      mouse_coords.x = (x / window.innerWidth ) * 2 - 1;
      mouse_coords.y = -( y / window.innerHeight ) * 2 + 1;

    	raycaster.setFromCamera( mouse_coords, camera );
    	let intersects = raycaster.intersectObject( plane );
      if (intersects[0]) return intersects[0].point;
},

onWindowResize : function() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
        render.reset_camera();
}
}