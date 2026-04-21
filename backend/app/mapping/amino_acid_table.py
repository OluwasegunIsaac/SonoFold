"""
Amino acid property tables for protein sonification.

Implements Tay et al., 2021, Heliyon 7: e07933.
Table 2  — pitch and note-length mappings.
Table 3  — chord mappings.
Sec 3.5  — octave groupings and trigger rules.
Sec 3.6  — accidental triggers.
Sec 3.7  — dynamics trigger.
"""

# ── Standard physicochemical properties (kept for feature heatmap) ───────

AA_PROPERTIES: dict[str, dict[str, float]] = {
    "A": {"hydrophobicity": 1.8,  "charge":  0.0, "mw": 89.1},
    "R": {"hydrophobicity": -4.5, "charge":  1.0, "mw": 174.2},
    "N": {"hydrophobicity": -3.5, "charge":  0.0, "mw": 132.1},
    "D": {"hydrophobicity": -3.5, "charge": -1.0, "mw": 133.1},
    "C": {"hydrophobicity": 2.5,  "charge":  0.0, "mw": 121.2},
    "Q": {"hydrophobicity": -3.5, "charge":  0.0, "mw": 146.2},
    "E": {"hydrophobicity": -3.5, "charge": -1.0, "mw": 147.1},
    "G": {"hydrophobicity": -0.4, "charge":  0.0, "mw": 75.1},
    "H": {"hydrophobicity": -3.2, "charge":  0.5, "mw": 155.2},
    "I": {"hydrophobicity": 4.5,  "charge":  0.0, "mw": 131.2},
    "L": {"hydrophobicity": 3.8,  "charge":  0.0, "mw": 131.2},
    "K": {"hydrophobicity": -3.9, "charge":  1.0, "mw": 146.2},
    "M": {"hydrophobicity": 1.9,  "charge":  0.0, "mw": 149.2},
    "F": {"hydrophobicity": 2.8,  "charge":  0.0, "mw": 165.2},
    "P": {"hydrophobicity": -1.6, "charge":  0.0, "mw": 115.1},
    "S": {"hydrophobicity": -0.8, "charge":  0.0, "mw": 105.1},
    "T": {"hydrophobicity": -0.7, "charge":  0.0, "mw": 119.1},
    "W": {"hydrophobicity": -0.9, "charge":  0.0, "mw": 204.2},
    "Y": {"hydrophobicity": -1.3, "charge":  0.0, "mw": 181.2},
    "V": {"hydrophobicity": 4.2,  "charge":  0.0, "mw": 117.1},
}

# Chou-Fasman propensities for secondary structure fallback
CHOU_FASMAN: dict[str, dict[str, float]] = {
    "A": {"Pa": 1.42, "Pb": 0.83}, "R": {"Pa": 0.98, "Pb": 0.93},
    "N": {"Pa": 0.67, "Pb": 0.89}, "D": {"Pa": 1.01, "Pb": 0.54},
    "C": {"Pa": 0.70, "Pb": 1.19}, "Q": {"Pa": 1.11, "Pb": 1.10},
    "E": {"Pa": 1.51, "Pb": 0.37}, "G": {"Pa": 0.57, "Pb": 0.75},
    "H": {"Pa": 1.00, "Pb": 0.87}, "I": {"Pa": 1.08, "Pb": 1.60},
    "L": {"Pa": 1.21, "Pb": 1.30}, "K": {"Pa": 1.16, "Pb": 0.74},
    "M": {"Pa": 1.45, "Pb": 1.05}, "F": {"Pa": 1.13, "Pb": 1.38},
    "P": {"Pa": 0.57, "Pb": 0.55}, "S": {"Pa": 0.77, "Pb": 0.75},
    "T": {"Pa": 0.83, "Pb": 1.19}, "W": {"Pa": 1.08, "Pb": 1.37},
    "Y": {"Pa": 0.69, "Pb": 1.47}, "V": {"Pa": 1.06, "Pb": 1.70},
}

MAX_ASA: dict[str, float] = {
    "A": 121.0, "R": 265.0, "N": 187.0, "D": 187.0, "C": 148.0,
    "Q": 214.0, "E": 214.0, "G": 97.0,  "H": 216.0, "I": 195.0,
    "L": 191.0, "K": 230.0, "M": 203.0, "F": 228.0, "P": 154.0,
    "S": 143.0, "T": 163.0, "W": 264.0, "Y": 255.0, "V": 165.0,
}

# ── Tay et al. 2021 — Table 2: Pitch mappings ────────────────────────────
# Right-hand pitch ← relative frequency of occurrence in proteins (JOND920101)
RH_PITCH_MAP: dict[str, str] = {
    "T": "C", "G": "C", "D": "C", "Y": "C",
    "L": "D", "N": "D",
    "K": "E", "Q": "E",
    "P": "F", "R": "F", "C": "F",
    "A": "G", "I": "G", "M": "G", "E": "G",
    "V": "A", "F": "A", "H": "A",
    "S": "B", "W": "B",
}

# Left-hand pitch ← amino acid composition in proteins (DAYM780201)
LH_PITCH_MAP: dict[str, str] = {
    "I": "C", "F": "C", "G": "C", "P": "C",
    "A": "D", "C": "D", "H": "D",
    "Y": "E", "K": "E",
    "V": "F", "D": "F",
    "E": "G", "Q": "G", "N": "G", "L": "G",
    "R": "A", "M": "A", "T": "A",
    "S": "B", "W": "B",
}

# ── Tay et al. 2021 — Table 2: Note-length mappings ──────────────────────
# Note length of the CURRENT amino acid is determined by the PREVIOUS amino acid.
# Values in beats (1 beat = crotchet). At 120 BPM: 1 beat = 0.5 s.

