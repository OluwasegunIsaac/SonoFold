import { create } from 'zustand'
import type { AppStatus, FeatureVectors, NoteEvent, SonifyResponse } from '../types/protein'
import type { MusicalStyle } from '../components/Sonification/StyleEngine'
import type { SonifyAlgorithm } from '../components/Sonification/AlgorithmEngine'

interface ProteinState {
  fasta: string
  sequence: string
  pdb: string | null
  events: NoteEvent[]
  featureVectors: FeatureVectors | null
  tempoCurve: number[]
  status: AppStatus
  errorMessage: string
  currentResidue: number
  isPlaying: boolean
  /** BPM for playback and export */
  bpm: number
  /** Active musical style */
  style: MusicalStyle
  /** Active sonification algorithm */
  algorithm: SonifyAlgorithm
  /** Note duration scale override (multiplier; overrides style preset when changed by user) */
  durationScale: number

  setFasta: (fasta: string) => void
  setResult: (result: SonifyResponse) => void
  setStatus: (status: AppStatus, error?: string) => void
  setCurrentResidue: (idx: number) => void
  setIsPlaying: (playing: boolean) => void
  setBpm: (bpm: number) => void
  setStyle: (style: MusicalStyle) => void
  setAlgorithm: (algorithm: SonifyAlgorithm) => void
  setDurationScale: (scale: number) => void
  reset: () => void
}

export const useProteinStore = create<ProteinState>((set) => ({
  fasta: '',
  sequence: '',
  pdb: null,
  events: [],
  featureVectors: null,
  tempoCurve: [],
  status: 'idle',
  errorMessage: '',
  currentResidue: -1,
  isPlaying: false,
  bpm: 120,
  style: 'Default' as MusicalStyle,
  algorithm: 'Fantaisie-Impromptu' as SonifyAlgorithm,
  durationScale: 1.0,

  setFasta: (fasta) => set({ fasta }),
  setBpm: (bpm) => set({ bpm }),
  setStyle: (style) => set({ style }),
  setAlgorithm: (algorithm) => set({ algorithm }),
  setDurationScale: (durationScale) => set({ durationScale }),

  setResult: (result) =>
    set({
      pdb: result.pdb,
      events: result.events,
      featureVectors: result.feature_vectors,
      tempoCurve: result.tempo_curve,
      sequence: result.sequence,
      status: 'ready',
      errorMessage: '',
      currentResidue: -1,
    }),

  setStatus: (status, error = '') =>
    set({ status, errorMessage: error }),

  setCurrentResidue: (idx) => set({ currentResidue: idx }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  reset: () =>
    set({
      pdb: null,
      events: [],
      featureVectors: null,
      tempoCurve: [],
      sequence: '',
      status: 'idle',
      errorMessage: '',
      currentResidue: -1,
      isPlaying: false,
    }),
}))
