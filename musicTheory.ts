namespace musicUtils {
    export enum ChordTypes {
        Maj,
        Min,
        Seven,
        MinSeven
    }

    export enum ScaleType {
        Major,
        Minor,
        HarmonicMinor,
        Blues,
        MinorPentatonic
    }

    // Converts intervals to half steps
    export enum Interval {
        Perfect = 0,
        Half = 1,
        Whole = 2,
        AugmentedSecond = 3,
        MinorThird = 3,
        MajorThird = 4,
        Fifth = 7,
        Octave = 12
    }

    const eachOctavesLowFreq = [16.35160, 32.70320, 65.40639, 130.8128, 261.6256, 523.2511, 1046.502, 2093.005, 4186.009]

    export function intervalBetweenNotes(n1: number, n2: number) {
        const div = n2 / n1;
        console.log("n2: " + n2)
        console.log("n1: " + n1)
        console.log("DV:" + div)
        const intv = Interval.Octave * (Math.log(div) / Math.log(2));
        console.log("Interval: " + intv)
        return Interval.Octave * Math.log(div) / Math.log(2);
    }

    function chordTypeToIntervals (chord: ChordTypes) {
        switch (chord) {
            case ChordTypes.Maj:
                return [Interval.Perfect, Interval.MajorThird, Interval.MinorThird];
            case ChordTypes.Min:
                return [Interval.Perfect, Interval.MinorThird, Interval.MajorThird];
            case ChordTypes.Seven:
                return [Interval.Perfect, Interval.MajorThird, Interval.MinorThird, Interval.MinorThird];
            case ChordTypes.MinSeven:
                return [Interval.Perfect, Interval.MinorThird, Interval.MajorThird, Interval.MinorThird]
        }
    }

    export function getNoteFromInterval(root: number, interval: number): number {
        return (root * Math.pow(2, (interval / 12)));
    }

    export function getOctave(note: number) {
        for (let oct = 0; oct < eachOctavesLowFreq.length; oct++) {
            if (note < eachOctavesLowFreq[oct]) {
                return oct - 1;
            }
        }
        return eachOctavesLowFreq.length;
    }

    function getNoteInCorrectOctave(note: number, oct: number) {
        const currOct = getOctave(note);
        return getNoteFromInterval(note, (oct - currOct) * Interval.Octave);
    }

    export function getNoteInScale(key: number, scale: ScaleType, degree: number) {
        const scaleNotes = getScale(key, scale, getOctave(key), 1);
        return scaleNotes[degree];
    }

    export function getScale(key: number, scale: ScaleType, baseOct: number, numOct: number) {
        let scaleIntervals;
        switch (scale) {
            case ScaleType.Major: scaleIntervals = [Interval.Perfect, Interval.Whole, Interval.Whole, Interval.Half, Interval.Whole, Interval.Whole, Interval.Whole, Interval.Half]; break;
            case ScaleType.Minor: scaleIntervals = [Interval.Perfect, Interval.Whole, Interval.Half, Interval.Whole, Interval.Whole, Interval.Half, Interval.Whole, Interval.Whole]; break;
            case ScaleType.HarmonicMinor: scaleIntervals = [Interval.Perfect, Interval.Whole, Interval.Half, Interval.Whole, Interval.Whole, Interval.Half, Interval.AugmentedSecond, Interval.Half]; break;
            case ScaleType.Blues: scaleIntervals = [Interval.Perfect, Interval.AugmentedSecond, Interval.Whole, Interval.Whole, Interval.Half, Interval.AugmentedSecond, Interval.Whole]; break;
            case ScaleType.MinorPentatonic: scaleIntervals = [Interval.Perfect, Interval.AugmentedSecond, Interval.Whole, Interval.Whole, Interval.AugmentedSecond, Interval.Whole]; break;
        }

        const baseNote = getNoteInCorrectOctave(key, baseOct);
        const ret = [];
        for (let o = 0; o < numOct; o++) {
            for (let n = 0; n < scaleIntervals.length; n++) {
                ret.push(getNoteFromInterval(baseNote, scaleIntervals[n] + o * Interval.Octave))
            }
        }
        return ret;
    }

    export class Chord {
        root: number;
        cType: number;

        getNotes(oct: number, num: number) {
            const ints = chordTypeToIntervals(this.cType);
            const ret = []
            
            const baseNote = getNoteInCorrectOctave(this.root, oct)
            for (let o = 0; o < num; o++) {
                let acc = 0;
                for (let step = 0; step < ints.length; step ++) {
                    acc += ints[step];
                    ret.push(getNoteFromInterval(baseNote, (12 * o)+acc));
                }
            }
            return ret;
        }

        getRandomNote(oct: number) {
            const notes = this.getNotes(oct, 1);
            return Math.pickRandom(notes);
        }

        transpose(interval: number) {
            this.root = getNoteFromInterval(this.root, interval);
        }
    }

    export function makeChord(chordName: string) {
        const crd = new Chord();
        let idx = 0;
        switch(chordName.charAt(idx)) {
            case 'c': case 'C': crd.root = Note.C; break;
            case 'd': case 'D': crd.root = Note.D; break;
            case 'e': case 'E': crd.root = Note.E; break;
            case 'f': case 'F': crd.root = Note.F; break;
            case 'g': case 'G': crd.root = Note.G; break;
            case 'a': case 'A': crd.root = Note.A; break;
            case 'b': case 'B': crd.root = Note.B; break;
            default: crd.root = Note.C; break;
        }
        idx++;
        if (chordName.charAt(idx) == "#") {
            crd.root = getNoteFromInterval(crd.root, 1)
            idx++;
        } else if (chordName.charAt(idx) == "b") {
            crd.root = getNoteFromInterval(crd.root, -1)
            idx++
        }

        const typeOfChord = chordName.substr(idx);
        switch (typeOfChord) {
            case 'm': case 'min': crd.cType = ChordTypes.Min; break;
            case '7': case 'dom7': crd.cType = ChordTypes.Seven; break;
            case 'm7': case 'min7': case '-7': crd.cType = ChordTypes.MinSeven; break;
            default: crd.cType = ChordTypes.Maj;
        }

        return crd;
    }
}