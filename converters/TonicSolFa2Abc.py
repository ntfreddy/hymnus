import re

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
    lines = text.strip().split("\n")
    output_lines = []

    for line in lines:
        line = line.strip()
        if not line:
            output_lines.append("")  # keep spacing
            continue

        converted = convert_line(line)
        output_lines.append(converted)

    return "\n".join(output_lines)

# -----------------------------
# OPTIONAL: WRAP INTO ABC FORMAT
# -----------------------------
def wrap_abc(body):
    return f"""X:1
T:Converted Hymn
M:4/4
L:1/4
K:C
{body}
"""

# -----------------------------
# RUN EXAMPLE
# -----------------------------
if __name__ == "__main__":
    input_data = """|m  :m  !m  :f  |s  :d' !-  :   |s  :s  !f  :m  |r  :-  !-  :   |"""

    converted = convert_song(input_data)

    print("=== ABC Notes ===")
    print(converted)

    print("\n=== FULL ABC ===")
    print(wrap_abc(converted))