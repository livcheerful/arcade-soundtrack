namespace soundtrack {
    let state: SoundtrackState;

    export class NoteWave {
        freq: number;
        offset: number;

        constructor(f: number, o?: number) {
            this.freq = f;
            this.offset = o || 0;
        }

    }

    function getTriggerForDrum(sound: DrumSounds, volume: number) {
        switch (sound) {
            case DrumSounds.CrashSymbol:
                const ampEnv = new envelopes.Envelope(volume + 4, volume, volume, 300);
                const pitchEnv = new envelopes.Envelope(550 + 2, 550 - 2, 550, 0);
                return envelopes.makeTrigger(100, 550, 5, volume, 0, ampEnv, pitchEnv)
            case DrumSounds.Kick:
                // const volume = 500;
                const kickAmpEnv = new envelopes.Envelope(volume / 2, 0,  volume / 20, 0);
                const kickPitchEnv = new envelopes.Envelope(10, 40, 0, 1000);
                return envelopes.makeTrigger(160, 60, 3, 80, 80, kickAmpEnv, kickPitchEnv)
            case DrumSounds.Snare:
                const freq = 1200;
                const duration = 80;
                const waveForm = 5;

                const snareAmpEnv = new envelopes.Envelope(10, 100, 20, 0);
                const snarePitchEnv = new envelopes.Envelope(10, 10, 0, 100);

                const trig = envelopes.makeTrigger(duration, freq, waveForm,
            /*ampMod=*/80, /*pitchMod=*/80,
                    snareAmpEnv, snarePitchEnv)
            
            default:
                // HiHat sound
                const hhAmp = new envelopes.Envelope(volume + 4, volume, volume, 20);
                const hhPitch = new envelopes.Envelope(440 + 2, 440 - 2, 440, 0);
                return envelopes.makeTrigger(20, 440, 5, volume, 0, hhAmp, hhPitch)
        }
    }

    export enum DrumSounds {
        Kick,
        Snare,
        HiHat,
        CrashSymbol
    }

    export enum PlayStyle {
        OneToOne,
        Arpeggiated,
        Octaves
    }

    export enum DrumPlayStyle {
        OneToOne,
        Pattern
    }

    export class Motif {
        width: number;
        source: Image;

        constructor(img: Image) {
            this.width = img.width;
            this.source = img;
        }

        getNotePitchOffset(x: number): number[] {
            const rets = []
            for (let y = 0; y < this.source.height; y++) {
                const thisPix = this.source.getPixel(x, y)
                if (thisPix != 0) {
                    if (x == 0 || this.source.getPixel(x-1, y) != thisPix) {
                        rets.push(this.source.height - y - 1)
                    }
                }
            }
            return rets;
        }

        getNoteLengthInPixels(x: number, ys: number[]) {
            const lengths = ys.map( y => {
                let count = 0;
                for (let xoff = x; count < this.source.width; count++) {
                    if (this.source.getPixel(xoff, y) == 0) {
                        break;
                    }
                    count++;
                }
                return count;
            })
            
            return lengths;
        }
    }

    export class PixelNote {
        pitchOffset: number;
        length: number;
        x: number;
        pixelVal: BeatFraction;

        constructor(pitch: number, length: number,x: number, pixelVal: number) {
            this.pitchOffset = pitch;
            this.length = length
            this.x = x;
            this.pixelVal = pixelVal;
        }
    }

    export class MotifPlayback {
        motif: Motif;
        speed: PlaySpeed;

        currentX: number;

        constructor(motif: Motif, speed:PlaySpeed) {
            this.motif = motif
            this.speed = speed
            this.currentX = 0;
        }

        reset() {
            this.currentX = 0;
        }

        playNote(): PixelNote[] {
            const ys = this.motif.getNotePitchOffset(this.currentX);
            const pixelLengths = this.motif.getNoteLengthInPixels(this.currentX, ys)

            this.currentX++;
            if (ys.length == 0 || pixelLengths.length == 0) {
                return undefined
            }

            const pn = []
            for (let note = 0; note < ys.length; note++) {
                pn.push(new PixelNote(ys[note], this.pixelsToMs(pixelLengths[note]),this.currentX, this.playSpeedToPixelLength()))
            }

            return pn;
        }

        isDonePlaying() : boolean {
            return this.currentX >= this.motif.width;
        }

        getPixelDuration() : number {
            return music.beat(this.playSpeedToPixelLength()) * 4
        }

        private pixelsToMs(px: number) {
            return px * this.getPixelDuration();
        }

        private playSpeedToPixelLength() {
            switch (this.speed) {
                case PlaySpeed.VerySlowly:
                    return BeatFraction.Whole
                case PlaySpeed.Slowly:
                    return BeatFraction.Half
                case PlaySpeed.Normal:
                    return BeatFraction.Quarter
                case PlaySpeed.Quickly:
                    return BeatFraction.Eighth;
                case PlaySpeed.VeryQuickly:
                    return BeatFraction.Sixteenth
            }
        }
    }
        
// FACE -> FAbBE -> EGBD -> EGBC //TEDDY"S lofi, 
// DFAC (Dm7) -> DFGB (Gm7)-> (Cm7) 


    export class Track {
        handler: () => void;

        parent: Soundtrack
        currentMotif: MotifPlayback;
        volume: number;

        instrument: InstrumentType;
        role: TrackRole;
        playbackType: TrackPlayType;

        isPlaying: boolean;
        isDone: boolean; // whether we've run out of music or not to play.
        // isMuted: boolean; TODO this would be cool.

        constructor(parent: Soundtrack, instrument: InstrumentType, role: TrackRole, pType: TrackPlayType, handler: () =>void) {
            this.parent = parent
            
            this.instrument = instrument;
            this.role = role;
            this.playbackType = pType;

            this.volume = 1;
            this.isDone = false;
            this.isPlaying = true;

            this.handler = handler;

            control.runInParallel(() => {
                this.startPlayingAHH()
            })
        }

        startPlayingAHH() {
            do {
                this.handler();
            } while(this.playbackType == TrackPlayType.Loop && this.isPlaying)
            this.isDone = true;
        }


        playNoteWithInstrument(note: PixelNote) {
            const notes = this.parent.mood.getNote(this.role, note)
            const vol = music.volume() * (this.volume / this.parent.getTrackSumVol());
            

            for (let i = 0; i < notes.length; i++) {
                let freq = notes[i].freq
                let pitchEnv;
                let ampEnv;
                let waveForm;
                let pitchMod = 2;
                let noteLength = music.beat(note.pixelVal) / 2;

                if (this.role == TrackRole.Rhythm) {
                    if (this.instrument == InstrumentType.Percussion) {
                        const trig = getTriggerForDrum(freq, vol);
                        music.queuePlayInstructions2(0, trig);
                        continue;
                    } else {
                        freq = this.parent.mood.getCurrentChord().root;
                    }
                } 
                switch(this.instrument) {
                    case InstrumentType.Bell:
                        ampEnv = new envelopes.Envelope(vol + 10, vol, vol - 5, 50)
                        pitchEnv = new envelopes.Envelope(freq, freq, freq, 0)
                        waveForm = 3;
                        noteLength = 100;
                        break;
                    case InstrumentType.Chip:
                        ampEnv = new envelopes.Envelope(vol , vol, vol, 50)
                        pitchEnv = new envelopes.Envelope(freq, freq, freq, 0)
                        waveForm = 15;
                        break;
                    case InstrumentType.Brass:
                        ampEnv = new envelopes.Envelope(vol + 5, vol -10, vol - 10, 10)
                        pitchMod = 0;
                        waveForm = 2;
                        noteLength = music.beat(note.pixelVal)*4 * .75;
                        break;

                    default:
                        ampEnv = new envelopes.Envelope(vol, vol, vol, 10)
                        pitchEnv = new envelopes.Envelope(freq+10, freq-10, freq, 10)
                        noteLength = music.beat(note.pixelVal) * 4 * .75;
                        waveForm = 1;
                }

                const trig = envelopes.makeTrigger(noteLength, freq, waveForm, vol, pitchMod, ampEnv, pitchEnv)
                music.queuePlayInstructions2(notes[i].offset, trig);
                
            }
        }

        reset() {
            this.isDone = false;
            this.isPlaying = false;
        }

        playMotif(motif: Motif, speed: PlaySpeed) {
            this.currentMotif = new MotifPlayback(motif, speed);
            for (let x = 0; x < this.currentMotif.motif.width; x++) {
                if (this.isPlaying) {
                    const notes = this.currentMotif.playNote();
                    if (notes) {
                        for (let i = 0; i < notes.length; i++) {
                            const note = notes[i];
                            this.playNoteWithInstrument(note);
                        }
                    }
                    loops.pause(this.currentMotif.getPixelDuration())
                } else {
                    // It'd be nice if we could clean ourselves up...
                }
            }
        }

        setVolume(vol: number) {
            this.volume = vol;
        }

        setPlaybackType(type: TrackPlayType) {
            this.playbackType = type;
        }
    }
    


    export class Soundtrack {
        handler: () => void;

        tracks: {[key: string]:Track};
        trackNames: string[];

        mood: Mood;

        currentChordIdx: number;

        constructor(handler: () => void) {
            this.trackNames = [];
            this.tracks = {};

            this.handler = handler;
        }

        reset() {
            for (let name of this.trackNames) {
                this.tracks[name].reset();
            }
        }

        addTrack(name: string, track: Track) {
            this.tracks[name] = track;
            this.trackNames.push(name)
        }

        getTrack(name: string): Track {
            return this.tracks[name];
        }

        getTrackSumVol() : number {
            let sum = 1;
            for (let name of this.trackNames) {
                const track = this.tracks[name]
                sum += track.volume;
            }
            return sum;
        }

        changeKey(diff: number) {
            this.mood.updateKey(musicUtils.getNoteFromInterval(this.mood.key, diff))
        }

        setKey(key: number) {
            this.mood.updateKey(key);
        }

        setMood(mood: Mood) {
            this.mood = mood;
            this.mood.update();
        }

        playOnUpdate() {
            this.mood.update();
        }
    }

    export class SoundtrackState {
        recordingTrackName: string;

        currentSoundtrackName: string;
        isPlaying: boolean;

        soundtrackCollection: { [key:string]: Soundtrack};
        currentMood: Mood;
        moods: Mood[];

        constructor() {
            this.soundtrackCollection = {};
            this.isPlaying = false;

            this.moods = []
            const bassForAdveture = img`
                ................................
                ................................
                ................................
                ................................
                ................................
                ................................
                ................................
                ........................3333....
                ......................33........
                ................................
                ................................
                ..........33....................
                ......33......33................
                ..33..............33............
                ................................
                23..34..32..23..32..34..........
            `

            const bassForChill = img`
                . . . . . . . .
                . . . . 3 . . .
                . . . . . . . .
                . . . . . . . .
                . . . 3 . 3 . .
                . . . . . . . .
                . . . . . . . .
                . . 3 . . . 3 .
                . . . . . . . .
                . . . . . . . .
                . 3 . . . . . 3
                . . . . . . . .
                . . . . . . . .
                . . . . . . . .
                . . . . . . . .
                3 . . . . . . .
            `
            const drumForChill = img`
                7 . . . . . . . . . . . . . . .
                . . . . . . . . . . . . . . . .
                . . . . 3 . . . . . . . 3 . . .
                3 . . 3 . . . . 3 . . 3 . . . .
            `
            const bassForFree = img`
                . . . . . . . . . . . . . . . .
                . . 7 7 . . 7 7 . . a a . . a a
                . . . . . . . . . . . . . . . .
                a a . . a a . . a a . . a a . .
            `
            const bassForBlues = img`
                . . . . . . . . . . . . . . . .
                . . . . . . . . . . . . . . . .
                . . . . . . . . . . . . . . . .
                3 . . 3 7 . . 7 4 . . 4 3 . . 3
            `
            this.moods[MusicMood.Adventure] = new Mood(Note.C, 4, 4, musicUtils.ScaleType.HarmonicMinor, "C Bb C C", bassForAdveture);
            this.moods[MusicMood.Adventure].setFlavorPlayStyle(PlayStyle.Octaves);
            this.moods[MusicMood.Chill] = new Mood(Note.C, 4, 4, musicUtils.ScaleType.Major, "Dm7 Gm7 Cm7 C", bassForChill);
            this.moods[MusicMood.Chill].setFlavorPlayStyle(PlayStyle.OneToOne);
            this.moods[MusicMood.Chill].setDrumPattern(drumForChill)
            this.moods[MusicMood.Magical] = new Mood(Note.C, 4, 4, musicUtils.ScaleType.Minor, "Bb F Gm F", bassForChill, Note.Bb );
            this.moods[MusicMood.Magical].setFlavorPlayStyle(PlayStyle.Arpeggiated);
            this.moods[MusicMood.Free] = new Mood(Note.C, 4, 4, musicUtils.ScaleType.Major, "C G Am F", bassForFree);
            this.moods[MusicMood.Free].setFlavorPlayStyle(PlayStyle.OneToOne);
            this.moods[MusicMood.Free].setDrumPlayStyle(DrumPlayStyle.OneToOne);
            this.moods[MusicMood.Bluesy] = new Mood(Note.C, 4, 4, musicUtils.ScaleType.Blues, "C F C C7 F F7 C C7 G F C G7", bassForBlues)
            this.moods[MusicMood.Bluesy].setFlavorPlayStyle(PlayStyle.OneToOne)
            this.moods[MusicMood.Bluesy].setDrumPlayStyle(DrumPlayStyle.OneToOne)

            this.currentMood = this.moods[MusicMood.Adventure]
        }

        getCurrentSoundtrack(): Soundtrack {
            const st = this.soundtrackCollection[this.currentSoundtrackName];
            return st;
        }

        startPlaySoundtrack(name: string) {
            if (this.isPlaying) {
                // Stop the current Soundtrack
                this.getCurrentSoundtrack().reset();
            }
            this.currentSoundtrackName = name
            this.isPlaying = true;
            this.getCurrentSoundtrack().handler();
        }

        stopPlaySoundtrack() {
            this.isPlaying = false;
            this.getCurrentSoundtrack().reset();
        }

    }

    export function registerSoundtrack(name: string, handler: () => void) {
        init();

        state.soundtrackCollection[name] = new Soundtrack(handler);
        state.soundtrackCollection[name].setMood(state.moods[MusicMood.Adventure])
    }

    export function registerTrack(name: string, instrument: InstrumentType, role: TrackRole, playbackType: TrackPlayType, handler: ()=>void) {
        init();

        const curr = state.getCurrentSoundtrack();
        if (curr) {
            const track = new Track(curr, instrument, role, playbackType, handler);
            curr.addTrack(name, track);
            state.recordingTrackName = name;
        }
    }

    export function registerMotif(trackName:string,motif: Motif, speed: PlaySpeed) {
        const track = state.getCurrentSoundtrack().tracks[trackName];
        if (track.isPlaying) {
            track.playMotif(motif, speed);
        }
    }

    export function createMotif (img: Image) {
        const motif = new Motif(img);

        return motif;
    }

    export function playSoundtrackSecret(name: string) {
        init();
        state.startPlaySoundtrack(name);
    }

    export function stopSoundtrackSecret() {
        init();

        state.stopPlaySoundtrack();
    }

    export function setChordsSecret(chords: string, key: Note) {
        init();
        
        state.currentMood.setChords(chords, key)
    }

    export function changeKeyBySecret(diff: number) {
        init();

        const st = state.getCurrentSoundtrack()

        if (st) {
            st.changeKey(diff);
        }
    }

    export function setSoundtrackKeySecret(key: number) {
        init();

        const st = state.getCurrentSoundtrack()

        if (st)
            st.setKey(key)
    }

    export function setTrackVolumeSecret(trackName: string, vol: number) {
        init();
        const track = state.getCurrentSoundtrack().tracks[trackName];
        if (track) 
            track.setVolume(vol);
    }
    export function setSoundtrackMoodSecret(mood: MusicMood) {
        init();
        const st = state.getCurrentSoundtrack();
        if (st) {
            st.setMood(state.moods[mood])
            state.currentMood = state.moods[mood];
        }
    }


    function init() {
        if (state) return;

        state = new SoundtrackState();
        game.currentScene().eventContext.registerFrameHandler(scene.PHYSICS_PRIORITY + 1, function() {

            if (state.isPlaying) {
                state.getCurrentSoundtrack().playOnUpdate();
            }
        })
    }
}