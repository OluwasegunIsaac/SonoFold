"""Main sonification router — orchestrates prediction + feature extraction + mapping."""

from __future__ import annotations

import asyncio
import re
from functools import partial
from typing import Optional

from fastapi import APIRouter, HTTPException

from ..mapping.sonification import compute_musical_sequence, compute_tempo_curve
from ..models.protein import (
    FeatureVectors,
    NoteEvent,
    SonifyRequest,
    SonifyResponse,
)
from ..services import alphafold, dssp, esmfold, flexibility, sasa

router = APIRouter(prefix="/api", tags=["sonification"])

_UNIPROT_RE = re.compile(
    r"^([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2})$",
    re.IGNORECASE,
)


def _parse_sequence(fasta: str) -> str:
    lines = fasta.strip().splitlines()
    seq_lines = [l for l in lines if not l.startswith(">")]
    return "".join(seq_lines).upper().replace(" ", "").replace("\t", "")


_THREE_TO_ONE = {
    "ALA": "A", "ARG": "R", "ASN": "N", "ASP": "D", "CYS": "C",
    "GLN": "Q", "GLU": "E", "GLY": "G", "HIS": "H", "ILE": "I",
    "LEU": "L", "LYS": "K", "MET": "M", "PHE": "F", "PRO": "P",
    "SER": "S", "THR": "T", "TRP": "W", "TYR": "Y", "VAL": "V",
}


def _sequence_from_pdb(pdb_string: str) -> str:
    """Extract one-letter amino acid sequence from PDB ATOM records."""
    seen: set[tuple[str, str]] = set()
    seq: list[str] = []
    for line in pdb_string.splitlines():
        if line.startswith("ATOM"):
            resname = line[17:20].strip()
            chain   = line[21]
            resnum  = line[22:26].strip()
            key = (chain, resnum)
            if key not in seen and resname in _THREE_TO_ONE:
                seen.add(key)
                seq.append(_THREE_TO_ONE[resname])
    return "".join(seq)


@router.post("/sonify", response_model=SonifyResponse)
async def sonify_protein(req: SonifyRequest) -> SonifyResponse:
    # ── 1. Structure prediction ────────────────────────────────────────────
    # Detect bare UniProt ID in fasta field if uniprot_id not explicitly set
    trimmed_fasta = req.fasta.strip()
    resolved_uniprot = req.uniprot_id or (trimmed_fasta if _UNIPROT_RE.match(trimmed_fasta) else None)

    try:
        if resolved_uniprot and _UNIPROT_RE.match(resolved_uniprot):
            result = await alphafold.fetch_known_structure(resolved_uniprot)
            pdb_string = result["pdb"]
            # Extract the real sequence from the returned PDB
            sequence = _sequence_from_pdb(pdb_string)
        else:
            sequence = _parse_sequence(req.fasta)
            pdb_string = await esmfold.predict_structure(sequence)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Structure prediction failed: {exc}",
        )

    # ── 2. Feature extraction (CPU-bound → thread pool) ────────────────────
    loop = asyncio.get_event_loop()
    try:
        ss_task = loop.run_in_executor(
            None,
            partial(dssp.extract_secondary_structure, pdb_string, sequence),
        )
        sasa_task = loop.run_in_executor(
            None,
            partial(sasa.compute_sasa, pdb_string, sequence),
        )
        flex_task = loop.run_in_executor(
            None,
            partial(flexibility.extract_flexibility, pdb_string),
        )
        ss, sa, flex = await asyncio.gather(ss_task, sasa_task, flex_task)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Feature extraction failed: {exc}",
        )

    # Pad or trim feature vectors to sequence length
    n = len(sequence)
    ss   = (ss   + ["C"] * n)[:n]
    sa   = (sa   + [0.5] * n)[:n]
    flex = (flex + [0.5] * n)[:n]

    # ── 3. Sonification mapping ────────────────────────────────────────────
    raw_events = compute_musical_sequence(sequence, ss, sa, flex)
    tempo_curve = compute_tempo_curve(sequence)

    events = [NoteEvent(**e) for e in raw_events]

    return SonifyResponse(
        pdb=pdb_string,
        events=events,
        tempo_curve=tempo_curve,
        feature_vectors=FeatureVectors(
            secondary_structure=ss,
            sasa=sa,
            flexibility=flex,
        ),
        sequence=sequence,
    )
