"""ESMFold REST API client — predicts 3D structure from raw sequence."""

from __future__ import annotations

import httpx

ESMFOLD_URL = "https://api.esmatlas.com/foldSequence/v1/pdb/"
_TIMEOUT = httpx.Timeout(180.0, connect=10.0)


async def predict_structure(sequence: str) -> str:
    """
    Submit a sequence to ESMFold and return PDB-format string.
    Supports sequences up to ~400 residues via the public API.
    """
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        response = await client.post(
            ESMFOLD_URL,
            content=sequence,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        response.raise_for_status()
        pdb = response.text
        if "ATOM" not in pdb:
            raise ValueError(f"Unexpected ESMFold response (not PDB): {pdb[:120]}")
        return pdb
