namespace soundtrack {

    export class Mood {
        key: number;
        beatVal: BeatFraction;
        beatsPM: number;

        scaleType: musicUtils.ScaleType;

        chords: musicUtils.Chord[];
        currentChordIdx: number;
        nextChordChangeTime: number;

        flavorPlayStyle: PlayStyle;

        bassNotes: Image; // array of notes. If there is a note there, play loud. Otherwise play random note in the current chord.
        bassNoteGenStyle: () => Note[];

        drumPattern: Image;

        // chordProgKey is the key the chord progression was written in. If you dont wanna pass it pass in your chords in the key of C 
        constructor(key: number, timeTop: number, timeBottom: number, scaleType: musicUtils.ScaleType, chordProg: string, bassNotes: Image, chordProgKey = Note.C,) {
            this.key = key;
            this.scaleType = scaleType;
            this.flavorPlayStyle = PlayStyle.OneToOne;

            this.bassNotes = bassNotes


            this.setTimeSignature(timeTop, timeBottom);
            this.generateChordsForMood(chordProg, chordProgKey);

            this.currentChordIdx = this.chords.length;
            this.nextChordChangeTime = 0;
            this.drumPattern = img`
                . . . .
                2 3 2 3
                . . 7 .
                3 . . .
            `
        }

        getNote(role: TrackRole, note: PixelNote): NoteWave[] {
            switch (role) {
                case TrackRole.Bass: return this.getBassNotes(note);
                case TrackRole.Melody: return this.getMelodyNotes(note);
                case TrackRole.Rhythm: return this.getDrumNotes(note);
                case TrackRole.Flavor: return this.getFlavorNotes(note);
            }
        }

        getScale(bassOct: number, numOct: number) {
            const scale = musicUtils.getScale(this.key, this.scaleType, bassOct, numOct);
            return scale
        }

        update() {
            if (this.nextChordChangeTime <= game.runtime()) {
                this.nextChordChangeTime += music.beat(this.beatVal) * this.beatsPM;
                this.currentChordIdx = (this.currentChordIdx + 1) % this.chords.length;
            }
        }

        getCurrentChord() {
            console.log(this.chords)
            return this.chords[this.currentChordIdx]
        }

        getBassNotes(note: PixelNote): NoteWave[] {
            if (this.bassNotes) {
                const x = note.x % this.bassNotes.width;

                const yPixelPos = this.getPixelsInCol(x, this.bassNotes);
                const scale = musicUtils.getScale(this.getCurrentChord().root, this.getCurrentChord().isMajor() ? musicUtils.ScaleType.Major : musicUtils.ScaleType.HarmonicMinor, 2, this.computeNumberOctavesFromOffset(this.bassNotes.height));
                const notes = []
                for (let i = 0; i < yPixelPos.length; i++) {
                    notes.push(new NoteWave(scale[yPixelPos[i]]))
                }
                return notes;
            } else if (this.bassNoteGenStyle) {
                const notes = this.bassNoteGenStyle();
                const nw = []
                for (let n = 0; n < notes.length; n++) {
                    nw.push(new NoteWave(notes[n], music.beat(note.pixelVal) * n))
                }
                return nw;
            } else {
                return [new NoteWave(musicUtils.getNoteInOctave(this.getCurrentChord().root, 2))];
            }

        }

        getMelodyNotes(note: PixelNote): NoteWave[] {
            return [new NoteWave(this.getCurrentChord().getRandomNote(5))]
        }

        getDrumNotes(note: PixelNote): NoteWave[] {
            const ys = this.getPixelsInCol(note.x, this.drumPattern);
            const notes = ys.map(y => (new NoteWave(y)))
            return notes;
        }

        getPixelsInCol(x: number, img: Image) {
            let yPixelPos = [];
            for (let y = 0; y < img.height; y++) {
                if (img.getPixel(x, y)) {
                    if (x == 0 || img.getPixel(x - 1, y) != img.getPixel(x, y)) {
                        // This is a fresh attack. add it
                        yPixelPos.push(img.height - y - 1);
                    }
                }
            }
            return yPixelPos;
        }

        getFlavorNotes(note: PixelNote): NoteWave[] {
            switch (this.flavorPlayStyle) {
                case PlayStyle.Arpeggiated:
                    // const currentChord = this.getCurrentChord();
                    const arpg = musicUtils.arpeggiateMe(this.getCurrentChord().getNotes(3, 1), 6, 3)
                    const notes: NoteWave[] = []
                    for (let i = 0; i < arpg.length; i++) {
                        notes.push(new NoteWave(arpg[i], music.beat(note.pixelVal) / 2 * i))
                    }
                    return notes;
                case PlayStyle.Octaves:
                    // Adventure uses octaves
                    console.log("current chord : " + this.getCurrentChord().root)
                    const octs = musicUtils.arpeggiateMe([this.getCurrentChord().root], 4, 4);
                    const ret: NoteWave[] = []
                    octs.forEach((n, index) => {
                        ret.push(new NoteWave(n, index * note.pixelVal / 4))
                    })
                    return ret;
                default:
                    // Default is 1:1
                    const off = note.pitchOffset
                    const scale = this.getScale(2, this.computeNumberOctavesFromOffset(off));
                    return [new NoteWave(scale[off])]
            }
        }

        updateKey(newKey: Note) {
            this.transposeChords(this.key, newKey)
        }

        computeNumberOctavesFromOffset(offset: number) {
            return (Math.floor(offset / this.getScale(1, 1).length) + 1);
        }

        transposeChords(oldKey: Note, newKey: Note) {
            const interval = musicUtils.intervalBetweenNotes(oldKey, newKey);

            for (let c = 0; c < this.chords.length; c++) {
                this.chords[c].transpose(interval)
            }

            this.key = newKey;
        }

        generateChordsForMood(chordProg: string, chordProgKey: Note) {

            const chordNames = chordProg.split(" ")

            this.chords = [];
            for (let id = 0; id < chordNames.length; id++) {
                this.chords.push(musicUtils.makeChord(chordNames[id]))
            }
            this.transposeChords(chordProgKey, this.key)
        }

        setTimeSignature(top: number, bottom: number) {
            switch (bottom) {
                case 4: this.beatVal = BeatFraction.Quarter; break;
                case 8: this.beatVal = BeatFraction.Eighth; break;
                case 16: this.beatVal = BeatFraction.Sixteenth; break
                case 2: this.beatVal = BeatFraction.Half; break;
            }

            this.beatsPM = top;
        }

        setFlavorPlayStyle(style: PlayStyle) {
            this.flavorPlayStyle = style;
        }

        setDrumPattern(pattern: Image) {
            this.drumPattern = pattern;
        }
    }
}
