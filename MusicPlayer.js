//src : String
//volume : number from 0 to 1
//loop : boolean


export default function playSound(src, volume, loop){
    let sound = new Audio(src);
     
    sound.volume = volume;
    sound.loop = loop;
        
    sound.play();
}