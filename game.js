  import * as THREE         from 'https://cdn.skypack.dev/three@0.134.0';
  import { FXAAShader }     from 'https://cdn.skypack.dev/three@0.134.0/examples/jsm/shaders/FXAAShader.js';
  import { EffectComposer } from 'https://cdn.skypack.dev/three@0.134.0/examples/jsm/postprocessing/EffectComposer.js';
  import { ShaderPass }     from 'https://cdn.skypack.dev/three@0.134.0/examples/jsm/postprocessing/ShaderPass.js';
  import { RenderPass }     from 'https://cdn.skypack.dev/three@0.134.0/examples/jsm/postprocessing/RenderPass.js';

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 10, 100 );
  const renderer = new THREE.WebGLRenderer();
  const debug    = document.getElementById("debug");

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

  const linematerial = new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 2 } );
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
  camera.position.z =  55;
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


const listener = new THREE.AudioListener();


let sound     = new THREE.Audio(listener);
let pew       = null; //new THREE.AudioBuffer(listener);
let bang      = null; //new THREE.AudioBuffer(listener);
let taptap    = null;
let walking   = null;
let tankmotor = null
scene.add(sound);

const audioLoader = new THREE.AudioLoader();
audioLoader.load( "./sound/test.mp3", function( buffer ) {
  console.log("bgm");
  sound.setBuffer( buffer );
  sound.setLoop( true );
  sound.setVolume( 0.05 );
  sound.play();
});
audioLoader.load( "./sound/tank.mp3", function( buffer ) {
  console.log("tank");
  tankmotor = buffer;
});
audioLoader.load( "./sound/pew.mp3", function( buffer ) {
  console.log("pew");
  pew  = buffer;
});
audioLoader.load( "./sound/bang.mp3", function( buffer ) {
  console.log("bang");
  bang = buffer;
});
audioLoader.load( "./sound/taptap.mp3", function( buffer ) {
  console.log("taptap");
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
          mixer  [path] = new THREE.AnimationMixer( gltf.scene );
          objects[path] = gltf;


          // console.log(objects[i]);
          // console.log("gltf", i, mixer, animations, gltf.animations);
          // console.log(gltf.animations);
          if(Array.isArray(gltf.animations) && gltf.animations[0]){
            gltf.animations.forEach((item, i) => {
              if(!animations[path]) animations[path] = {};
              animations[path][item.name] = item;
            });

            // var action = mixer[path].clipAction( animations[path][0] )
            // action.loop = THREE.LoopRepeat;
            // action.reset().play();
          }

          if(i > 1) return; //??? we just hide the turrets for now
          scene.add( gltf.scene );

          if(path == 'monitoringo.glb'){
            // console.log('cube', gltf.scene);
            cube = gltf.scene;
            cube.add( listener );
            // magic values :D
            const playerMixer      = mixer     ['monitoringo.glb'];
            const playerAnimations = animations['monitoringo.glb'];
            playerMixer.clipAction( playerAnimations.Shooting ) .clampWhenFinished = true;
            playerMixer.clipAction( playerAnimations.Shooting ) .loop              = THREE.LoopOnce;
            playerMixer.clipAction( playerAnimations.Shooting ) .stop();
            playerMixer.clipAction( playerAnimations.Running )  .stop();
            playerMixer.clipAction( playerAnimations.Breathing ).play();


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
      "monitoringo.glb", //this guy is hardcoded at index 0, do not add above
      "stage.glb",
      "turret.glb"
    ]
  );


    const shot = () => {
      if(movement[mov_SHOT]==1 && shotstart == 0){
        shotstart = mixer['monitoringo.glb'].time;
        mixer['monitoringo.glb'].clipAction( animations['monitoringo.glb'].Shooting ).reset();
        createball();
      }
    }

    document.addEventListener(
      "keydown",
      (event) => {
          switch(event.which){
            // case 80: createTurret(); break;
            case 32:
                    if(movement[mov_SHOT]==0) shotstart = 0;
                    movement[mov_SHOT] = 1;
                    break; //cant move when shooting
            case 38: movement[mov_U]    = 1; break;
            case 40: movement[mov_D]    = 1; break;
            case 37: movement[mov_L]    = 1; break;
            case 39: movement[mov_R]    = 1; break;
            default: console.log(`new THREE.Vector3(${cube.position.x.toFixed(3)}, ${cube.position.y.toFixed(3)}, 0),`); break;
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

  var cube = new THREE.Mesh( geometry, material );

  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

  var turrets         = [];
  var turretMixer     = [];
  var turretAction    = []
  var turretpositions = [
    new THREE.Vector3(-76.407, -135.438, 0),
    new THREE.Vector3(-39.942, -133.980, 0),
    new THREE.Vector3(-44.943, -106.047, 0),
    new THREE.Vector3( 39.213, -102.942, 0),
    new THREE.Vector3(-48.126, 69.936, 0),
    new THREE.Vector3(-53.970, -16.329, 0),
    new THREE.Vector3(-53.970, -45.267, 0),
    new THREE.Vector3(-14.607, -52.563, 0),
    new THREE.Vector3(21.858, -52.563, 0),
    new THREE.Vector3(-22.524, -92.985, 0),
    new THREE.Vector3(15.411, -92.985, 0),
    new THREE.Vector3(73.296, -149.442, 0),
    new THREE.Vector3(39.123, -149.442, 0),
    new THREE.Vector3(1.416, -149.442, 0),
    new THREE.Vector3(-90.252, -97.587, 0),
    new THREE.Vector3(-90.252, -89.241, 0),
    new THREE.Vector3(-90.252, -75.495, 0),
    new THREE.Vector3(-90.252, -25.926, 0),
    new THREE.Vector3(-90.252, 17.616, 0),
    new THREE.Vector3(-90.252, 65.325, 0),
    new THREE.Vector3(-90.252, 105.330, 0),
    new THREE.Vector3(-43.596, 114.270, 0),
    new THREE.Vector3(11.619, 114.270, 0),
    new THREE.Vector3(60.138, 114.270, 0),
    new THREE.Vector3(73.896, 73.659, 0),
    new THREE.Vector3(54.549, 73.659, 0),
    new THREE.Vector3(60.939, 90.030, 0),
    new THREE.Vector3( 39.213, -139.179, 0)
  ];

  const removeturret = (index)=> {
    console.log("removing", index, turrets[index]);
    createexplosion(turrets[index]);

    console.table(
      "children", turrets[index].children,
      "find", turrets[index].children.find(k=>k.type=='Audio').stop()
    );
    scene.remove(turrets[index]);
    scene.remove(turrets[index].children.find(k=>k.type=='Audio'));
    turrets      .splice(index,1);//= null;
    turretMixer  .splice(index,1);//= null;
    turretAction .splice(index,1);//= null;
  }

  const createTurret = () => {
    if(turrets.length > 10) return;
    let turret = objects["turret.glb"].scene.clone();
    let lifemeter = life.clone();

    // turret.position.set(10,10,0);
    turret.position.copy(turretpositions[getRandomInt(turretpositions.length-1)]);

    const t_mixer = new THREE.AnimationMixer(turret);
    const turretAnims = animations["turret.glb"];

    t_mixer.clipAction(turretAnims.BODYROLLIN).play();
    t_mixer.clipAction(turretAnims.WHEELROLLIN).play();


    const tanksound = new THREE.PositionalAudio(listener);
    tanksound.setBuffer(tankmotor);
    tanksound.setVolume(2);
    tanksound.setLoop(true);
    turret.add(tanksound);
    turret.add(lifemeter);
    tanksound.play();
    // console.log("wat");

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

  var plasmaballmaterial = new THREE.MeshBasicMaterial({
                             color: "aqua"
                           });
  var explosionmaterial  = new THREE.MeshBasicMaterial({
                             color: "yellow",
                             map  : imgloader.load("img/Lava_Texture_preview.jpg")
                           });

  const planelife  = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
  const life  = new THREE.Mesh( new THREE.PlaneGeometry( 4, 1 ), planelife );
  life.position.x = 0;
  life.position.y = 0;
  life.position.z = 7;





  let ballz = [null];
  const createball = () => {
    let plasmaBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 4, 4),
      plasmaballmaterial
    );

    let theta = -cube.rotation.z ;// * Math.PI/180;

    plasmaBall.position.x = cube.position.x-( 1*Math.cos(theta));
    plasmaBall.position.y = cube.position.y+( 1*Math.sin(theta));
    plasmaBall.position.z = 2.5;

    plasmaBall.quaternion.copy(cube.quaternion); // apply cube's quaternion

    const plasmapew = new THREE.PositionalAudio(listener);
    plasmapew.setBuffer(pew);
    plasmapew.setVolume(2);
    plasmapew.play();

    plasmaBall.add(plasmapew);
    scene.add(plasmaBall);

    let index = ballz.indexOf(null);
    if(index==-1) {
      ballz.push(plasmaBall);
    } else {
      ballz[index] = plasmaBall;
    }
  };

  const cannons = [];
  const createcannon = (mesh) => {
    let plasmaBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 4, 4),
      plasmaballmaterial
    );

    let theta = -mesh.rotation.z ;// * Math.PI/180;

    plasmaBall.position.x = mesh.position.x;//-( 1*Math.cos(theta));
    plasmaBall.position.y = mesh.position.y;//+( 1*Math.sin(theta));
    plasmaBall.position.z = 3;

    plasmaBall.quaternion.copy(mesh.quaternion); // apply mesh's quaternion

    const plasmapew = new THREE.PositionalAudio(listener);
    plasmapew.setBuffer(pew);
    plasmapew.setVolume(2);
    plasmapew.play();

    plasmaBall.add(plasmapew);
    scene.add(plasmaBall);

    let index = cannons.indexOf(null);
    if(index==-1) {
      cannons.push(plasmaBall);
    } else {
      cannons[index] = plasmaBall;
    }
  }; // const createcannon = (mesh) =>

  let boomz = [null];
  const createexplosion = (ball) => {
    let plasmaBall = new THREE.Mesh(
      new THREE.SphereGeometry(4, 4, 4),
      explosionmaterial
    );

    plasmaBall.position.x = ball.position.x;//-( 1*Math.cos(theta));
    plasmaBall.position.y = ball.position.y;//+( 1*Math.sin(theta));
    plasmaBall.position.z = 2.5;

    plasmaBall.scale.x=0.15;
    plasmaBall.scale.y=0.15;
    plasmaBall.scale.z=0.15;

    const plasmabang = new THREE.PositionalAudio(listener);
    plasmabang.setBuffer(bang);
    plasmabang.setVolume(10);
    plasmabang.play();
    plasmaBall.add(plasmabang);

    scene.add(plasmaBall);
    let index = boomz.indexOf(null);
    if(index==-1) {
      boomz.push(plasmaBall);
    } else {
      boomz[index] = plasmaBall;
    }
    return;
  }


  var running   = null;
  var shotstart = 0;
  const setAnimation = (isRunning) => {
    if(isRunning == running || movement[mov_SHOT]) return; //dont overwrite animation or shooting

    running                = isRunning //set state for next iteration
    const playerMixer      = mixer     ['monitoringo.glb'];
    const playerAnimations = animations['monitoringo.glb'];

    if(isRunning===false){
      playerMixer.clipAction( playerAnimations.Breathing ).play();
      playerMixer.clipAction( playerAnimations.Shooting ) .stop();
      playerMixer.clipAction( playerAnimations.Running )  .stop();
      walking.stop();
    } else {
      playerMixer.clipAction( playerAnimations.Running )  .play();
      playerMixer.clipAction( playerAnimations.Shooting ) .stop();
      playerMixer.clipAction( playerAnimations.Breathing ).stop();
      walking.play();
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
    // turret.translateY(-10 * delta);
    switch(t.state){
      case "rot":
        if(!t.moving){
            t.direction = getRandomInt(2)==1 ? -1 : 1; //rotate left or right
            t.timeMove  = getRandomInt(3000)/1000; // how long to rot
            t.timeDelta = 0;
            t.moving = true;
            break;
        }
        turret.rotateZ((0.75 * t.direction) * delta);
        if(t.timeDelta > t.timeMove){
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


        balltarget.copy(turret.position);
        balltarget.z=3;

        turret.translateY(t.reverse);

        ballvector.x=(turret.position.x-balltarget.x)*10;
        ballvector.y=(turret.position.y-balltarget.y)*10;
        ballvector.z=3;
        ballvector.normalize();

        ballray.set(balltarget, ballvector);
        let ballbound;
        ballbound = ballray.intersectObject(objects["stage.glb"].scene.children[0]);

        turret.position.copy(balltarget);
        turret.position.z=0;

        if(ballbound[0] && ballbound[0].distance > 4){
          turret.translateY((6 * delta)*t.reverse);
        } else {
          t.reverse = 1;
        }

        if(t.timeDelta > t.timeMove){
          t.state = "shot";
          t.moving = false;
        }
        break;

      case "shot":
          if(t.moving == false){
            // console.log("flag");
            enemixer.clipAction(eneanim.BODYROLLIN).stop();
            enemixer.clipAction(eneanim.BODYSHOOTIN).play();
            t.timeDelta = 0;
            t.moving=true;
            createcannon(turret)
            break;
          }

          if( t.timeDelta >= eneanim.BODYSHOOTIN.duration) {
            enemixer.clipAction(eneanim.BODYSHOOTIN).stop();
            enemixer.clipAction(eneanim.BODYROLLIN).play();

            t.moving = false;
            t.state  = "rot";
          }
          break;
      default: t.state = tankStates[getRandomInt(tankStates.length-1)];
    }
    t.timeDelta += delta;
    // debug.innerHTML=`<pre>${JSON.stringify(t, null, 2)}</pre>`;
  }

  let health    = 4;
  let score     = 0;
  let level     = 0;
  let lastspawn = 0;
  const updateStats = () => debug.innerHTML = `<pre>
  HEALTH: ${health < 0 ? "💀💀💀" : Array(health).fill('💟').join('')}
  SCORE:  ${score}
  LEVEL:  ${Array(level).fill('🪖').join('')}
  last:   ${lastspawn.toFixed(2)} / ${(20-level)}
  </pre>`;
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

  let direction_x, direction_y;

  const animate = function () {
    requestAnimationFrame( animate );
    let delta   = clock.getDelta();

    lastspawn += delta;
    if(lastspawn > (20-level)){
      lastspawn = 0;
      createTurret();
    };
    updateStats();

    turrets.forEach((turret, i) => {
      if(turret == null) return;
      doTurretAction(i, delta);
      if(turretMixer[i])  turretMixer[i].update( delta );
    });


    boomz.forEach((b, i) => {
      if(b==null) return;
      b.scale.x+=15 * delta;
      b.scale.y+=15 * delta;
      b.scale.z+=15 * delta;
      if(b.scale.z > 2){
        // console.log("bye");
        scene.remove(b);
        boomz[i] = null;
      }
    });

    cannons.forEach((b, i) => {
      if(!b) {
        // console.log("empty ball");
        return;
      }
      balltarget.x=(b.position.x);
      balltarget.y=(b.position.y);
      balltarget.z=4;//(b.position.z);

      b.translateY(-40 * delta); // move along the local y-axis

      ballvector.x=(cube.position.x - balltarget.x);
      ballvector.y=(cube.position.y - balltarget.y);
      ballvector.z=4;//(b.position.z);
      ballvector.normalize();

      ballray.set(balltarget, ballvector);
      let ballbound;
      // if(turrets.length > 0){
      //   ballbound = ballray.intersectObjects([...turrets, objects["stage.glb"].scene.children[0]]);
      // } else {
        ballbound = ballray.intersectObjects([cube, objects["stage.glb"].scene.children[0]]);
      // }
      if(ballbound[0] && ballbound[0].distance < 2){
        // console.log(ballbound[0].object)
        if(ballbound[0].object.name=="bambaman") {
          console.log("ouch")
          health--;
          if(health>0) updateStats();
          if(health ==0) debug.innerHTML = "GAME OVER MAN, ITS GAME OVER~";
        }
        // console.log(ballbound);
        createexplosion(b);
        scene.remove(b);
        cannons[i] = null;
      }
    });


    ballz.forEach((b, i) => {
      if(!b) {
        // console.log("empty ball");
        return;
      }
      balltarget.x=(b.position.x);
      balltarget.y=(b.position.y);
      balltarget.z=4;//(b.position.z);

      b.translateY(-40 * delta); // move along the local y-axis

      ballvector.x=(cube.position.x - balltarget.x);
      ballvector.y=(cube.position.y - balltarget.y);
      ballvector.z=4;//(b.position.z);
      ballvector.normalize();

      ballray.set(balltarget, ballvector);
      let ballbound;
      if(turrets.length > 0){
        ballbound = ballray.intersectObjects([...turrets, objects["stage.glb"].scene.children[0]]);
      } else {
        ballbound = ballray.intersectObject(objects["stage.glb"].scene.children[0]);
      }
      if(ballbound[0] && ballbound[0].distance < 2){

        let turretindex = turrets.findIndex((k)=>{
          let target = ballbound[0].object;
          if(k.uuid        == ballbound[0].object.parent.uuid) return true;
          if(k.parent.uuid == ballbound[0].object.parent.uuid) return true;

          for (var index in k.children) {
            if (k.children[index].uuid == target.uuid) return true;
            if (k.children[index].children[0] && k.children[index].children[0].uuid == target.uuid) return true;
          }

        }

          // console.log("find",
          //   k.name, k.uuid,
          //   ballbound[0].object.parent.name, ballbound[0].object.parent.uuid);
          // return k.uuid==ballbound[0].object.parent.uuid}
        );
        if(turretindex!=-1){
          score++;
          turretAction[turretindex].health--;
          turretAction[turretindex].life.scale.x=turretAction[turretindex].health/10;
          if(turretAction[turretindex].health<0){
            score+=10;
            level++;
            removeturret(turretindex);
          }
        }
        updateStats();
        createexplosion(b);
        scene.remove(b);
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
      running = false;
      const playerMixer = mixer['monitoringo.glb'];
      const playerAnims = animations['monitoringo.glb'];
      playerMixer.clipAction( playerAnims.Running )  .stop();
      playerMixer.clipAction( playerAnims.Breathing ).stop();
      playerMixer.clipAction( playerAnims.Shooting ) .play();

      if( (playerMixer.time-shotstart) >= playerAnims.Shooting.duration) {
        playerMixer.clipAction( playerAnims.Shooting ) .stop();
        playerMixer.clipAction( playerAnims.Breathing ).play();

        shotstart = 0;
        walking.stop();
        shot();
        // console.log(cube.position)
      }
    } else {
      // direction_x = (movement[mov_R] - movement[mov_L]);
      // direction_y = (movement[mov_U] - movement[mov_D]);

      if(direction_x || direction_y){
        xtarget.copy(cube.position); xtarget.z = 1.5;
        xvector.z = 0; xvector.y = 0; xvector.x = direction_x; xvector.normalize(); xray.set(xtarget, xvector);
        let xbound = xray.intersectObject(objects["stage.glb"].scene.children[0]);

        ytarget.copy(cube.position); ytarget.z = 1.5;
        yvector.z = 0; yvector.x = 0; yvector.y = direction_y; yvector.normalize(); yray.set(ytarget, yvector);
        let ybound = yray.intersectObject(objects["stage.glb"].scene.children[0]);
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

    if(mixer) Object.keys(mixer).forEach((name) => {
                // console.log(name);
                mixer[name].update( delta );
              });



    composer.render();
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
