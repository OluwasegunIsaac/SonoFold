/**
 * Export engine — audio (WAV) and MIDI export from NoteEvent arrays.
 *
 * Audio: uses OfflineAudioContext (Web Audio API) to render notes offline
 *        with the selected StylePreset applied, then encodes as PCM 16-bit WAV.
 *
 * MIDI:  pure-JS Standard MIDI File (SMF type-0) builder; no dependencies.
 */

import type { NoteEvent } from '../../types/protein'
import type { StylePreset } from './StyleEngine'

// ─────────────────────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 400)
}

function midiFreq(pitch: number): number {
  return 440 * Math.pow(2, (pitch - 69) / 12)
}

// ─────────────────────────────────────────────────────────────────────────────
// MIDI export
// ─────────────────────────────────────────────────────────────────────────────

const TICKS_PER_BEAT = 480

function varLen(val: number): number[] {
  if (val === 0) return [0]
  const bytes: number[] = []
  bytes.push(val & 0x7f)
  val >>= 7
  while (val > 0) {
    bytes.unshift((val & 0x7f) | 0x80)
    val >>= 7
  }
  return bytes
}

function u32be(n: number): number[] {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]
}

function u16be(n: number): number[] {
  return [(n >>> 8) & 0xff, n & 0xff]
}

function strBytes(s: string): number[] {
  return Array.from(s).map((c) => c.charCodeAt(0))
}

export function exportMidi(events: NoteEvent[], bpm: number, preset: StylePreset): void {
  const scale = 120 / bpm
  const { velocityScale, durationScale, pitchShift, swingAmount } = preset
  const tempoMicros = Math.round(60_000_000 / bpm)
  const secToTick = (s: number) => Math.round(s * (TICKS_PER_BEAT * bpm) / 60)

  type ME = { tick: number; status: number; b1: number; b2: number }
  const mes: ME[] = []

  const handCount: Record<string, number> = {}

  for (const evt of events) {
    const noteIdx = (handCount[evt.hand] = (handCount[evt.hand] ?? 0) + 1)
    const swing = noteIdx % 2 === 0 ? swingAmount : 0
    const startTick = secToTick(evt.time * scale + swing)
    const durTick   = Math.max(1, secToTick(evt.duration * scale * durationScale))
    const pitch     = Math.max(21, Math.min(108, evt.pitch + pitchShift))
    const vel       = Math.max(1, Math.min(127, Math.round(evt.velocity * velocityScale)))
    const ch        = evt.hand === 'right' ? 0 : 1

    mes.push({ tick: startTick,            status: 0x90 | ch, b1: pitch, b2: vel })
    mes.push({ tick: startTick + durTick,  status: 0x80 | ch, b1: pitch, b2: 0 })

    for (let i = 0; i < (evt.chord_pitches?.length ?? 0); i++) {
      const cp  = Math.max(21, Math.min(108, evt.chord_pitches[i] + pitchShift))
      const cvl = Math.max(1, Math.round(vel * 0.7))
      mes.push({ tick: startTick + i,          status: 0x90 | ch, b1: cp, b2: cvl })
      mes.push({ tick: startTick + durTick + i, status: 0x80 | ch, b1: cp, b2: 0 })
    }
  }

  mes.sort((a, b) => a.tick - b.tick || (a.status < 0x90 ? -1 : 1))

  const track: number[] = []

  // Tempo meta event
  track.push(...varLen(0), 0xff, 0x51, 0x03, ...u32be(tempoMicros).slice(1))

  let prev = 0
  for (const m of mes) {
    track.push(...varLen(m.tick - prev), m.status, m.b1, m.b2)
    prev = m.tick
  }
  track.push(...varLen(0), 0xff, 0x2f, 0x00) // End of track

  const header = [
    ...strBytes('MThd'), ...u32be(6),
    ...u16be(0),               // format 0
    ...u16be(1),               // 1 track
    ...u16be(TICKS_PER_BEAT),
  ]
  const trkHeader = [...strBytes('MTrk'), ...u32be(track.length)]

  downloadBlob(
    new Blob([new Uint8Array([...header, ...trkHeader, ...track])], { type: 'audio/midi' }),
    'protein-sonification.mid',
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WAV encode
// ─────────────────────────────────────────────────────────────────────────────

function encodeWav(buf: AudioBuffer): Blob {
  const nc = buf.numberOfChannels
  const sr = buf.sampleRate
  const ns = buf.length
  const dataSize = ns * nc * 2 // 16-bit PCM
  const ab = new ArrayBuffer(44 + dataSize)
  const v = new DataView(ab)

  const ws = (off: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)) }
  ws(0, 'RIFF'); v.setUint32(4, 36 + dataSize, true)
  ws(8, 'WAVE'); ws(12, 'fmt ')
  v.setUint32(16, 16, true);  v.setUint16(20, 1, true)
  v.setUint16(22, nc, true);  v.setUint32(24, sr, true)
  v.setUint32(28, sr * nc * 2, true); v.setUint16(32, nc * 2, true)
  v.setUint16(34, 16, true);  ws(36, 'data'); v.setUint32(40, dataSize, true)

  let off = 44
  for (let i = 0; i < ns; i++) {
    for (let c = 0; c < nc; c++) {
      const s = Math.max(-1, Math.min(1, buf.getChannelData(c)[i]))
      v.setInt16(off, s * 0x7fff, true)
      off += 2
    }
  }
  return new Blob([ab], { type: 'audio/wav' })
}

