"""
Core sonification engine — Tay et al., 2021, Heliyon 7: e07933.

Musical parameter assignments (from paper Sections 3.4–3.8):
  Right-hand pitch      ← relative frequency of occurrence (Table 2)
  Left-hand  pitch      ← amino acid composition (Table 2)
  Right note length     ← size of PREVIOUS amino acid (Table 2)
  Left  note length     ← residue volume of PREVIOUS amino acid (Table 2)
  Right octave          ← EIIP groups + R/K raise, D/E lower triggers (Sec 3.5)
  Left  octave          ← bitterness groups + R/K lower, I/V raise triggers (Sec 3.5)
  Accidentals           ← Proline → right hand; Arginine → left hand (Sec 3.6)
  Dynamics              ← Arginine triggers H-bond donor tallying (Sec 3.7)
  Right chords          ← rRNA binding propensity (Table 3)
  Left  chords          ← mRNA binding propensity (Table 3)
"""

from __future__ import annotations

import random
from typing import Any

from .amino_acid_table import (
    H_BOND_DONORS,
    LH_BITTER_GROUP1,
    LH_BITTER_GROUP2,
    LH_CHORD_INTERVALS,
    LH_LENGTH_MAP,
    LH_PITCH_MAP,
    NOTE_SEMITONE,
    PARTITION_COEFF,
    RH_CHORD_INTERVALS,
    RH_EIIP_GROUP1,
    RH_EIIP_GROUP2,
    RH_LENGTH_MAP,
    RH_PITCH_MAP,
)

# Base tempo: 120 BPM → 0.5 s per crotchet beat (matches paper)
BASE_BPM: int = 120
_BEAT_SEC: float = 60.0 / BASE_BPM

# Octave ranges — right hand C3–C5, left hand C1–C3 (Sec 3.5)
RH_OCT_MIN, RH_OCT_MAX = 3, 5
LH_OCT_MIN, LH_OCT_MAX = 1, 3

# MIDI velocity levels (ppp–fff, 8 markings)
_VEL_PPP: int = 16
_VEL_MF:  int = 64
_VEL_FFF: int = 112


def _choose_chord(choices: list[list[int]]) -> list[int]:
    """
    Select chord interval set using paper probability rules (Sec 3.8):
      2 choices  → 0.70 / 0.30
      3 choices  → 0.70 / 0.20 / 0.10
      other      → uniform
    """
    if not choices:
        return []
    n = len(choices)
    if n == 1:
        return choices[0]
    weights = {2: [0.70, 0.30], 3: [0.70, 0.20, 0.10]}.get(n, [1 / n] * n)
    return random.choices(choices, weights=weights, k=1)[0]


def _update_rh_octave(octave: int, aa: str, prev_aa: str) -> int:
    """Right-hand octave trigger logic (Sec 3.5)."""
    if aa in ("R", "K"):
        if octave >= RH_OCT_MAX:                 # At cap → bounce
            return RH_OCT_MAX - 1
        if prev_aa in RH_EIIP_GROUP1:
            return min(octave + 1, RH_OCT_MAX)
    elif aa in ("D", "E"):
        if octave <= RH_OCT_MIN:                 # At cap → bounce
            return RH_OCT_MIN + 1
        if prev_aa in RH_EIIP_GROUP2:
            return max(octave - 1, RH_OCT_MIN)
    return octave


def _update_lh_octave(octave: int, aa: str, prev_aa: str) -> int:
    """Left-hand octave trigger logic (Sec 3.5)."""
    if aa in ("R", "K"):
        if octave <= LH_OCT_MIN:                 # At cap → bounce
            return LH_OCT_MIN + 1
        if prev_aa in LH_BITTER_GROUP2:
            return max(octave - 1, LH_OCT_MIN)
    elif aa in ("I", "V"):
        if octave >= LH_OCT_MAX:                 # At cap → bounce
            return LH_OCT_MAX - 1
        if prev_aa in LH_BITTER_GROUP1:
            return min(octave + 1, LH_OCT_MAX)
    return octave


def _apply_dynamics(velocity: int, prev_aa: str) -> int:
    """
    Arginine-triggered dynamics update (Sec 3.7).
    H-bond donors of frontward AA → louder; partition coefficient → minor ±.
    """
    donors = H_BOND_DONORS.get(prev_aa, 0)
    if donors > 0:
        velocity += donors * 8
    part = PARTITION_COEFF.get(prev_aa, 0.0)
    velocity += 4 if part > 0 else -4
    return int(max(_VEL_PPP, min(_VEL_FFF, velocity)))


