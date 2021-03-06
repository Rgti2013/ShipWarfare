var input1 = {
	power: null,
	direction: null,
	steering: 0,
	cannon_power: -1,
	cannon: null,
	cannon_loaded: true,
	health: 100,
	dead: false
};

var input2 = {
	power: null,
	direction: null,
	steering: 0,
	cannon_power: -1,
	cannon: null,
	cannon_loaded: true,
	health: 100,
	dead: false
};

function Player(posX,posY,posZ,rotY, pID, scene, input, vehicle) {

	this.vehicle_body = null;
	//this.vehicle = null;
	this.cannonball = null;

	// Vehicle handling parameters
	this.turnDeltaFactor = 50;
	this.maxTurnAngle = 0.5;
	this.maxVelocity = 15.0;
	this.brakeTurnFactor = 0.5;
	this.engineForce = 130;

	//cannon handling parameters
	//this.cannon_loaded = true;

	// Load and setup the vehicle
	var car_material = Physijs.createMaterial(
		new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'images/ship_diffuse.png' ) }),
		.2, 
		.4 
	);
	var loader = new THREE.JSONLoader();
	loader.load( "models/warship.js", function( car, car_materials ) {
		loader.load( "models/mustang_wheel.js", function( wheel, wheel_materials ) {
			this.mesh = new Physijs.ConvexMesh(
				car,
				car_material
				//new THREE.MeshFaceMaterial( car_materials )
				, 60 // mass
			);
			this.mesh.scale.set(0.8, 0.8, 0.8);
			this.mesh.position.y = posY;
			this.mesh.position.x = posX;
			this.mesh.position.z = posZ;
			this.mesh.castShadow = this.mesh.receiveShadow = true;

			vehicle = new Physijs.Vehicle(mesh, new Physijs.VehicleTuning(
				10.88,	// suspension stifness
				1.83,	// suspension compression
				0.28,	// suspension dampening
				500,	// max suspension travel
				10.5,	// friction slip
				6000	// max suspension force
			));
			
			vehicle.mesh.addEventListener(
				'collision',
				function( collided_with, linearVelocity, angularVelocity ) {
					if ( collided_with instanceof Physijs.SphereMesh ) input.health -= 30;
				}
			);
			scene.add( vehicle );

			this.wheel_material = new THREE.MeshFaceMaterial( wheel_materials );

			for ( var i = 0; i < 4; i++ ) {
				vehicle.addWheel(
					wheel,	// geometry
					new THREE.MeshLambertMaterial({color: 0xcccccc, transparent: true, opacity: 0.0}),	//material
					new THREE.Vector3(
							i % 2 === 0 ? -1.6 : 1.6,
							-1,
							i < 2 ? 4.4 : -3.0
					),	// connection point
					new THREE.Vector3( 0, -1, 0 ),	// wheel direction
					new THREE.Vector3( -1, 0, 0 ),	// wheel axle
					0.3,	//suspension rest length
					2,	//wheel radius
					i < 2 ? false : true	// is front wheel
				);
				
			}

			// Don't display the wheels or the shadows
			for (i = 0; i < 4; i++){
				vehicle.wheels[i].castShadow = vehicle.wheels[i].receiveShadow = false;
				vehicle.wheels[i].visible = false;
			}
			
			document.addEventListener('keydown', function( ev ) {
				keyDown( ev.keyCode );
			});
			document.addEventListener('keyup', function( ev ) {
				keyUp( ev.keyCode );
			});
		});
	});

	// Function to update the player
	this.updatePlayer = updatePlayer;
	function updatePlayer () {
		// Update vehicle 
			if( input && vehicle ) {

				// Handle the vehicle steering
				if ( input.direction !== null ) {
					input.steering += input.direction / this.turnDeltaFactor;
					if ( input.steering < -this.maxTurnAngle ) input.steering = -this.maxTurnAngle;
					if ( input.steering > this.maxTurnAngle ) input.steering = this.maxTurnAngle;

				} else {
					if ( input.steering > 1/this.turnDeltaFactor ) input.steering -= 1/this.turnDeltaFactor;
					else if ( input.steering < 1/this.turnDeltaFactor ) input.steering += 1/this.turnDeltaFactor;
					else input.steering = 0;
				}
				// Apply the steering to the back wheels
				vehicle.setSteering( input.steering, 2 );
				vehicle.setSteering( input.steering, 3 );

				// Handle the vehicle power
				if ( input.power === true ) {
					
					this.vel = vehicle.mesh.getLinearVelocity();
					this.velLen = this.vel.length();
					if(this.velLen < this.maxVelocity ){
						vehicle.applyEngineForce( this.engineForce, 0);
						vehicle.applyEngineForce( this.engineForce, 1 );
					} else {
						vehicle.applyEngineForce( 0, 0 );
						vehicle.applyEngineForce( 0, 1 );
					}

				} else if ( input.power === false ) {
					
					//vehicle.setBrake( 5, 2 );
					//vehicle.setBrake( 5, 3 );

					vehicle.applyEngineForce( -30 );
					
				} else {
					vehicle.applyEngineForce( 0 );
					
				}

				// Brake the vehicle according to the steering angle and the velocity of the vehicle
				this.brakeAmount = this.brakeTurnFactor * Math.abs(input.steering) * vehicle.mesh.getLinearVelocity().length();
				// Lower limit
				if(this.brakeAmount < 0.15) this.brakeAmount = 0.15;
				// Apply the brakes
				vehicle.setBrake( this.brakeAmount, 2 );
				vehicle.setBrake( this.brakeAmount, 3 );

				//console.log("Brake amount: ", brakeAmount);


			}

			//Handle firing cannon
			if ( input.cannon && input.cannon_loaded ) {

				input.cannon_loaded = false;
				input.cannon = null;

				//left side
				this.cannonball1 = new Physijs.SphereMesh(
					new THREE.SphereGeometry( 0.3, 20, 20, 0, Math.PI * 2, 0, Math.PI ),
					new THREE.MeshLambertMaterial( {color: 0x000000} )
				);
				this.cannonball1.castShadow = this.cannonball1.receiveShadow = true;
				this.cannonball2 = new Physijs.SphereMesh(
					new THREE.SphereGeometry( 0.3, 20, 20, 0, Math.PI * 2, 0, Math.PI ),
					new THREE.MeshLambertMaterial( {color: 0x000000} )
				);
				this.cannonball2.castShadow = this.cannonball2.receiveShadow = true;
				this.cannonball3 = new Physijs.SphereMesh(
					new THREE.SphereGeometry( 0.3, 20, 20, 0, Math.PI * 2, 0, Math.PI ),
					new THREE.MeshLambertMaterial( {color: 0x000000} )
				);
				this.cannonball3.castShadow = this.cannonball3.receiveShadow = true;

				this.rotation_matrix = new THREE.Matrix4().extractRotation( vehicle.mesh.matrix );
				this.position_matrix = new THREE.Matrix4().copyPosition( vehicle.mesh.matrix );
				this.position_vector1 = new THREE.Vector3( 5, 3, 2 ).applyMatrix4( this.rotation_matrix ).applyMatrix4( this.position_matrix );
				this.position_vector2 = new THREE.Vector3( 5, 3, -0.5 ).applyMatrix4( this.rotation_matrix ).applyMatrix4( this.position_matrix );
				this.position_vector3 = new THREE.Vector3( 5, 3, -3 ).applyMatrix4( this.rotation_matrix ).applyMatrix4( this.position_matrix );

				this.cannonball1.position.set(
					this.position_vector1.x,
					this.position_vector1.y,
					this.position_vector1.z
				);
				this.cannonball2.position.set(
					this.position_vector2.x,
					this.position_vector2.y,
					this.position_vector2.z
				);
				this.cannonball3.position.set(
					this.position_vector3.x,
					this.position_vector3.y,
					this.position_vector3.z
				);
				//destroy cannonball when collided
				this.cannonball1.addEventListener(
					'collision',
					function( collided_with, linearVelocity, angularVelocity ) {
						scene.remove( this );
						input.cannon_loaded = true;
					}
				);
				this.cannonball2.addEventListener(
					'collision',
					function( collided_with, linearVelocity, angularVelocity ) {
						scene.remove( this );
						input.cannon_loaded = true;
					}
				);
				this.cannonball3.addEventListener(
					'collision',
					function( collided_with, linearVelocity, angularVelocity ) {
						scene.remove( this );
						input.cannon_loaded = true;
					}
				);
				// calculate force vector, add cannonball to the scene and apply impulse with calculated cannon power
				this.calculated_cannon_power = input.cannon_power * 1 / 10;
				this.force_vector1 = new THREE.Vector3( 1 + this.calculated_cannon_power, 1 + this.calculated_cannon_power, 0 ).applyMatrix4( this.rotation_matrix );
				
				this.force_vector1 = this.force_vector1.add( vehicle.mesh.getLinearVelocity().multiplyScalar( 0.1 ) );
				scene.add( this.cannonball1 );
				scene.add( this.cannonball3 );
				scene.add( this.cannonball2 );
				this.cannonball1.applyCentralImpulse( this.force_vector1 );
				this.cannonball2.applyCentralImpulse( this.force_vector1 );
				this.cannonball3.applyCentralImpulse( this.force_vector1 );

				//right side
				this.cannonball4 = new Physijs.SphereMesh(
					new THREE.SphereGeometry( 0.3, 20, 20, 0, Math.PI * 2, 0, Math.PI ),
					new THREE.MeshLambertMaterial( {color: 0x000000} )
				);
				this.cannonball4.castShadow = this.cannonball1.receiveShadow = true;
				this.cannonball5 = new Physijs.SphereMesh(
					new THREE.SphereGeometry( 0.3, 20, 20, 0, Math.PI * 2, 0, Math.PI ),
					new THREE.MeshLambertMaterial( {color: 0x000000} )
				);
				this.cannonball5.castShadow = this.cannonball2.receiveShadow = true;
				this.cannonball6 = new Physijs.SphereMesh(
					new THREE.SphereGeometry( 0.3, 20, 20, 0, Math.PI * 2, 0, Math.PI ),
					new THREE.MeshLambertMaterial( {color: 0x000000} )
				);
				this.cannonball6.castShadow = this.cannonball3.receiveShadow = true;

				this.position_vector4 = new THREE.Vector3( -5, 3, 2 ).applyMatrix4( this.rotation_matrix ).applyMatrix4( this.position_matrix );
				this.position_vector5 = new THREE.Vector3( -5, 3, -0.5 ).applyMatrix4( this.rotation_matrix ).applyMatrix4( this.position_matrix );
				this.position_vector6 = new THREE.Vector3( -5, 3, -3 ).applyMatrix4( this.rotation_matrix ).applyMatrix4( this.position_matrix );

				this.cannonball4.position.set(
					this.position_vector4.x,
					this.position_vector4.y,
					this.position_vector4.z
				);
				this.cannonball5.position.set(
					this.position_vector5.x,
					this.position_vector5.y,
					this.position_vector5.z
				);
				this.cannonball6.position.set(
					this.position_vector6.x,
					this.position_vector6.y,
					this.position_vector6.z
				);
				//destroy cannonball when collided
				this.cannonball4.addEventListener(
					'collision',
					function( collided_with, linearVelocity, angularVelocity ) {
						scene.remove( this );
						input.cannon_loaded = true;
					}
				);
				this.cannonball5.addEventListener(
					'collision',
					function( collided_with, linearVelocity, angularVelocity ) {
						scene.remove( this );
						input.cannon_loaded = true;
					}
				);
				this.cannonball6.addEventListener(
					'collision',
					function( collided_with, linearVelocity, angularVelocity ) {
						scene.remove( this );
						input.cannon_loaded = true;
					}
				);
				// calculate force vector, add cannonball to the scene and apply impulse with calculated cannon power
				this.force_vector2 = new THREE.Vector3( -(1 + this.calculated_cannon_power), 1 + this.calculated_cannon_power, 0 ).applyMatrix4( this.rotation_matrix );
				
				this.force_vector2 = this.force_vector2.add( vehicle.mesh.getLinearVelocity().multiplyScalar( 0.9 ) );
				scene.add( this.cannonball4 );
				scene.add( this.cannonball5 );
				scene.add( this.cannonball6 );
				this.cannonball4.applyCentralImpulse( this.force_vector2 );
				this.cannonball5.applyCentralImpulse( this.force_vector2 );
				this.cannonball6.applyCentralImpulse( this.force_vector2 );

				input.cannon_power = -1;
			}

			//check if ship has enough health
			if(input.health < 1){
				scene.remove( vehicle );
				input.dead = true;
			}

			//progress bar for testing
			

			// Limit the maximum velocity of the vehicle
			//limitVelocity(vehicle.mesh ,maxVelocity);
/*
			// Limit the maximum velocity of the vehicle
			if(vehicle !== null){
				var vel = vehicle.mesh.getLinearVelocity();
				var velLen = vel.length();
				if(velLen > maxVelocity ){
					/*
					var rotation_matrix = new THREE.Matrix4().extractRotation(vehicle.mesh.matrix);
					// Rotate the vector in the direction of the ship, using the ship's matrix
					vel = new THREE.Vector3(0, 0,maxVelocity);
					vel.applyMatrix4(rotation_matrix);
					vehicle.mesh.setLinearVelocity(vel);
					
					vel.divideScalar(velLen);
					vel.multiplyScalar(maxVelocity);
					vehicle.mesh.setLinearVelocity(vel);
				} 

				//console.log(velLen);
				
			}
*/
			//if(vehicle) console.log("Ship velocity: " + vehicle.mesh.getLinearVelocity().length());		
			 
	}

	function keyDown( keycode ){
		if( pID == 0 ){
			switch ( keycode ) {
				case 37: // left
					input.direction = -1;
					break;

				case 38: // forward
					input.power = true;
					break;

				case 39: // right
					input.direction = 1;
					break;

				case 40: // back
					input.power = false;
					break;

				case 76: // l
					if ( input.cannon_loaded ) {
						input.cannon_power++;
						if ( input.cannon_power > 19 ) input.cannon = true;
					}
					break;
			}
		}
		else if( pID == 1 ){
			switch ( keycode ) {
				case 65: // a
					input.direction = -1;
					break;

				case 87: // w
					input.power = true;
					break;

				case 68: // d
					input.direction = 1;
					break;

				case 83: // s
					input.power = false;
					break;

				case 32: // spacebar
					if ( input.cannon_loaded ) {
						input.cannon_power++;
						if ( input.cannon_power > 19 ) input.cannon = true;
					}
					break;
			}
		}
	}

	function keyUp( keycode ){
		if( pID == 0 ){
			switch ( keycode ) {
				case 37: // left
					input.direction = null;
					break;

				case 38: // forward
					input.power = null;
					break;

				case 39: // right
					input.direction = null;
					break;

				case 40: // back
					input.power = null;
					break;

				case 76: // l
					if ( input.cannon_loaded ) input.cannon = true;
					break;
			}
		}
		else if( pID == 1 ){
			switch ( keycode ) {
				case 65: // a
					input.direction = null;
					break;

				case 87: // w
					input.power = null;
					break;

				case 68: // d
					input.direction = null;
					break;

				case 83: // s
					input.power = null;
					break;

				case 32: // spacebar
					if ( input.cannon_loaded ) input.cannon = true;
					break;
			}
		}
	}
} // END PLAYER