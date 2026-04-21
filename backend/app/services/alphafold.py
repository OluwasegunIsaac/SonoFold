"""AlphaFold EBI database client — retrieves pre-computed structures."""

from __future__ import annotations

import httpx

_BASE = "https://alphafold.ebi.ac.uk/api/prediction/{accession}"
_TIMEOUT = httpx.Timeout(30.0, connect=10.0)


async def fetch_known_structure(uniprot_accession: str) -> dict:
    """
    Fetch AlphaFold predicted structure for a UniProt accession.
    Returns {"pdb": str, "plddt": list[float]}.
    pLDDT values are stored in the B-factor column of the PDB file.
    """
    url = _BASE.format(accession=uniprot_accession.strip().upper())
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        meta_r = await client.get(url)
        meta_r.raise_for_status()
        metadata = meta_r.json()
        if not metadata:
            raise ValueError(f"No AlphaFold entry for accession: {uniprot_accession}")
        entry = metadata[0]
        pdb_r = await client.get(entry["pdbUrl"])
        pdb_r.raise_for_status()
        return {"pdb": pdb_r.text}
