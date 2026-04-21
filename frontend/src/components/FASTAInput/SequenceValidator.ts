export const VALID_AA = /^[ACDEFGHIKLMNPQRSTVWY]+$/i

export function parseFASTA(input: string): { header: string; sequence: string } | null {
  const lines = input.trim().split('\n')
  const header = lines[0].startsWith('>') ? lines[0].slice(1).trim() : 'Unknown'
  const sequence = lines
    .filter((l) => !l.startsWith('>'))
    .join('')
    .toUpperCase()
    .replace(/\s/g, '')

  if (!VALID_AA.test(sequence)) return null
  if (sequence.length < 10) return null
  if (sequence.length > 2500) return null
  return { header, sequence }
}
