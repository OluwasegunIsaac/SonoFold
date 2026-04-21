export interface NoteEvent {
  time: number
  pitch: number
  duration: number
  velocity: number
  instrument: string
  residue_index: number
  amino_acid: string
  secondary_structure: string
  hand: 'right' | 'left'
  chord_pitches: number[]
}

export interface FeatureVectors {
  secondary_structure: string[]
  sasa: number[]
  flexibility: number[]
}

export interface SonifyResponse {
  pdb: string
  events: NoteEvent[]
  tempo_curve: number[]
  feature_vectors: FeatureVectors
  sequence: string
}

export type AppStatus = 'idle' | 'loading' | 'error' | 'ready'
