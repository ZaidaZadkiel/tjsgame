  import playSound from './MusicPlayer.js'
  import * as THREE from 'https://cdn.skypack.dev/three@0.134.0';

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );
  const renderer = new THREE.WebGLRenderer();

  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

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

  const linematerial = new THREE.LineBasicMaterial( { color: 0x0000ff } );
  const points = [
    new THREE.Vector3( -10,  -10,  0 ) ,
    new THREE.Vector3( -10,   10,  0 ) ,
    new THREE.Vector3(  10,   10,  0 ) ,
    new THREE.Vector3(  10,  -10,  0 ) ,
    new THREE.Vector3( -10,  -10,  0 )
  ];

  const linegeo = new THREE.BufferGeometry().setFromPoints( points );
  const line    = new THREE.Line( linegeo, linematerial );
  scene.add( line );

  camera.up = new THREE.Vector3( 0, 0 , 1 );

  camera.position.z = 30;
  camera.position.y = -30;

  const environment    = new RoomEnvironment();
  const pmremGenerator = new THREE.PMREMGenerator( renderer );
  const loader         = new GLTFLoader();
  scene.background     = new THREE.Color( 0xbbbbbb );
  scene.environment    = pmremGenerator.fromScene( environment ).texture;
  const movement       = [0,0,0]; //Y pos X pos Animation on/off

//-----Sound--------------------------

document.addEventListener("click", () => {
    //sound.loop = true;
  playSound("sound/test.mp3", 0.5, false);
})
//--------------------------------------





  console.log("flag");
  var mixer   = [];
  var scenemixer = new THREE.AnimationMixer( scene );
  var objects = [];

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
          objects[i] = gltf;
          mixer[i]   = new THREE.AnimationMixer( gltf.scene );
          // console.log(objects[i]);
          console.log(i, mixer);
          // console.log(gltf.animations);
          if(Array.isArray(gltf.animations) && gltf.animations[0]){
            var action = mixer[i].clipAction( gltf.animations[ 0 ] )
            action.loop = THREE.LoopRepeat;
            action.reset().play();
            console.log("loled");
          }

          scene.add( gltf.scene );

          if(i == 0){
            console.log("cube", gltf.scene);
            cube = gltf.scene;
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
    nice[0] = "cube:" + Object.keys(mixer[0].clipAction(objects[0].animations[0])) ;
    nice[1] = "y:" + camera.rotation.y.toFixed(6).padStart(10, '0');
    nice[2] = "z:" + camera.rotation.z.toFixed(6).padStart(10, '0');
    nice[3] = "posx:" + cube.position.x.toFixed(6).padStart(10, '0');
    nice[4] = "posy:" + cube.position.y.toFixed(6).padStart(10, '0');
    nice[5] = "rotz:" + cube.rotation.z.toFixed(6).padStart(10, '0');
    nice[6] = "mov[2]:" + movement[2];
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

  var running = false;
  const setRunning = (isRunning) => {
    running = isRunning
    if(isRunning===false){
      mixer[0].clipAction( objects[0].animations[1] ).stop();
      mixer[0].clipAction( objects[0].animations[0] ).play();
    } else {
      mixer[0].clipAction( objects[0].animations[0] ).stop();
      mixer[0].clipAction( objects[0].animations[1] ).play();
    }
  }

  document.addEventListener(
    "keydown",
    (event) => {
        //hardcoder4lyf bby
        switch(event.which){
          case 87:
            movement[0] =  0.1;
            movement[2] = 1
            cube.rotation.z = -3.15; //idk why those values
            if(running == false) setRunning(true);
            break;
          case 83:
            movement[0] = -0.1;
            movement[2] = 1
            cube.rotation.z = 0;
            if(running == false) setRunning(true);
            break;
          case 65:
            movement[1] = -0.1;
            movement[2] = 1
            if(running == false) setRunning(true);
            cube.rotation.z = -1.6;
            break;
          case 68:
            movement[1] =  0.1;
            movement[2] = 1
            if(running == false) setRunning(true);
            cube.rotation.z = 1.6;
            break;
        }
    },
    false
  );

  document.addEventListener(
    "keyup",
    (event) => {
        //hardcoder4lyf bby
        switch(event.which){
          case 87:
          case 83:
            if(running==true) setRunning(false);
            movement[0] = 0;
            movement[2] = 0;
            break;
          case 65:
          case 68:
            if(running==true) setRunning(false);
            movement[1] = 0;
            movement[2] = 0;
            break;
        }
    },
    false
  );

  const animate = function () {
    requestAnimationFrame( animate );
    let delta = clock.getDelta();
    cube.position.x += movement[1];
    cube.position.y += movement[0];
    camera.lookAt(cube.position);
    // scenemixer.update( clock.getDelta() );

    if(mixer) mixer.forEach((mix) => {
                // console.log(mix);
                mix.update( delta );
              });

    // if(movement[2] == 1) {
    //   mixer[0].clipAction( objects[0].animations[0] ).reset().play();
    // }

    renderer.render( scene, camera );
    debugcam();
  };

  animate();


