type PageType = 'landing' | 'dashboard' | 'docs' | 'about'

interface Props {
  onNavigate: (page: PageType) => void
}

export function AboutPage({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-white text-[#1a1a2e]">
      {/* Back icon */}
      <div className="px-8 pt-6">
        <button
          onClick={() => onNavigate('landing')}
          className="p-1.5 rounded-lg hover:bg-[#f0f0f0] transition-colors text-[#555] hover:text-[#1a1a2e]"
          title="Back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="max-w-[680px] mx-auto px-8 py-16">

        {/* Page header */}
        <p className="text-xs font-semibold uppercase tracking-widest text-[#5b9bd5] mb-3">About</p>


        {/* Profile card */}
        <div className="rounded-2xl border border-[#e0e0e0] p-8 mb-10">
          <h2 className="text-2xl font-bold tracking-tight mb-1">Daramola Oluwasegun Isaac</h2>
          <p className="text-sm text-[#5b9bd5] font-semibold mb-1">Incoming PhD Student</p>
          <p className="text-sm text-[#888] mb-6">Purdue University</p>

          {/* Links */}
          <div className="flex gap-3 flex-wrap">
            <a
              href="https://www.linkedin.com/in/oluwasegun-isaac-daramola"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e0e0e0]
                         bg-white hover:bg-[#f5f5f7] transition-colors text-sm font-medium text-[#1a1a2e]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>
            <a
              href="https://github.com/OluwasegunIsaac"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e0e0e0]
                         bg-white hover:bg-[#f5f5f7] transition-colors text-sm font-medium text-[#1a1a2e]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
            <a
              href="https://orcid.org/0000-0001-9956-7274"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e0e0e0]
                         bg-white hover:bg-[#f5f5f7] transition-colors text-sm font-medium text-[#1a1a2e]"
            >
              {/* ORCID icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#a6ce39">
                <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 01-.947-.947c0-.516.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.016-5.325 5.016h-3.919V7.416zm1.444 1.303v7.444h2.297c2.359 0 3.928-1.316 3.928-3.722 0-2.016-1.284-3.722-3.928-3.722h-2.297z"/>
              </svg>
              ORCID
            </a>
          </div>
        </div>

        {/* About the project */}
        <div className="mb-10">
          <h2 className="text-lg font-bold mb-4">About the Project</h2>
          <div className="space-y-3 text-sm text-[#444] leading-relaxed">
            <p>
              SonoFold implements protein sonification based on two peer-reviewed publication frameworks:
              the amino acid property mapping of <strong>Tay et al. (Heliyon, 2021)</strong> and the
              five Sonifyed algorithms of <strong>Martin et al. (BMC Bioinformatics, 2021)</strong>.
            </p>
            <p>
              Structure prediction is powered by <strong>ESMFold</strong> (Meta AI) for new sequences
              and the <strong>AlphaFold EBI database</strong> for known UniProt accessions.
              Per-residue features (secondary structure, solvent accessibility, flexibility) are
              extracted server-side and used to drive musical parameters in real time.
            </p>
            <p>
              The application is open-source. Contributions, issues, and ideas are welcome on GitHub.
            </p>
          </div>
        </div>

        {/* Publications */}
        <div className="border-t border-[#f0f0f0] pt-8">
          <h2 className="text-lg font-bold mb-4">Publications Used</h2>
          <div className="space-y-3 text-xs text-[#666]">
            <p>
              [1] Tay NM et al. <em>Protein music of enhanced musicality by music style guided
              exploration of diverse amino acid properties.</em> Heliyon 7(9): e07933, 2021.{' '}
              <a className="text-[#5b9bd5] hover:underline" href="https://doi.org/10.1016/j.heliyon.2021.e07933" target="_blank" rel="noopener noreferrer">
                doi:10.1016/j.heliyon.2021.e07933
              </a>
            </p>
            <p>
              [2] Martin E et al. <em>Using sound to understand protein sequence data.</em>{' '}
              BMC Bioinformatics 22: 490, 2021.{' '}
              <a className="text-[#5b9bd5] hover:underline" href="https://doi.org/10.1186/s12859-021-04362-7" target="_blank" rel="noopener noreferrer">
                doi:10.1186/s12859-021-04362-7
              </a>
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
