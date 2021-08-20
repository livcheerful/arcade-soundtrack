namespace envelopes {
    export class Envelope {
        constructor(public attack = 0, public decay = 0, public sustain = 255, public release = 0) {
        }
    }

    export interface Stage {
        offset: number;
        value: number;
    }

    const BUFFER_SIZE = 12;
    const stages = control.createBuffer(BUFFER_SIZE * 8)

    export function makeTrigger(gateLength: number, pitch: number, waveForm: number, ampMod: number, pitchMod: number, ampEnv: Envelope, pitchEnv: Envelope) {
        const ampStages = getStages(ampEnv, 0, ampMod, gateLength);
        const pitchStages = getStages(pitchEnv, pitch, pitchMod, gateLength);
        let ptr = 0;

        let offset = 0;
        let prevPitch = pitch;
        let prevAmp = 0;

        let currentAmp = ampStages[0];
        let currentPitch = pitchStages[0];

        let ampIndex = 0;
        let pitchIndex = 0;
        let temp: number;

        do {
            if (currentAmp && currentPitch) {
                if (currentAmp.offset === currentPitch.offset) {
                    ptr = addNote(
                        stages,
                        ptr,
                        currentAmp.offset - offset,
                        prevAmp,
                        currentAmp.value,
                        waveForm,
                        prevPitch,
                        currentPitch.value
                    );

                    prevAmp = currentAmp.value;
                    prevPitch = currentPitch.value;

                    offset = currentAmp.offset;
                    ampIndex++;
                    pitchIndex++;
                }
                else if (currentAmp.offset < currentPitch.offset) {
                    temp = prevPitch + (currentPitch.value - prevPitch) * ((currentAmp.offset - offset) / (currentPitch.offset - offset));
                    ptr = addNote(
                        stages,
                        ptr,
                        currentAmp.offset - offset,
                        prevAmp,
                        currentAmp.value,
                        waveForm,
                        prevPitch,
                        temp
                    );

                    prevAmp = currentAmp.value
                    prevPitch = temp;

                    offset = currentAmp.offset;
                    ampIndex++;
                }
                else {
                    temp = prevAmp + (currentAmp.value - prevAmp) * ((currentPitch.offset - offset) / (currentAmp.offset - offset));
                    ptr = addNote(
                        stages,
                        ptr,
                        currentPitch.offset - offset,
                        prevAmp,
                        temp,
                        waveForm,
                        prevPitch,
                        currentPitch.value
                    );

                    prevAmp = temp;
                    prevPitch = currentPitch.value

                    offset = currentPitch.offset;
                    pitchIndex++;
                }
            }
            else if (currentAmp) {
                ptr = addNote(
                    stages,
                    ptr,
                    currentAmp.offset - offset,
                    prevAmp,
                    currentAmp.value,
                    waveForm,
                    prevPitch,
                    prevPitch
                );

                prevAmp = currentAmp.value
                offset = currentAmp.offset;
                ampIndex++;
            }
            else {
                ptr = addNote(
                    stages,
                    ptr,
                    currentPitch.offset - offset,
                    prevAmp,
                    prevAmp,
                    waveForm,
                    prevPitch,
                    currentPitch.value
                );

                prevPitch = currentPitch.value
                offset = currentPitch.offset;
                pitchIndex++;
            }

            currentAmp = ampStages[ampIndex]
            currentPitch = pitchStages[pitchIndex]
        } while (currentAmp || currentPitch);

        const buf = control.createBuffer(ptr);
        buf.write(0, stages);
        return buf;
    }

    export function getStages(env: Envelope, base: number, mod: number, gateLength: number) {
        let stages: Stage[] = [];
        let offset = 0;
        let stageTime = 0;

        if (mod > 0) {
            // Attack
            offset = Math.min(gateLength, env.attack)
            stages.push({
                offset: offset,
                value: base + mod * (offset / env.attack)
            });

            // Decay
            if (offset < gateLength) {
                stageTime = Math.min(gateLength - env.attack, env.decay);
                offset += stageTime;
                stages.push({
                    offset: offset,
                    value: base + ((mod - (mod * (env.sustain / 255))) / env.decay) * stageTime
                });
            }

            // Sustain
            if (offset < gateLength) {
                offset = gateLength;
                stages.push({
                    offset: offset,
                    value: base + mod * (env.sustain / 255)
                });
            }

            // Release
            stages.push({
                offset: offset + env.release,
                value: base
            });
        }

        return stages;
    }

    const buff = pins.createBuffer(24);


    export function addNote(sndInstr: Buffer, sndInstrPtr: number, ms: number, beg: number, end: number, soundWave: number, hz: number, endHz: number) {
        if (ms > 0) {
            sndInstr.setNumber(NumberFormat.UInt8LE, sndInstrPtr, soundWave)
            sndInstr.setNumber(NumberFormat.UInt8LE, sndInstrPtr + 1, 0)
            sndInstr.setNumber(NumberFormat.UInt16LE, sndInstrPtr + 2, hz)
            sndInstr.setNumber(NumberFormat.UInt16LE, sndInstrPtr + 4, ms)
            sndInstr.setNumber(NumberFormat.UInt16LE, sndInstrPtr + 6, (beg * 255) >> 6)
            sndInstr.setNumber(NumberFormat.UInt16LE, sndInstrPtr + 8, (end * 255) >> 6)
            sndInstr.setNumber(NumberFormat.UInt16LE, sndInstrPtr + 10, endHz);
            sndInstrPtr += BUFFER_SIZE;
        }
        sndInstr.setNumber(NumberFormat.UInt8LE, sndInstrPtr, 0) // terminate
        return sndInstrPtr
    }
}
namespace music {
    //% shim=music::queuePlayInstructions
    export function queuePlayInstructions2(timeDelta: number, buf: Buffer) { }
}
