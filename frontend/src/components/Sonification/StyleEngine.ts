/**
 * Musical style presets for protein sonification.
 *
 * The base translation (Tay et al. 2021) produces pitches, durations,
 * velocities and chords from amino acid properties intact.  Each style
 * preset is a post-processing blend layer: it scales those outputs and
 * adjusts timbre / tempo / reverb to fit the target genre, without
 * altering the underlying amino-acid → note mapping logic.
 */

export type MusicalStyle =
  | 'Default'
  | 'Ambient'
  | 'Classical'
  | 'Jazz'
  | 'Lo-Fi'
  | 'Afrobeat'
  | 'Punk'
  | 'Techno'
  | 'Synthwave'
  | 'Folk'

export interface StylePreset {
  /** Default BPM suggested for this style */
  defaultBpm: number
  /** Oscillator waveform type */
  oscillatorType: OscillatorType
  /** ADSR envelope (seconds) */
  envelope: { attack: number; decay: number; sustain: number; release: number }
  /** Reverb wet mix 0–1 */
  reverbWet: number
  /** Multiplier applied to base velocity (0–2) */
  velocityScale: number
  /** Multiplier applied to note duration (1 = unchanged base) */
  durationScale: number
  /** Extra delay (seconds) added to every off-beat note for swing feel */
  swingAmount: number
  /** Semitones added to every pitch (0 = no shift) */
  pitchShift: number
}

export const MUSICAL_STYLES: MusicalStyle[] = [
  'Default',
  'Ambient',
  'Classical',
  'Jazz',
  'Lo-Fi',
  'Afrobeat',
  'Punk',
  'Techno',
  'Synthwave',
  'Folk',
]

export const STYLE_PRESETS: Record<MusicalStyle, StylePreset> = {
  /**
   * Default — pure Tay et al. mapping, no modification.
   */
  Default: {
    defaultBpm: 120,
    oscillatorType: 'triangle',
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.8 },
    reverbWet: 0,
    velocityScale: 1.0,
    durationScale: 1.0,
    swingAmount: 0,
    pitchShift: 0,
  },

  /**
   * Ambient — slow, sine-wave, heavy reverb.
   * Base pitches/chords intact; durations stretched, dynamics softened.
   */
  Ambient: {
    defaultBpm: 72,
    oscillatorType: 'sine',
    envelope: { attack: 0.35, decay: 0.4, sustain: 0.8, release: 2.8 },
    reverbWet: 0.65,
    velocityScale: 0.6,
    durationScale: 1.7,
    swingAmount: 0,
    pitchShift: 0,
  },

  /**
   * Classical — clean triangle, light room reverb, full chord voicings.
   */
  Classical: {
    defaultBpm: 96,
    oscillatorType: 'triangle',
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.65, release: 1.0 },
    reverbWet: 0.18,
    velocityScale: 1.0,
    durationScale: 1.05,
    swingAmount: 0,
    pitchShift: 0,
  },

  /**
   * Jazz — slight swing on off-beats, rounded sine timbre, short notes.
   */
  Jazz: {
    defaultBpm: 100,
    oscillatorType: 'sine',
    envelope: { attack: 0.015, decay: 0.1, sustain: 0.45, release: 0.55 },
    reverbWet: 0.14,
    velocityScale: 0.88,
    durationScale: 0.82,
    swingAmount: 0.055,
    pitchShift: 0,
  },

  /**
   * Lo-Fi — warm and low, slight swing, shifted down an octave.
   */
  'Lo-Fi': {
    defaultBpm: 85,
    oscillatorType: 'triangle',
    envelope: { attack: 0.06, decay: 0.22, sustain: 0.6, release: 1.3 },
    reverbWet: 0.32,
    velocityScale: 0.72,
    durationScale: 1.12,
    swingAmount: 0.025,
    pitchShift: -12,
  },

  /**
   * Afrobeat — upbeat, percussive, fast, slight syncopation.
   */
  Afrobeat: {
    defaultBpm: 140,
    oscillatorType: 'triangle',
    envelope: { attack: 0.008, decay: 0.07, sustain: 0.45, release: 0.4 },
    reverbWet: 0.08,
    velocityScale: 1.12,
    durationScale: 0.72,
    swingAmount: 0.03,
    pitchShift: 0,
  },

  /**
   * Punk — sawtooth, fast, loud, short sharp notes.
   */
  Punk: {
    defaultBpm: 180,
    oscillatorType: 'sawtooth',
    envelope: { attack: 0.004, decay: 0.05, sustain: 0.28, release: 0.18 },
    reverbWet: 0.04,
    velocityScale: 1.35,
    durationScale: 0.48,
    swingAmount: 0,
    pitchShift: 0,
  },

  /**
   * Techno — square wave, mechanical, heavy sub-bass feel.
   */
  Techno: {
    defaultBpm: 138,
    oscillatorType: 'square',
    envelope: { attack: 0.004, decay: 0.1, sustain: 0.4, release: 0.28 },
    reverbWet: 0.2,
    velocityScale: 1.15,
    durationScale: 0.68,
    swingAmount: 0,
    pitchShift: 0,
  },

  /**
   * Synthwave — sawtooth, lush reverb, slightly stretched, nostalgic.
   */
  Synthwave: {
    defaultBpm: 110,
    oscillatorType: 'sawtooth',
    envelope: { attack: 0.12, decay: 0.22, sustain: 0.72, release: 1.6 },
    reverbWet: 0.52,
    velocityScale: 0.88,
    durationScale: 1.22,
    swingAmount: 0,
    pitchShift: 0,
  },

  /**
   * Folk — warm triangle, short reverb, natural feel and gentle swing.
   */
  Folk: {
    defaultBpm: 90,
    oscillatorType: 'triangle',
    envelope: { attack: 0.03, decay: 0.16, sustain: 0.56, release: 0.95 },
    reverbWet: 0.1,
    velocityScale: 0.84,
    durationScale: 1.0,
    swingAmount: 0.012,
    pitchShift: 0,
  },
}

/**
 * Per-algorithm style palettes.
 * Each algorithm has a subset of styles that make musical sense for its
 * pitch-mapping character.  'Default' is always first (no modification).
 *
 * Fantaisie-Impromptu — full palette (multi-parameter mapping can use any style)
 * Algo-I / Algo-V     — full melodic range works across all styles
 * Algo-II             — only 4 pitches → styles that tolerate minimal melody
 * Algo-III            — chord-heavy → styles that benefit from rich harmony
 * Algo-IV             — entropy-mapped → atmospheric / textural styles suit it best
 */
import type { SonifyAlgorithm } from './AlgorithmEngine'

export const ALGO_STYLES: Record<SonifyAlgorithm, MusicalStyle[]> = {
  'Fantaisie-Impromptu':  ['Default', 'Ambient', 'Classical', 'Jazz', 'Lo-Fi', 'Afrobeat', 'Punk', 'Techno', 'Synthwave', 'Folk'],
  'Algo-I':               ['Default', 'Classical', 'Jazz', 'Folk', 'Afrobeat', 'Punk', 'Synthwave', 'Ambient'],
  'Algo-II':              ['Default', 'Ambient', 'Lo-Fi', 'Techno', 'Classical'],
  'Algo-III':             ['Default', 'Classical', 'Jazz', 'Synthwave', 'Ambient', 'Folk'],
  'Algo-IV':              ['Default', 'Ambient', 'Lo-Fi', 'Synthwave', 'Techno'],
  'Algo-V':               ['Default', 'Classical', 'Ambient', 'Jazz', 'Synthwave', 'Afrobeat', 'Folk'],
}
