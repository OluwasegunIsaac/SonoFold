import { useProteinStore } from '../../store/proteinStore'

// Color-coded heatmap rows
const SS_ROWS: { key: string; label: string; color: string; bg: string }[] = [
  { key: 'H', label: 'Helix', color: '#e05c5c', bg: '#f5d8d8' },
  { key: 'E', label: 'Sheet', color: '#4a90d9', bg: '#d8eaf8' },
  { key: 'C', label: 'Coil',  color: '#6abf7a', bg: '#d8f0dd' },
]

function SegmentBar({
  ssArray,
  typeKey,
  color,
  bg,
  activeIdx,
}: {
  ssArray: string[]
  typeKey: string
  color: string
  bg: string
  activeIdx: number
}) {
  return (
    <div className="flex flex-1 h-5 rounded overflow-hidden">
      {ssArray.map((v, i) => (
        <div
          key={i}
          title={`${i + 1}: ${v}`}
          className="flex-1 transition-opacity"
          style={{
            backgroundColor: v === typeKey ? color : bg,
            minWidth: 2,
            opacity: i === activeIdx ? 1 : 0.85,
            outline: i === activeIdx ? `1px solid ${color}` : 'none',
          }}
        />
      ))}
    </div>
  )
}

export function FeatureHeatmap() {
  const { featureVectors, sequence, currentResidue } = useProteinStore()

  if (!featureVectors || !sequence) {
    return (
      <p className="text-sm text-[#999] py-2">
        Feature heatmap will appear after prediction
      </p>
    )
  }

  const { secondary_structure: ss } = featureVectors

  return (
    <div className="flex flex-col gap-3">
      {SS_ROWS.map(({ key, label, color, bg }) => (
        <div key={key} className="flex items-center gap-3">
          {/* Color swatch */}
          <div
            className="w-4 h-4 rounded-sm shrink-0"
            style={{ backgroundColor: color }}
          />
          {/* Label */}
          <span className="w-10 text-sm text-[#555] shrink-0">{label}</span>
          {/* Segmented bar */}
          <SegmentBar
            ssArray={ss}
            typeKey={key}
            color={color}
            bg={bg}
            activeIdx={currentResidue}
          />
          {/* Residue count */}
          <span className="text-xs text-[#999] shrink-0 w-24 text-right">
            {ss.filter((v) => v === key).length} residues
          </span>
        </div>
      ))}
    </div>
  )
}
