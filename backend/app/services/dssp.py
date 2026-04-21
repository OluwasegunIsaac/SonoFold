"""
Secondary structure extraction via DSSP (BioPython).
Falls back to Chou-Fasman propensity tables when mkdssp is absent.
"""

from __future__ import annotations

import os
import shutil
import tempfile

import numpy as np
from Bio.PDB import DSSP, PDBParser

from ..mapping.amino_acid_table import CHOU_FASMAN

_DSSP_AVAILABLE = shutil.which("mkdssp") is not None or shutil.which("dssp") is not None


def _chou_fasman_fallback(sequence: str) -> list[str]:
    """
    Sliding-window Chou-Fasman prediction.
    Window of 6 residues; assign H/E/C by dominant propensity.
    """
    n = len(sequence)
    pa = np.array([CHOU_FASMAN.get(aa.upper(), {"Pa": 1.0})["Pa"] for aa in sequence])
    pb = np.array([CHOU_FASMAN.get(aa.upper(), {"Pb": 1.0})["Pb"] for aa in sequence])

    half = 3
    result: list[str] = []
    for i in range(n):
        lo, hi = max(0, i - half), min(n, i + half + 1)
        avg_a, avg_b = pa[lo:hi].mean(), pb[lo:hi].mean()
        if avg_a > 1.03 and avg_a >= avg_b:
            result.append("H")
        elif avg_b > 1.05 and avg_b > avg_a:
            result.append("E")
        else:
            result.append("C")
    return result


def extract_secondary_structure(pdb_string: str, sequence: str) -> list[str]:
    """
    Returns per-residue secondary structure codes: H (helix), E (sheet), C (coil).
    Uses DSSP when the binary is available, otherwise Chou-Fasman.
    """
    if not _DSSP_AVAILABLE:
        return _chou_fasman_fallback(sequence)

    tmp = None
    try:
        with tempfile.NamedTemporaryFile(
            suffix=".pdb", delete=False, mode="w"
        ) as f:
            f.write(pdb_string)
            tmp = f.name

        parser = PDBParser(QUIET=True)
        structure = parser.get_structure("prot", tmp)
        model = structure[0]
        dssp_binary = "mkdssp" if shutil.which("mkdssp") else "dssp"
        dssp = DSSP(model, tmp, dssp=dssp_binary)

        ss_codes: list[str] = []
        for key in dssp:
            raw = dssp[key][2]
            if raw in ("H", "G", "I"):
                ss_codes.append("H")
            elif raw in ("E", "B"):
                ss_codes.append("E")
            else:
                ss_codes.append("C")
        return ss_codes if ss_codes else _chou_fasman_fallback(sequence)
    except Exception:
        return _chou_fasman_fallback(sequence)
    finally:
        if tmp and os.path.exists(tmp):
            os.unlink(tmp)
