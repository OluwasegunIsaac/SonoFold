"""ESMFold REST API client — predicts 3D structure from raw sequence."""

from __future__ import annotations

import asyncio
import httpx

ESMFOLD_URL = "https://api.esmatlas.com/foldSequence/v1/pdb/"
_TIMEOUT = httpx.Timeout(120.0, connect=15.0)
_MAX_RETRIES = 3


async def predict_structure(sequence: str) -> str:
    """
    Submit a sequence to ESMFold and return PDB-format string.
    Retries up to 3 times with exponential backoff on 5xx / timeout errors.
    """
    last_exc: Exception | None = None
    for attempt in range(_MAX_RETRIES):
        try:
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
        except (httpx.TimeoutException, httpx.HTTPStatusError) as exc:
            last_exc = exc
            if attempt < _MAX_RETRIES - 1:
                await asyncio.sleep(2 ** attempt)  # 1s, 2s backoff
            continue

    raise RuntimeError(
        f"ESMFold unavailable after {_MAX_RETRIES} attempts "
        f"(the public API is often overloaded — try a UniProt ID instead): {last_exc}"
    )
