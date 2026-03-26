import re
import sys
import argparse
from pathlib import Path

# -----------------------------
# SOL-FA → ABC MAPPING
# -----------------------------
SOLFA_TO_ABC = {
    "fe": "^F",  # altered notes FIRST
    "d": "C",
    "r": "D",
    "m": "E",
    "f": "F",
    "s": "G",
    "l": "A",
    "t": "B",
}

# -----------------------------
# APPLY OCTAVE
# -----------------------------
def apply_octave(note, octave):
    if note.startswith("^"):  # sharp note
        base = note[1]
        if "'" in octave:
            return "^" + base.lower()
        elif "," in octave:
            return "^" + base + ","
        return note

    if "'" in octave:
        return note.lower()
    if "," in octave:
        return note + ","

    return note

# -----------------------------
# PARSE ONE TOKEN (notes)
# -----------------------------
def convert_token(token):
    notes = []
    i = 0

    while i < len(token):
        # try 2-letter match first
        if i + 1 < len(token) and token[i:i+2] in SOLFA_TO_ABC:
            solfa = token[i:i+2]
            note = SOLFA_TO_ABC[solfa]
            i += 2
        elif token[i] in SOLFA_TO_ABC:
            solfa = token[i]
            note = SOLFA_TO_ABC[solfa]
            i += 1
        else:
            i += 1
            continue

        # collect octave markers
        octave = ""
        while i < len(token) and token[i] in ["'", ","]:
            octave += token[i]
            i += 1

        note = apply_octave(note, octave)
        notes.append(note)

    return notes

# -----------------------------
# APPLY DURATION
# -----------------------------
def apply_duration(notes, raw_token):
    if not notes:
        return notes

    # extend note if "-" exists
    if "-" in raw_token:
        notes[-1] += "3"

    return notes

# -----------------------------
# CONVERT ONE LINE
# -----------------------------
def convert_line(line):
    tokens = re.split(r"(\|)", line)  # keep bars
    result = []

    for token in tokens:
        token = token.strip()

        if token == "|":
            result.append("|")
            continue

        if not token:
            continue

        # remove rhythm symbols for parsing
        clean = token.replace(":", "").replace("!", "")

        notes = convert_token(clean)
        notes = apply_duration(notes, token)

        result.extend(notes)

    return " ".join(result)

# -----------------------------
# CONVERT FULL TEXT
# -----------------------------
def convert_song(text):
    lines = text.split("\n")
    voices = {"S": [], "A": [], "T": [], "B": []}
    VOICE_IDS = ["S", "A", "T", "B"]
    
    voice_counter = 0
    for line in lines:
        stripped = line.strip()
        if not stripped:
            voice_counter = 0  # Reset for the next block
            continue

        if voice_counter < len(VOICE_IDS):
            converted = convert_line(stripped)
            voices[VOICE_IDS[voice_counter]].append(converted)
            voice_counter += 1

    return voices

# -----------------------------
# OPTIONAL: WRAP INTO ABC FORMAT
# -----------------------------
def wrap_abc(voices):
    header = "X:1\nT:Converted Hymn\nM:4/4\nL:1/4\nK:C"
    body_sections = []
    
    for v_id in ["S", "A", "T", "B"]:
        if voices[v_id]:
            body_sections.append(f"V:{v_id}")
            body_sections.append("\n".join(voices[v_id]))
            
    return header + "\n" + "\n".join(body_sections)

# -----------------------------
# RUN EXAMPLE
# -----------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert Tonic Sol-Fa to ABC notation.")
    parser.add_argument("input", help="Input file path (e.g., sample1.tsf)")
    parser.add_argument("-o", "--output", help="Output file path (optional)")

    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: File {input_path} not found.")
        sys.exit(1)

    # If no output path is provided, use the input filename with .abc extension
    output_path = Path(args.output) if args.output else input_path.with_suffix(".abc")

    try:
        with open(input_path, "r", encoding="utf-8") as f:
            input_data = f.read()

        voices = convert_song(input_data)
        full_abc = wrap_abc(voices)

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(full_abc)

        print(f"Successfully converted '{input_path}' to '{output_path}'")
    except Exception as e:
        print(f"An error occurred during conversion: {e}")
        sys.exit(1)