# Right-hand note length ← size of previous amino acid (DAWD720101)
RH_LENGTH_MAP: dict[str, float] = {
    "G": 2.0,
    "D": 1.5, "A": 1.5,
    "S": 1.0, "C": 1.0,
    "N": 0.5, "E": 0.5, "T": 0.5, "V": 0.5,
    "R": 0.25, "K": 0.25, "W": 0.25, "Y": 0.25, "F": 0.25,
    "Q": 0.25, "H": 0.25, "M": 0.25, "I": 0.25, "L": 0.25, "P": 0.25,
}

# Left-hand note length ← residue volume of previous amino acid (BIGC670101)
LH_LENGTH_MAP: dict[str, float] = {
    "G": 2.0,
    "A": 1.5, "S": 1.5,
    "C": 1.0, "T": 1.0,
    "N": 0.5, "D": 0.5, "P": 0.5, "V": 0.5,
    "Q": 0.25, "E": 0.25, "H": 0.25, "I": 0.25, "L": 0.25,
    "K": 0.25, "M": 0.25, "F": 0.25, "W": 0.25, "Y": 0.25,
}

# ── Tay et al. 2021 — Sec 3.5: Octave groupings ──────────────────────────
# Right hand: electron-ion interaction potential (VELV850101)
# Group 1 → higher EIIP values. Triggers: R/K (+1 charge) raise, D/E (-1 charge) lower.
RH_EIIP_GROUP1 = frozenset(
    {"P", "H", "K", "A", "Y", "W", "Q", "M", "S", "C", "T", "F", "R", "D"}
)
RH_EIIP_GROUP2 = frozenset({"L", "I", "N", "G", "V", "E"})

# Left hand: bitterness (VENT840101)
# Triggers: R/K (most negative hydropathy) lower, I/V (most positive) raise.
LH_BITTER_GROUP1 = frozenset(
    {"A", "R", "N", "D", "C", "Q", "E", "G", "H", "K", "M", "P", "S", "T"}
)
LH_BITTER_GROUP2 = frozenset({"I", "L", "F", "W", "Y", "V"})

# ── Tay et al. 2021 — Table 3: Chord mappings ────────────────────────────
# Key insight from paper: chord root == pitch note for the same amino acid.
# So we store only the ADDITIONAL semitone offsets above the main pitch.
# Choices: list of possible interval sets (selected probabilistically).
# Probability: 70% 2-note, 20-30% 3-note, 8-10% 4-note.

# Right-hand chords ← rRNA binding propensity (Ellis et al. 2007)
# Amino acids not listed produce single notes only.
RH_CHORD_INTERVALS: dict[str, list[list[int]]] = {
    # D,Y → C note chord: C-E (major 3rd=4) or C-E-G (+7)
    "D": [[4], [4, 7]],
    "Y": [[4], [4, 7]],
    # P,R,C → F note chord: F-A (4) or F-A-C (4,7)
    "P": [[4], [4, 7]],
    "R": [[4], [4, 7]],
    "C": [[4], [4, 7]],
    # M → G note chord: G-C (5) or G-C-E (5,9)
    "M": [[5], [5, 9]],
    # F,H → A note chord: A-C (minor 3rd=3) or A-C-F (3,8)
    "F": [[3], [3, 8]],
    "H": [[3], [3, 8]],
    # L → D note chord: D-F (3) or D-F-A (3,7)
    "L": [[3], [3, 7]],
    # W → B note chord: B-D (3), B-D-G (3,8), B-D-G-F (3,8,17)
    "W": [[3], [3, 8], [3, 8, 17]],
}

# Left-hand chords ← mRNA binding propensity (Ellis et al. 2007)
LH_CHORD_INTERVALS: dict[str, list[list[int]]] = {
    # P,F → C note chord: C-E or C-E-G
    "P": [[4], [4, 7]],
    "F": [[4], [4, 7]],
    # C,H → D note chord: D-F or D-F-A
    "C": [[3], [3, 7]],
    "H": [[3], [3, 7]],
    # D → F note chord: F-A or F-A-C
    "D": [[4], [4, 7]],
    # L → G note chord: G-B (4), G-B-D (4,7), G-B-D-F dominant 7th (4,7,10)
    "L": [[4], [4, 7], [4, 7, 10]],
    # R,M → A note chord: A-C or A-C-F
    "R": [[3], [3, 8]],
    "M": [[3], [3, 8]],
    # W → B note chord: B-D or B-D-G
    "W": [[3], [3, 8]],
}

# ── Tay et al. 2021 — Sec 3.7: Dynamics data ─────────────────────────────
# Number of hydrogen bond donors per amino acid sidechain (FAUJ880109)
H_BOND_DONORS: dict[str, int] = {
    "A": 0, "R": 5, "N": 2, "D": 0, "C": 1, "Q": 2, "E": 0, "G": 0,
    "H": 2, "I": 0, "L": 0, "K": 1, "M": 0, "F": 0, "P": 0, "S": 1,
    "T": 1, "W": 2, "Y": 1, "V": 0,
}

# Partition coefficient (GARJ730101) — minor increase/decrease in dynamics
PARTITION_COEFF: dict[str, float] = {
    "A": 0.31, "R": -1.01, "N": -0.60, "D": -0.77, "C": 1.54, "Q": -0.22,
    "E": -0.64, "G": 0.00, "H": 0.13, "I": 1.80, "L": 1.70, "K": -0.99,
    "M": 1.23, "F": 1.79, "P": 0.72, "S": -0.04, "T": 0.26, "W": 2.25,
    "Y": 0.96, "V": 1.22,
}

# Semitone offsets for note names (C major scale)
NOTE_SEMITONE: dict[str, int] = {
    "C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11
}
