"""Pydantic request / response models."""

from __future__ import annotations

import re
from typing import Optional

from pydantic import BaseModel, field_validator

_UNIPROT_RE = re.compile(
    r"^([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2})$",
    re.IGNORECASE,
)


class SonifyRequest(BaseModel):
    fasta: str
    uniprot_id: Optional[str] = None

    @field_validator("fasta")
    @classmethod
    def validate_fasta(cls, v: str) -> str:
        trimmed = v.strip()
        # Allow bare UniProt accession IDs — they bypass sequence validation
        if _UNIPROT_RE.match(trimmed):
            return v
        lines = trimmed.splitlines()
        seq_lines = [l for l in lines if not l.startswith(">")]
        sequence = "".join(seq_lines).upper().replace(" ", "").replace("\t", "")
        valid_aa = set("ACDEFGHIKLMNPQRSTVWY")
        invalid = set(sequence) - valid_aa
        if invalid:
            raise ValueError(f"FASTA contains invalid characters: {invalid}")
        if len(sequence) < 10:
            raise ValueError("Sequence must be at least 10 residues long.")
        if len(sequence) > 2500:
            raise ValueError("Sequence exceeds 2 500 residue limit for ESMFold.")
        return v


class NoteEvent(BaseModel):
    time: float
    pitch: int
    duration: float
    velocity: int
    instrument: str
    residue_index: int
    amino_acid: str
    secondary_structure: str
    hand: str = "right"
    chord_pitches: list[int] = []


class FeatureVectors(BaseModel):
    secondary_structure: list[str]
    sasa: list[float]
    flexibility: list[float]


class SonifyResponse(BaseModel):
    pdb: str
    events: list[NoteEvent]
    tempo_curve: list[float]
    feature_vectors: FeatureVectors
    sequence: str
