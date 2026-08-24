#!/usr/bin/env python3
"""Merge parsed CW collect JSON fragments into the final {label: text} shape,
resolving 'Apostles and Evangelists' post-communion cross-references where
only the collect (not post communion) is used for v1 parity with BCP."""
import json

FILES = [
    "Collects_-_Advent_to_before_Lent",
    "Collects_-_Lent_to_Pentecost",
    "Collects_-_Ordinary_Time_after_Pentecost",
    "Collects_-_Festivals_-_January_to_June",
    "Collects_-_Festivals_-_July_to_December",
]

result = {}
dupes = []
for fname in FILES:
    with open(f"/tmp/{fname}.json") as f:
        records = json.load(f)
    for r in records:
        label = r['title'].strip()
        text = r['collect']['main']
        if not text:
            continue
        text = ' '.join(text.split('\n'))  # collapse to single-line like BCP style
        if label in result:
            dupes.append(label)
        result[label] = text

print(f"{len(result)} unique labels, {len(dupes)} duplicate titles: {dupes}")
with open("/home/claude/repo/scripts/collects_cw_raw.json", "w") as f:
    json.dump(result, f, indent=2, ensure_ascii=False)
print("Saved to scripts/collects_cw_raw.json")
