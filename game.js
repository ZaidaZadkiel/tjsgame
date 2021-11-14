  import playSound          from './MusicPlayer.js'
  import * as THREE         from 'https://cdn.skypack.dev/three@0.134.0';
  import { FXAAShader }     from 'https://cdn.skypack.dev/three@0.134.0/examples/jsm/shaders/FXAAShader.js';
  import { EffectComposer } from 'https://cdn.skypack.dev/three@0.134.0/examples/jsm/postprocessing/EffectComposer.js';
  import { ShaderPass }     from 'https://cdn.skypack.dev/three@0.134.0/examples/jsm/postprocessing/ShaderPass.js';
  import { RenderPass }     from 'https://cdn.skypack.dev/three@0.134.0/examples/jsm/postprocessing/RenderPass.js';

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );
  const renderer = new THREE.WebGLRenderer();

  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  const listener = new THREE.AudioListener();
  camera.add( listener );

  import { OrbitControls }   from 'https://cdn.skypack.dev/three@0.134.0/examples/jsm/controls/OrbitControls.js';
  import { GLTFLoader }      from 'https://cdn.skypack.dev/three@0.134.0/examples/jsm/loaders/GLTFLoader.js';
  import { RoomEnvironment } from 'https://cdn.skypack.dev/three@0.134.0/examples/jsm/environments/RoomEnvironment.js';

  const controls  = new OrbitControls(camera, renderer.domElement);
  const imgloader = new THREE.TextureLoader();
  const geometry  = new THREE.BoxGeometry();
  const material  = new THREE.MeshBasicMaterial({map: imgloader.load("img/wall.jpg") });
  const clock     = new THREE.Clock();

  // movement - please calibrate these values
  var xSpeed = 0.1;
  var ySpeed = 0.1;

  material.flatShading = true;

  const linematerial = new THREE.LineBasicMaterial( { color: 0xff0000 } );
  const points = [
    new THREE.Vector3( -10,  -10,  10 ) ,
    new THREE.Vector3( -10,   10,  10 ) ,
    // new THREE.Vector3(  10,   10,  10 ) ,
    // new THREE.Vector3(  10,  -10,  10 ) ,
    // new THREE.Vector3( -10,  -10,  10 )
  ];

  const linegeo = new THREE.BufferGeometry().setFromPoints( points );
  const line    = new THREE.Line( linegeo, linematerial );
  line.frustumCulled = false;
  scene.add( line );

  camera.up = new THREE.Vector3( 0, 0 , 1 );

  camera.position.z = 60;
  camera.position.y = -30;

  const environment    = new RoomEnvironment();
  const pmremGenerator = new THREE.PMREMGenerator( renderer );
  const loader         = new GLTFLoader();
  scene.background     = new THREE.Color( 0xbbbbbb );
  scene.environment    = pmremGenerator.fromScene( environment ).texture;
  const movement       = [0,0,0,0, 0, 0]; //Y pos X pos Animation on/off
  const mov_L    = 0;
  const mov_R    = 1;
  const mov_U    = 2;
  const mov_D    = 3;
  const mov_ANI  = 4;
  const mov_SHOT = 5;


  let composer, fxaaPass;
  fxaaPass = new ShaderPass( FXAAShader );

  const renderPass = new RenderPass( scene, camera );
  const pixelRatio = renderer.getPixelRatio();

	fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( window.innerWidth * pixelRatio );
	fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( window.innerHeight * pixelRatio );

	composer = new EffectComposer( renderer );
	composer.addPass( renderPass );
	composer.addPass( fxaaPass );


//-----Sound--------------------------

playSound(listener, "sound/test.mp3", 0.5, false);

