type PageType = 'landing' | 'dashboard' | 'docs' | 'about'

interface Props {
  onNavigate: (page: PageType) => void
}

const section = 'mb-10'
const h2 = 'text-xl font-bold text-[#1a1a2e] mb-4'
const h3 = 'text-base font-semibold text-[#1a1a2e] mb-2'
const prose = 'text-sm text-[#444] leading-relaxed'
const chip = 'inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#eaf2fb] text-[#4a8bc4] mr-1.5 mb-1.5'

const ALGORITHMS = [
  {
    id: 'Fantaisie-Impromptu',
    label: 'Fantaisie-Impromptu (Default)',
    badge: 'Tay et al. 2021',
    desc:
      "The primary mapping used by SonoFold. Each amino acid's physicochemical properties (relative occurrence frequency, residue volume, EIIP group, rRNA/mRNA binding propensity) are translated into pitch, octave, duration, chord, velocity and hand assignment for a two-voice piano score. Structure is predicted by ESMFold so each note also encodes 3D context.",
    details: [
      'Right-hand pitch \u2190 relative frequency of occurrence',
      'Left-hand pitch \u2190 amino acid composition index',
      'Note duration \u2190 size / volume of previous residue',
      'Octave \u2190 EIIP group; R/K raise, D/E lower',
      'Chords \u2190 rRNA binding (RH) / mRNA binding (LH)',
      'Dynamics \u2190 H-bond donor count from Arginine triggers',
      'Accidentals \u2190 Proline (RH), Arginine (LH)',
    ],
  },
  {
    id: 'Algo-I',
    label: 'Sonifyed I \u2014 Hydrophobicity',
    badge: 'Martin et al. 2021',
    desc:
      'Maps each residue to one of 20 distinct MIDI pitches ordered by the Engelmann (1986) hydrophobicity scale. The most hydrophobic residue (Phenylalanine) receives the lowest pitch (MIDI 50); the most hydrophilic (Arginine) the highest (MIDI 77). Produces a direct physicochemical melody with a wide dynamic pitch range.',
    details: [
      'Source: Engelmann (1986) hydrophobicity scale',
      '20 unique pitches, one per amino acid',
      'Hydrophobic \u2192 low pitch; hydrophilic \u2192 high pitch',
    ],
  },
  {
    id: 'Algo-II',
    label: 'Sonifyed II \u2014 Reduced Alphabet',
    badge: 'Martin et al. 2021',
    desc:
      'Groups the 20 amino acids into 4 chemical families using the Lenckowski reduced alphabet, each assigned a single pitch. Produces a minimal 4-note melody that emphasises broad chemical patterns rather than per-residue variation.',
    details: [
      'Group 1 \u2014 D E H N R \u2192 pitch 60 (C4)',
      'Group 2 \u2014 K Q S T   \u2192 pitch 62 (D4)',
      'Group 3 \u2014 A C G M P \u2192 pitch 64 (E4)',
      'Group 4 \u2014 F I L V W Y \u2192 pitch 67 (G4)',
    ],
  },
  {
    id: 'Algo-III',
    label: 'Sonifyed III \u2014 Hydrophobicity + Groups',
    badge: 'Martin et al. 2021',
    desc:
      'Combines Algorithms I and II. The Engelmann hydrophobicity pitch forms the melody while the Lenckowski group pitch is added as a simultaneous chord note. Provides both fine-grained and coarse-grained chemical texture in parallel.',
    details: [
      'Melody: Engelmann hydrophobicity (Algo-I)',
      'Chord layer: Lenckowski group pitch (Algo-II)',
    ],
  },
  {
    id: 'Algo-IV',
    label: 'Sonifyed IV \u2014 Sequence Entropy',
    badge: 'Martin et al. 2021',
    desc:
      'Computes the Shannon entropy in a \u00b14 residue sliding window around each position. High local diversity produces high pitches; repetitive regions produce low pitches. Originally designed for Multiple Sequence Alignments; SonoFold adapts it to single sequences by analysing local composition.',
    details: [
      'Window: \u00b14 residues (9 positions total)',
      'High entropy \u2192 high pitch (MIDI 50\u201374)',
      'Low entropy \u2192 low pitch',
    ],
  },
  {
    id: 'Algo-V',
    label: 'Sonifyed V \u2014 Hydrophobicity + Harmonics',
    badge: 'Martin et al. 2021',
    desc:
      'Uses Engelmann hydrophobicity pitches as the melody and layers octave harmonics as chord notes, simulating the multi-strand effect of running Algo-I across a full MSA simultaneously. Produces a rich, layered sound texture.',
    details: [
      'Melody: Engelmann hydrophobicity (Algo-I)',
      'Chords: octave harmonics (+12, +24 semitones)',
    ],
  },
]

