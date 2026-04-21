import { useCallback, useRef } from 'react'
import { useProteinStore } from '../store/proteinStore'
import {
  scheduleSonification,
  startAudioContext,
  stopPlayback,
} from '../components/Sonification/AudioEngine'
import { STYLE_PRESETS } from '../components/Sonification/StyleEngine'
import { applyAlgorithm } from '../components/Sonification/AlgorithmEngine'
import type { SonifyAlgorithm } from '../components/Sonification/AlgorithmEngine'

export function useSonification() {
  const {
    events, setCurrentResidue, setIsPlaying,
    bpm, setBpm, style, setStyle,
    algorithm, setAlgorithm,
    durationScale, setDurationScale,
  } = useProteinStore()
  const scheduledRef = useRef(false)

  const play = useCallback(async () => {
    if (events.length === 0) return
    await startAudioContext()
    scheduledRef.current = true
    setIsPlaying(true)
    const preset = { ...STYLE_PRESETS[style], durationScale }
    const transformedEvents = applyAlgorithm(events, algorithm)
    await scheduleSonification(transformedEvents, bpm, preset, (idx, _hand) => {
      setCurrentResidue(idx)
    })
  }, [events, bpm, style, algorithm, durationScale, setCurrentResidue, setIsPlaying])

  const stop = useCallback(() => {
    stopPlayback()
    setIsPlaying(false)
    setCurrentResidue(-1)
  }, [setCurrentResidue, setIsPlaying])

  return { play, stop, bpm, setBpm, style, setStyle, algorithm, setAlgorithm, durationScale, setDurationScale }
}

// Re-export the type so consumers don't need a separate import
export type { SonifyAlgorithm }

