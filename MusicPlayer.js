//src : String
//volume : number from 0 to 1
//loop : boolean

import * as THREE         from 'https://cdn.skypack.dev/three@0.134.0';



export default function playSound(listener, src, volume, loop){
  let sound = new THREE.Audio(listener);

  const audioLoader = new THREE.AudioLoader();
  console.log("trying", src);
  audioLoader.load( src, function( buffer ) {
  	sound.setBuffer( buffer );
  	sound.setLoop( true );
  	sound.setVolume( 0.5 );
  	sound.play();
  });

    // let sound = new Audio(src);
    //
    // sound.volume = volume;
    // sound.loop = loop;
    //
    // sound.play();
}
