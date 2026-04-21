/**
 * AlgorithmEngine — translates NoteEvent[] pitch values using one of
 * six mapping strategies:
 *
 *  Fantaisie-Impromptu — Fantaisie-Impromptu (Tay et al., Heliyon 2021). Default.
 *  Algo-I    — Sonifyed Algorithm I   : 20 pitches ranked by Engelmann (1986)
 *                                       hydrophobicity scale.
 *  Algo-II   — Sonifyed Algorithm II  : Lenckowski reduced alphabet, 4 pitches.
 *  Algo-III  — Sonifyed Algorithm III : Engelmann pitch + reduced-group chord.
 *  Algo-IV   — Sonifyed Algorithm IV  : Sliding-window sequence entropy,
 *                                       adapted for single sequences.
 *  Algo-V    — Sonifyed Algorithm V   : Engelmann pitch + octave harmonics,
 *                                       adapted for single sequences.
 *
 * Reference: https://github.com/sonifyed/Protein_Sound
 * License  : Creative Commons Attribution 4.0 International
 */

import type { NoteEvent } from '../../types/protein'

// ── Public algorithm type ─────────────────────────────────────────────────────

export type SonifyAlgorithm =
  | 'Fantaisie-Impromptu'
  | 'Algo-I'
  | 'Algo-II'
  | 'Algo-III'
  | 'Algo-IV'
  | 'Algo-V'

export const ALGORITHM_NAMES: SonifyAlgorithm[] = [
  'Fantaisie-Impromptu', 'Algo-I', 'Algo-II', 'Algo-III', 'Algo-IV', 'Algo-V',
]

export const ALGORITHM_LABELS: Record<SonifyAlgorithm, string> = {
  'Fantaisie-Impromptu': 'Fantaisie-Impromptu (Default)',
  'Algo-I':   'Sonifyed I — Hydrophobicity Scale',
  'Algo-II':  'Sonifyed II — Reduced Alphabet',
  'Algo-III': 'Sonifyed III — Hydrophobicity + Groups',
  'Algo-IV':  'Sonifyed IV — Sequence Entropy',
  'Algo-V':   'Sonifyed V — Hydrophobicity + Harmonics',
}

export const ALGORITHM_DESCRIPTIONS: Record<SonifyAlgorithm, string> = {
  'Fantaisie-Impromptu':
    'Fantaisie-Impromptu mapping (Tay et al., Heliyon 2021). Pitch, duration, and chords encode structural properties from ESMFold predictions.',
  'Algo-I':
    'Maps each residue to 1 of 20 MIDI pitches ranked by the Engelmann (1986) hydrophobicity scale. More hydrophobic → lower pitch.',
  'Algo-II':
    'Lenckowski reduced alphabet groups the 20 amino acids into 4 chemical families. Each family maps to a single distinct pitch (4 pitches total).',
  'Algo-III':
    'Combines Algorithms I & II: the Engelmann hydrophobicity pitch is used as melody; the Lenckowski group pitch is added as a chord note.',
  'Algo-IV':
    'Sliding-window Shannon entropy (±4 residues). High local diversity → higher pitch; repeated regions → lower pitch. Adapted for single sequences.',
  'Algo-V':
    'Engelmann hydrophobicity pitch (as in Algo I) with octave harmonics layered as chord notes, simulating the multi-strand MSA playback of Sonifyed V.',
}

// ── Engelmann 1986 hydrophobicity scale → MIDI pitch ─────────────────────────
// Exactly as implemented in Sonifyed Algorithm-I.pl / Algorithm-III.pl.
// Most hydrophobic (F) at the lowest pitch (50) through most hydrophilic (R=77).
const ENGELMANN_PITCH: Readonly<Record<string, number>> = {
  F: 50, M: 51, I: 52, L: 53, V: 54, C: 55, W: 56,
  A: 57, T: 58, G: 59, S: 60, P: 61, Y: 62,
  H: 65, Q: 66, N: 67,
  E: 71, K: 72, D: 73, R: 77,
}

// ── Lenckowski reduced alphabet → MIDI pitch ──────────────────────────────────
// Exactly as implemented in Sonifyed Algorithm-II.pl.
const REDUCED_PITCH: Readonly<Record<string, number>> = {
  // Group 1: D E H N R  → pitch 60
  D: 60, E: 60, H: 60, N: 60, R: 60,
  // Group 2: K Q S T   → pitch 62
  K: 62, Q: 62, S: 62, T: 62,
  // Group 3: A C G M P → pitch 64
  A: 64, C: 64, G: 64, M: 64, P: 64,
  // Group 4: F I L V W Y → pitch 67
  F: 67, I: 67, L: 67, V: 67, W: 67, Y: 67,
}

