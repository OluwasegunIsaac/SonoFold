"""
Solvent Accessible Surface Area (SASA) extraction.
Uses FreeSASA when available, falls back to a neighbour-count heuristic.
"""

from __future__ import annotations

import os
import tempfile

import numpy as np

from ..mapping.amino_acid_table import MAX_ASA


def _neighbour_count_fallback(sequence: str) -> list[float]:
    """
    Approximate relative SASA using a hydrophobic burial heuristic:
    residues inside hydrophobic windows are treated as buried.
    Returns values in [0.0, 1.0].
    """
    from ..mapping.amino_acid_table import AA_PROPERTIES

    n = len(sequence)
    hydros = np.array([
        AA_PROPERTIES.get(aa.upper(), {}).get("hydrophobicity", 0.0)
        for aa in sequence
    ], dtype=float)

    half = 4
    sasa_approx: list[float] = []
    for i in range(n):
        lo, hi = max(0, i - half), min(n, i + half + 1)
        avg_h = hydros[lo:hi].mean()
        # High hydrophobicity neighbours → buried (low SASA)
        rel = float(np.clip(1.0 - (avg_h + 4.5) / 9.0, 0.0, 1.0))
        sasa_approx.append(round(rel, 4))
    return sasa_approx


def compute_sasa(pdb_string: str, sequence: str) -> list[float]:
    """
    Returns per-residue relative SASA (0.0 = buried, 1.0 = fully exposed).
    """
    try:
        import freesasa  # type: ignore
    except ImportError:
        return _neighbour_count_fallback(sequence)

    tmp = None
    try:
        with tempfile.NamedTemporaryFile(
            suffix=".pdb", delete=False, mode="w"
        ) as f:
            f.write(pdb_string)
            tmp = f.name

        structure = freesasa.Structure(tmp)
        result = freesasa.calc(structure)
        residue_areas = result.residueAreas()

        rel_sasa: list[float] = []
        # FreeSASA returns a dict keyed by chain → {resi: ResidueArea}
        for chain_id in sorted(residue_areas.keys()):
            for resi in sorted(residue_areas[chain_id].keys(), key=int):
                area = residue_areas[chain_id][resi]
                aa = area.residueType.strip()
                max_asa = MAX_ASA.get(aa, 200.0)
                rel = float(np.clip(area.total / max_asa, 0.0, 1.0))
                rel_sasa.append(round(rel, 4))

        return rel_sasa if rel_sasa else _neighbour_count_fallback(sequence)
    except Exception:
        return _neighbour_count_fallback(sequence)
    finally:
        if tmp and os.path.exists(tmp):
            os.unlink(tmp)
