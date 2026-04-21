"""
Per-residue flexibility from B-factor / pLDDT column of the PDB.

For AlphaFold: B-factor = pLDDT (0–100); high confidence = low flexibility.
For ESMFold:  B-factor is a standard crystallographic B-factor; high = flexible.
"""

from __future__ import annotations

import os
import tempfile

import numpy as np
from Bio.PDB import PDBParser


def extract_flexibility(pdb_string: str) -> list[float]:
    """
    Returns per-residue flexibility in [0.0, 1.0].
    1.0 = most flexible / least confident.
    """
    tmp = None
    try:
        with tempfile.NamedTemporaryFile(
            suffix=".pdb", delete=False, mode="w"
        ) as f:
            f.write(pdb_string)
            tmp = f.name

        parser = PDBParser(QUIET=True)
        structure = parser.get_structure("prot", tmp)
        bfactors: list[float] = []
        for model in structure:
            for chain in model:
                for residue in chain:
                    if residue.id[0] != " ":   # skip HETATMs
                        continue
                    ca = residue.get("CA")
                    if ca:
                        bfactors.append(ca.get_bfactor())

        if not bfactors:
            return []

        arr = np.array(bfactors, dtype=float)
        span = arr.max() - arr.min()
        if span < 1e-8:
            return [0.5] * len(bfactors)

        # Detect AlphaFold/ESMFold: pLDDT values cluster in 0–100
        # For pLDDT, invert so that HIGH confidence = LOW flexibility
        if arr.max() <= 100.0 and arr.min() >= 0.0:
            normalized = 1.0 - (arr - arr.min()) / span
        else:
            normalized = (arr - arr.min()) / span

        return [round(float(v), 4) for v in normalized]
    except Exception:
        return []
    finally:
        if tmp and os.path.exists(tmp):
            os.unlink(tmp)