//--------------------------------------





  console.log("flag");
  var scenemixer = new THREE.AnimationMixer( scene );
  var mixer      = [];
  var objects    = [];
  var animations = [];

  const loadGLTFPhilez = (paths) => {
    if(!Array.isArray(paths)) {
      console.log("Error with loading paths");
      return null;
    }

    paths.forEach((path, i) => {
      console.log("path index", i, `mod/${path}`);

      loader.load(
        `mod/${path}`,
        ( gltf ) => {
          mixer[i]      = new THREE.AnimationMixer( gltf.scene );
          objects[i]    = gltf;
          gltf.animations.forEach((item, i) => {
            console.log("why", item.name);
            if(!animations[path]) animations[path] = {};
            animations[path][item.name] = item;
          });

          // console.log(objects[i]);
          console.log("gltf", i, mixer, animations, gltf.animations);
          // console.log(gltf.animations);
          if(Array.isArray(gltf.animations) && gltf.animations[0]){
            var action = mixer[i].clipAction( gltf.animations[ 0 ] )
            // action.loop = THREE.LoopRepeat;
            action.reset().play();
            console.log("loled");
          }

          scene.add( gltf.scene );

          if(i == 0){
            console.log("cube", gltf.scene);
            cube = gltf.scene;
            // magic values :D
            mixer[0].clipAction( animations['monitoringo.glb'].Shooting ).clampWhenFinished=true;
            mixer[0].clipAction( animations['monitoringo.glb'].Shooting ).loop=THREE.LoopOnce;
            mixer[0].clipAction( animations['monitoringo.glb'].Shooting ) .stop();
            mixer[0].clipAction( animations['monitoringo.glb'].Running )  .stop();
            mixer[0].clipAction( animations['monitoringo.glb'].Breathing ).play();
            //TODO make animation shooting stop on time frame end
            // mixer[0].addEventListener( 'finished', ( event ) => {
            //   console.log( 'Finished animation action: ', event.action );
            //   // start next animation
            // });
          }

        },
        (progress) => {
          //this callback DURING loading philez
        },
        ( error ) => {
          console.error( error );
        }
      ); // loader.load(

    });

  } // loadGLTFPhilez()

  const debugcam = () => {
    var nice = [];
    // nice[0] = "cube:" + Object.keys(mixer[0].clipAction(objects[0].animations[0])) ;
    nice[1] = "y:" + camera.rotation.y.toFixed(6).padStart(10, '0');
    nice[2] = "z:" + camera.rotation.z.toFixed(6).padStart(10, '0');
    nice[3] = "posx:" + (movement[mov_R] - movement[mov_L]); //cube.position.x.toFixed(6).padStart(10, '0');
    nice[4] = "posy:" + (movement[mov_U] - movement[mov_D]); //cube.position.y.toFixed(6).padStart(10, '0');
    nice[5] = "rotz:" + cube.rotation.z.toFixed(6).padStart(10, '0');
    nice[6] = "mov:" + movement;
    document.getElementById("info").innerHTML=nice.join('<br/>');
  }

  //
  loadGLTFPhilez(
    [
      "monitoringo.glb",
      "stage.glb"
      // "lilhouse.glb",
    ]
  );

  var cube = new THREE.Mesh( geometry, material );
  // console.log("obj", objects[1]);
  let ballz = [null];
  const createball = () => {
    let plasmaBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 4),
      new THREE.MeshBasicMaterial({
                 color: "aqua"
               }));

    let theta = -cube.rotation.z ;// * Math.PI/180;

    plasmaBall.position.x = cube.position.x-( 1*Math.cos(theta));
    plasmaBall.position.y = cube.position.y+( 1*Math.sin(theta));
    plasmaBall.position.z = 2.5;

    plasmaBall.quaternion.copy(cube.quaternion); // apply cube's quaternion
    scene.add(plasmaBall);
    let index = ballz.indexOf(null);
    if(index==-1) {
      ballz.push(plasmaBall);
    } else {
      ballz[index] = plasmaBall;
    }
    console.log("balllen", ballz.length);
    // ballz.push(plasmaBall);
  };


  var running = false;
  var shotstart = 0;
  const setAnimation = (isRunning) => {
    if(isRunning == running || movement[mov_SHOT]) return; //dont overwrite animation or shooting
    running = isRunning //set state for next iteration

    if(isRunning===false){
      mixer[0].clipAction( animations['monitoringo.glb'].Shooting ) .stop();
      mixer[0].clipAction( animations['monitoringo.glb'].Running )  .stop();
      mixer[0].clipAction( animations['monitoringo.glb'].Breathing ).play();
    } else {
      mixer[0].clipAction( animations['monitoringo.glb'].Shooting ) .stop();
      mixer[0].clipAction( animations['monitoringo.glb'].Breathing ).stop();
      mixer[0].clipAction( animations['monitoringo.glb'].Running )  .play();
    }
  } // const setAnimation = (isRunning) =>

  const shot = () => {
    if(movement[mov_SHOT]==1 && shotstart == 0){
      shotstart          = mixer[0].time;
      mixer[0].clipAction( animations['monitoringo.glb'].Shooting ).reset();
      createball();
    }
  }
  document.addEventListener(
    "keydown",
    (event) => {
        switch(event.which){
          case 32:
                  if(movement[mov_SHOT]==0) shotstart = 0;
                  movement[mov_SHOT] = 1;
                  break; //cant move when shooting
          case 38: movement[mov_U]    = 1; break;
          case 40: movement[mov_D]    = 1; break;
          case 37: movement[mov_L]    = 1; break;
          case 39: movement[mov_R]    = 1; break;
          default: console.log(event.which); break;
        } // switch(event.which)
    },
    false
  );

  document.addEventListener(
    "keyup",
    (event) => {
        switch(event.which){
          case 32: movement[mov_SHOT] = 0; break; //cant move when shooting
          case 38: movement[mov_U]    = 0; break;
          case 40: movement[mov_D]    = 0; break;
          case 37: movement[mov_L]    = 0; break;
          case 39: movement[mov_R]    = 0; break;
          // case 32: movement[mov_SHOT] = 0; break; //we dont unset shooting until end of animation
        }
    },
    false
  );

  // const translateOnAxis = ( pos, axis, distance ) => {
  //
	// 	// translate object by distance along axis in object space
	// 	// axis is assumed to be normalized
  //
	// 	pos.copy( axis ).applyQuaternion( this.quaternion );
  //
	// 	this.position.add( pos.multiplyScalar( distance ) );
  //
	// 	return this;
  //
	// }

  let xvector    = new THREE.Vector3(0,0,10);
  let yvector    = new THREE.Vector3(0,0,10);
  let xtarget    = new THREE.Vector3(0,0,10);
  let ytarget    = new THREE.Vector3(0,0,10);
  let balltarget = new THREE.Vector3(0,0, 0);
  let ballvector = new THREE.Vector3(0,0, 0);

  let xray       = new THREE.Raycaster();
  let yray       = new THREE.Raycaster();
  let ballray    = new THREE.Raycaster();
