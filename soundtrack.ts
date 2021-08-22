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

    export class Motif {
        width: number;
        source: Image;

        constructor(img: Image) {
            this.width = img.width;
            this.source = img;
        }

        getNotePitchOffset(x: number) {
            const y = this.getBottomPixelY(x)
            return y >= 0 ?  this.source.height - y :  y;
        }

        getNoteLengthInPixels(x: number) {
            const y = this.getBottomPixelY(x);

            // If this isn't a new note attack
            if (x > 0 && this.source.getPixel(x-1, y) == this.source.getPixel(x, y))
                return 0;

            let count = 0;
            for (let xoff = x; count < this.source.width; count++) {
                if (this.source.getPixel(xoff, y) == 0) {
                    break;
                }
                count++;
            }
            return count;
        }

        private getBottomPixelY(x: number) {
            for (let y = this.source.height - 1; y >= 0; y--) {
                if (this.source.getPixel(x, y) != 0) {
                    return y;
                }
            }
            return -1;
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

        playNote(): PixelNote {
            const offset = this.motif.getNotePitchOffset(this.currentX);
            const pixels = this.motif.getNoteLengthInPixels(this.currentX)

            this.currentX++;
            if (pixels == 0) {
                return undefined
            }
            return new PixelNote(offset, this.pixelsToMs(pixels), this.currentX, this.playSpeedToPixelLength() );
        }

        isDonePlaying() : boolean {
            return this.currentX >= this.motif.width;
        }

        getPixelDuration() : number {
            return music.beat(this.playSpeedToPixelLength())
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
        parent: Soundtrack
        motifs: MotifPlayback[];
        volume: number;

        instrument: InstrumentType;
        role: TrackRole;
        playbackType: TrackPlayType;

        currentMotifIdx: number;
        nextPlayTime: number;
        isDone: boolean; // whether we've run out of music or not to play.
        // isMuted: boolean; TODO this would be cool.

        constructor(parent: Soundtrack, instrument: InstrumentType, role: TrackRole, pType: TrackPlayType) {
            this.parent = parent
            
            this.instrument = instrument;
            this.role = role;
            this.playbackType = pType;

            this.currentMotifIdx = 0;
            this.volume = 1;
            this.motifs = [];
            this.isDone = false;
            this.nextPlayTime = 0;
        }


        playNoteWithInstrument(note: PixelNote) {
            const notes = this.parent.mood.getNote(this.role, note)
            const vol = music.volume() * (this.volume / this.parent.getTrackSumVol());
            

            for (let i = 0; i < notes.length; i++) {
                const freq = notes[i].freq
                let pitchEnv;
                let ampEnv;
                let waveForm;
                let pitchMod = 2;
                let noteLength = music.beat(note.pixelVal) / 2;
                if (this.instrument == InstrumentType.Percussion) {
                    const trig = getTriggerForDrum(notes[i].freq, vol);
                    music.queuePlayInstructions2(0, trig);
                } else {
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
                            noteLength = music.beat(note.pixelVal) * .75;
                            break;

                        default:
                            ampEnv = new envelopes.Envelope(vol, vol, vol, 10)
                            pitchEnv = new envelopes.Envelope(freq+10, freq-10, freq, 10)
                            waveForm = 1;
                    }

                    const trig = envelopes.makeTrigger(noteLength, freq, waveForm, vol, pitchMod, ampEnv, pitchEnv)
                    music.queuePlayInstructions2(notes[i].offset, trig);
                }
            }
        }

        play() {
            if (!this.isDone && this.nextPlayTime <= game.runtime()) {
                const currentM = this.motifs[this.currentMotifIdx]
                const note = currentM.playNote();
                this.nextPlayTime = game.runtime() + currentM.getPixelDuration();

                if (note) {
                    this.playNoteWithInstrument(note);
                }

                if (currentM.isDonePlaying()) {
                    // Queue up the next motif!
                    this.currentMotifIdx++;
                    if (this.playbackType == TrackPlayType.Loop) {
                        this.currentMotifIdx = this.currentMotifIdx % this.motifs.length;
                    }

                    if (this.currentMotifIdx >= this.motifs.length) {
                        this.isDone = true;
                    } else {
                        this.motifs[this.currentMotifIdx].reset(); // Set it up again, boys!
                    }
                }
            }
        }

        reset() {
            this.motifs.forEach(m => m.reset())
            this.nextPlayTime = 0;
            this.isDone = false;
            this.currentMotifIdx = 0;
        }

        addMotif(motif: Motif, speed: PlaySpeed) {
            this.motifs.push(new MotifPlayback(motif, speed));
        }

        setVolume(vol: number) {
            this.volume = vol;
        }

        setPlaybackType(type: TrackPlayType) {
            this.playbackType = type;
        }
    }
    


    export class Soundtrack {
        tracks: {[key: string]:Track};
        trackNames: string[];

        mood: Mood;

        currentChordIdx: number;

        constructor() {
            this.trackNames = [];
            this.tracks = {};
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
        }

        playOnUpdate() {
            this.mood.update();

            for (let name of this.trackNames) {
                const track = this.tracks[name]
                track.play();
            }
        }
    }

    export class SoundtrackState {
        recordingTrackName: string;
        recordingSoundtrackName: string;

        playingSoundtrackName: string;
        isPlaying: boolean;

        soundtrackCollection: { [key:string]: Soundtrack};
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

            this.moods[MusicMood.Adventure] = new Mood(Note.C, 4, 4, musicUtils.ScaleType.HarmonicMinor, "C Bb C C", bassForAdveture);
            this.moods[MusicMood.Adventure].setFlavorPlayStyle(PlayStyle.Octaves);
            this.moods[MusicMood.Chill] = new Mood(Note.C, 4, 4, musicUtils.ScaleType.Major, "Dm7 Gm7 Cm7 C", bassForChill);
            this.moods[MusicMood.Chill].setFlavorPlayStyle(PlayStyle.Arpeggiated);
            this.moods[MusicMood.Chill].setDrumPattern(img`
3 3 3 3 3 3 . . 3 3 3 3 3 3 . . 
. . . . . . . . . . . . . . . . 
. . . . 3 . . . . . . . 3 . . . 
3 . . 3 . . . . 3 . . 3 . . . . 
`)
            this.moods[MusicMood.Magical] = new Mood(Note.C, 4, 4, musicUtils.ScaleType.Minor, "Bb F Gm F", bassForChill, Note.Bb );
            this.moods[MusicMood.Magical].setFlavorPlayStyle(PlayStyle.Arpeggiated);
        }

        getCurrentlyRecordingSoundtrack(): Soundtrack {
            const st = this.soundtrackCollection[this.recordingSoundtrackName];
            return st;
        }

        getCurrentlyRecordingTrack() {
            const st = this.getCurrentlyRecordingSoundtrack()
            if (st) {
                return st.getTrack(this.recordingTrackName);
            }
            return undefined;
        }

        getCurrentlyPlayingSoundtrack(): Soundtrack {
            return this.soundtrackCollection[this.playingSoundtrackName]
        }

        startPlaySoundtrack(name: string) {
            this.playingSoundtrackName = name;
            this.isPlaying = true;
        }

        stopPlaySoundtrack() {
            this.isPlaying = false;
            this.getCurrentlyPlayingSoundtrack().reset();
        }

    }

    export function registerSoundtrack(name: string) {
        init();

        state.soundtrackCollection[name] = new Soundtrack();
        state.recordingSoundtrackName = name;

        state.getCurrentlyRecordingSoundtrack().setMood(state.moods[MusicMood.Adventure])
    }

    export function registerTrack(name: string, instrument: InstrumentType, role: TrackRole, playbackType: TrackPlayType) {
        init();

        const curr = state.getCurrentlyRecordingSoundtrack();
        if (curr) {
            const track = new Track(curr, instrument, role, playbackType);
            curr.addTrack(name, track);
            state.recordingTrackName = name;
        }
    }

    export function registerMotif(motif: Motif, speed: PlaySpeed) {
        const track = state.getCurrentlyRecordingTrack();
        track.addMotif(motif, speed);
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

    export function changeKeyBySecret(diff: number) {
        init();

        const st = state.isPlaying ? state.getCurrentlyPlayingSoundtrack()
            : state.getCurrentlyRecordingSoundtrack();

        if (st) {
            st.changeKey(diff);
        }
    }

    export function setSoundtrackKeySecret(key: number) {
        init();

        const st = state.isPlaying ? state.getCurrentlyPlayingSoundtrack()
                    : state.getCurrentlyRecordingSoundtrack();

        if (st)
            st.setKey(key)
    }

    export function setTrackVolumeSecret(vol: number) {
        init();
        const track = state.getCurrentlyRecordingTrack();
        if (track) 
            track.setVolume(vol);
    }
    export function setSoundtrackMoodSecret(mood: MusicMood) {
        init();
        const st = state.getCurrentlyRecordingSoundtrack();
        if (st)
            st.setMood(state.moods[mood])
    }


    function init() {
        if (state) return;

        state = new SoundtrackState();
        game.currentScene().eventContext.registerFrameHandler(scene.PHYSICS_PRIORITY + 1, function() {

            if (state.isPlaying) {
                state.getCurrentlyPlayingSoundtrack().playOnUpdate();
            }
        })
    }
}