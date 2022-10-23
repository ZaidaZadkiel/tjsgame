import * as THREE         from 'three';
import { GLTFLoader }     from 'three/examples/jsm/loaders/GLTFLoader.js';

const manager     = new THREE.LoadingManager();
const audioLoader = new THREE.AudioLoader(manager);
const loader      = new GLTFLoader(manager);
export const imgloader = new THREE.TextureLoader(manager);


manager.onStart = function ( url, itemsLoaded, itemsTotal ) {
  console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
};

manager.onLoad = function ( ) {
  // console.log( 'Loading complete!');
  console.log("onLoad triggered");

  // renderer.shadowMapEnabled = true;
  // renderer.shadowMapSoft = true;
  // renderer.shadowMapType = THREE.PCFShadowMap;

};


manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
  // console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );

  //******* loadingscreen.style.width=`${(100*itemsLoaded)/itemsTotal}%`;

  // console.log(loadingscreen.style.width)
};

manager.onError = function ( url ) {
  console.log( 'There was an error loading ' + url );
};


const loadAudioPhilez = (paths) => {
  if(!Array.isArray(paths)) {
    console.log("Error loading audio philez");
    return null;
  }

  console.log("loadAudioPhilez")

  return Promise.all(
    paths.map(
      (path, i) => new Promise(
        (ok, no)=>{
          console.log("promisall", i, path, ok, no)
          audioLoader.load( `sound/${path}`, (y,n)=>ok(y) )
        }
      )
    )
  ).then(
    x=>{
      let audios = {};
      x.forEach(
        (item, i) => {
          let path     = paths[i];
          audios[path] = item;
        }
      );
      console.log("audios load inner")
      return audios;
    }
  );
}

const loadGLTFPhilez  = (paths) => {

  if(!Array.isArray(paths)) {
    console.log("Error loading gltf philez");
    return null;
  }

  return Promise.all(
    paths.map(
      (path, i) => new Promise(
        (ok, no)=>{
          console.log("promisall", i, path, ok, no)
          loader.load( `mod/${path}`, (y,n)=>ok(y) )
        }
      )
    )
  ).then(x=>{
    console.log("loled promise all", x)
    let objects    = {};
    let mixer      = {};
    let animations = {};

    x.forEach(
      (item, i) => {
        let path = paths[i];
        objects[path] = item;

        if(item.animations[0]){
          mixer[path] = new THREE.AnimationMixer( item.scene );
          item.animations.forEach(
            (anim) => {
              if(!animations[path]) animations[path] = {};
              animations[path][anim.name] = anim;
            }
          );
        }
      }
    );

    console.log(objects)

    return {objects, mixer, animations};
  })
} // loadGLTFPhilez()






export async function loadAll(sounds, models, progress_callback){
  if(!sounds || !models || !progress_callback) throw Error("loadAll cant load with empty sounds, empty models or empty callback");

  manager.onProgress = progress_callback;

  return await Promise.all(
    []
    .concat(loadGLTFPhilez (models))
    .concat(loadAudioPhilez(sounds))
  ).then(
      (data)=>{
        console.log("loadAll inner", data[0], data[1])
        return ({
          sounds: data[1],
          models: data[0]
        })
      })
}