;
  let direction_x, direction_y;

  const animate = function () {
    requestAnimationFrame( animate );
    let delta   = clock.getDelta();

    // points[0] = cube.position;
    // if(ballz[ballz.length-1]) {
    //   points[2] = ballz[ballz.length-1].position;
    //   points[3] = zerovector;
    // }

    ballz.forEach((b, i) => {
      if(!b) {
        // console.log("empty ball");
        return;
      }
      balltarget.x=(b.position.x);
      balltarget.y=(b.position.y);
      balltarget.z=4;//(b.position.z);

      b.translateY(-40 * delta); // move along the local z-axis

      ballvector.x=(cube.position.x - balltarget.x);
      ballvector.y=(cube.position.y - balltarget.y);
      ballvector.z=4;//(b.position.z);
      ballvector.normalize();

      ballray.set(balltarget, ballvector);
      let ballbound = ballray.intersectObject(objects[1].scene.children[0]);
      if(ballbound[0] && ballbound[0].distance < 2){
        // console.log(ballbound);
        b.position.x=1000;
        b.position.y=1000;
        b.position.z=1000;
        ballz[i] = null;
      }

    });

    direction_x = (movement[mov_R] - movement[mov_L]);
    direction_y = (movement[mov_U] - movement[mov_D]);

    let rotz = Math.atan2(
       direction_x,
      -direction_y
    ); // witchcraft from stockoverflaw

    if(direction_x || direction_y){
      cube.rotation.z = rotz;
      setAnimation(true);
    } else {
      setAnimation(false);
    }

    if(movement[mov_SHOT]){
    // if(shotstart!=0) {
      running = false;

      mixer[0].clipAction( animations['monitoringo.glb'].Running )  .stop();
      mixer[0].clipAction( animations['monitoringo.glb'].Breathing ).stop();
      mixer[0].clipAction( animations['monitoringo.glb'].Shooting ) .play();

      if( (mixer[0].time-shotstart) >= animations['monitoringo.glb'].Shooting.duration) {
        mixer[0].clipAction( animations['monitoringo.glb'].Shooting ) .stop();
        mixer[0].clipAction( animations['monitoringo.glb'].Breathing ).play();

        shotstart          = 0;
        shot();

      }
    } else {
      // direction_x = (movement[mov_R] - movement[mov_L]);
      // direction_y = (movement[mov_U] - movement[mov_D]);

      if(direction_x || direction_y){
        xtarget.copy(cube.position); xtarget.z = 1.5;
        xvector.z = 0; xvector.y = 0; xvector.x = direction_x; xvector.normalize(); xray.set(xtarget, xvector);
        let xbound = xray.intersectObject(objects[1].scene.children[0]);

        ytarget.copy(cube.position); ytarget.z = 1.5;
        yvector.z = 0; yvector.x = 0; yvector.y = direction_y; yvector.normalize(); yray.set(ytarget, yvector);
        let ybound = yray.intersectObject(objects[1].scene.children[0]);
      /**
        // debug movement
        points[1].x = cube.position.x;
        points[1].y = cube.position.y;
        if(xbound[0]) points[0] = xbound[0].point;
        if(ybound[0]) points[2] = ybound[0].point;
        //
        linegeo.setFromPoints(points);
        if(xbound.length>1)console.log("xbound",xbound[0].distance);
        if(ybound.length>1)console.log("ybound",ybound[0].distance);
      /**/
        if(xbound.length>0 && xbound[0].distance>1.5){
          cube.position.x += direction_x*(delta*30);
        }
        if(ybound.length>0 && ybound[0].distance>1.5){
          cube.position.y += direction_y*(delta*30);
        }

        setAnimation(true);
      } else {
        setAnimation(false);
      }
    }

    camera.position.x = cube.position.x;
    camera.position.y = cube.position.y-1;

    camera.lookAt(cube.position);
    // scenemixer.update( clock.getDelta() );

    if(mixer) mixer.forEach((mix) => {
                // console.log(mix);
                mix.update( delta );
              });

    // if(movement[2] == 1) {
    //   mixer[0].clipAction( objects[0].animations[0] ).reset().play();
    // }

    // renderer.render( scene, camera );
    composer.render();
    debugcam();
  };

  animate();

  window.addEventListener(
    'resize',
    ()=>{
    	camera.aspect = window.innerWidth / window.innerHeight;
    	camera.updateProjectionMatrix();
    	renderer.setSize( window.innerWidth, window.innerHeight );
      fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( window.innerWidth  * renderer.getPixelRatio() );
      fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( window.innerHeight * renderer.getPixelRatio() );
    },
    false
);
