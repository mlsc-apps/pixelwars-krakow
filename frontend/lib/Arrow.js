var lineGeometry, coneGeometry;

function Arrow( dir, origin, length, color, headLength, headWidth ) {

  // dir is assumed to be normalized

  THREE.Object3D.call( this );

  if ( dir === undefined ) dir = new THREE.Vector3( 0, 0, 1 );
  if ( origin === undefined ) origin = new THREE.Vector3( 0, 0, 0 );
  if ( length === undefined ) length = 1;
  if ( color === undefined ) color = 0xffff00;
  if ( headLength === undefined ) headLength = 0.2 * length;
  if ( headWidth === undefined ) headWidth = 0.2 * headLength;

  if ( lineGeometry === undefined ) {

    lineGeometry = new THREE.BufferGeometry();
    lineGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 1, 0 ], 3 ) );

    coneGeometry = new THREE.CylinderBufferGeometry( 0, 0.5, 1, 5, 1 );
    coneGeometry.translate( 0, - 0.5, 0 );

  }

  this.position.copy( origin );

  this.line = new THREE.Line( lineGeometry, new THREE.LineBasicMaterial( { color: color } ) );
  this.line.matrixAutoUpdate = false;
  this.add( this.line );

  this.cone = new THREE.Mesh( coneGeometry, new THREE.MeshBasicMaterial( { color: color } ) );
  this.cone.matrixAutoUpdate = false;
  this.add( this.cone );

  this.setDirection( dir );
  this.setLength( length, headLength, headWidth );

}

Arrow.prototype = Object.create( THREE.Object3D.prototype );
Arrow.prototype.constructor = Arrow;

Arrow.prototype.setDirection = ( function () {

  var axis = new THREE.Vector3();
  var radians;

  return function setDirection( dir ) {

    // dir is assumed to be normalized

    if ( dir.y > 0.99999 ) {

      this.quaternion.set( 0, 0, 0, 1 );

    } else if ( dir.y < - 0.99999 ) {

      this.quaternion.set( 1, 0, 0, 0 );

    } else {

      axis.set( dir.z, 0, - dir.x ).normalize();

      radians = Math.acos( dir.y );

      this.quaternion.setFromAxisAngle( axis, radians );

    }

  };

}() );

Arrow.prototype.setLength = function ( length, headLength, headWidth ) {

  if ( headLength === undefined ) headLength = 0.2 * length;
  if ( headWidth === undefined ) headWidth = 0.2 * headLength;

  this.line.scale.set( 1, Math.max( 0, length - headLength ), 1 );
  this.line.updateMatrix();

  this.cone.scale.set( headWidth, headLength, headWidth );
  this.cone.position.y = length;
  this.cone.updateMatrix();

};

Arrow.prototype.setPosition = function ( position ) {

  this.position.copy( position );
  
};

Arrow.prototype.setColor = function ( color ) {

  this.line.material.color.set( color );
  this.cone.material.color.set( color );

};

Arrow.prototype.copy = function ( source ) {

  Object3D.prototype.copy.call( this, source, false );

  this.line.copy( source.line );
  this.cone.copy( source.cone );

  return this;

};

Arrow.prototype.clone = function () {

  return new this.constructor().copy( this );

};