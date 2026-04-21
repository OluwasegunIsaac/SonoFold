import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { useProteinStore } from '../../store/proteinStore'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $3Dmol: any
  }
}

export interface StructureViewerHandle {
  exportPng: () => void
  exportJpeg: () => void
  exportSvg: () => void
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 400)
}

export const StructureViewer = forwardRef<StructureViewerHandle>(function StructureViewer(_, ref) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null)
  const { pdb, currentResidue } = useProteinStore()

  useImperativeHandle(ref, () => ({
    exportPng() {
      if (!viewerRef.current) return
      const uri: string = viewerRef.current.pngURI()
      const a = document.createElement('a')
      a.href = uri
      a.download = 'structure.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    },
    exportJpeg() {
      if (!viewerRef.current) return
      const uri: string = viewerRef.current.pngURI()
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        canvas.toBlob((blob) => { if (blob) downloadBlob(blob, 'structure.jpg') }, 'image/jpeg', 0.92)
      }
      img.src = uri
    },
    exportSvg() {
      if (!viewerRef.current || !containerRef.current) return
      const uri: string = viewerRef.current.pngURI()
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><image href="${uri}" x="0" y="0" width="${w}" height="${h}"/></svg>`
      downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'structure.svg')
    },
  }))

  // Init viewer + reload model whenever pdb changes
  useEffect(() => {
    if (!containerRef.current || !window.$3Dmol) return

    // Create viewer once
    if (!viewerRef.current) {
      viewerRef.current = window.$3Dmol.createViewer(containerRef.current, {
        backgroundColor: 'white',
      })
    }

    const viewer = viewerRef.current

    if (!pdb) {
      viewer.render()
      return
    }

    viewer.clear()
    viewer.addModel(pdb, 'pdb')
    viewer.setStyle({}, { cartoon: { color: 'spectrum' } })
    viewer.zoomTo()
    viewer.render()
  }, [pdb])

  // Highlight residue during playback
  useEffect(() => {
    if (!viewerRef.current || !pdb || currentResidue < 0) return
    const viewer = viewerRef.current
    const resi = currentResidue + 1
    viewer.setStyle({}, { cartoon: { color: 'spectrum', opacity: 0.5 } })
    viewer.setStyle(
      { resi },
      { cartoon: { color: 'spectrum' }, sphere: { radius: 0.5, color: '#ffffff' } },
    )
    viewer.render()
  }, [currentResidue, pdb])

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-[#e0e0e0]"
         style={{ height: '460px' }}>
      {!pdb && (
        <div className="absolute inset-0 flex items-center justify-center text-[#bbb] text-sm z-10 pointer-events-none">
          3D structure will appear here after prediction
        </div>
      )}
      {/* absolute inset-0 ensures 3Dmol canvas receives explicit pixel dimensions */}
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  )
})