const STYLES = [
  { name: 'Default', desc: 'Pure Tay et al. mapping; triangle wave, no modification.' },
  { name: 'Ambient', desc: 'Sine wave, 65% reverb, stretched durations; meditative texture.' },
  { name: 'Classical', desc: 'Soft sine, subtle reverb, precise staccato feel.' },
  { name: 'Jazz', desc: 'Sawtooth timbre, swing rhythm offset, slight pitch shift.' },
  { name: 'Lo-Fi', desc: 'Square wave, high reverb, reduced dynamics; hazy, warm.' },
  { name: 'Afrobeat', desc: 'Polyrhythmic swing, bright sawtooth, punchy velocity.' },
  { name: 'Punk', desc: 'Square wave, high velocity, minimal reverb, fast attack.' },
  { name: 'Techno', desc: 'Sawtooth, rhythmic gate envelope, driven velocity.' },
  { name: 'Synthwave', desc: 'Sawtooth, stereo reverb blend, slight pitch-down shift.' },
  { name: 'Folk', desc: 'Triangle wave, soft swing, warm resonant decay.' },
]

const SECTIONS = ['Overview', 'Getting Started', 'Scientific Foundation', 'Algorithms', 'Musical Styles', 'Feature Heatmap', 'Export', 'Architecture']

