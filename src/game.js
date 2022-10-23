  'use strict';

  import * as THREE              from 'three';
  import { FXAAShader }          from 'three/examples/jsm/shaders/FXAAShader.js';
  import { EffectComposer }      from 'three/examples/jsm/postprocessing/EffectComposer.js';
  import { ShaderPass }          from 'three/examples/jsm/postprocessing/ShaderPass.js';
  import { RenderPass }          from 'three/examples/jsm/postprocessing/RenderPass.js';
  import { RoomEnvironment }     from 'three/examples/jsm/environments/RoomEnvironment.js';
  import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils";


  import {imgloader, loadAll} from './loader';

  let loadingscreen = document.getElementById("progress");
  loadingscreen.style.visibility="visible";

  let options = JSON.parse(localStorage.getItem("options"));
  if(!options){
    options = {
      use_aa    : false,
      use_osd   : false,
      run_demo  : false,
      play_sound: true,
      do_board  : false
    };
  }

  console.log(options);

  const audioDebug = !options.play_sound
  console.log("audioDebug", audioDebug);
  let demo         = options.run_demo;
  let demotime     = 0;
  let demoindex    = 0;

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 10, 300 );
  const renderer = new THREE.WebGLRenderer({alpha: true, antialias: (!!options.use_aa)});
  const debug    = document.getElementById("debug");

  let statuescount = 10;
  let coincount    = 10; //max number of coins in screen
  let gatostatue   = null;
  let gatocoin     = null;
  let delta        = 0;

  // debug.innerHTML="WHAT";

  // scene.fog = new THREE.Fog(new THREE.Color(0xc0c0c0), 100, 150);
  renderer.debug.checkShaderErrors = false;
  renderer.setSize( window.innerWidth, window.innerHeight );
  // renderer.physicallyCorrectLights = true;
  // renderer.setPixelRatio( window.devicePixelRatio );
  renderer.autoClear           = false;
  renderer.toneMapping         = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.6;
  renderer.gammaFactor         = 2.2;
  renderer.outputEncoding      = THREE.sRGBEncoding;

  document.body.appendChild( renderer.domElement );

  // const controls  = new OrbitControls(camera, renderer.domElement);
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

  scene.background     = new THREE.Color( 0xbbbbbb );
  scene.environment    = pmremGenerator.fromScene( environment ).texture;

  const movement = [0,0,0,0, 0, 0]; //Y pos X pos Animation on/off
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

  let sound     = new THREE.Audio(listener);
  let pew       = null; //new THREE.AudioBuffer(listener);
  let bang      = null; //new THREE.AudioBuffer(listener);
  let taptap    = null;
  let walking   = null;
  let tankmotor = null
  let kapow     = null
  let coinget   = null;
  let coindrop  = null;

