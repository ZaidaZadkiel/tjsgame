  import * as THREE         from 'three';
  import { FXAAShader }     from 'three/examples/jsm/shaders/FXAAShader.js';
  import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
  import { ShaderPass }     from 'three/examples/jsm/postprocessing/ShaderPass.js';
  import { RenderPass }     from 'three/examples/jsm/postprocessing/RenderPass.js';

  let loadingscreen = document.getElementById("progress");
  loadingscreen.style.visibility="visible";

  let options = JSON.parse(localStorage.getItem("options"));
  if(!options){
    options = {
      use_aa  :   false,
      use_osd :   false,
      run_demo:   false,
      play_sound: true,
      do_board:   false
    };
  }

  console.log(options);

  const audioDebug = !options.play_sound
  console.log("audioDebug", audioDebug);
  let demo      = options.run_demo;
  var demotime  = 0;
  var demoindex = 0;


  const manager = new THREE.LoadingManager();
  manager.onStart = function ( url, itemsLoaded, itemsTotal ) {
  	console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
  };

  manager.onLoad = function ( ) {
  	// console.log( 'Loading complete!');
    loadingscreen.style.visibility="hidden";
    document.getElementById("info").style.visibility="hidden";

    if(!audioDebug) sound.play();
    createTurret();
    createTurret();
    createTurret();

    lights.map(l=>scene.add(l));

    animate();

    // renderer.shadowMapEnabled = true;
    // renderer.shadowMapSoft = true;
    // renderer.shadowMapType = THREE.PCFShadowMap;



  };


  manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
  	// console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    loadingscreen.style.width=`${(100*itemsLoaded)/itemsTotal}%`;
    // console.log(loadingscreen.style.width)
  };

  manager.onError = function ( url ) {
  	console.log( 'There was an error loading ' + url );
  };


  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 10, 300 );
  const renderer = new THREE.WebGLRenderer({alpha: true, antialias: (!!options.use_aa)});
  const debug    = document.getElementById("debug");

  // scene.fog = new THREE.Fog(new THREE.Color(0xc0c0c0), 100, 150);
  renderer.debug.checkShaderErrors = false;
  renderer.autoClear = false;
  renderer.setSize( window.innerWidth, window.innerHeight );
  // renderer.physicallyCorrectLights = true;
  // renderer.outputEncoding = THREE.sRGBEncoding;
  // renderer.setPixelRatio( window.devicePixelRatio );
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  // renderer.outputEncoding = THREE.sRGBEncoding;

  document.body.appendChild( renderer.domElement );

  // import { OrbitControls }   from 'three/examples/jsm/controls/OrbitControls.js';
  import { GLTFLoader }      from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

  // const controls  = new OrbitControls(camera, renderer.domElement);
  const imgloader = new THREE.TextureLoader(manager);
  const geometry  = new THREE.BoxGeometry();
  const material  = new THREE.MeshBasicMaterial({map: imgloader.load("img/wall.jpg") });
  const clock     = new THREE.Clock();
  material.flatShading = true;


  var linematerial;
  var points;
  var linegeo;
  var line;
  if(false){ //debug line to show stuff on world space
    linematerial = new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 2 } );
    points = [
      new THREE.Vector3( -10,  -10,  10 ) ,
      new THREE.Vector3( -10,   10,  10 ) ,
      // new THREE.Vector3(  10,   10,  10 ) ,
      // new THREE.Vector3(  10,  -10,  10 ) ,
      // new THREE.Vector3( -10,  -10,  10 )
    ];
    linegeo = new THREE.BufferGeometry().setFromPoints( points );
    line    = new THREE.Line( linegeo, linematerial );
    line.frustumCulled = false;
    scene.add( line );
  }

  camera.up = new THREE.Vector3( 0, 0 , 1 );
  camera.position.z = demo==true ? 15 : 55;
  camera.position.y = -30;

  const environment    = new RoomEnvironment();
  const pmremGenerator = new THREE.PMREMGenerator( renderer );
  pmremGenerator.compileEquirectangularShader();

  const loader         = new GLTFLoader(manager);
  scene.background     = new THREE.Color( 0xbbbbbb );
  scene.environment    = pmremGenerator.fromScene( environment ).texture;
  const movement       = [0,0,0,0, 0, 0]; //Y pos X pos Animation on/off
  const mov_L    = 0;
  const mov_R    = 1;
  const mov_U    = 2;
  const mov_D    = 3;
  const mov_ANI  = 4;
  const mov_SHOT = 5;
  const mov_HURT = 6;


  // let composer, fxaaPass;
  // const renderPass = new RenderPass( scene, camera );
  // composer = new EffectComposer( renderer );
  // composer.addPass( renderPass );

  // if(options.use_aa === true){
  //         fxaaPass   = new ShaderPass( FXAAShader );
  //   const pixelRatio = renderer.getPixelRatio();
  // 	fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( window.innerWidth * pixelRatio );
  // 	fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( window.innerHeight * pixelRatio );
  //   composer.addPass( fxaaPass );
  // }



//-----Sound--------------------------


const listener = new THREE.AudioListener();
;


let sound     = new THREE.Audio(listener);
let pew       = null; //new THREE.AudioBuffer(listener);
let bang      = null; //new THREE.AudioBuffer(listener);
let taptap    = null;
let walking   = null;
let tankmotor = null
let kapow     = null

const audioLoader = new THREE.AudioLoader(manager);
audioLoader.load( "./sound/test.mp3", function( buffer ) {
  // console.log("bgm");
  sound.setBuffer( buffer );
  sound.setLoop( true );
  sound.setVolume( 0.05 );
});
audioLoader.load( "./sound/tank.mp3", function( buffer ) {
  // console.log("tank");
  tankmotor = buffer;
});
audioLoader.load( "./sound/pew.mp3", function( buffer ) {
  // console.log("pew");
  pew  = buffer;
});
audioLoader.load( "./sound/bang.mp3", function( buffer ) {
  // console.log("bang");
  bang = buffer;
});
audioLoader.load( "./sound/kapow.mp3", function( buffer ) {
  // console.log("kapow");
  kapow = buffer;
});
audioLoader.load( "./sound/taptap.mp3", function( buffer ) {
  // console.log("taptap");
  taptap = buffer;
  walking = new THREE.Audio(listener);
  walking.setBuffer(taptap);
  walking.setVolume(0.25);
  walking.setLoop(true);
});

