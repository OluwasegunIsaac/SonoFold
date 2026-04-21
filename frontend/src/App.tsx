import { useRef, useState } from 'react'
import { FASTAInput } from './components/FASTAInput/FASTAInput'
import { StructureViewer } from './components/StructureViewer/StructureViewer'
import type { StructureViewerHandle } from './components/StructureViewer/StructureViewer'
import { PlaybackControls } from './components/Sonification/PlaybackControls'
import { FeatureHeatmap } from './components/FeaturePanel/FeatureHeatmap'
import { DocsPage } from './components/DocsPage'
import { AboutPage } from './components/AboutPage'
import { useProteinStore } from './store/proteinStore'
import { useProteinQuery } from './hooks/useProteinQuery'
import { exportAudio } from './components/Sonification/ExportEngine'
import type { AudioExportFormat } from './components/Sonification/ExportEngine'
import { STYLE_PRESETS } from './components/Sonification/StyleEngine'
import { applyAlgorithm } from './components/Sonification/AlgorithmEngine'

const card = 'bg-white rounded-xl border border-[#e0e0e0] p-5'

// ── Protein wireframe background ──────────────────────────────────────────────
const BG_NODES: [number, number][] = [
  [80, 430], [165, 370], [235, 310], [308, 265], [385, 248],
  [455, 275], [514, 330], [572, 342], [642, 312], [702, 258],
  [762, 218], [832, 208], [904, 238], [962, 290], [1024, 302],
  [1082, 272], [1142, 228], [1204, 218], [1264, 252], [1322, 292],
  [1352, 335], [1330, 382], [1280, 414], [1218, 402], [1158, 381],
  [1098, 362], [1038, 382], [978, 412], [916, 422], [858, 402],
  [798, 372], [738, 362], [678, 382], [618, 412], [558, 432],
  [498, 422], [438, 402], [378, 393], [318, 412], [258, 442],
  [198, 462], [138, 452],
]

function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2
    const my = (pts[i][1] + pts[i + 1][1]) / 2
    d += ` Q ${pts[i][0]} ${pts[i][1]}, ${mx} ${my}`
  }
  const last = pts[pts.length - 1]
  d += ` L ${last[0]} ${last[1]}`
  return d
}

function ProteinBackground() {
  return (
    <svg
      viewBox="0 0 1440 780"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    >
      {/* main backbone */}
      <path
        d={smoothPath(BG_NODES)}
        stroke="#d0d0d0"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* secondary loop — offset version for depth */}
      <path
        d={smoothPath(BG_NODES.map(([x, y]) => [x + 22, y - 28]))}
        stroke="#e0e0e0"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="6 6"
      />
      {/* connector stubs from backbone to loop */}
      {BG_NODES.filter((_, i) => i % 3 === 0).map(([x, y], i) => (
        <line
          key={i}
          x1={x} y1={y}
          x2={x + 22} y2={y - 28}
          stroke="#d8d8d8"
          strokeWidth="1"
        />
      ))}
      {/* nodes */}
      {BG_NODES.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 5 === 0 ? 5 : 3.5}
          fill="white" stroke="#c8c8c8" strokeWidth="1.5" />
      ))}
      {/* secondary loop nodes */}
      {BG_NODES.filter((_, i) => i % 3 === 0).map(([x, y], i) => (
        <circle key={i} cx={x + 22} cy={y - 28} r="2.5"
          fill="white" stroke="#d8d8d8" strokeWidth="1" />
      ))}
    </svg>
  )
}

// ── Landing page ──────────────────────────────────────────────────────────────
const EXAMPLE_INSULIN = `>INS_HUMAN Insulin preprotein
MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKTRREAEDLQVGQVELGGGPGAGSLQPLALEGSLQKRGIVEQCCTSICSLYQLENYCN`

const EXAMPLE_GFP = `>GFP Green Fluorescent Protein
MSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGKLPVPWPTLVTTLTYGVQCFSRYPDHMKQHDFFKSAMPEGYVQERTIFFKDDGNYKTRAEVKFEGDTLVNRIELKGIDFKEDGNILGHKLEYNYNSHNVYIMADKQKNGIKVNFKIRHNIEDGSVQLADHYQQNTPIGDGPVLLPDNHYLSTQSALSKDPNEKRDHMVLLEFVTAAGITLGMDELYK`

