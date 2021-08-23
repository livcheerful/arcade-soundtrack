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

    export enum MusicMood {
        //% block="Adventure"
        Adventure,
        //% block="Chill"
        Chill,
        //% block="Magical"
        Magical,
        //% block="Free",
        Free,
        //% block="Bluesy"
        Bluesy
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

    //% block="change key by $interval"
    //% group="Play"
    export function changeKeyBy(interval: number) {
        changeKeyBySecret(interval);
    }


    /***********************************
     *           MOTIF
     ***********************************/
    /**
     * Create a new motif from image
     */
    //% blockId="motifCreate" block="motif $img"
    //% img.shadow="screen_image_picker"
    //% block
    //% group="Compose"
    export function motif( img: Image): Motif {
        return soundtrack.createMotif(img);
    }


    //% block="play $motif on $track $speed"
    //% motif.shadow="motifCreate"
    //% speed.shadow="soundtrack_speed_picker"
    //% group="Compose"
    export function playMotif(track: string, motif: Motif, speed: PlaySpeed) {
        registerMotif(track, motif, speed);
    }



    /***********************************
     *           SOUNDTRACK
     ***********************************/
    /**
     * Define a soundtrack with a name. Doesn't play it
     */
    //% block="soundtrack $name"
    //% group="Song"
    export function setSoundtrack(name: string, handler: () => void) {
        registerSoundtrack(name, handler)
    }

    //% blockId=soundtrack_set_key
    //% block="set key $key"
    //% key.fieldEditor="note"
    //% group="Song"
    export function setSountrackKey(key: number) {
        setSoundtrackKeySecret(key)
    }

    //% blockId=soundtrack_set_mood
    //% block="set mood to $mood"
    //% mood.shadow="soundtrack_mood_picker"
    //% group="Song"
    export function setSoundtrackMood(mood: number) {
        setSoundtrackMoodSecret(mood)
    }

    //% blockId=soundtrack_set_chords
    //% block="set chords $chords in key $key"
    //% key.fieldEditor="note"
    //% group="Song"
    export function setChords(chords: string, key: Note) {
        setChordsSecret(chords, key);
    }

    /***********************************
     *           TRACK
     ***********************************/

    //% block="set track $name $instrument as $role $t"
    //% handlerStatement
    //% instrument.shadow=soundtrack_instrument_picker
    //% role.shadow=soundtrack_track_role_picker
    //% t.shadow=soundtrack_track_play_type
    //% expandableArgumentMode="toggle"
    //% group="Track"
    export function setTrack(name: string, instrument: number, role: number, t: number, handler: ()=>void) {
        registerTrack(name, instrument, role, t, handler);
    }


    //% blockId=soundtrack_set_volume
    //% block="set track volume $vol"
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
    //% block="$theType"
    //% blockHidden=true
    //% theType.defl="soundtrack.TrackPlayType.Loop"
    //% duplicateShadowOnDrag
    export function _trackPlayType(theType: TrackPlayType): number {
        return theType;
    }

    //% blockId=soundtrack_mood_picker
    //% shim=TD_ID
    //% block="$mood"
    //% blockHidden=true
    //% type.defl="soundtrack.MusicMood.Adventure"
    //% duplicateShadowOnDrag
    export function _setSoundtrackMood(mood: MusicMood): number {
        return mood
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