//-----Models--------------------------

  let scenemixer = new THREE.AnimationMixer( scene );
  let mixer      = [];
  let objects    = [];
  let animations = [];
  let walls      = null;
  let floor      = null;
  let statues    = null;
  let coins      = [];

  const update_load = (url, itemsLoaded, itemsTotal) => {
    loadingscreen.style.width=`${(100*itemsLoaded)/itemsTotal}%`;
  }

  loadAll(
    [
      "kakariko_village.mp3",
      "tank.mp3",
      "pew.mp3",
      "bang.mp3",
      "kapow.mp3",
      "taptap.mp3",
      "coinget.mp3",
      "coindrop.mp3"
    ],
    [
      "monitoringo.glb", //this guy is hardcoded at index 0, do not add above
      "stage.glb",
      "turret.glb",
      "taquerocat.glb",
      "gatostatue.glb"
    ],
    update_load
  ).then(
    ({sounds, models}) => {
      console.log("loadall return", {sounds, models})


      objects    = models.objects;
      mixer      = models.mixer;
      animations = models.animations;

      cube = objects['monitoringo.glb'].scene;
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

      let taquerocat = objects   ['taquerocat.glb'];
      let gatomation = animations['taquerocat.glb'];
      let gatomixer  = mixer     ['taquerocat.glb'];
      taquerocat.scene.position.y = 15;
      taquerocat.scene.position.x = -12;
      gatomixer.clipAction(gatomation.idle).play();

      let stage = objects['stage.glb']
      stage.scene.matrixAutoUpdate=false;
      let children = Object.values(stage.scene.children);
      walls   = children.find(k=>k.name=="walls" );
      walls.visible=false;

      floor   = children.find(k=>k.name=="floor" );
      statues = children.filter(k=>k.name.startsWith("statue_p") );
      if(statues){
        statuescount = statues.length;
      }


      console.log({walls, floor, statues})
      let statuegeos = [];
      let coingeo    = null;
      let coinmat    = null;
      let material   = null;

      let n = null;

      objects['gatostatue.glb'].scene.traverse(
        x=>{
          if(x.isMesh && x.name.startsWith("LPCoin")){
            console.log("coin")
            coingeo = x.geometry; //assuming there is only 1 geo for the coin
            coinmat = x.material;
            coinmat.emissiveIntensity = 2;
            n = x;
          }

          if(x.isMesh && x.name.startsWith("LPGatoMesh")){
            console.log("prep scene gatostatue", x)
            statuegeos.push(x.geometry);
          }
          if(!material) material = x.material;
      });

      const geometry = BufferGeometryUtils.mergeBufferGeometries(statuegeos, false);
      gatostatue = new THREE.InstancedMesh( geometry, material, statuescount);
      // gatocoin   = new THREE.InstancedMesh( geometry, material, coincount);
      gatocoin   = new THREE.InstancedMesh( coingeo,  coinmat,  coincount);
      // console.log(coingeo,  coinmat,  coincount)

      for (var i = 0; i < coincount; i++) {
        coins[i] = new THREE.Object3D();
        coins[i].position.set((i*3) - 10,5,0);
        coins[i].position.z = 3;
        coins[i].scale.set(10,10,10);
        coins[i].rotation.set(Math.PI,0,0,0)
        coins[i].audio = {
            drop: new THREE.Audio(listener),
            get:  new THREE.Audio(listener)
        };
        coins[i].audio.get.setBuffer(sounds['coinget.mp3']);
        coins[i].audio.get.setVolume(1);
        coins[i].audio.get.setLoop(false);

        coins[i].updateMatrix();
        // console.log(i, coins[i].position)
        gatocoin.setMatrixAt(i, coins[i].matrix);
      }

      for (var i = 0; i < statuescount; i++) {
        statues[i].position.copy(statues[i].position);
        statues[i].position.z = 0;
        statues[i].rotation.copy(statues[i].rotation);
        statues[i].updateMatrix();
        // console.log(i, statues[i], statues[i])
        gatostatue.setMatrixAt(i, statues[i].matrix);
      }
      gatocoin.needsUpdate=true;
      scene.add(gatostatue)
      scene.add(gatocoin)


      pew       = sounds['pew.mp3'];
      bang      = sounds['bang.mp3'];
      taptap    = sounds['taptap.mp3'];
      tankmotor = sounds['tank.mp3'];
      kapow     = sounds['kapow.mp3'];
      coinget   = sounds['coinget.mp3'];
      coindrop  = sounds['coindrop.mp3'];
      walking   = new THREE.Audio(listener);

      walking.setBuffer(taptap);
      walking.setVolume(0.25);
      walking.setLoop(true);

      sound.setBuffer( sounds['kakariko_village.mp3'] );
      sound.setLoop  ( true );
      sound.setVolume( 0.25 );
      if(!audioDebug) sound.play();

      lights.forEach(l=>scene.add(l));
      scene.add( cube);
      scene.add( taquerocat.scene );
      scene.add( stage.scene );

      loadingscreen.style.visibility="hidden";
      document.getElementById("info").style.visibility="hidden";
      animate();
    }
  );


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
                  event.preventDefault();
                  break; //cant move when shooting
          case 38: movement[mov_U]    = 1; event.preventDefault(); break;
          case 40: movement[mov_D]    = 1; event.preventDefault(); break;
          case 37: movement[mov_L]    = 1; event.preventDefault(); break;
          case 39: movement[mov_R]    = 1; event.preventDefault(); break;
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
    new THREE.Vector3(   0.000,   -5.634, 0),
    new THREE.Vector3( -40.836,   -5.634, 0),
    new THREE.Vector3( -56.052,  -51.663, 0),
    new THREE.Vector3( -56.052, -112.491, 0),
    new THREE.Vector3(  -2.697, -112.491, 0),
    new THREE.Vector3(  43.107, -112.491, 0),
    new THREE.Vector3(  59.586,  -62.295, 0),
    new THREE.Vector3( 130.830,  -31.839, 0),
    new THREE.Vector3( 187.695, -116.010, 0),
    new THREE.Vector3(  38.121, -127.266, 0),
    new THREE.Vector3( -70.416, -123.114, 0),
    new THREE.Vector3(-138.315, -113.940, 0),
    new THREE.Vector3(-203.118,  -13.944, 0),
    new THREE.Vector3(-216.252,   19.590, 0),
    new THREE.Vector3(-242.901,   97.707, 0),
    new THREE.Vector3(-187.059,  123.174, 0),
    new THREE.Vector3(-117.282,  133.161, 0),
    new THREE.Vector3( -36.478,   58.350, 0),
    new THREE.Vector3(-125.008,  -28.746, 0),
    new THREE.Vector3(  33.134,   85.797, 0),
    new THREE.Vector3(  37.706,  173.316, 0),
    new THREE.Vector3(  61.259,  203.097, 0),
    new THREE.Vector3(  74.381,  253.107, 0),
    new THREE.Vector3(  74.381,  294.759, 0),
    new THREE.Vector3(  47.699,  327.471, 0),
    new THREE.Vector3(   2.948,  257.466, 0),
    new THREE.Vector3( -32.242,  237.885, 0)
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

    if(turrets[index].ptr) scene.remove(turrets[index].ptr);
    if(turrets[index].lifemeter) scene.remove(turrets[index].lifemeter);
    scene.remove(turrets[index]);
    scene.remove(turrets[index].children.find(k=>k.type=='Audio'));
    turrets      .splice(index,1);//= null;
    turretMixer  .splice(index,1);//= null;
    turretAction .splice(index,1);//= null;
  }


  var triangleGeo   = new THREE.CircleGeometry( 1, 3 );
  triangleGeo.translate(3,0,3);
  const triangleMat = new THREE.MeshBasicMaterial( { color: 0xff2020 } );
  var triangle      = new THREE.Mesh(triangleGeo, triangleMat);



  var turrcount = 0;
  const createTurret = () => {
    turrcount++;

    // if(turrcount>1)
    // return;



    if(turrets.length > 10) return;

    const cloneMaterial = (item) => {
      //material outline is defined in blender file
      if(!item.material || item.material.name == "outline") return;
      item.material = item.material.clone();
      // console.log("item.material", item.material.name)
    };

    let turret       = objects["turret.glb"].scene.clone();
    let lifemeter    = life.clone();
    turret.lifemeter = lifemeter;
    lifemeter.up     = camera.up;
    lifemeter.lookAt(camera.position);
    scene.add(lifemeter);

    let triPtr = triangle.clone();
    turret.ptr = triPtr;
    scene.add(triPtr);

    // turret.position.set(10,10,0);
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

  var plasmaballmaterial  = new THREE.MeshLambertMaterial({
                                color:             "aqua",
                                emissive:          "aqua",
                                emissiveIntensity: 2
                              });
   var cannonballmaterial = new THREE.MeshBasicMaterial({
                                color: "yellow"
                              });

  var explosionmaterial   = new THREE.MeshBasicMaterial({
                                color: "yellow",
                                map  : imgloader.load("img/Lava_Texture_preview.jpg")
                              });

  const planelife = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
  const life      = new THREE.Mesh( new THREE.PlaneGeometry( 4, 0.3 ), planelife );
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
      plasmaBall.target.x = (plasmaBall.position.x - x);
      plasmaBall.target.y = (plasmaBall.position.y - y);
      plasmaBall.target.z = 0;

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
    if(ballbound[0]) {
      plasmaBall.target = ballbound[0].point;
    } else {
      plasmaBall.target = new THREE.Vector3();
      plasmaBall.target.x=(plasmaBall.position.x - mesh.position.x);
      plasmaBall.target.y=(plasmaBall.position.y - mesh.position.y);
      plasmaBall.target.z=0;
      plasmaBall.target.multiplyScalar(10);
      plasmaBall.target.z=3;

      plasmaBall.target.add(plasmaBall.position);
    }

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
    new THREE.PointLight( 0xff8000, 0, 50 ),
    new THREE.PointLight( 0xff8000, 0, 50 ),
    new THREE.PointLight( 0xff8000, 0, 50 )
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

  const doTurretAction = (turret, t, enemixer) => {
    // let t      = turretAction[index];
    // let turret = turrets[index];
    if(!t) return;

    const eneanim  = animations['turret.glb'];
    enemixer.update(delta);
    // const enemixer = turretMixer[index];

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
    materialupdate(turret);

    var len = turret.children.length;
    while(len--){
      materialupdate(turret.children[len]);
      if(turret.children[len].children.length > 0){
        var n = turret.children[len].children.length;
        while(n--) materialupdate(turret.children[len].children[n]);
      }
    }

    if(turret.lifemeter) {
      turret.lifemeter.quaternion.copy(camera.quaternion);
      turret.lifemeter.position.copy(turret.position);
      turret.lifemeter.position.z += 7;
    }
    // if(turret.lifemeter) turret.lifemeter.rotation.copy(camera.rotation);

    if(turret.ptr) {
      turret.ptr.position.copy(cube.position);
      // turret.ptr.quaternion.copy(camera.quaternion);
      // testAngle = turret.position.angleTo(turret.ptr.position)
      // turret.ptr.rotation.z = testAngle;
      // console.log(testAngle );

      let vectorB = cube.position;
      let vectorA = turret.position;
      let radang  = Math.atan2(
                      vectorA.y - vectorB.y,
                      vectorA.x - vectorB.x
                    );

      turret.ptr.rotation.set(0,0, radang );
      // turret.ptr.rotation.z = turret.position.angleTo(turret.ptr.position));
      // turret.ptr.lookAt(turret.position);
      // turret.ptr.position.z += 7;
    }

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

        // const ray = () => {
          balltarget.copy(turret.position);
          balltarget.z=3;

          turret.translateY(t.reverse);

          ballvector.x=(turret.position.x-balltarget.x)*10;
          ballvector.y=(turret.position.y-balltarget.y)*10;
          ballvector.z=0;
          ballvector.normalize();

          ballray.set(balltarget, ballvector);
          let ballbound;
          rayarr1.length=0;
          ballbound = ballray.intersectObject(walls, false, rayarr1);
          // console.log(ballbound);

          turret.position.copy(balltarget);
          turret.position.z=0;
          if(ballbound[0] && ballbound[0].distance > 4){
          }
          turret.translateY((6 * delta)*t.reverse);
          // if(ballbound[0] && ballbound[0].distance < 4){
          //   t.reverse = 1;
          // }

          xtarget.copy(turret.position);
          xtarget.z += 3;
          xvector.set(0,0,-1);
          xray.set(xtarget, xvector);
          rayarr2.length=0;
          let zbound = floor.children[0]
            ? xray.intersectObjects(floor.children, false, rayarr2)
            : xray.intersectObject(floor, false, rayarr2);

          if(zbound[0]){
            turret.position.z = zbound[0].point.z;
          }



        if(t.timeDelta > t.timeMove || turret.position.distanceTo(cube.position) < 30){
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

  const doTurretFrame = () => {
    let index = turrets.length;
    let turret;
    // turrets.forEach((turret, i) => {
    while(index--){
      turret = turrets[index]
      if(turret == null) return;
      doTurretAction(turrets[index], turretAction[index], turretMixer[index]);
      // if()  turretMixer[index].update( delta );
    }
  }

  let health     = 4;
  let score      = 0;
  let level      = 0;
  let lastspawn  = 0;

  let coinsheld = 0;

  let oldHealth  = null;
  let strHealth  = "";
  let oldScore   = null;
  let strScore   = "";
  let oldLevel   = null;
  let strLevel   = "x";

  const healthText = () => strHealth = (
    health==oldHealth
      ? strHealth
      : (health > 0
          ? Array(health).fill('💟').join('')
          : "💀💀💀")
  );
  const scoreText   = () => (
    strScore = score==oldScore
      ? strHealth
      : score+" "+turrets.length
  );

  let levelText     = () => (
    strLevel = level == oldLevel
      ? strLevel
      : (level  > 10
          ? Array(Math.floor(level/10)).fill('🐲').join('')
          : '') +
        Array(level%11).fill('🪖').join('')
  );

  let statsLast = 1;
  const updateStats = () => {
    // return;
    statsLast += delta;
    if(
      false &&
      statsLast  <  1
      // (
      //   (oldLevel  == level)  &&
      //   (oldScore  == score)  &&
      //   (oldHealth == health)
      // )
    ) return;
    statsLast=0;
    debug.innerHTML=`
HEALTH: ${healthText()}
SCORE:  ${scoreText()}
LEVEL:  ${levelText()}
COINS:  ${coinsheld}
NEXT:   ${((20-level)-lastspawn).toFixed(0)}s
    `;
  }
  // HEALTH: ${health < 0 ? "💀💀💀" : Array(health).fill('💟').join('')}
  // SCORE:  ${score} (${turrets.length})
  // LEVEL:  ${level>10?Array(Math.floor(level/10)).fill('🐲').join(''):''}${Array(level%11).fill('🪖').join('')}
  // `;

  // NEXT:   ${((20-level)-lastspawn).toFixed(2)}
  // MOVS:   ${osdTime}
  updateStats(0);


  let xvector    = new THREE.Vector3(0,0,10);
  let yvector    = new THREE.Vector3(0,0,10);
  let ballvector = new THREE.Vector3(0,0, 0);
  let xtarget    = new THREE.Vector3(0,0,10);
  let ytarget    = new THREE.Vector3(0,0,10);
  let balltarget = new THREE.Vector3(0,0, 0);

  let xray       = new THREE.Raycaster();
  let yray       = new THREE.Raycaster();
  let ballray    = new THREE.Raycaster();

  let rayarr1 = [];
  let rayarr2 = [];

  const doCharacterMovement = () => {
    const playerMixer = mixer     ['monitoringo.glb'];
    const playerAnims = animations['monitoringo.glb'];

    let direction_x, direction_y;
    direction_x = (movement[mov_R] - movement[mov_L]);
    direction_y = (movement[mov_U] - movement[mov_D]);

    let rotz = Math.atan2(
       direction_x,
      -direction_y
    ); // witchcraft from stockoverflaw

    if(direction_x || direction_y) {
      cube.rotation.z = rotz;
      lookAtLerp.set(
        cube.position.x + (direction_x*6),
        cube.position.y + (direction_y*6),
        cube.position.z );
    }

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
      xray.far = 10;
      rayarr1.length=0;
      let xbound = xray.intersectObjects(floor.children, false, rayarr1);
      // console.log(floor);

      // if(!xbound[0]){
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
        rayarr2.length=0;

        let ybound = (
          walls.type==="Group"
            ? yray.intersectObjects(walls.children, false, rayarr2)
            : yray.intersectObject (walls, false, rayarr2)
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
          // return;
        }
      // } else {
      if(xbound[0]){
        cube.position.x += direction_x*(delta*30);
        cube.position.y += direction_y*(delta*30);
        cube.position.z  = xbound[0].point.z+0.5;
      }

      setAnimation(true);
    } else {
      setAnimation(false);
    }
  }

  const doBoomzFrame = () => {
    var i = boomz.length;
    // boomz.forEach((b, i) => {
    while(i--){
      var b = boomz[i];
      if(!b) continue;
      b.scale.x+=15 * delta;
      b.scale.y+=15 * delta;
      b.scale.z+=15 * delta;
      if(b.magicValue!=undefined) {
        lights[b.magicValue].intensity-=((15*5)*delta);
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

  const doCannonsFrame = () => {
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

  const doBallzFrame = () => {
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

      if(statuescount){
        let si = statuescount;
        while(si--){
          let s = statues[si];
          if(!s) continue;

          if(b.position.distanceTo(s.position) < 4){
            // console.log(i, statues[si])
            removeball(b, i);
            throwCoins(statues[si].position);
            statues[si].position.z = -10;
            statues[si].updateMatrix();
            gatostatue.setMatrixAt(si, statues[si].matrix);
            gatostatue.instanceMatrix.needsUpdate = true;
            return;
          }
        }
      }

      if(b.position.distanceTo(b.target) < 1){
        removeball(b, i);
        return;
      }

      b.translateY(-50 * delta); // move along the local y-axis
    }
  } // const doBallzFrame = () =>

  let availablecoins = [];

  function easeOutBounce(x) {
    /*
      x represents the absolute progress of the animation in the bounds of 0 (beginning of the animation) and 1 (end of animation).
    */
    const n1 = 7.5625;
    const d1 = 2.75;

    if (x < 1 / d1) {
        return n1 * x * x;
    } else if (x < 2 / d1) {
        return n1 * (x -= 1.5 / d1) * x + 0.75;
    } else if (x < 2.5 / d1) {
        return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
        return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
  }

  function easeInBounce(x) {
    return 1 - easeOutBounce(1 - x);
  }

  const throwCoins = (sourceposition) => {
    let n = THREE.MathUtils.randInt(3, coincount);
    console.log("coins", n, availablecoins)
    let ci = coincount;
    while(ci--){
      if(!availablecoins[ci]) continue;
      availablecoins[ci].position.copy(sourceposition);
      availablecoins[ci].position.direction = THREE.MathUtils.randFloat(-Math.PI, Math.PI);
      availablecoins[ci].position.speed     = 10;
      // availablecoins[ci] = null;
      if(!(n--)) break;
    }
  }

  const doCoinsFrame = () => {
    for (var i = 0; i < coincount; i++) {
      if(coins[i].position.z < 0) continue;
      coins[i].rotation.z+=delta;

      let pos   = coins[i].position;
      let d     = pos.direction || 0;
      pos.speed = THREE.MathUtils.clamp(pos.speed - (delta*7), 0, 10);
      let s     = pos.speed||0

      pos.x += (Math.cos(d) * delta) * (s);
      pos.y += (Math.sin(d) * delta) * (s);
      pos.z = easeInBounce(s/10)*5;

      if(cube.position.distanceTo(pos) < 5){
        availablecoins[i] = coins[i];
        pos.z = -10;
        pos.speed = 10;
        coinsheld++;
        coins[i].audio.get.play();
      }
      coins[i].updateMatrix();
      gatocoin.setMatrixAt(i, coins[i].matrix);
    }
    gatocoin.instanceMatrix.needsUpdate = true;
  }


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
    let slope  = y / x;
    let radang = Math.atan2(y, x) ;
    let absrad = Math.abs (radang);
    let sgn    = Math.sign(radang);

    movement[mov_L]=0;
    movement[mov_R]=0;
    movement[mov_D]=0;
    movement[mov_U]=0;

    score = `${absrad}`;
    if(absrad >  1.9)                              { movement[mov_L]=1; }
    if(absrad <  1.2)                              { movement[mov_R]=1; }
    if(sgn > 0 &&  0.78 < radang && radang <  2.74) { movement[mov_U]=1; }
    if(sgn < 0 && -0.78 > radang && radang > -2.74) { movement[mov_D]=1; }
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
    cursorGeo         = new THREE.CircleGeometry( 30, 4 );
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
      var elem         = renderer.domElement,
          boundingRect = elem.getBoundingClientRect(),
          x,
          y;

      while(tl--){
        var touch = e.changedTouches[tl];
        if(touch.clientX < window.innerWidth/2){

          x = (touch.clientX - boundingRect.left) ;//* (elem.width  / boundingRect.width),
          y = (touch.clientY - boundingRect.top)  ;//* (elem.height / boundingRect.height);

          cursorMesh.position.set(
             (x/renderer.domElement.clientWidth) *2-1,
            -(y/renderer.domElement.clientHeight)*2+1,
            // touch.clientX,
            // window.innerHeight-touch.clientY,
            -1
          );
          cursorMesh.position.unproject(cameraOrtho);
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
          // console.log("cursor move")
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

  let lookAtTarget = new THREE.Vector3();
  let lookAtLerp   = new THREE.Vector3();
  let mixerkeys    = null;

  function animate() {
    delta = clock.getDelta();

    lastspawn += delta;
    if(lastspawn > (20-level)){
      lastspawn = 0;
      createTurret();
    };

    doBallzFrame();
    doTurretFrame();
    doBoomzFrame();
    doCannonsFrame();
    doCoinsFrame();

    doCharacterMovement();

    if(mixerkeys==null) mixerkeys = Object.keys(mixer);
    let mixlen = mixerkeys.length;
    while(mixlen--) mixer[mixerkeys[mixlen]].update( delta );

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
      lookAtTarget.lerp(lookAtLerp, 6*delta);
      camera.position.x = lookAtTarget.x;
      camera.position.y = lookAtTarget.y-30;
      camera.position.z = cube.position.z+55;
      // // camera.position.y = cube.position.y-50;
      // // camera.position.z = cube.position.z+35;
      camera.lookAt(lookAtTarget);
      // camera.lookAt(cube.position);
    }


    renderer.render(scene, camera);
    if(options.use_osd){
      osdTime += delta;
      renderer.clearDepth();
      renderer.render(sceneOrtho, cameraOrtho);
    }

    requestAnimationFrame( animate );

  };



 function resizeEvent(){
   renderer.setSize( window.innerWidth, window.innerHeight );

   // camera.aspect = window.innerWidth / window.innerHeight;
   const aspect = window.innerWidth / window.innerHeight;
   camera.aspect = aspect;
   camera.updateProjectionMatrix();

   if(options.use_osd){
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
   }
 }
  window.addEventListener(
    'resize',
    resizeEvent,
    false
);
