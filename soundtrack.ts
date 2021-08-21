namespace soundtrack {
    let state: SoundtrackState;

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

    export class NoteBones {
        pitchOffset: number;
        length: number;
        constructor(pitch: number, length: number) {
            this.pitchOffset = pitch;
            this.length = length
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

        playNote(): NoteBones {
            const offset = this.motif.getNotePitchOffset(this.currentX);
            const pixels = this.motif.getNoteLengthInPixels(this.currentX)

            this.currentX += 1;
            if (pixels == 0) {
                return undefined
            }
            return new NoteBones(offset, this.pixelsToMs(pixels) ); // TODO get note length
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

    // PercussionSounds {
    //     const freq = 440;
    //     const duration = 10;
    //     const volume = music.volume() * 10;
    //     const waveForm = 5

    //     const ampEnv = new Envelope(volume + 4, volume, volume, duration * 2);
    //     const pitchEnv = new Envelope(freq + 2, freq - 2, freq, 0);

    //     const trig = makeTrigger(duration, freq, waveForm, volume, 0, ampEnv, pitchEnv)
    //     music.queuePlayInstructions2(0, trig);
    // }
        
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

        noteOptions: number[]; // Array of frequencies.

        constructor(parent: Soundtrack, instrument: InstrumentType, role: TrackRole, pType: TrackPlayType) {
            this.parent = parent
            
            this.instrument = instrument;
            this.role = role;
            this.playbackType = pType;


            this.currentMotifIdx = 0;
            this.motifs = [];
            this.isDone = false;
            this.nextPlayTime = 0;

            this.generateNoteOptions();
        }

        generateNoteOptions(chord?: musicUtils.Chord) {// TODO set this when we set the key...and mood?
            if (!chord) {
                this.noteOptions = [Note.C, Note.E, Note.G, Note.Bb];
            } else {
                switch(this.role) {
                    case TrackRole.Bass: this.noteOptions = chord.getNotes(1, 2);
                    case TrackRole.Melody: this.noteOptions = chord.getNotes(4, 2);
                    case TrackRole.Flavor: this.noteOptions = chord.getNotes(2, 5);
                    case TrackRole.Rhythm: this.noteOptions = chord.getNotes(4, 1); // VVN TODO RHYTHM
                }
            }
        }

        getNoteFreqFromOffset(offset: number) {
            // if (this.role == TrackRole.Bass) {
            //     return this.noteOptions[Math.floor(offset / this.noteOptions.length)]
            // }

            return this.noteOptions[ offset % this.noteOptions.length]
        }

        playNoteWithInstrument(note: NoteBones) {
            const freq = this.getNoteFreqFromOffset(note.pitchOffset);
            const vol = music.volume();

            let pitchEnv;
            let ampEnv;
            let waveForm;
            let pitchMod = 2;
            
            switch(this.instrument) {
                case InstrumentType.Bell:
                    ampEnv = new envelopes.Envelope(vol + 10, vol, vol - 5, 50)
                    pitchEnv = new envelopes.Envelope(freq, freq, freq, 0)
                    waveForm = 3;
                    break;
                case InstrumentType.Chip:
                    ampEnv = new envelopes.Envelope(vol , vol, vol, 50)
                    pitchEnv = new envelopes.Envelope(freq, freq, freq, 0)
                    waveForm = 15;
                    break;
                case InstrumentType.Brass:
                    ampEnv = new envelopes.Envelope(vol + 5, vol -10, vol - 10, note.length)
                    pitchMod = 0;
                    waveForm = 2;
                    break;
                default:
                    ampEnv = new envelopes.Envelope(vol, vol, vol, 50)
                    pitchEnv = new envelopes.Envelope(freq+10, freq-10, freq, 10)
                    waveForm = 1;
            }

            const trig = envelopes.makeTrigger(note.length, freq, waveForm, vol, pitchMod, ampEnv, pitchEnv)
            music.queuePlayInstructions2(0, trig);
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

        key: number;
        mood: MusicMood;
        beatVal: BeatFraction;
        beatsPMeasure: number;

        chords: musicUtils.Chord[];
        nextChordChangeTime: number;
        currentChordIdx: number;

        constructor() {
            this.trackNames = [];
            this.tracks = {};
            this.mood = MusicMood.Chill;
            this.generateChordsForMood();
            this.generateTimeSigForMood();

            this.beatVal = BeatFraction.Quarter;
            this.beatsPMeasure = 4;

            this.currentChordIdx = -1;
            this.nextChordChangeTime = 0;
        }

        reset() {
            for (let name of this.trackNames) {
                this.tracks[name].reset();
            }

            this.currentChordIdx = -1;
            this.nextChordChangeTime = 0;
        }

        addTrack(name: string, track: Track) {
            this.tracks[name] = track;
            this.trackNames.push(name)
        }

        getTrack(name: string): Track {
            return this.tracks[name];
        }

        setKey(key: number) {
            this.key = key;
        }

        setMood(mood: MusicMood) {
            this.mood = mood;
            this.generateChordsForMood();
            this.generateTimeSigForMood();
        }

        generateTimeSigForMood() {
            switch (this.mood) {
                case MusicMood.Chill: this.setTimeSignature(4, 4); break;
                case MusicMood.Adventure: this.setTimeSignature(4, 4); break;
            }
        }

        setTimeSignature(top: number, bottom: number) {
            switch (bottom) {
                case 4: this.beatVal = BeatFraction.Quarter; break;
                case 8: this.beatVal = BeatFraction.Eighth; break;
                case 16: this.beatVal = BeatFraction.Sixteenth; break
                case 2: this.beatVal = BeatFraction.Half; break;
            }

            this.beatsPMeasure = top;
        }

        generateChordsForMood() {
            let chordProg = "";
            // VVN ToDO take in the key.
            switch (this.mood) {
                case MusicMood.Chill:
                    chordProg = "Dm7 Gm7 Cm7 Cm7"
                    break;
                case MusicMood.Adventure:
                    chordProg = "G F G G"
                    break;
            }

            this.chords = [];
            const chordNames = chordProg.split(" ")

            for (let id = 0; id < chordNames.length; id ++ ) {
                this.chords.push(musicUtils.makeChord(chordNames[id]));
            }
        }

        playOnUpdate() {
            // Check if we have a new chord. if we do, update the tracks.
            let chordHasChanged = false;
            if (this.nextChordChangeTime < game.runtime()) {
                const lastChord = this.chords[this.currentChordIdx];
                this.currentChordIdx = ( this.currentChordIdx + 1 ) % this.chords.length;

                this.nextChordChangeTime = game.runtime() + (this.beatsPMeasure * music.beat(this.beatVal));
                chordHasChanged = true;
            }


            for (let name of this.trackNames) {
                const track = this.tracks[name]
                if (chordHasChanged) {
                    track.generateNoteOptions(this.chords[this.currentChordIdx]);
                }
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

        constructor() {
            this.soundtrackCollection = {};
            this.isPlaying = false;
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

    export function setSoundtrackKeySecret(key: number) {
        init();

        const st = state.isPlaying ? state.getCurrentlyPlayingSoundtrack()
                    : state.getCurrentlyRecordingSoundtrack();
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
            st.setMood(mood)
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