// ─────────────────────────────────────────────────────────────────────────────
// Audio export (WAV via OfflineAudioContext)
// ─────────────────────────────────────────────────────────────────────────────

export type AudioExportFormat = 'MP3' | 'Ambient' | 'MIDI'

export async function exportAudio(
  events: NoteEvent[],
  bpm: number,
  preset: StylePreset,
  format: AudioExportFormat,
  onProgress?: (frac: number) => void,
): Promise<void> {
  // MIDI branch
  if (format === 'MIDI') {
    exportMidi(events, bpm, preset)
    return
  }

  // Ambient branch: override preset with Ambient characteristics
  const p: StylePreset = format === 'Ambient'
    ? { ...preset, reverbWet: 0.65, velocityScale: preset.velocityScale * 0.6, durationScale: preset.durationScale * 1.7, oscillatorType: 'sine', envelope: { attack: 0.35, decay: 0.4, sustain: 0.8, release: 2.8 } }
    : preset

  const scale = 120 / bpm
  const { velocityScale, durationScale, pitchShift, swingAmount } = p

  // Compute total render duration
  let maxEnd = 0
  for (const e of events) {
    const end = e.time * scale + e.duration * scale * durationScale + p.envelope.release
    if (end > maxEnd) maxEnd = end
  }
  const totalDur = maxEnd + 1.5

  const SR = 44100
  const ctx = new OfflineAudioContext(2, Math.ceil(totalDur * SR), SR)

  // Optional convolver reverb
  let reverbNode: ConvolverNode | null = null
  let reverbGain: GainNode | null = null
  if (p.reverbWet > 0) {
    // Impulse response approximation: decaying noise
    const irLen = Math.ceil(SR * 2.5)
    const irBuf = ctx.createBuffer(2, irLen, SR)
    for (let c = 0; c < 2; c++) {
      const data = irBuf.getChannelData(c)
      for (let i = 0; i < irLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 3)
      }
    }
    reverbNode = ctx.createConvolver()
    reverbNode.buffer = irBuf
    reverbGain = ctx.createGain()
    reverbGain.gain.value = p.reverbWet
    reverbNode.connect(reverbGain)
    reverbGain.connect(ctx.destination)
  }

  const dryGain = ctx.createGain()
  dryGain.gain.value = 1 - p.reverbWet * 0.4
  dryGain.connect(ctx.destination)

  const handCount: Record<string, number> = {}

  for (const evt of events) {
    const noteIdx = (handCount[evt.hand] = (handCount[evt.hand] ?? 0) + 1)
    const swing = noteIdx % 2 === 0 ? swingAmount : 0
    const t0  = evt.time * scale + swing
    const dur = evt.duration * scale * durationScale
    const vel = Math.min(1, (evt.velocity / 127) * velocityScale) * 0.28

    const allPitches = [evt.pitch, ...(evt.chord_pitches ?? []).map((cp, i) =>
      ({ pitch: cp, delay: 0.01 * (i + 1), velMult: 0.7 }))]

    const mainAndChords: Array<{ pitch: number; delay: number; velMult: number }> = [
      { pitch: evt.pitch, delay: 0, velMult: 1 },
      ...(evt.chord_pitches ?? []).map((cp, i) => ({ pitch: cp, delay: 0.01 * (i + 1), velMult: 0.7 })),
    ]
    // suppress unused allPitches warning
    void allPitches

    for (const { pitch, delay, velMult } of mainAndChords) {
      const mp = Math.max(21, Math.min(108, pitch + pitchShift))
      const freq = midiFreq(mp)
      const start = t0 + delay

      const env = ctx.createGain()
      env.gain.setValueAtTime(0, start)
      env.gain.linearRampToValueAtTime(vel * velMult, start + p.envelope.attack)
      env.gain.linearRampToValueAtTime(vel * velMult * p.envelope.sustain, start + p.envelope.attack + p.envelope.decay)
      env.gain.setValueAtTime(vel * velMult * p.envelope.sustain, start + dur)
      env.gain.linearRampToValueAtTime(0, start + dur + p.envelope.release)

      env.connect(dryGain)
      if (reverbNode) env.connect(reverbNode)

      const osc = ctx.createOscillator()
      osc.type = p.oscillatorType
      osc.frequency.value = freq
      osc.connect(env)
      osc.start(start)
      osc.stop(start + dur + p.envelope.release + 0.1)
    }
  }

  onProgress?.(0.05)
  const rendered = await ctx.startRendering()
  onProgress?.(0.9)

  const blob = encodeWav(rendered)
  downloadBlob(blob, `protein-sonification-${format.toLowerCase()}.wav`)
  onProgress?.(1.0)
}


