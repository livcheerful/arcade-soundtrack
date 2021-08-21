namespace musicUtils {
    export enum ChordTypes {
        Maj,
        Min,
        Seven,
        MinSeven
    }

    const eachOctavesLowFreq = [16.35160, 32.70320, 65.40639, 130.8128, 261.6256, 523.2511, 1046.502, 2093.005, 4186.009]

    function chordTypeToIntervals (chord: ChordTypes) {
        switch (chord) {
            case ChordTypes.Maj:
                return [0, 4, 3];
            case ChordTypes.Min:
                return [0, 3, 4];
            case ChordTypes.Seven:
                return [0, 4, 3, 3];
            case ChordTypes.MinSeven:
                return [0, 3, 4, 3]
        }
    }

    function getNoteFromInterval(root: number, interval: number): number {
        return (root * Math.pow(2, (interval / 12)));
    }

    function getNotesOctave(note: number) {
        for (let oct = 0; oct < eachOctavesLowFreq.length; oct++) {
            if (note < eachOctavesLowFreq[oct]) {
                return oct - 1;
            }
        }
        return eachOctavesLowFreq.length;
    }

    function getNoteInCorrectOctave(note: number, oct: number) {
        const currOct = getNotesOctave(note);
        return getNoteFromInterval(note, (oct - currOct) * 12);
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
    }

    export function makeChord(chordName: string) {
        console.log("Chord name: " + chordName);
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
        console.log("type of chord: [" + typeOfChord + "]")
        switch (typeOfChord) {
            case 'm': case 'min': crd.cType = ChordTypes.Min; break;
            case '7': case 'dom7': crd.cType = ChordTypes.Seven; break;
            case 'm7': case 'min7': case '-7': crd.cType = ChordTypes.MinSeven; break;
            default: crd.cType = ChordTypes.Maj;
        }

        return crd;
    }
}