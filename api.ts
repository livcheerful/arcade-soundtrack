/**
 * VVN TODO
 */
//% color="#b3687d" weight=100 icon="\uf1ec" block="Soundtrack"
namespace soundtrack {

    //%
    export class Motif {
        constructor() {
            return {}
        }
    }

    export class Song {
        constructor() {
            return undefined;
        }

        //% blockId=soundtrack_set_volume
        //% block="set volume to $vol"
        //% group="Play"
        public setVolume(vol: number) {

        }

        //% blockId=soundtrack_set_temp
        //% block="set tempo to $tempo"
        //% group="Song"
        public setTempo(tempo: number) {

        }
    }


    export enum TrackRole {
        //% block="Bass"
        Bass,
        //% block="Rhythm"
        Rhythm,
        //% block="Melody"
        Melody,
        //% block="Flavor"
        Flavor
    }

    export enum PlaySpeed {
        //% block="Very Slowly"
        VerySlowly,
        //% block="Slowly"
        Slowly,
        //% block="Normal"
        Normal,
        //% block="Quickly"
        Quickly,
        //% block="Very Quickly"
        VeryQuickly
    }
    export enum TrackPlayType {
        //% block="Loop"
        Loop,
        //% block="One Shot"
        OneShot
    }

    export enum InstrumentType {
        //% block="Piano"
        Piano,
        //% block="Brass"
        Brass,
        //% block="String"
        String,
        //% block="Bells"
        Bell,
        //% block="Drums"
        Percussion,
        //% block="Chip"
        Chip
    }
    /***********************************
     *           PLAY
     ***********************************/


    //% block="play soundtrack $name"
    //% group="Play"
    export function playSoundtrack(name: string): void {

    }

    //% block="stop soundtrack"
    //% group="Play"
    export function stopSountrack() {

    }




    /***********************************
     *           COMPOSE
     ***********************************/
    /**
     * Create a new motif from image
     */
    //% blockId="motifCreate" block="motif $img"
    //% img.shadow="screen_image_picker"
    //% block
    //% group="Compose"
    export function motif(img: Image): Motif {
        sprites.create(img, 0)
        return new Motif();
    }


    //% block="play $motif $speed"
    //% motif.shadow="motifCreate"
    //% speed.shadow="soundtrack_speed_picker"
    //% group="Compose"
    export function playMotif(motif: Motif, speed: PlaySpeed) {

    }



    /***********************************
     *           SONG
     ***********************************/
    /**
     * Define a soundtrack with a name. Doesn't play it
     */
    //% block="soundtrack $name"
    //% group="Song"
    export function setSoundtrack(name: string, handler: () => void) {

    }


    //% blockId=soundtrack_set_key
    //% block="set key $key"
    //% group="Song"
    export function setSountrackKey(key: number) {

    }



    /***********************************
     *           TRACK
     ***********************************/

    //% block="set track $name"
    //% handlerStatement
    //% group="Track"
    export function setTrack(name: string, handler: ()=>void) {

    }


    //% block="set track play type to $type"
    //% type.shadow=soundtrack_track_play_type
    //% group="Track"
    export function setTrackPlaybackType(type: number) {

    }

    //% block="set track instrument to $instrument"
    //% instrument.shadow=soundtrack_instrument_picker
    //% group="Track"
    export function setTrackInstrument(instrument: number) {

    }

    //% blockId=soundtrack_role_picker
    //% block="set track role $role"
    //% role.shadow=soundtrack_track_role_picker
    //% group="Track"
    export function setRole(role: number) {

    }

    export function setOctave(octave: number) {

    }




    /***********************************
     *           shhhh
     ***********************************/
    //% blockId=soundtrack_track_role_picker
    //% shim=TD_ID
    //% block="$role"
    //% blockHidden=true
    //% role.defl="soundtrack.TrackRole.Melody"
    //% duplicateShadowOnDrag
    export function _trackRole(role: TrackRole): number {
        return role;
    }

    //% blockId=soundtrack_speed_picker
    //% shim=TD_ID
    //% block="$speed"
    //% blockHidden=true
    //% speed.defl="soundtrack.PlaySpeed.Normal"
    //% duplicateShadowOnDrag
    export function _playSpeed(speed: PlaySpeed): number {
        return speed;
    }

    //% blockId=soundtrack_track_play_type
    //% shim=TD_ID
    //% block="$type"
    //% blockHidden=true
    //% type.defl="soundtrack.TrackPlayType.Loop"
    //% duplicateShadowOnDrag
    export function _trackPlayType(type: TrackPlayType): number {
        return type;
    }

    //% blockId=soundtrack_instrument_picker
    //% shim=TD_ID
    //% block="$instrument"
    //% blockHidden=true
    //% instrument.defl="Piano"
    //% duplicateShadowOnDrag
    export function _instrument(instrument: InstrumentType): number {
        return instrument
    }
}