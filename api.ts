/**
 * VVN TODO
 */
//% color="#b3687d" weight=100 icon="\uf1ec" block="Soundtrack"
namespace soundtrack {
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
        playSoundtrackSecret(name);
    }

    //% block="stop soundtrack"
    //% group="Play"
    export function stopSountrack() {
        stopSoundtrackSecret();
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
        return soundtrack.createMotif(img);
    }


    //% block="play $motif $speed"
    //% motif.shadow="motifCreate"
    //% speed.shadow="soundtrack_speed_picker"
    //% group="Compose"
    export function playMotif(motif: Motif, speed: PlaySpeed) {
        registerMotif(motif, speed);
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
        registerSoundtrack(name)

        handler();//VVN TODO should i be calling this? I think so....
    }


    //% blockId=soundtrack_set_key
    //% block="set key $key"
    //% key.fieldEditor="note"
    //% group="Song"
    export function setSountrackKey(key: number) {
        setSoundtrackKeySecret(key)
    }



    /***********************************
     *           TRACK
     ***********************************/

    //% block="set track $name $instrument as $role $type"
    //% handlerStatement
    //% instrument.shadow=soundtrack_instrument_picker
    //% role.shadow=soundtrack_track_role_picker
    //% type.shadow=soundtrack_track_play_type
    //% expandableArgumentMode="toggle"
    //% group="Track"
    export function setTrack(name: string, instrument: number, role: number, type: number, handler: ()=>void) {
        registerTrack(name, instrument, role, type);
        handler();
    }


    //% blockId=soundtrack_set_volume
    //% block="set track volume percent to $vol"
    //% group="Track"
    export function setTrackVolume(vol: number) {
        setTrackVolumeSecret(vol);
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