export function DocsPage({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-white text-[#1a1a2e] flex flex-col">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#f0f0f0] flex items-center gap-4 px-5 sm:px-8 py-3">
        <button
          onClick={() => onNavigate('landing')}
          className="p-1.5 rounded-lg hover:bg-[#f0f0f0] transition-colors text-[#555] hover:text-[#1a1a2e] shrink-0"
          title="Back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#5b9bd5]">Documentation</p>
      </div>

      {/* ── Body: sidebar + content ── */}
      <div className="flex flex-1 min-h-0">

        {/* Sticky sidebar TOC — desktop only */}
        <aside className="hidden lg:flex flex-col w-56 xl:w-64 shrink-0 border-r border-[#f0f0f0] sticky top-[49px] h-[calc(100vh-49px)] overflow-y-auto py-10 px-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#aaa] mb-4">On this page</p>
          <nav className="flex flex-col gap-1">
            {SECTIONS.map((s) => (
              <a
                key={s}
                href={`#${s.toLowerCase().replace(/ /g, '-')}`}
                className="text-sm text-[#666] hover:text-[#5b9bd5] py-1 transition-colors"
              >
                {s}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main content — full remaining width */}
        <main className="flex-1 min-w-0 px-5 sm:px-10 lg:px-16 xl:px-20 py-10 lg:py-12">

          {/* Page header */}
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">How SonoFold works</h1>
            <p className="text-base text-[#555] max-w-2xl">
              A complete reference for users and developers: input formats, sonification algorithms,
              musical styles, export options, and the full backend pipeline.
            </p>
          </div>

        {/* 1. Overview */}
        <div id="overview" className={section}>
          <h2 className={h2}>Overview</h2>
          <p className={`${prose} mb-3`}>
            SonoFold is a web application that accepts a protein sequence (FASTA format or UniProt ID),
            predicts its 3D structure using <strong>ESMFold</strong> or retrieves it from the
            <strong> AlphaFold EBI database</strong>, extracts biophysical features, and converts the
            result into a musical score — a process called <em>protein sonification</em>.
          </p>
          <p className={prose}>
            The goal is to make protein data perceivable through sound, enabling researchers and
            enthusiasts to detect patterns in sequence and structure through human psychoacoustic
            intuition. SonoFold implements six distinct sonification algorithms derived from two
            peer-reviewed publications and overlays ten musical style presets.
          </p>
        </div>

        {/* 2. Getting Started */}
        <div id="getting-started" className={section}>
          <h2 className={h2}>Getting Started</h2>
          <ol className="list-none space-y-4">
            {[
              ['Enter a sequence', 'Paste a protein sequence in FASTA format, or type a UniProt accession ID (e.g. P01308 for Insulin) in the landing-page input box. You can also click "Upload FASTA" to load a local .fasta / .fa / .txt file.'],
              ['Run analysis', 'Click "Music to my ears". SonoFold calls the structure prediction API; this typically takes 5\u201330 seconds depending on sequence length.'],
              ['Explore the 3D viewer', 'The predicted structure appears in the centre panel, rendered with colour-by-spectrum cartoon style. The highlighted residue advances as the music plays.'],
              ['Choose an algorithm', 'Open the Algorithm dropdown in the Audio Controls panel. Six mapping strategies are available, each emphasising different chemical properties of the sequence.'],
              ['Choose a musical style', 'Select a Style preset. The available styles are filtered to those appropriate for the chosen algorithm.'],
              ['Adjust playback', 'Use the BPM slider to set tempo and the Duration multiplier (0.25\u00d7 \u2013 3.0\u00d7) to stretch or compress note lengths.'],
              ['Play / pause', 'Click the play button to start. The progress bar and residue counter advance in real time. The 3D viewer highlights the current residue.'],
              ['Export', 'Click "Export" at the top of the workspace to download the sonification as WAV/MIDI or save the structure as PNG, JPEG, SVG or PDB.'],
            ].map(([title, body], i) => (
              <li key={i} className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-[#eaf2fb] text-[#5b9bd5] flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a1a2e] mb-0.5">{title}</p>
                  <p className="text-sm text-[#555]">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* 3. Scientific Foundation */}
        <div id="scientific-foundation" className={section}>
          <h2 className={h2}>Scientific Foundation</h2>
          <p className={`${prose} mb-6`}>
            SonoFold's sonification engine is built directly on top of two peer-reviewed publications.
          </p>
          <div className="space-y-4">
            <div className="rounded-xl border border-[#e0e0e0] p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#5b9bd5] mb-1">Heliyon · CellPress · 2021</p>
                  <h3 className="text-sm font-bold leading-snug">
                    Protein music of enhanced musicality by music style guided exploration of diverse amino acid properties
                  </h3>
                  <p className="text-xs text-[#888] mt-1">
                    Nicole Morriti Tay, Fanel Lu, Chasein Wong, Hui Zhong, Peng Zhong, Yu Zong Chen · Heliyon 7(9): e07933
                  </p>
                </div>
                <span className="shrink-0 px-2.5 py-1 rounded-full bg-[#eaf2fb] text-[#4a8bc4] text-[10px] font-bold uppercase">
                  Fantaisie-Impromptu
                </span>
              </div>
              <p className="text-sm text-[#555] mb-3">
                Establishes the primary amino-acid → musical parameter mapping used by SonoFold's default
                Fantaisie-Impromptu algorithm. Tables 2 and 3 of the paper define pitch, octave, note
                duration, chord interval, and dynamic assignments for all 20 standard amino acids.
              </p>
              <a href="https://doi.org/10.1016/j.heliyon.2021.e07933" target="_blank" rel="noopener noreferrer"
                className="text-xs text-[#5b9bd5] hover:underline font-medium">
                doi:10.1016/j.heliyon.2021.e07933 ↗
              </a>
            </div>
            <div className="rounded-xl border border-[#e0e0e0] p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#5b9bd5] mb-1">BMC Bioinformatics · 2021</p>
                  <h3 className="text-sm font-bold leading-snug">
                    Using sound to understand protein sequence data <span className="font-normal text-[#888]">(Sonifyed)</span>
                  </h3>
                  <p className="text-xs text-[#888] mt-1">Eddie Martin et al. · BMC Bioinformatics 22: 490</p>
                </div>
                <span className="shrink-0 px-2.5 py-1 rounded-full bg-[#eaf2fb] text-[#4a8bc4] text-[10px] font-bold uppercase">
                  Algo-I – Algo-V
                </span>
              </div>
              <p className="text-sm text-[#555] mb-3">
                Describes five algorithms that map protein sequences to musical output. SonoFold
                re-implements these in TypeScript adapted for single-sequence use. The hydrophobicity
                scale follows Engelmann (1986); the reduced alphabet follows Lenckowski et al.
              </p>
              <a href="https://doi.org/10.1186/s12859-021-04362-7" target="_blank" rel="noopener noreferrer"
                className="text-xs text-[#5b9bd5] hover:underline font-medium">
                doi:10.1186/s12859-021-04362-7 ↗
              </a>
            </div>
          </div>
        </div>

        {/* 4. Algorithms */}
        <div id="algorithms" className={section}>
          <h2 className={h2}>Sonification Algorithms</h2>
          <p className={`${prose} mb-6`}>
            Six algorithms are available from the Algorithm dropdown in the Audio Controls panel.
            Each transforms the sequence of amino acids into a different pitch mapping strategy.
            You can mix any algorithm with any compatible musical style preset.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {ALGORITHMS.map((algo) => (
              <div key={algo.id} className="rounded-xl border border-[#e0e0e0] p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-bold text-[#1a1a2e]">{algo.label}</h3>
                  <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f0f0f0] text-[#666]">
                    {algo.badge}
                  </span>
                </div>
                <p className="text-sm text-[#555] mb-3">{algo.desc}</p>
                <ul className="space-y-0.5">
                  {algo.details.map((d, i) => (
                    <li key={i} className="text-xs text-[#777] flex gap-2">
                      <span className="text-[#c0c0c0]">·</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Musical Styles */}
        <div id="musical-styles" className={section}>
          <h2 className={h2}>Musical Styles</h2>
          <p className={`${prose} mb-4`}>
            Musical styles are post-processing presets applied on top of the chosen algorithm.
            They modify oscillator waveform, ADSR envelope, reverb wet mix, velocity scale,
            note duration scale, swing offset, and pitch shift — without altering the amino-acid
            → pitch mapping logic itself. Available styles are filtered to those musically
            appropriate for the active algorithm.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {STYLES.map((s) => (
              <div key={s.name} className="rounded-lg border border-[#e8e8e8] px-4 py-3">
                <p className="text-sm font-semibold text-[#1a1a2e] mb-0.5">{s.name}</p>
                <p className="text-xs text-[#777]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Feature Heatmap */}
        <div id="feature-heatmap" className={section}>
          <h2 className={h2}>Feature Heatmap</h2>
          <p className={`${prose} mb-3`}>
            The Feature Heatmap appears below the 3D viewer and visualises secondary structure
            assignment for every residue in the predicted structure.
          </p>
          <div className="space-y-2 mb-4">
            {[
              { label: 'Helix (H)', color: '#e05c5c', desc: 'α-helices, 310-helices, and π-helices — shown in red.' },
              { label: 'Sheet (E)', color: '#4a90d9', desc: 'β-strands / extended residues — shown in blue.' },
              { label: 'Coil (C)', color: '#6abf7a', desc: 'All other conformations (loops, turns) — shown in green.' },
            ].map(({ label, color, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-sm shrink-0 mt-0.5" style={{ background: color }} />
                <p className="text-sm text-[#444]">
                  <span className="font-semibold">{label}</span> — {desc}
                </p>
              </div>
            ))}
          </div>
          <p className={prose}>
            Secondary structure is extracted by running <strong>DSSP</strong> on the predicted PDB.
            The active residue is highlighted in the heatmap bar as the music plays, synchronised
            with the 3D viewer highlight and the playback progress bar.
          </p>
        </div>

        {/* 7. Export */}
        <div id="export" className={section}>
          <h2 className={h2}>Export</h2>
          <p className={`${prose} mb-4`}>
            Click the <strong>Export</strong> button at the top of the workspace to open the export
            modal. Two categories of export are available.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#e0e0e0] p-4">
              <h3 className={h3}>3D Structure</h3>
              <ul className="space-y-1.5">
                {[
                  ['PNG', 'Raster screenshot from the 3Dmol WebGL canvas.'],
                  ['JPEG', 'Re-rendered on a white background at 92% quality.'],
                  ['SVG', 'Raster screenshot embedded inside an SVG wrapper.'],
                  ['PDB (3D)', 'Raw PDB text file for use in PyMOL, Chimera etc.'],
                ].map(([fmt, desc]) => (
                  <li key={fmt as string} className="text-xs text-[#555]">
                    <span className={chip}>{fmt}</span>{desc}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-[#e0e0e0] p-4">
              <h3 className={h3}>Audio</h3>
              <ul className="space-y-1.5">
                {[
                  ['WAV (MP3)', 'Full offline render via Web Audio OfflineAudioContext.'],
                  ['Ambient WAV', 'Same render with heavy reverb blend applied.'],
                  ['MIDI', 'Standard MIDI File (.mid) with RH channel 0 and LH channel 1; respects BPM, velocity scaling and chord notes.'],
                ].map(([fmt, desc]) => (
                  <li key={fmt as string} className="text-xs text-[#555]">
                    <span className={chip}>{fmt}</span>{desc}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-xs text-[#999] mt-3">
            All exports respect the current BPM, Duration scale, Musical Style, and Algorithm settings at the time of export.
          </p>
        </div>

        {/* 8. Architecture */}
        <div id="architecture" className={section}>
          <h2 className={h2}>App Architecture</h2>
          <p className={`${prose} mb-6`}>
            SonoFold is a full-stack application. The frontend is a React 18 + Vite + TypeScript
            single-page app; the backend is a Python FastAPI service.
          </p>
          <h3 className={h3}>Request Pipeline</h3>
          <div className="flex flex-col gap-2 mb-6">
            {[
              ['1 · Input', 'User enters FASTA sequence or UniProt ID in the frontend.'],
              ['2 · Structure prediction', 'If a UniProt ID is provided, the backend fetches the pre-computed structure from the AlphaFold EBI API. Otherwise the raw sequence is sent to the ESMFold public REST API, which returns a PDB-format coordinate file.'],
              ['3 · Feature extraction (parallel)', 'Three CPU-bound tasks run concurrently in a thread pool: DSSP (secondary structure assignment), FreeSASA (solvent-accessible surface area), and B-factor-based flexibility extraction from the PDB.'],
              ['4 · Sonification mapping', 'The Tay et al. 2021 mapping (sonification.py) converts the per-residue feature vectors into NoteEvent objects encoding pitch, duration, hand, velocity, and chord intervals.'],
              ['5 · Response', 'The API returns the PDB string, feature vectors, note events, and a tempo curve to the frontend.'],
              ['6 · Playback', "The frontend's AudioEngine.ts schedules NoteEvents using Tone.js, applying the selected algorithm transform and musical style preset in real time."],
            ].map(([step, desc]) => (
              <div key={step as string} className="flex gap-4">
                <div className="shrink-0 text-[10px] font-bold text-[#5b9bd5] w-36 pt-0.5">{step}</div>
                <p className="text-sm text-[#555]">{desc}</p>
              </div>
            ))}
          </div>
          <h3 className={h3}>Technology Stack</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-[#e8e8e8] px-4 py-3">
              <p className="text-xs font-bold text-[#888] uppercase tracking-wider mb-2">Frontend</p>
              {['React 18 + Vite + TypeScript', 'Zustand (global state)', 'Tone.js (audio scheduling)', '3Dmol.js (structure rendering)', 'Tailwind CSS 3'].map((t) => (
                <p key={t} className="text-xs text-[#555] mb-0.5">· {t}</p>
              ))}
            </div>
            <div className="rounded-lg border border-[#e8e8e8] px-4 py-3">
              <p className="text-xs font-bold text-[#888] uppercase tracking-wider mb-2">Backend</p>
              {['FastAPI + uvicorn (Python 3.11)', 'ESMFold public API (meta.ai)', 'AlphaFold EBI API', 'DSSP via biopython', 'FreeSASA (SASA computation)'].map((t) => (
                <p key={t} className="text-xs text-[#555] mb-0.5">· {t}</p>
              ))}
            </div>
          </div>
        </div>

        {/* References */}
        <div className="border-t border-[#f0f0f0] pt-8">
          <h2 className={h2}>References</h2>
          <div className="space-y-3 text-xs text-[#666]">
            <p>
              [1] Tay NM, Lu F, Wong C, Zhong H, Zhong P, Chen YZ. <em>Protein music of enhanced musicality
              by music style guided exploration of diverse amino acid properties.</em> Heliyon.
              2021;7(9):e07933.{' '}
              <a className="text-[#5b9bd5] hover:underline" href="https://doi.org/10.1016/j.heliyon.2021.e07933" target="_blank" rel="noopener noreferrer">doi:10.1016/j.heliyon.2021.e07933</a>
            </p>
            <p>
              [2] Martin E et al. <em>Using sound to understand protein sequence data.</em> BMC Bioinformatics.
              2021;22:490.{' '}
              <a className="text-[#5b9bd5] hover:underline" href="https://doi.org/10.1186/s12859-021-04362-7" target="_blank" rel="noopener noreferrer">doi:10.1186/s12859-021-04362-7</a>
            </p>
            <p>
              [3] Engelmann BE. <em>A new empirical hydrophobicity scale for amino acids and its application.</em> 1986.
            </p>
            <p>
              [4] Lin HH, Lenckowski et al. Reduced alphabet encoding. (As implemented in Sonifyed Algorithm-II.pl.)
            </p>
            <p>
              [5] Lin Z, Akin H, Rao R, et al. <em>Evolutionary-scale prediction of atomic-level protein
              structure with a language model.</em> Science. 2023;379:1123–1130.
            </p>
            <p>
              [6] Jumper J, Evans R, Pritzel A, et al. <em>Highly accurate protein structure prediction
              with AlphaFold.</em> Nature. 2021;596:583–589.
            </p>
          </div>
        </div>

        </main>
      </div>
    </div>
  )
}
