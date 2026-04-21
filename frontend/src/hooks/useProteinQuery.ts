import { useCallback } from 'react'
import axios from 'axios'
import { useProteinStore } from '../store/proteinStore'
import type { SonifyResponse } from '../types/protein'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

const UNIPROT_RE = /^([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2})$/i

export function useProteinQuery() {
  const { fasta, setResult, setStatus } = useProteinStore()

  const submit = useCallback(
    async (uniprotId?: string) => {
      if (!fasta.trim()) return
      setStatus('loading')
      const trimmed = fasta.trim()
      const detectedUniprotId = uniprotId ?? (UNIPROT_RE.test(trimmed) ? trimmed : null)
      try {
        const { data } = await axios.post<SonifyResponse>(`${API_BASE}/api/sonify`, {
          fasta,
          uniprot_id: detectedUniprotId,
        })
        setResult(data)
      } catch (err: unknown) {
        const msg =
          axios.isAxiosError(err)
            ? (err.response?.data?.detail ?? err.message)
            : 'Unknown error'
        setStatus('error', String(msg))
      }
    },
    [fasta, setResult, setStatus],
  )

  return { submit }
}
