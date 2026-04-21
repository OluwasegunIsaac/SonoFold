import * as Tone from 'tone'
import type { NoteEvent } from '../../types/protein'
import type { StylePreset } from './StyleEngine'

// ── Synth / reverb cache — recreated when style key changes ──────────────────
let _synthRH: Tone.Synth | null = null
let _synthLH: Tone.Synth | null = null
let _reverb:  Tone.Freeverb | null = null
let _styleKey = ''

function styleKey(p: StylePreset) {
  return `${p.oscillatorType}|${p.envelope.attack}|${p.envelope.release}|${p.reverbWet}`
}

function disposeSynths() {
  try { _synthRH?.dispose() } catch (_) { /* ignore */ }
  try { _synthLH?.dispose() } catch (_) { /* ignore */ }
  try { _reverb?.dispose()  } catch (_) { /* ignore */ }
  _synthRH = null; _synthLH = null; _reverb = null
}

function ensureSynths(preset: StylePreset) {
  const key = styleKey(preset)
  if (key === _styleKey && _synthRH && _synthLH) return
  disposeSynths()
  _styleKey = key

  const output: Tone.InputNode = (() => {
    if (preset.reverbWet > 0) {
      _reverb = new Tone.Freeverb({ roomSize: 0.75, dampening: 3500 }).toDestination()
      _reverb.wet.value = preset.reverbWet
      return _reverb
    }
    return Tone.getDestination()
  })()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const osc = (type: OscillatorType): any => ({ type })

  _synthRH = new Tone.Synth({
    oscillator: osc(preset.oscillatorType),
    envelope:   preset.envelope,
  }).connect(output)

  // Left-hand uses a softer variant of the same waveform
  const lhType: OscillatorType = preset.oscillatorType === 'sawtooth' ? 'triangle'
    : preset.oscillatorType === 'square' ? 'triangle'
    : preset.oscillatorType
  _synthLH = new Tone.Synth({
    oscillator: osc(lhType),
    envelope:   preset.envelope,
  }).connect(output)
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function startAudioContext(): Promise<void> {
  await Tone.start()
}

export function stopPlayback(): void {
  Tone.Transport.stop()
  Tone.Transport.cancel()
}

export async function scheduleSonification(
  events: NoteEvent[],
  baseBpm: number,
  preset: StylePreset,
  onResidue: (idx: number, hand: string) => void,
): Promise<void> {
  await Tone.start()
  stopPlayback()
  ensureSynths(preset)

  const scale = 120 / baseBpm
  const { velocityScale, durationScale, swingAmount, pitchShift } = preset

  const handCount: Record<string, number> = {}

  for (const evt of events) {
    const noteIdx = (handCount[evt.hand] = (handCount[evt.hand] ?? 0) + 1)
    const isOff   = noteIdx % 2 === 0
    const swing   = isOff ? swingAmount : 0

    const synth = evt.hand === 'right' ? _synthRH! : _synthLH!
    const rawPitch = Math.max(21, Math.min(108, evt.pitch + pitchShift))
    const freq     = Tone.Frequency(rawPitch, 'midi').toFrequency()

    const chordFreqs = (evt.chord_pitches ?? []).map((p: number) =>
      Tone.Frequency(Math.max(21, Math.min(108, p + pitchShift)), 'midi').toFrequency(),
    )

    const t   = evt.time * scale + swing
    const dur = evt.duration * scale * durationScale
    const vel = Math.min(1, (evt.velocity / 127) * velocityScale)

    Tone.Transport.schedule((time: number) => {
      synth.triggerAttackRelease(freq, dur, time, vel)

      chordFreqs.forEach((f: number, i: number) => {
        synth.triggerAttackRelease(f, dur, time + 0.01 * (i + 1), vel * 0.7)
      })

      Tone.Draw.schedule(() => {
        onResidue(evt.residue_index, evt.hand ?? 'right')
      }, time)
    }, t)
  }

  Tone.Transport.start()
}

