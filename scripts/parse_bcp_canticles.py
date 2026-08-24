#!/usr/bin/env python3
"""Parse the BCP Canticles MHT page into structured JSON: one entry per
canticle, verses as an ordered list of {number, a, b} half-verse pairs
(matching the source's verse-per-two-lines layout with a colon divider)."""
import email, re, json, html as html_module
from bs4 import BeautifulSoup

def load_table(mht_path):
    with open(mht_path, 'rb') as f:
        msg = email.message_from_bytes(f.read())
    for part in msg.walk():
        if part.get_content_type() == 'text/html':
            htmltext = part.get_payload(decode=True).decode(part.get_content_charset() or 'utf-8', errors='replace')
            break
    else:
        raise ValueError(f"No HTML part in {mht_path}")
    soup = BeautifulSoup(htmltext, 'lxml')
    tables = soup.find_all('table')
    content_table = max(tables, key=lambda t: len(t.get_text(strip=True)))
    return content_table

def td_text(td):
    raw = str(td)
    raw = re.sub(r'<br\s*/?>', '\n', raw)
    text = re.sub(r'<[^>]+>', '', raw)
    text = html_module.unescape(text)
    lines = [re.sub(r'\s+', ' ', l).strip() for l in text.split('\n')]
    lines = [l for l in lines if l]
    return ' '.join(lines)

def has_class(tag, name):
    classes = tag.get('class') or []
    return any(c.lower() == name.lower() for c in classes)

def parse_table(content_table):
    canticles = []
    current = None
    section = None
    raw_rows = []  # list of ('BOUNDARY', None) or (number_or_None, text, has_colon_marker)

    def flush():
        nonlocal current, raw_rows
        if current is None:
            return
        has_numbers = any(isinstance(n, str) and n not in (None, 'BOUNDARY') for n, *_ in raw_rows)
        verses = []
        if has_numbers:
            state = 'a'  # 'a' = building part before the colon, 'b' = after
            v_number, v_a, v_b = None, None, None

            def finalize_verse():
                nonlocal v_number, v_a, v_b
                if v_a is not None:
                    verses.append({'number': v_number, 'a': v_a, 'b': v_b})
                v_number, v_a, v_b = None, None, None

            for row in raw_rows:
                if row[0] == 'BOUNDARY':
                    finalize_verse()
                    state = 'a'
                    continue
                number, text, has_colon = row
                if number is not None:
                    finalize_verse()
                    v_number, v_a = number, text
                    state = 'b' if has_colon else 'a'
                elif state == 'a':
                    v_a = (v_a + ' ' + text) if v_a else text
                    if has_colon:
                        state = 'b'
                else:  # state == 'b'
                    if has_colon:
                        # a second colon-marked row with no number in between is
                        # always the start of a fresh unnumbered verse-pair (as
                        # with the Gloria Patri's two half-verses)
                        finalize_verse()
                        v_a = text
                        state = 'b'
                    else:
                        v_b = (v_b + ' ' + text) if v_b else text
            finalize_verse()
        else:
            verses = [{'number': None, 'a': text, 'b': None} for n, text, _ in raw_rows if n != 'BOUNDARY']
        current['verses'] = verses
        canticles.append(current)
        current = None
        raw_rows = []

    for tr in content_table.find_all('tr'):
        tds = tr.find_all('td', recursive=False)
        if not tds:
            continue

        heading_b = next((t for t in tds if has_class(t, 'headingB')), None)
        if heading_b is not None:
            text = td_text(heading_b)
            if text:
                section = text
            continue

        heading_c = next((t for t in tds if has_class(t, 'headingC')), None)
        if heading_c is not None:
            title = td_text(heading_c)
            if title:
                flush()
                current = {'title': title, 'section': section, 'citation': None}
            continue

        # citation reference rows (e.g. "Luke 2.29-32") carry their entire text
        # wrapped in <em> - unlike regular verse text, where <em> never wraps
        # the whole line. They also mark a boundary before the Gloria Patri,
        # which has no verse numbers of its own and would otherwise wrongly
        # merge into the preceding verse.
        text_td = next((t for t in tds if has_class(t, 'xx') and t.get('colspan')), None)
        if text_td is not None:
            em = text_td.find('em')
            if em is not None and em.get_text(strip=True) and em.get_text(strip=True) == text_td.get_text(strip=True):
                if current is not None:
                    current['citation'] = td_text(text_td)
                    raw_rows.append(('BOUNDARY', None, None))
                continue

        xx_tds = [t for t in tds if has_class(t, 'xx')]
        if not xx_tds or current is None:
            continue

        number_val = None
        text_val = None
        has_colon = False
        for t in xx_tds:
            raw_text = td_text(t)
            # verse numbers are sometimes bracketed (e.g. "[8", "11]") to mark
            # a traditionally-optional passage (e.g. Venite v.8-11) - extract
            # the digits as the number and drop the bracket punctuation
            m = re.fullmatch(r'\[?(\d+)\]?', raw_text)
            if m:
                number_val = m.group(1)
            elif raw_text:
                text_val = raw_text.strip('[]').strip()
                has_colon = t.find('span', class_='red') is not None

        if text_val is not None:
            raw_rows.append((number_val, text_val, has_colon))

    flush()
    return canticles

if __name__ == '__main__':
    import sys
    path = sys.argv[1]
    table = load_table(path)
    canticles = parse_table(table)
    print(json.dumps(canticles, indent=2, ensure_ascii=False))
