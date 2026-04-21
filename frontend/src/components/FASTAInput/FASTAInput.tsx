import { useState } from 'react'
import { useProteinStore } from '../../store/proteinStore'
import { useProteinQuery } from '../../hooks/useProteinQuery'
import { parseFASTA } from './SequenceValidator'
import clsx from 'clsx'

export function FASTAInput() {
  const { fasta, setFasta, status } = useProteinStore()
  const { submit } = useProteinQuery()
  const [validationError, setValidationError] = useState('')

  const handleChange = (value: string) => {
    setFasta(value)
    if (value.trim()) {
      const parsed = parseFASTA(value)
      setValidationError(parsed ? '' : 'Invalid FASTA format (A–Z only, 10–2500 residues)')
    } else {
      setValidationError('')
    }
  }

  const handleSubmit = () => {
    const parsed = parseFASTA(fasta)
    if (!parsed) return
    submit()
  }

  const isLoading = status === 'loading'
  const canSubmit = fasta.trim().length > 0 && !validationError && !isLoading

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={fasta}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Enter UniProt ID or sequence (e.g., P04637)"
        rows={5}
        spellCheck={false}
        className={clsx(
          'w-full rounded-lg border px-3 py-2.5 text-sm text-[#1a1a2e]',
          'placeholder-[#aaa] resize-none focus:outline-none focus:ring-2 transition-colors bg-white',
          validationError
            ? 'border-red-400 focus:ring-red-400/30'
            : 'border-[#d0d0d0] focus:ring-[#5b9bd5]/30',
        )}
      />

      {validationError && (
        <p className="text-xs text-red-500">{validationError}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={clsx(
          'w-full rounded-lg py-2.5 text-sm font-medium transition-all border',
          canSubmit
            ? 'bg-white border-[#d0d0d0] text-[#1a1a2e] hover:bg-[#f5f5f7]'
            : 'bg-white border-[#e8e8e8] text-[#bbb] cursor-not-allowed',
        )}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4 text-[#5b9bd5]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Analyzing…
          </span>
        ) : (
          'Analyze'
        )}
      </button>
    </div>
  )
}