def compute_musical_sequence(
    sequence: str,
    secondary_structure: list[str],
    sasa: list[float],       # Kept for API compatibility; used for heatmap only
    flexibility: list[float],  # Kept for API compatibility; used for heatmap only
) -> list[dict[str, Any]]:
    """
    Generate right-hand and left-hand note events implementing Tay et al. 2021.

    Each event dict contains: time, pitch, duration, velocity, instrument,
    residue_index, amino_acid, secondary_structure, hand, chord_pitches.
    """
    rh_events: list[dict] = []
    lh_events: list[dict] = []

    rh_octave:     int   = 4        # Right hand starts at octave 4
    lh_octave:     int   = 2        # Left hand starts at octave 2
    rh_velocity:   int   = _VEL_MF
    lh_velocity:   int   = _VEL_MF
    rh_accidental: bool  = False    # Raise NEXT right-hand note +1 semitone
    lh_accidental: bool  = False    # Raise NEXT left-hand note +1 semitone
    rh_time:       float = 0.0
    lh_time:       float = 0.0

    for i, raw_aa in enumerate(sequence):
        aa = raw_aa.upper()
        if aa not in RH_PITCH_MAP:
            continue

        prev_aa = sequence[i - 1].upper() if i > 0 else "G"
        ss = secondary_structure[i] if i < len(secondary_structure) else "C"

        # Update octaves (trigger checks CURRENT aa vs PREVIOUS aa's group)
        rh_octave = _update_rh_octave(rh_octave, aa, prev_aa)
        lh_octave = _update_lh_octave(lh_octave, aa, prev_aa)

        # ── RIGHT HAND ────────────────────────────────────────────────────
        rh_note     = RH_PITCH_MAP[aa]
        rh_semitone = NOTE_SEMITONE[rh_note]
        if rh_accidental:
            rh_semitone += 1    # Accidental: +1 semitone for this note only
            rh_accidental = False
        rh_pitch   = 12 * (rh_octave + 1) + rh_semitone
        rh_beats   = RH_LENGTH_MAP.get(prev_aa, 1.0)
        rh_dur     = rh_beats * _BEAT_SEC
        rh_intervals = _choose_chord(RH_CHORD_INTERVALS.get(aa, []))
        rh_chord   = [rh_pitch + iv for iv in rh_intervals]

        if aa == "P":           # Proline → raise next right-hand note (Sec 3.6)
            rh_accidental = True

        rh_events.append({
            "time":                round(rh_time, 4),
            "pitch":               rh_pitch,
            "duration":            round(rh_dur, 4),
            "velocity":            rh_velocity,
            "instrument":          "piano_rh",
            "residue_index":       i,
            "amino_acid":          aa,
            "secondary_structure": ss,
            "hand":                "right",
            "chord_pitches":       rh_chord,
        })
        rh_time += rh_dur

        # ── LEFT HAND ─────────────────────────────────────────────────────
        lh_note     = LH_PITCH_MAP[aa]
        lh_semitone = NOTE_SEMITONE[lh_note]
        if lh_accidental:
            lh_semitone += 1
            lh_accidental = False
        lh_pitch   = 12 * (lh_octave + 1) + lh_semitone
        lh_beats   = LH_LENGTH_MAP.get(prev_aa, 1.0)
        lh_dur     = lh_beats * _BEAT_SEC
        lh_intervals = _choose_chord(LH_CHORD_INTERVALS.get(aa, []))
        lh_chord   = [lh_pitch + iv for iv in lh_intervals]

        if aa == "R":           # Arginine → update dynamics + accidental (Sec 3.6/3.7)
            lh_velocity   = _apply_dynamics(lh_velocity, prev_aa)
            lh_accidental = True

        lh_events.append({
            "time":                round(lh_time, 4),
            "pitch":               lh_pitch,
            "duration":            round(lh_dur, 4),
            "velocity":            lh_velocity,
            "instrument":          "piano_lh",
            "residue_index":       i,
            "amino_acid":          aa,
            "secondary_structure": ss,
            "hand":                "left",
            "chord_pitches":       lh_chord,
        })
        lh_time += lh_dur

    # Merge hands and sort by absolute time
    all_events = rh_events + lh_events
    all_events.sort(key=lambda e: (e["time"], 0 if e["hand"] == "right" else 1))
    return all_events


def compute_tempo_curve(sequence: str, window: int = 7) -> list[float]:
    """
    Tay et al. 2021 uses fixed BPM; rhythmic variation comes from note lengths.
    Returns flat 1.0 multipliers (no tempo modulation applied).
    """
    return [1.0] * len(sequence)
