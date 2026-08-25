#!/usr/bin/env python3
"""Append one Sunday's Second/Third Service data (all 3 years) to the
working CW Sunday Office JSON file. Usage: import and call add_sunday()."""
import json, sys

PATH = "/home/claude/cw_sunday_office.json"

def add_sunday(title, data):
    """data = {'A': {'second': {...}, 'third': {...}}, 'B': {...}, 'C': {...}}
    Any year can be omitted if that Sunday doesn't apply that year."""
    with open(PATH) as f:
        d = json.load(f)
    for year, entry in data.items():
        d[year][title] = entry
    with open(PATH, 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=False)
    print(f"Added '{title}' for years: {list(data.keys())}")

if __name__ == '__main__':
    pass