//--------------------------------------





  var scenemixer = new THREE.AnimationMixer( scene );
  var mixer      = [];
  var objects    = [];
  var animations = [];
  var walls      = null;
  var floor      = null;

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
          objects[path] = gltf;

          if(gltf.animations[0]){
            mixer[path] = new THREE.AnimationMixer( gltf.scene );
            gltf.animations.forEach((item, i) => {
              if(!animations[path]) animations[path] = {};
              animations[path][item.name] = item;
            });

            // var action = mixer[path].clipAction( animations[path][0] )
            // action.loop = THREE.LoopRepeat;
            // action.reset().play();
          }


          if(path == 'monitoringo.glb'){
            cube = gltf.scene;
            scene.add(cube);
            cube.add( listener );
            cube.position.z =1
            // magic values :D
            const playerMixer      = mixer     ['monitoringo.glb'];
            const playerAnimations = animations['monitoringo.glb'];
            playerMixer.clipAction( playerAnimations.Shooting ) .clampWhenFinished = true;
            playerMixer.clipAction( playerAnimations.Shooting ) .loop              = THREE.LoopOnce;
            playerMixer.clipAction( playerAnimations.Damaged )  .loop              = THREE.LoopOnce;
            playerMixer.clipAction( playerAnimations.Shooting ) .stop();
            playerMixer.clipAction( playerAnimations.Running )  .stop();
            playerMixer.clipAction( playerAnimations.Breathing ).play();
          }

          if(path == 'taquerocat.glb'){
            console.log("loled");
            gltf.scene.position.y = 13;
            gltf.scene.position.x = -10;
            scene.add( gltf.scene );

          }

          if(path=="stage.glb"){
            // console.log( gltf.scene );
            // scene.add( Object.values(gltf.scene.children).find(k=>k.name=="levelMesh") );
            scene.add( gltf.scene );
            // Object.values(gltf.scene.children).map(k=>k.visible = false );
            walls = Object.values(gltf.scene.children).find(k=>k.name=="walls" );
            floor = Object.values(gltf.scene.children).find(k=>k.name=="floor" );
            // walls.material.side = THREE.FrontSide;

            // walls.visible=false;

            // floor.visible=false;
            // scene.add( walls );
            // console.log(walls);
            // objects[path].scene.position.z=-100;
          }

          if(i > 1) return; //??? we just hide the turrets for now
          // scene.add( gltf.scene );

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
  loadGLTFPhilez(
    [
      "monitoringo.glb", //this guy is hardcoded at index 0, do not add above
      "stage.glb",
      "turret.glb",
      "taquerocat.glb"
    ]
  );


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

  document.addEventListener(
    "keydown",
    (event) => {
        // let d = Object.keys(animations['monitoringo.glb']).forEach((item, i) => {
        //   console.log(item, "isRunning", mixer['monitoringo.glb'].clipAction(animations['monitoringo.glb'][item]).isRunning());
        // });

        // if(movement[mov_SHOT]==1) return;
        switch(event.which){
          // case 80: createTurret(); break;
          case 68: ballz = []; break;
          case 32:
                  if(movement[mov_SHOT]==0) shotstart = 0;
                  movement[mov_SHOT] = 2;
                  break; //cant move when shooting
          case 38: movement[mov_U]    = 1; break;
          case 40: movement[mov_D]    = 1; break;
          case 37: movement[mov_L]    = 1; break;
          case 39: movement[mov_R]    = 1; break;
          default:
            // console.log(`new THREE.Vector3(${cube.position.x.toFixed(3)}, ${cube.position.y.toFixed(3)}, 0),`);
            // console.log(event.which)
            break;
        } // switch(event.which)
      },
      false
    );

    document.addEventListener(
      "keyup",
      (event) => {
          switch(event.which){
            case 32: movement[mov_SHOT]--;   break; //cant move when shooting
            case 38: movement[mov_U]    = 0; break;
            case 40: movement[mov_D]    = 0; break;
            case 37: movement[mov_L]    = 0; break;
            case 39: movement[mov_R]    = 0; break;
            // case 32: movement[mov_SHOT] = 0; break; //we dont unset shooting until end of animation
          }
      },
      false
    );

  var cube = new THREE.Mesh( geometry, material );


  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

  var turrets         = [];
  var turretMixer     = [];
  var turretAction    = []
  var turretpositions = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-76.407, -135.438, 0),
    new THREE.Vector3(-39.942, -133.980, 0),
    new THREE.Vector3(-44.943, -106.047, 0),
    new THREE.Vector3( 39.213, -102.942, 0),
    new THREE.Vector3(-48.126,  69.936,  0),
    new THREE.Vector3(-53.970, -16.329,  0),
    new THREE.Vector3(-53.970, -45.267,  0),
    new THREE.Vector3(-14.607, -52.563,  0),
    new THREE.Vector3( 21.858, -52.563,  0),
    new THREE.Vector3(-22.524, -92.985,  0),
    new THREE.Vector3( 15.411, -92.985,  0),
    new THREE.Vector3( 73.296, -149.442, 0),
    new THREE.Vector3( 39.123, -149.442, 0),
    new THREE.Vector3(  1.416, -149.442, 0),
    new THREE.Vector3(-90.252, -97.587,  0),
    new THREE.Vector3(-90.252, -89.241,  0),
    new THREE.Vector3(-90.252, -75.495,  0),
    new THREE.Vector3(-90.252, -25.926,  0),
    new THREE.Vector3(-90.252,  17.616,  0),
    new THREE.Vector3(-90.252,  65.325,  0),
    new THREE.Vector3(-90.252,  105.330, 0),
    new THREE.Vector3(-43.596,  114.270, 0),
    new THREE.Vector3( 11.619,  114.270, 0),
    new THREE.Vector3( 60.138,  114.270, 0),
    new THREE.Vector3( 73.896,  73.659,  0),
    new THREE.Vector3( 54.549,  73.659,  0),
    new THREE.Vector3( 60.939,  90.030,  0),
    new THREE.Vector3( 39.213, -139.179, 0)
  ];

  const removeturret = (index)=> {
    // console.log("removing", index, turrets[index]);
    createexplosion(turrets[index]);

    if(!audioDebug) {
      // console.log(
      //   "children", turrets[index].children,
      //   "find", turrets[index].children.find(k=>k.type=='Audio').stop()
      // );
      turrets[index].children.find(k=>k.type=='Audio').stop();
    }

    scene.remove(turrets[index]);
    scene.remove(turrets[index].children.find(k=>k.type=='Audio'));
    turrets      .splice(index,1);//= null;
    turretMixer  .splice(index,1);//= null;
    turretAction .splice(index,1);//= null;
  }

  var turrcount = 0;
  const createTurret = () => {
    // turrcount++;
    // if(turrcount>1)
    return;



    if(turrets.length > 10) return;

    const cloneMaterial = (item) => {
      //material outline is defined in blender file
      if(!item.material || item.material.name == "outline") return;
      item.material = item.material.clone();
      // console.log("item.material", item.material.name)
    };

    let turret = objects["turret.glb"].scene.clone();
    let lifemeter = life.clone();
    turret.add(lifemeter);

    // turret.position.set(1,1,0);
    turret.position.copy(turretpositions[getRandomInt(turretpositions.length-1)]);

    cloneMaterial(turret);
    var i = turret.children.length;
    // console.log(i, turret.children.length)
    while(i--){
      cloneMaterial(turret.children[i])
      if(turret.children[i].children.length){
        var n = turret.children[i].children.length;
        while(n--) cloneMaterial(turret.children[i].children[n]);
      }

    }
    //turret.children[0].children




    const t_mixer = new THREE.AnimationMixer(turret);
    const turretAnims = animations["turret.glb"];

    t_mixer.clipAction(turretAnims.BODYROLLIN).play();
    t_mixer.clipAction(turretAnims.WHEELROLLIN).play();

    const tanksound = new THREE.PositionalAudio(listener);
    tanksound.setBuffer(tankmotor);
    tanksound.setVolume(8);
    tanksound.setLoop(true);
    if(!audioDebug) tanksound.play();
    turret.add(tanksound);

    scene.add(turret);

    var index = turrets.indexOf(null);
    if(index == -1){
      turretMixer.push(t_mixer);
      turrets.push(turret);
      turretAction.push({life: lifemeter, health: 10})
    } else {
      turrets[index]      = turret;
      turretMixer[index]  = t_mixer;
      turretAction[index] = {life: lifemeter, health: 10};
    }
  };

  var plasmaballmaterial = new THREE.MeshLambertMaterial({
                             color:             "aqua",
                             emissive:          "aqua",
                             emissiveIntensity: 2
                           });
   var cannonballmaterial = new THREE.MeshBasicMaterial({
                              color: "yellow"
                            });

  var explosionmaterial  = new THREE.MeshBasicMaterial({
                             color: "yellow",
                             map  : imgloader.load("img/Lava_Texture_preview.jpg")
                           });

  const planelife  = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
  const life  = new THREE.Mesh( new THREE.PlaneGeometry( 4, 0.3 ), planelife );
  life.position.x = 0;
  life.position.y = 0;
  life.position.z = 7;




  let plasmaBallGeo = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 4, 4),
    plasmaballmaterial
  );


  let ballz = [];
  const createball = () => {
    // console.log("created", ballz.length)
    let plasmaBall = plasmaBallGeo.clone()
    let plasmapew  = new THREE.PositionalAudio(listener);

    plasmapew.setBuffer(pew);
    plasmapew.setVolume(10);
    if(!audioDebug) plasmapew.play();

    plasmaBall.add(plasmapew);
    scene     .add(plasmaBall);

    let theta = -cube.rotation.z ;// * Math.PI/180;
    let x     = cube.position.x -( 0.8*Math.cos(theta));
    let y     = cube.position.y +( 0.8*Math.sin(theta));
    let z     = cube.position.z+2.5;

    plasmaBall.position.x = x;
    plasmaBall.position.y = y;
    plasmaBall.position.z = z;
    plasmaBall.quaternion.copy(cube.quaternion); // apply cube's quaternion
    plasmaBall.translateY(-1); // move along the local y-axis
    plasmaBall.scale.y = 2;

    balltarget.x=x;
    balltarget.y=y;
    balltarget.z=z;

    ballvector.x=(plasmaBall.position.x - x);
    ballvector.y=(plasmaBall.position.y - y);
    ballvector.z=0;

    ballvector.normalize();

    ballray.set(balltarget, ballvector);
    let ballbound = ballray.intersectObject(walls);

    if(ballbound[0]) {
      plasmaBall.target = ballbound[0].point;
    } else {
      //this ugly. Makes target somewhere off screen
      plasmaBall.target = new THREE.Vector3();
      plasmaBall.target.x=(plasmaBall.position.x - x);
      plasmaBall.target.y=(plasmaBall.position.y - y);
      plasmaBall.target.z=0;

      plasmaBall.target.multiplyScalar(50);
      plasmaBall.target.add(plasmaBall.position);
    }
    // console.log(plasmaBall.target);

    ballz.push(plasmaBall);
  };

  let cannonBallGeo = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 4, 4),
    cannonballmaterial
  );
  const cannons = [];
  const createcannon = (mesh) => {
    let plasmaBall = cannonBallGeo.clone();
    let theta      = -mesh.rotation.z ;// * Math.PI/180;

    plasmaBall.position.x = mesh.position.x;//-( 1*Math.cos(theta));
    plasmaBall.position.y = mesh.position.y;//+( 1*Math.sin(theta));
    plasmaBall.position.z = 3;
    plasmaBall.quaternion.copy(mesh.quaternion); // apply mesh's quaternion

    balltarget.x=(plasmaBall.position.x);
    balltarget.y=(plasmaBall.position.y);
    balltarget.z=4;//(plasmaBall.position.z);

    plasmaBall.translateY(-1); // move along the local y-axis

    ballvector.x=(plasmaBall.position.x - balltarget.x)*10;
    ballvector.y=(plasmaBall.position.y - balltarget.y)*10;
    ballvector.z=0;//(plasmaBall.position.z);
    ballvector.normalize();

    ballray.set(balltarget, ballvector);

    let ballbound = ballray.intersectObject(walls);

    plasmaBall.target = ballbound[0].point;

    // if(ballbound[0] && ballbound[0].distance < 2 && ballbound[0].object.uuid != b.uuid){
    //   deleteCannon(b, cannonindex);
    // }


    const plasmapew = new THREE.PositionalAudio(listener);
    plasmapew.setBuffer(kapow);
    plasmapew.setVolume(10);
    if(!audioDebug) plasmapew.play();

    plasmaBall.add(plasmapew);
    plasmaBall.turret = mesh;
    scene.add(plasmaBall);

    let index = cannons.indexOf(null);
    if(index==-1) {
      cannons.push(plasmaBall);
    } else {
      cannons[index] = plasmaBall;
    }
  }; // const createcannon = (mesh) =>

  let boomz = [null];
  let lights = [
    new THREE.PointLight( 0xffffff, 0, 50 ),
    new THREE.PointLight( 0xffffff, 0, 50 ),
    new THREE.PointLight( 0xffffff, 0, 50 )
  ];
  let lightindex = [99,99,99]; // ugly hack to avoid stutters

  let explosionMesh = new THREE.Mesh(
    new THREE.SphereGeometry(4, 4, 4),
    explosionmaterial
  );

  const createexplosion = (ball) => {
    if(!ball) return;
    let plasmaBall = explosionMesh.clone()

    plasmaBall.position.x = ball.position.x;//-( 1*Math.cos(theta));
    plasmaBall.position.y = ball.position.y;//+( 1*Math.sin(theta));
    plasmaBall.position.z = ball.position.z+1;

    plasmaBall.scale.x=0.15;
    plasmaBall.scale.y=0.15;
    plasmaBall.scale.z=0.15;

    const plasmabang = new THREE.PositionalAudio(listener);
    plasmabang.setBuffer(bang);
    plasmabang.setVolume(10);
    if(!audioDebug) plasmabang.play();

    let index = boomz.indexOf(null);
    if(index==-1) {
      boomz.push(plasmaBall);
      index=boomz.length-1;
    } else {
      boomz[index] = plasmaBall;
    }

    const li = lightindex.findIndex(l=>l==99);
    // console.log("add", li, lightindex, lights);
    if(li != -1) {
      const light = lights[li];
      lightindex[li] = index;
      light.visible=true;
      light.castShadow = false;
      light.intensity = 15;
      light.position.set(
        plasmaBall.position.x,
        plasmaBall.position.y,
        plasmaBall.position.z,
      );
      plasmaBall.magicValue = li;
      // scene.add( light );
    }

    plasmaBall.add(plasmabang);
    scene     .add(plasmaBall);


    return;
  }

  let damageTime = 0;
  const doDamaged = () => {
    // movement.fill(0);
    movement[mov_HURT] = 1;
    const playerMixer = mixer     ['monitoringo.glb'];
    const playerAnims = animations['monitoringo.glb'];
    Object.keys(playerAnims).forEach((item, i) => {
      playerMixer.clipAction(playerAnims[item]).stop();
    });
    playerMixer.clipAction(playerAnims.Damaged).play();
    damageTime = 0;
  }

  var running   = null;
  var shotstart = 0;
  const setAnimation = (isRunning) => {
    if(isRunning == running || movement[mov_SHOT]) return; //dont overwrite animation or shooting

    running                = isRunning //set state for next iteration
    const playerMixer      = mixer     ['monitoringo.glb'];
    const playerAnimations = animations['monitoringo.glb'];
    if(!playerMixer) return;

    if(isRunning===false){
      playerMixer.clipAction( playerAnimations.Breathing ).play();
      playerMixer.clipAction( playerAnimations.Shooting ) .stop();
      playerMixer.clipAction( playerAnimations.Running )  .stop();
      if(!audioDebug && walking.isPlaying) walking.stop();
    } else {
      playerMixer.clipAction( playerAnimations.Running )  .play();
      playerMixer.clipAction( playerAnimations.Shooting ) .stop();
      playerMixer.clipAction( playerAnimations.Breathing ).stop();
      if(!audioDebug && walking!=null) walking.play();
    }
  } // const setAnimation = (isRunning) =>

  const tankStates = [
    "rot", "mov", "shot"
  ];
  const doTurretAction = (index, delta) => {
    let t      = turretAction[index];
    let turret = turrets[index];
    if(!t) return;

    const eneanim  = animations['turret.glb'];
    const enemixer = turretMixer[index];

    const materialupdate = (item) => {
      if(
        item.material &&
        item.material.name != "outline" &&
        item.material.emissive
        // item.material.emissive.r>=0
      ) {
        item.material.emissive.r-=4*delta;//setHex(item.material.emissive.getHex()-1*delta);
        item.material.emissive.g-=4*delta;//setHex(item.material.emissive.getHex()-1*delta);
        item.material.emissive.b-=4*delta;//setHex(item.material.emissive.getHex()-1*delta);
        if(item.material.emissive.r<0){
          item.material.emissive.r=0;
          item.material.emissive.g=0;
          item.material.emissive.b=0;
        }
      }
    }

    // console.log(turret);
    materialupdate(turret);
    var len = turret.children.length;
    while(len--){
      materialupdate(turret.children[len]);
      if(turret.children[len].children.length > 0){
        var n = turret.children[len].children.length;
        while(n--) materialupdate(turret.children[len].children[n]);
      }
    }
    // [    turret,
    //   ...turret.children,
    //   ...turret.children[0].children
    // ].forEach((item, i) => );
    // if(t.material && t.material.emissive.getHex() ) t.material.emissive.setHex(t.material.emissive.getHex()/2);
// t.state="rot";
    // turret.translateY(-10 * delta);
    switch(t.state){
      case "rot":
        if(!t.moving){
            t.direction = getRandomInt(2)==1 ? -1 : 1; //rotate left or right
            t.timeMove  = getRandomInt(3000)/1000; // how long to rot
            t.timeDelta = 0;
            t.moving    = true;
            // console.log(t)
            break;
        }

        if(turret.position.distanceTo(cube.position) < 35) {
          let vectorB = cube.position;
          let vectorA = turret.position;
          let radang  = Math.atan2(
                          vectorA.y - vectorB.y,
                          vectorA.x - vectorB.x
                        );
          let a = turret.rotation._z+1.6;
          let b = radang;
          t.angleTo   = Math.atan2(Math.sin(b-a), Math.cos(b-a))

          turret.rotateZ(0.01 * Math.sign(t.angleTo));
        } else {
          turret.rotateZ(0.01 * t.direction);
        }

        if(t.timeDelta > t.timeMove || Math.abs(t.angleTo) < 0.05){
          t.state = "mov";
          t.moving = false;
        }
        break;
      case "mov":
        if(!t.moving){
          t.timeMove  = getRandomInt(3000)/1000; // how long to rot
          t.timeDelta = 0;
          t.moving = true;
          t.reverse = -1;
          break;
        }

        const ray = () => {
          balltarget.copy(turret.position);
          balltarget.z=3;

          turret.translateY(t.reverse);

          ballvector.x=(turret.position.x-balltarget.x)*10;
          ballvector.y=(turret.position.y-balltarget.y)*10;
          ballvector.z=0;
          ballvector.normalize();

          ballray.set(balltarget, ballvector);
          let ballbound;
          ballbound = ballray.intersectObject(walls);

          turret.position.copy(balltarget);
          turret.position.z=0;

          if(ballbound[0] && ballbound[0].distance > 4){
            turret.translateY((6 * delta)*t.reverse);
          } else {
            t.reverse = 1;
          }
        }

        ray();

        // debug.innerHTML=`<pre>
        //   ${turret.position.distanceTo(cube.position)}
        // </pre>`

        if(t.timeDelta > t.timeMove || turret.position.distanceTo(cube.position) < 15){
          t.state = "shot";
          t.moving = false;
        }
        break;

      case "shot":
          if(t.moving == false){
            // console.log("flag");
            enemixer.clipAction(eneanim.BODYROLLIN) .stop();
            enemixer.clipAction(eneanim.BODYSHOOTIN).play();
            enemixer.clipAction(eneanim.CANSHOOTIN) .play();
            t.timeDelta = 0;
            t.moving=true;
            createcannon(turret)
            break;
          }

          if( t.timeDelta >= eneanim.BODYSHOOTIN.duration) {
            enemixer.clipAction(eneanim.BODYSHOOTIN).stop();
            enemixer.clipAction(eneanim.CANSHOOTIN) .stop();
            enemixer.clipAction(eneanim.BODYROLLIN) .play();

            t.moving = false;
            t.state  = "rot";
          }
          break;
      default: t.state = tankStates[getRandomInt(tankStates.length-1)];
    }
    t.timeDelta += delta;
    // debug.innerHTML=`<pre>${JSON.stringify(t, null, 2)}</pre>`;
  }

  const doTurretFrame = (delta) => {
    turrets.forEach((turret, i) => {
      if(turret == null) return;
      doTurretAction(i, delta);
      if(turretMixer[i])  turretMixer[i].update( delta );
    });
  }

  let health    = 4;
  let score     = 0;
  let level     = 0;
  let lastspawn = 0;

  let dot = 1;

  const updateStats = () => debug.innerHTML=`<pre>
  HEALTH: ${health < 0 ? "💀💀💀" : Array(health).fill('💟').join('')}
  SCORE:  ${score} (${turrets.length})
  LEVEL:  ${level>10?Array(Math.floor(level/10)).fill('🐲').join(''):''}${Array(level%11).fill('🪖').join('')}
  NEXT:   ${((20-level)-lastspawn).toFixed(2)}
  </pre>`;
  // MOVS:   ${osdTime}
  updateStats();


  let xvector    = new THREE.Vector3(0,0,10);
  let yvector    = new THREE.Vector3(0,0,10);
  let xtarget    = new THREE.Vector3(0,0,10);
  let ytarget    = new THREE.Vector3(0,0,10);
  let balltarget = new THREE.Vector3(0,0, 0);
  let ballvector = new THREE.Vector3(0,0, 0);

  let xray       = new THREE.Raycaster();
  let yray       = new THREE.Raycaster();
  let ballray    = new THREE.Raycaster();

  let damagePos  = new THREE.Vector3();

  const doCharacterMovement = (delta) => {
    const playerMixer = mixer     ['monitoringo.glb'];
    const playerAnims = animations['monitoringo.glb'];

    let direction_x, direction_y;
    direction_x = (movement[mov_R] - movement[mov_L]);
    direction_y = (movement[mov_U] - movement[mov_D]);

    let rotz = Math.atan2(
       direction_x,
      -direction_y
    ); // witchcraft from stockoverflaw

    if(direction_x || direction_y) cube.rotation.z = rotz;

    if(movement[mov_HURT]){
      damageTime += delta;
      direction_x = 0;
      direction_y = 0;

      if(damageTime > playerAnims.Damaged.duration) {
        movement[mov_HURT] = 0;
        playerMixer.clipAction(playerAnims.Damaged).stop();
        /// UGLY!
        if(
          movement[mov_D] ||
          movement[mov_U] ||
          movement[mov_L] ||
          movement[mov_R]
        ){
          playerMixer.clipAction(playerAnims.Running).play();
        } else if (movement[mov_SHOT]) {
          playerMixer.clipAction(playerAnims.Shooting).play();
        } else {
          playerMixer.clipAction(playerAnims.Breathing).play();
        }
      }
    }

    if(movement[mov_SHOT]){
      if(shotstart==0){
        running = false;
        playerMixer.clipAction( playerAnims.Running )  .stop();
        playerMixer.clipAction( playerAnims.Breathing ).stop();
        playerMixer.clipAction( playerAnims.Shooting ) .play();
        if(!audioDebug && walking && walking.source) walking.stop();
        createball();
      }

      shotstart+=delta;

      if( shotstart >= playerAnims.Shooting.duration) {
        playerMixer.clipAction( playerAnims.Shooting ) .stop();
        playerMixer.clipAction( playerAnims.Breathing ).play();

        shotstart = 0;
        movement[mov_SHOT] = movement[mov_SHOT]==2 ? 2 : 0;
        // console.log(cube.position)
      }
      return;
    }

    // cube.position.x += direction_x*(delta*30);
    // cube.position.y += direction_y*(delta*30);

    if(direction_x || direction_y){

      xtarget.set(
        cube.position.x + direction_x,
        cube.position.y + direction_y,
        cube.position.z + 3
      );
      xvector.z = -10;
      xvector.y = 0; //direction_y;
      xvector.x = 0; //direction_x;
      xvector.normalize(); xray.set(xtarget, xvector);
      xray.far = 5;
      let xbound = xray.intersectObjects(floor.children);
      // console.log(floor);

      if(!xbound[0]){
      // if(true){
        ytarget.set(
          cube.position.x,
          cube.position.y,
          cube.position.z + 3
        );
        yvector.z = 0;
        yvector.y = direction_y;
        yvector.x = direction_x;
        yvector.normalize(); yray.set(ytarget, yvector);
        yray.far = 10;
        let ybound = (
          walls.type==="Group"
            ? yray.intersectObjects(walls.children)
            : yray.intersectObject (walls)
        );

        if(ybound[0] && ybound[0].distance < 3){
          yvector.set(
            direction_x,//*(-30  * delta),
            direction_y,//*(-30 * delta),
            5
          );//.normalize();

          ytarget.copy(ybound[0].face.normal);
          ytarget.transformDirection(ybound[0].object.matrixWorld)
          ytarget.normalize();
          // ytarget.negate();

          // yvector.multiply(ytarget);
          // ytarget.projectOnPlane(yvector);
          // yvector.normalize();
          // ytarget.multiplyScalar(ytarget.dot(yvector));//.dot(ybound[0].face.normal);
          // ytarget.sub(ytarget);

          let v = ytarget;//.normalize();
          direction_x = v.x;
          direction_y = v.y;
          dot = direction_x + ", "+ direction_x;

          cube.position.x += direction_x*(delta*30);
          cube.position.y += direction_y*(delta*30);

          // Vector undesiredMotion = normal * (dotProduct(input, normal));
          // Vector desiredMotion = input - undesiredMotion
          // yvector.sub(ytarget);
          // ytarget.copy(cube.position);
          // ytarget.z = cube.position.z + 3;


          // points[0] = ytarget.add(ybound[0].point);
          // points[1] = ybound[0].point;
          // points[2] = yvector.add(ybound[0].point); // ytarget.add(ybound[0].point);
          // linegeo.setFromPoints(points);

          // yvector.multiplyScalar(yvector.dot(yvector));


          // // ytarget.multiplyScalar(30*delta)
          // ybound[0].point.sub(cube.position);
          // ybound[0].point.normalize();
          // // console.log(ybound[0]);
          // cube.position.x += (ybound[0].point.x*direction_x)*(delta*30);//*(delta*30);
          // cube.position.y += (ybound[0].point.y*direction_y)*(delta*30);//*(delta*30);
          return;
        }
      } else {
        cube.position.x += direction_x*(delta*30);
        cube.position.y += direction_y*(delta*30);
        cube.position.z = xbound[0].point.z+0.5;
      }

      setAnimation(true);
    } else {
      setAnimation(false);
    }

    //
    // if(false){
    //
    //     xtarget.copy(cube.position); xtarget.z = 1.5;
    //     xvector.z = 0;
    //     xvector.y = direction_y;
    //     xvector.x = direction_x;
    //     xvector.normalize(); xray.set(xtarget, xvector);
    //     let xbound = xray.intersectObject(walls);
    //     let ybound = [];
    //     // ytarget.copy(cube.position); ytarget.z = 1.5;
    //     // yvector.z = 0; yvector.x = 0; yvector.y = direction_y; yvector.normalize(); yray.set(ytarget, yvector);
    //     // let ybound = yray.intersectObject(walls);
    //
    //     if(xbound[0]){
    //       ytarget.set(
    //         // direction_x*10,
    //         // direction_y*10,
    //         cube.position.x-xbound[0].point.x,
    //         cube.position.y-xbound[0].point.y,
    //         0
    //       );
    //       ytarget.projectOnPlane(xbound[0].face.normal);
    //       ytarget.normalize();
    //
    //       yvector.copy(cube.position);
    //
    //       yray.set(yvector, ytarget);
    //       ybound = yray.intersectObject(walls);
    //
    //       if(ybound[0]){
    //         ytarget.copy(ybound[0].point);
    //       } else {
    //         ytarget.set(
    //           direction_x*30,
    //           direction_y*30,
    //           0
    //         );
    //       }
    //         // cube.position.add(xtarget);
    //       // }
    //     }
    //
    //     if(xbound.length==0 || xbound[0].distance>3){
    //       cube.position.x += direction_x*(delta*30);
    //       cube.position.y += direction_y*(delta*30);
    //     } else {
    //       if(ybound[0] && ybound[0].distance>2){
    //         // ytarget.multiplyScalar(30*delta)
    //         ybound[0].point.sub(cube.position);
    //         ybound[0].point.normalize();
    //         // console.log(ybound[0]);
    //         cube.position.x += (ybound[0].point.x*direction_x)*(delta*30);//*(delta*30);
    //         cube.position.y += (ybound[0].point.y*direction_y)*(delta*30);//*(delta*30);
    //       }
    //     }
    //       // xtarget.set(
    //       //   direction_x*30,
    //       //   direction_y*30,
    //       //   0
    //       // );
    //       // xtarget.projectOnPlane(xbound[0].face.normal);
    //       // xtarget.normalize();
    //       // yray.set(xbound[0].point, xtarget);
    //       // let ybound = yray.intersectObject(walls);
    //       // if(ybound.length == 0 || ybound[0].distance < 2){
    //       //   //cube.position.add(xtarget);
    //       // } else {
    //       //   xtarget.set(
    //       //     direction_x*(30*delta),
    //       //     direction_y*(30*delta),
    //       //     0
    //       //   );
    //       //   cube.position.add(xtarget);
    //       // }
    //     // }
    //
    //     if(xbound[0]){
    //       // console.log(xbound[0]);
    //       points[0] = xbound[0].point;
    //       // xtarget.set(
    //       //   direction_x*10,
    //       //   direction_y*10,
    //       //   0);
    //       // xtarget.projectOnPlane(xbound[0].face.normal);
    //       // xtarget.multiplyScalar(10);
    //       // xtarget.add(points[1]);
    //       points[2] = ytarget;
    //       points[3] = xbound[0].point;
    //     } else {
    //       points[0] = cube.position;
    //       points[2] = cube.position;
    //       points[3] = cube.position;
    //     }
    //     points[1] = cube.position;
    //
    //     linegeo.setFromPoints(points);
    //
    //     // if(ybound.length==0 || ybound[0].distance>2){
    //     //   cube.position.y += direction_y*(delta*30);
    //     // } else {
    //     //   ytarget.set(0, direction_y*(delta*30), 0);
    //     //   ytarget.projectOnPlane(ybound[0].face.normal);
    //     //   cube.position.add(ytarget);
    //     // }
    //   setAnimation(true);
    // } else {
    //   // setAnimation(false);
    // }

  }

  const doBoomzFrame = (delta) => {
    var i = boomz.length;
    // boomz.forEach((b, i) => {
    while(i--){
      var b = boomz[i];
      if(!b) continue;
      b.scale.x+=15 * delta;
      b.scale.y+=15 * delta;
      b.scale.z+=15 * delta;
      if(b.magicValue!=undefined) {
        // console.log("lf", b.magicValue);
        lights[b.magicValue].intensity-=((15*4)*delta);
      }
      if(b.scale.z > 3){
        if(b.magicValue!=undefined){
          lights[b.magicValue].intensity=0;
          lightindex[b.magicValue] = 99;
        }
        // scene.remove(lights[i]);
        // lights.splice(i,1);

        scene.remove(b);
        boomz.splice(i, 1);//] = null;
      }
    }
  }


  const deleteCannon = (b, index) => {
    // console.log("wat");
    createexplosion(b);
    b.position.set(0,0,-10);
    // console.log(cannons.children[1]);
    scene.remove(b);
    cannons.splice(index,1);
  }

  const doCannonsFrame = (delta) => {
    var cannonindex = cannons.length;
    while(cannonindex--) {
      var b = cannons[cannonindex];
      if(!b) return;
      // console.log(b.position, cube.position, b.position.distanceTo(cube.position));

      b.translateY(-40 * delta); // move along the local y-axis

      if(b.position.distanceTo(cube.position) < 4){
        // console.log("ouch");
        deleteCannon(b, cannonindex);
        health--;
        doDamaged();
        // if(health ==0) debug.innerHTML = "GAME OVER MAN, ITS GAME OVER~";
      }

      // console.log(cannonindex, b.target);
      if(b.position.distanceTo(b.target) < 1.5){
        deleteCannon(b, cannonindex);
      }

    }
  }

  const setdamagedhighlight = (item) => {
    if(
      item.material &&
      item.material.name != "outline" &&
      item.material.emissive
    ) {
      item.material.emissive.setHex(0xffffff);
    }
  };

  const removeball = (b, i) => {
    if(!b) return;
    // console.log("delet", i, b);
    createexplosion(b);
    scene.remove(b);
    ballz.splice(i, 1); //[i] = null;
    // b.position.set(cube.position)
  }

  const turretHit = (turretindex) => {
    // console.log("turretHit", turretindex);
    score++;
    let ta = turretAction[turretindex];
    let t  = turrets[turretindex]; //ballbound[0].object.parent;

    var len = t.children.length;
    setdamagedhighlight(t);
    while(len--){
      setdamagedhighlight(t.children[len])
      if(t.children[len].children.length > 0){
        var n = t.children[len].children.length;
        while(n--) setdamagedhighlight(t.children[len].children[n]);
      }
    }

    ta.health--;
    ta.life.scale.x=ta.health/10;
    if(ta.health<0){
      score+=10;
      level++;
      removeturret(turretindex);
    }
    // console.log("turretHitEnd", t, ta);
  }

  const doBallzFrame = (delta) => {
    var i = ballz.length;

    while (i-- ) {
      if(!ballz[i]){
        console.log("ball does not exist")
        continue;
      }
      let b = ballz[i];

      if(turrets.length > 0){
        var ti = turrets.length;
        while(ti--){
          if(!turrets[ti]) continue;
          let turret = turrets[ti];
          if(b.position.distanceTo(turret.position) < 6){
            // console.log("turretsforeach",i, b.position.distanceTo(turret.position))
            turretHit(ti);
            removeball(b, i);
            return; // exit frame
          }
          // console.log("nothing");
        } // for (let i = 0; i!=turrets.length; i++)
      } // if(turrets.length > 0)

      if(b.position.distanceTo(b.target) < 1){
        removeball(b, i);
        return;
      }

      b.translateY(-50 * delta); // move along the local y-axis
    }
  } // const doBallzFrame = (delta) =>


  var cameraOrtho;
  var sceneOrtho;
  var padMat;
  var cursorMat;
  var buttonMat;
  var padGeo;
  var cursorGeo;
  var buttonGeo;
  var padMesh;
  var cursorMesh;
  var buttonMesh;
  var osdTime = 0;

  const padUpdate = () => {
    let x = cursorMesh.position.x - padMesh.position.x;
    let y = cursorMesh.position.y - padMesh.position.y;

    let slope = y / x;
    if(Math.abs(slope) < 1){
      if(Math.sign(x) > 0) { movement[mov_R]=1; movement[mov_L]=0; }
      if(Math.sign(x) < 0) { movement[mov_L]=1; movement[mov_R]=0; }
    } else {
    // if(Math.abs(slope) > 1){
      if(Math.sign(y) > 0) { movement[mov_U]=1; movement[mov_D]=0; }
      if(Math.sign(y) < 0) { movement[mov_D]=1; movement[mov_U]=0; }
    }
    // movement[6] = Math.abs(x).toFixed(3);
    // movement[7] = Math.abs(y).toFixed(3);
    if(Math.abs(x)<15) { movement[mov_R]=0; movement[mov_L]=0; }
    if(Math.abs(y)<15) { movement[mov_U]=0; movement[mov_D]=0; }
  }

  if(options.use_osd){

    cameraOrtho       = new THREE.OrthographicCamera(
       - window.innerWidth  / 2,
         window.innerWidth  / 2,
         window.innerHeight / 2,
       - window.innerHeight / 2,
       1,
       20 );
    sceneOrtho        = new THREE.Scene();
    padMat            = new THREE.MeshBasicMaterial( { color: 0xffffff, opacity: 0.25, blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor } );
    cursorMat         = padMat.clone();
    cursorMat.color   = new THREE.Color(0xffc0c0);
    cursorMat.opacity = 1;//new THREE.Color(0xffc0c0);
    buttonMat         = padMat.clone();
    buttonMat.color   = new THREE.Color(0xffffff);
    padGeo            = new THREE.CircleGeometry( 80, 8 );
    cursorGeo         = new THREE.CircleGeometry( 10, 4 );
    buttonGeo         = new THREE.CircleGeometry( 20, 10 );
    padMesh           = new THREE.Mesh( padGeo,    padMat );
    cursorMesh        = new THREE.Mesh( cursorGeo, cursorMat );
    buttonMesh        = new THREE.Mesh( buttonGeo, buttonMat );

    cameraOrtho.position.z = 10;
    cameraOrtho.position.x = window.innerWidth/2;
    cameraOrtho.position.y = window.innerHeight/2;

    padMesh   .position.set(window.innerWidth/4,window.innerHeight/4,0);
    console.log(padMesh   .position)
    cursorMesh.position.set(0,0,-1);
    buttonMesh.position.set(-1000,0,0);

    sceneOrtho.add(padMesh);
    sceneOrtho.add(cursorMesh);
    sceneOrtho.add(buttonMesh);

    var cursorId;
    var buttonId;

    window.addEventListener("touchmove", (e)=>{
      var tl = e.changedTouches.length;
      while(tl--){
        var touch = e.changedTouches[tl];
        if(touch.clientX < window.innerWidth/2){
          cursorMesh.position.set(
            touch.clientX,
            window.innerHeight-touch.clientY,
            0
          );
          padUpdate();
        } else {
          buttonMesh.position.set(
            touch.clientX,
            window.innerHeight-touch.clientY,
            0
          );
        }
      }
    });

    window.addEventListener("touchend", (e)=>{

      let x = padMesh.position.x - cursorMesh.position.x;
      let y = padMesh.position.y - cursorMesh.position.y;
      movement[mov_L]    = 0;
      movement[mov_R]    = 0;
      movement[mov_U]    = 0;
      movement[mov_D]    = 0;
      //idunno
      var len = e.changedTouches.length;

      while(len--){
        if(e.changedTouches[len].clientX > (window.innerWidth/2)){
          movement[mov_SHOT]--;// = 0;
        } else {
          cursorMesh.position.set(
            padMesh.position.x,
            padMesh.position.y,
            1
          );
        }
      }

      // if(x<0) movement[mov_L] = 0;
      // if(x>0) movement[mov_R] = 0;
      // if(y<0) movement[mov_U] = 0;
      // if(y>0) movement[mov_D] = 0;
    });


    window.addEventListener("touchstart", (e)=>{
      var len = e.changedTouches.length;
      while(len--){
        if(e.changedTouches[len].clientX < window.innerWidth/2){
          //cursor
          console.log("cursor move")
          cursorId = e.changedTouches[len].identifier;

          // if(osdTime > 5){
          //   osdTime = 0;
          //   padMesh.position.set(
          //     e.changedTouches[len].clientX,
          //     window.innerHeight-e.changedTouches[len].clientY,
          //     0);
          // }

          cursorMesh.position.set(
            e.changedTouches[len].clientX,
            window.innerHeight-e.changedTouches[len].clientY,
            0);
          padUpdate();

        } else {
          //button
          movement[mov_SHOT] = 2;
          console.log("button move")
          buttonId = e.changedTouches[len].identifier;
          buttonMesh.position.set(
            e.changedTouches[len].clientX,
            window.innerHeight-e.changedTouches[len].clientY,
            0);
        }
      }
    });
  }

  const animate = function () {
    requestAnimationFrame( animate );
    let delta   = clock.getDelta();

    lastspawn += delta;
    if(lastspawn > (20-level)){
      lastspawn = 0;
      createTurret();
    };

    doBallzFrame(delta);
    doTurretFrame(delta);
    doBoomzFrame(delta);
    doCannonsFrame(delta);

    doCharacterMovement(delta);
    updateStats();

    if(demo && turrets[demoindex]){
      demotime += delta;
      if(demotime > 6){
        demotime = 0;
        demoindex = getRandomInt(turrets.length)
      }
      camera.position.x = turrets[demoindex].position.x;
      camera.position.y = turrets[demoindex].position.y-10;
      camera.lookAt(turrets[demoindex].position);
    } else if(objects["taquerocat.glb"].scene.position.distanceTo(cube.position) < 10) {
      camera.position.x = cube.position.x;
      camera.position.y = objects["taquerocat.glb"].scene.position.y-20;
      camera.position.z = 10;
      camera.lookAt(objects["taquerocat.glb"].scene.position);
    } else {

      camera.position.x = cube.position.x;
      camera.position.y = cube.position.y-30;
      camera.position.z = cube.position.z+55;
      camera.lookAt(cube.position);
    }

    if(mixer) Object.keys(mixer).forEach((name) => {
                // console.log(name);
                mixer[name].update( delta );
              });

    renderer.render(scene, camera);
    if(options.use_osd){
      osdTime += delta;
      renderer.clearDepth();
      renderer.render(sceneOrtho, cameraOrtho);
    }
  };



  window.addEventListener(
    'resize',
    ()=>{
    	camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

    	const aspect = window.innerWidth / window.innerHeight;

      cameraOrtho.left       = - window.innerWidth  / 2;
			cameraOrtho.right      =   window.innerWidth  / 2;
			cameraOrtho.top        =   window.innerHeight / 2;
			cameraOrtho.bottom     = - window.innerHeight / 2;
      cameraOrtho.position.x =   window.innerWidth  / 2;
      cameraOrtho.position.y =   window.innerHeight / 2;
      padMesh    .position.set(  window.innerWidth  / 4,
                                 window.innerHeight / 4,
                                 0);
    	cameraOrtho.updateProjectionMatrix();

      // cameraOrtho       = new THREE.OrthographicCamera( - window.innerWidth / 2, window.innerWidth / 2, window.innerHeight / 2, - window.innerHeight / 2, 1, 20 );

    	renderer.setSize( window.innerWidth, window.innerHeight );
      // fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( window.innerWidth  * renderer.getPixelRatio() );
      // fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( window.innerHeight * renderer.getPixelRatio() );
    },
    false
);