const EXAMPLE_MYOGLOBIN = 'P02144'

type PageType = 'landing' | 'dashboard' | 'docs' | 'about'

function LandingPage({ onEnter, onNavigate }: { onEnter: () => void; onNavigate: (page: PageType) => void }) {
  const { fasta, setFasta } = useProteinStore()
  const { submit } = useProteinQuery()
  const [showMethodology, setShowMethodology] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setFasta(ev.target?.result as string)
    reader.readAsText(file)
  }

  const handleSubmit = () => {
    if (!fasta.trim()) return
    submit()
    onEnter()
  }

  return (
    <div className="min-h-screen bg-white text-[#1a1a2e] flex flex-col relative overflow-hidden">
      <ProteinBackground />

      {/* Nav */}
      <nav className="relative z-10 flex justify-end items-center gap-5 sm:gap-8 px-5 sm:px-10 py-4 sm:py-5">
        <button
          onClick={() => onNavigate('docs')}
          className="text-sm text-[#1a1a2e] hover:text-[#5b9bd5] transition-colors font-medium"
        >
          docs
        </button>
        <button
          onClick={() => setShowMethodology(true)}
          className="text-sm text-[#1a1a2e] hover:text-[#5b9bd5] transition-colors font-medium"
        >
          methodology
        </button>
        <button
          onClick={() => setShowAbout(true)}
          className="text-sm text-[#1a1a2e] hover:text-[#5b9bd5] transition-colors font-medium"
        >
          about
        </button>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-5 sm:gap-6 px-5 sm:px-8 -mt-4 sm:-mt-8">
        <h1 className="text-5xl sm:text-6xl md:text-[72px] font-bold tracking-tight text-center leading-none">
          SonoFold
        </h1>
        <p className="text-base sm:text-lg text-[#555] text-center max-w-[520px] leading-relaxed">
          minimalist biology-inspired tool for predicting protein structure
          and transforming it into music using ESMFold.
        </p>

        {/* Input row */}
        <div className="flex flex-col sm:flex-row gap-2 w-full max-w-[540px]">
          <input
            type="text"
            value={fasta}
            onChange={(e) => setFasta(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Enter UniProt ID or Sequence"
            className="flex-1 rounded-lg border border-[#d8d8d8] bg-white/80 px-4 py-3
                       text-sm text-[#1a1a2e] placeholder-[#aaa] focus:outline-none
                       focus:ring-2 focus:ring-[#5b9bd5]/30 transition-colors"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-[#d8d8d8] bg-white
                       px-4 py-3 text-sm text-[#444] hover:bg-[#f5f5f7] transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            upload FASTA
          </button>
          <input ref={fileRef} type="file" accept=".fasta,.fa,.txt" className="hidden" onChange={handleFile} />
        </div>

        {/* Analyze button */}
        <button
          onClick={handleSubmit}
          disabled={!fasta.trim()}
          className="w-full max-w-[540px]
                     bg-[#1e3a4f] hover:bg-[#162d3e] disabled:bg-[#ccc] disabled:cursor-not-allowed
                     text-white py-3.5 rounded-lg text-base font-semibold transition-colors"
        >
          music for my DNA
        </button>

        {/* Load examples */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#aaa]">Try:</span>
          <button
            onClick={() => setFasta(EXAMPLE_INSULIN)}
            className="text-sm text-[#5b9bd5] hover:underline"
          >
            Insulin
          </button>
          <span className="text-[#ddd]">·</span>
          <button
            onClick={() => setFasta(EXAMPLE_GFP)}
            className="text-sm text-[#5b9bd5] hover:underline"
          >
            GFP
          </button>
          <span className="text-[#ddd]">·</span>
          <button
            onClick={() => setFasta(EXAMPLE_MYOGLOBIN)}
            className="text-sm text-[#5b9bd5] hover:underline"
          >
            Myoglobin <span className="text-[#aaa] text-xs">(P02144)</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 pb-5 text-center">
        <p className="text-xs text-[#bbb]">
          developed by{' '}
          <a
            href="https://dataapps.agency"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5b9bd5] hover:underline"
          >
            dataapps.agency
          </a>
        </p>
      </div>

      {/* Methodology modal */}
      {showMethodology && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowMethodology(false)}
        >
          <div
            className="bg-white rounded-2xl border border-[#e0e0e0] shadow-xl w-full max-w-2xl mx-4 p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <p className="text-xs text-[#5b9bd5] font-semibold uppercase tracking-widest">Methodology</p>
              <button
                onClick={() => setShowMethodology(false)}
                className="ml-4 text-[#999] hover:text-[#1a1a2e] transition-colors shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Paper 1 */}
            <div className="rounded-xl border border-[#e0e0e0] p-5 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5b9bd5] mb-1">Heliyon · CellPress · 2021</p>
              <h2 className="text-sm font-bold leading-snug mb-1">
                Protein music of enhanced musicality by music style guided exploration
                of diverse amino acid properties
              </h2>
              <p className="text-xs text-[#888] mb-3">
                Nicole Morriti Tay, Fanel Lu, Chasein Wong, Hui Zhong, Peng Zhong, Yu Zong Chen ·
                Heliyon, Vol. 7, Issue 9, September 2021, e07933
              </p>
              <p className="text-sm text-[#555] mb-3">
                Establishes the primary amino-acid → musical parameter mapping used by SonoFold's
                default Fantaisie-Impromptu algorithm. Properties such as residue volume, EIIP group,
                and rRNA/mRNA binding propensity are translated into pitch, octave, duration, chord,
                velocity, and hand assignment for a two-voice piano score.
              </p>
              <a
                href="https://doi.org/10.1016/j.heliyon.2021.e07933"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#5b9bd5] hover:underline font-medium"
              >
                doi:10.1016/j.heliyon.2021.e07933
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Paper 2 */}
            <div className="rounded-xl border border-[#e0e0e0] p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5b9bd5] mb-1">BMC Bioinformatics · 2021</p>
              <h2 className="text-sm font-bold leading-snug mb-1">
                Using sound to understand protein sequence data
              </h2>
              <p className="text-xs text-[#888] mb-3">
                Eddie Martin et al. · BMC Bioinformatics 22: 490
              </p>
              <p className="text-sm text-[#555] mb-3">
                Describes five distinct sonification algorithms (Sonifyed I–V) mapping protein
                sequences to musical output via hydrophobicity scales, reduced chemical-group
                alphabets, and Shannon sequence entropy. SonoFold re-implements all five adapted
                for single-sequence use.
              </p>
              <a
                href="https://doi.org/10.1186/s12859-021-04362-7"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#5b9bd5] hover:underline font-medium"
              >
                doi:10.1186/s12859-021-04362-7
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* About modal */}
      {showAbout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowAbout(false)}
        >
          <div
            className="bg-white rounded-2xl border border-[#e0e0e0] shadow-xl w-full max-w-lg mx-4 p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <p className="text-xs text-[#5b9bd5] font-semibold uppercase tracking-widest">About</p>
              <button
                onClick={() => setShowAbout(false)}
                className="text-[#999] hover:text-[#1a1a2e] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Profile */}
            <div className="rounded-xl border border-[#e0e0e0] p-6 mb-6">
              <h2 className="text-xl font-bold tracking-tight mb-4">Daramola Oluwasegun Isaac</h2>
              <div className="flex gap-2 flex-wrap">
                <a href="https://www.linkedin.com/in/oluwasegun-isaac-daramola" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#e0e0e0] bg-white hover:bg-[#f5f5f7] transition-colors text-sm font-medium text-[#1a1a2e]">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>
                <a href="https://github.com/OluwasegunIsaac" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#e0e0e0] bg-white hover:bg-[#f5f5f7] transition-colors text-sm font-medium text-[#1a1a2e]">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
                <a href="https://orcid.org/0000-0001-9956-7274" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#e0e0e0] bg-white hover:bg-[#f5f5f7] transition-colors text-sm font-medium text-[#1a1a2e]">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#a6ce39">
                    <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 01-.947-.947c0-.516.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.016-5.325 5.016h-3.919V7.416zm1.444 1.303v7.444h2.297c2.359 0 3.928-1.316 3.928-3.722 0-2.016-1.284-3.722-3.928-3.722h-2.297z"/>
                  </svg>
                  ORCID
                </a>
              </div>
            </div>

            {/* About the project */}
            <div className="text-sm text-[#444] space-y-3 mb-6">
              <p>
                SonoFold implements protein sonification based on two peer-reviewed publication frameworks:
                the amino acid property mapping of <strong>Tay et al. (Heliyon, 2021)</strong> and the
                five Sonifyed algorithms of <strong>Martin et al. (BMC Bioinformatics, 2021)</strong>.
              </p>
              <p>
                Structure prediction is powered by <strong>ESMFold</strong> (Meta AI) for new sequences
                and the <strong>AlphaFold EBI database</strong> for known UniProt accessions.
              </p>
            </div>

            {/* Publications */}
            <div className="border-t border-[#f0f0f0] pt-5 space-y-2 text-xs text-[#666]">
              <p>[1] Tay NM et al. <em>Protein music of enhanced musicality…</em> Heliyon 7(9): e07933, 2021.{' '}
                <a className="text-[#5b9bd5] hover:underline" href="https://doi.org/10.1016/j.heliyon.2021.e07933" target="_blank" rel="noopener noreferrer">doi:10.1016/j.heliyon.2021.e07933</a>
              </p>
              <p>[2] Martin E et al. <em>Using sound to understand protein sequence data.</em> BMC Bioinformatics 22: 490, 2021.{' '}
                <a className="text-[#5b9bd5] hover:underline" href="https://doi.org/10.1186/s12859-021-04362-7" target="_blank" rel="noopener noreferrer">doi:10.1186/s12859-021-04362-7</a>
              </p>
            </div>

            <div className="border-t border-[#f0f0f0] pt-4 mt-2 text-center">
              <p className="text-xs text-[#bbb]">
                Developed by{' '}
                <a
                  href="https://dataapps.agency"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5b9bd5] hover:underline"
                >
                  dataapps.agency
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { status, errorMessage, events, bpm, style, algorithm, durationScale, pdb, fasta } = useProteinStore()

  // Derive a short label + best-match database URL from the user's input
  const proteinMeta = (() => {
    if (!fasta) return null
    const trimmed = fasta.trim()

    // ── FASTA header ──────────────────────────────────────────────────────────
    if (trimmed.startsWith('>')) {
      const header = trimmed.split('\n')[0].replace(/^>\s*/, '')
      const label = header.split(/\s+/).slice(0, 4).join(' ') || null
      if (!label) return null

      // sp|P12345|... or tr|A0A000|... → UniProt
      const uniprotInHeader = header.match(/(?:sp|tr)\|([A-Z0-9]{6,10})\|/)
      if (uniprotInHeader)
        return { label, url: `https://www.uniprot.org/uniprotkb/${uniprotInHeader[1]}` }

      // PDB-style: 4-char + optional chain e.g. 1ABC or 1ABC_A
      const pdbInHeader = header.match(/\b([1-9][A-Z0-9]{3})(?:_[A-Za-z])?\b/)
      if (pdbInHeader)
        return { label, url: `https://www.rcsb.org/structure/${pdbInHeader[1].toUpperCase()}` }

      // Fallback: NCBI text search
      const query = encodeURIComponent(label)
      return { label, url: `https://www.ncbi.nlm.nih.gov/protein/?term=${query}` }
    }

    const id = trimmed.trim()

    // UniProt accession: P12345 / A0A000ABC1 (6–10 alphanumeric, optionally -N isoform)
    if (/^[OPQ][0-9][A-Z0-9]{3}[0-9](-\d+)?$/i.test(id) ||
        /^[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}(-\d+)?$/i.test(id))
      return { label: id.toUpperCase(), url: `https://www.uniprot.org/uniprotkb/${id.toUpperCase()}` }

    // UniProt entry name: GENE_ORGANISM (e.g. INS_HUMAN)
    if (/^[A-Z0-9]{1,5}_[A-Z]{2,5}$/i.test(id))
      return { label: id.toUpperCase(), url: `https://www.uniprot.org/uniprotkb?query=${encodeURIComponent(id)}` }

    // PDB ID: exactly 4 chars starting with digit
    if (/^[1-9][A-Z0-9]{3}$/i.test(id))
      return { label: id.toUpperCase(), url: `https://www.rcsb.org/structure/${id.toUpperCase()}` }

    // NCBI protein accession: e.g. NP_000198, XP_012345678, AAB12345
    if (/^[A-Z]{2}_?\d{6,9}(\.\d+)?$/i.test(id))
      return { label: id.toUpperCase(), url: `https://www.ncbi.nlm.nih.gov/protein/${id}` }

    // RefSeq / GenBank protein (1-2 letters + 5-8 digits)
    if (/^[A-Z]{1,2}\d{5,8}(\.\d+)?$/i.test(id))
      return { label: id.toUpperCase(), url: `https://www.ncbi.nlm.nih.gov/protein/${id}` }

    // Pfam accession: PF00001
    if (/^PF\d{5}$/i.test(id))
      return { label: id.toUpperCase(), url: `https://www.ebi.ac.uk/interpro/entry/pfam/${id.toUpperCase()}/` }

    // InterPro: IPR000001
    if (/^IPR\d{6}$/i.test(id))
      return { label: id.toUpperCase(), url: `https://www.ebi.ac.uk/interpro/entry/InterPro/${id.toUpperCase()}/` }

    // Generic short alphanumeric fallback → UniProt search
    if (/^[A-Z0-9_-]{2,20}$/i.test(id))
      return { label: id.toUpperCase(), url: `https://www.uniprot.org/uniprotkb?query=${encodeURIComponent(id)}` }

    return null
  })()
  const [page, setPage] = useState<PageType>('landing')
  const [showExport, setShowExport] = useState(false)
  const [audioFormat, setAudioFormat] = useState<AudioExportFormat>('MP3')
  const [audioStatus, setAudioStatus] = useState('')
  const structureRef = useRef<StructureViewerHandle>(null)

  const handleExportPdb = () => {
    if (!pdb) return
    const blob = new Blob([pdb], { type: 'chemical/x-pdb' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'structure.pdb'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 400)
  }

  const preset = { ...STYLE_PRESETS[style], durationScale }

  const handleExportAudio = async () => {
    setAudioStatus('Rendering…')
    try {
      const transformedEvents = applyAlgorithm(events, algorithm)
      await exportAudio(transformedEvents, bpm, preset, audioFormat, (p) =>
        setAudioStatus(`Rendering… ${Math.round(p * 100)}%`),
      )
      setAudioStatus('Downloaded!')
    } catch (e) { setAudioStatus(`Error: ${String(e)}`) }
    setTimeout(() => setAudioStatus(''), 3000)
  }

  if (page === 'docs') return <DocsPage onNavigate={setPage} />
  if (page === 'about') return <AboutPage onNavigate={setPage} />

  if (page === 'landing') {
    return <LandingPage onEnter={() => setPage('dashboard')} onNavigate={setPage} />
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1a1a2e] flex flex-col">
      <div className="flex-1 px-4 sm:px-6 py-3 max-w-[1400px] w-full mx-auto flex flex-col gap-3">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage('landing')}
              className="p-1.5 rounded-lg hover:bg-[#e8e8e8] transition-colors text-[#555] hover:text-[#1a1a2e]"
              title="Back to home"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight">SonoFold Workspace</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExport(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#e0e0e0]
                         bg-white text-sm font-medium text-[#1a1a2e] hover:bg-[#f5f5f7] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* ── Main row ── */}
        <div className="flex flex-col lg:flex-row gap-5 items-stretch flex-1">

          {/* Left sidebar — full width on mobile, 300px on desktop */}
          <div className="w-full lg:w-[300px] lg:shrink-0 flex flex-col gap-4">

            {/* Protein Sequence card */}
            <div className={card}>
              <h2 className="text-base font-semibold mb-3">Protein Sequence</h2>
              <FASTAInput />
            </div>

            {status === 'error' && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {/* Audio Controls card — grows to fill remaining height */}
            {status === 'ready' ? (
              <div className={`${card} flex-1 flex flex-col`}>
                <h2 className="text-base font-semibold mb-4">Audio Controls</h2>
                <PlaybackControls />
              </div>
            ) : (
              <div className="flex-1" />
            )}
          </div>

          {/* Center + Heatmap column */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">
            {/* 3D structure viewer */}
            <div className={`${card} flex flex-col`}>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                {proteinMeta ? (
                  <>
                    <a
                      href={proteinMeta.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#5b9bd5] hover:underline underline-offset-2 flex items-center gap-1"
                      title="Open in protein database"
                    >
                      {proteinMeta.label}
                      <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                    <span className="text-[#aaa] font-normal">·</span>
                    <span>3D Structure</span>
                  </>
                ) : '3D Structure'}
              </h2>
              <StructureViewer ref={structureRef} />
            </div>

            {/* Feature Heatmap — fills remaining space below viewer */}
            <div className={`${card} flex-1`}>
              <h2 className="text-base font-semibold mb-5">Feature Heatmap</h2>
              <FeatureHeatmap />
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <p className="text-xs text-[#999] text-center pb-2">
          Data source: ESMFold &amp; AlphaFold &middot; 2021
        </p>
      </div>

      {/* ── Export modal ── */}
      {showExport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowExport(false)}
        >
          <div
            className="bg-white rounded-2xl border border-[#e0e0e0] shadow-xl w-full max-w-lg mx-4 p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Export Data</h2>
              <button onClick={() => setShowExport(false)} className="text-[#999] hover:text-[#1a1a2e] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 3D Structure Export section */}
            <div className="mb-6">
              <h3 className="text-base font-semibold mb-3">3D Structure Export</h3>
              <div className="flex flex-col gap-3">
                <p className="text-sm text-[#555]">
                  Export the current 3D render as an image or download the raw structure file.
                </p>
                <div className="flex flex-wrap gap-2">
                  {(['PNG', 'JPEG', 'SVG'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      disabled={!pdb}
                      onClick={() => {
                        if (fmt === 'PNG') structureRef.current?.exportPng()
                        else if (fmt === 'JPEG') structureRef.current?.exportJpeg()
                        else structureRef.current?.exportSvg()
                      }}
                      className="px-4 py-2 rounded-lg border border-[#d0d0d0] bg-white hover:bg-[#f5f5f7]
                                 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium
                                 text-[#1a1a2e] transition-colors"
                    >
                      {fmt}
                    </button>
                  ))}
                  <button
                    disabled={!pdb}
                    onClick={handleExportPdb}
                    className="px-4 py-2 rounded-lg border border-[#d0d0d0] bg-white hover:bg-[#f5f5f7]
                               disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium
                               text-[#1a1a2e] transition-colors"
                  >
                    PDB (3D)
                  </button>
                </div>
              </div>
            </div>

            {/* Audio Export section */}
            <div className="mb-6">
              <h3 className="text-base font-semibold mb-3">Audio Export</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-[#555] w-16 shrink-0">Format:</label>
                  <select
                    value={audioFormat}
                    onChange={(e) => setAudioFormat(e.target.value as AudioExportFormat)}
                    className="flex-1 rounded-lg border border-[#d0d0d0] bg-white px-3 py-2 text-sm
                               text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#5b9bd5]/30"
                  >
                    <option value="MP3">MP3</option>
                    <option value="Ambient">Ambient</option>
                    <option value="MIDI">MIDI</option>
                  </select>
                </div>
                <p className="text-sm text-[#555]">
                  {audioFormat === 'MIDI'
                    ? 'Exports a Standard MIDI File (.mid) with right and left hand tracks.'
                    : audioFormat === 'Ambient'
                    ? 'Renders the sonification with ambient reverb blend applied, saved as WAV.'
                    : 'Renders the full protein sonification as a WAV audio file.'}
                </p>
                {audioStatus && (
                  <p className="text-xs font-medium text-[#5b9bd5]">{audioStatus}</p>
                )}
                <button
                  onClick={handleExportAudio}
                  disabled={events.length === 0}
                  className="self-start px-5 py-2 rounded-lg bg-[#5b9bd5] hover:bg-[#4a8bc4]
                             disabled:bg-[#ccc] disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                >
                  Export Audio
                </button>
              </div>
            </div>


          </div>
        </div>
      )}
    </div>
  )
}