const DEFAULT_PITCH = 60

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(p: number): number {
  return Math.max(21, Math.min(108, p))
}

// ── Algorithm IV: sliding-window Shannon entropy ──────────────────────────────

function computeEntropyPitches(rhEvents: NoteEvent[]): Map<number, number> {
  const WINDOW = 4
  const seq = rhEvents.map(e => e.amino_acid.toUpperCase())

  const rawEntropies = seq.map((_, pos) => {
    const start = Math.max(0, pos - WINDOW)
    const end   = Math.min(seq.length - 1, pos + WINDOW)
    const slice = seq.slice(start, end + 1)
    const counts: Record<string, number> = {}
    for (const aa of slice) counts[aa] = (counts[aa] ?? 0) + 1
    const n = slice.length
    let entropy = 0
    for (const c of Object.values(counts)) {
      const p = c / n
      if (p > 0) entropy -= p * Math.log2(p)
    }
    return entropy
  })

  const eMin = Math.min(...rawEntropies)
  const eMax = Math.max(...rawEntropies)
  const range = eMax - eMin || 1

  // Normalize to MIDI 50–74 (matches Sonifyed IV's ~50–70 pitch range)
  const result = new Map<number, number>()
  rhEvents.forEach((evt, i) => {
    const pitch = Math.round(50 + ((rawEntropies[i] - eMin) / range) * 24)
    result.set(evt.residue_index, pitch)
  })
  return result
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Returns a new events array with pitches (and chord_pitches) remapped
 * according to the selected algorithm. All other event fields are preserved
 * so timing, duration, velocity and residue index remain unchanged.
 */
export function applyAlgorithm(
  events: NoteEvent[],
  algorithm: SonifyAlgorithm,
): NoteEvent[] {
  if (algorithm === 'Fantaisie-Impromptu') return events

  // Build sorted right-hand event list for entropy computation
  const rhEvents = events
    .filter(e => e.hand === 'right')
    .slice()
    .sort((a, b) => a.residue_index - b.residue_index)

  const entropyMap: Map<number, number> | null =
    algorithm === 'Algo-IV' ? computeEntropyPitches(rhEvents) : null

  return events.map(evt => {
    const aa          = evt.amino_acid.toUpperCase()
    const octaveShift = evt.hand === 'left' ? -12 : 0

    switch (algorithm) {
      // ── Algo I: Engelmann hydrophobicity pitch, clean melody ─────────────
      case 'Algo-I': {
        const p = clamp((ENGELMANN_PITCH[aa] ?? DEFAULT_PITCH) + octaveShift)
        return { ...evt, pitch: p, chord_pitches: [] }
      }

      // ── Algo II: Lenckowski 4-group pitch ────────────────────────────────
      case 'Algo-II': {
        const p = clamp((REDUCED_PITCH[aa] ?? DEFAULT_PITCH) + octaveShift)
        return { ...evt, pitch: p, chord_pitches: [] }
      }

      // ── Algo III: Engelmann pitch + Reduced-group chord layer ────────────
      case 'Algo-III': {
        const primary   = clamp((ENGELMANN_PITCH[aa] ?? DEFAULT_PITCH) + octaveShift)
        const secondary = clamp((REDUCED_PITCH[aa]   ?? DEFAULT_PITCH) + octaveShift)
        // Only add secondary as chord when it differs from primary
        const chords = primary !== secondary ? [secondary] : []
        return { ...evt, pitch: primary, chord_pitches: chords }
      }

      // ── Algo IV: sliding-window entropy pitch ────────────────────────────
      case 'Algo-IV': {
        const basePitch = entropyMap?.get(evt.residue_index) ?? DEFAULT_PITCH
        const p = clamp(basePitch + octaveShift)
        return { ...evt, pitch: p, chord_pitches: [] }
      }

      // ── Algo V: Engelmann pitch + octave harmonics (multi-strand sim.) ───
      case 'Algo-V': {
        const base  = clamp((ENGELMANN_PITCH[aa] ?? DEFAULT_PITCH) + octaveShift)
        const upper = base + 12
        const lower = base - 12
        const chords = [upper, lower].filter(p => p >= 21 && p <= 108)
        return { ...evt, pitch: base, chord_pitches: chords }
      }

      default:
        return evt
    }
  })
}
