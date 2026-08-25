#!/usr/bin/env python3
"""Parse justus.anglican.org Common Worship Canticles MHT pages into
structured JSON, matching the shape of parse_bcp_canticles.py's output.
Source files are Windows-1252 encoded, not UTF-8 (unlike the BCP pages).
CW canticles mark the chant-division point with a bullet (•, class
"redlight") rather than BCP's literal colon (class "red")."""
import email, re, json, html as html_module
from bs4 import BeautifulSoup

def load_table(mht_path):
    with open(mht_path, 'rb') as f:
        msg = email.message_from_bytes(f.read())
    for part in msg.walk():
        if part.get_content_type() == 'text/html':
            raw_bytes = part.get_payload(decode=True)
            htmltext = raw_bytes.decode('windows-1252', errors='replace')
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

def is_division_marker_row(td):
    """CW's chant-division bullet (class 'redlight') appears inline at the
    end of a verse-half's text, not as its own row - detect it on the td."""
    return td.find('span', class_='redlight') is not None

def parse_table(content_table):
    canticles = []
    current = None
    section = None
    raw_rows = []

    def flush():
        nonlocal current, raw_rows
        if current is None:
            return
        has_numbers = any(isinstance(n, str) and n not in (None, 'BOUNDARY') for n, *_ in raw_rows)
        verses = []
        if has_numbers:
            state = 'a'
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
                number, text, has_marker = row
                if number is not None:
                    finalize_verse()
                    v_number, v_a = number, text
                    state = 'b' if has_marker else 'a'
                elif state == 'a':
                    v_a = (v_a + ' ' + text) if v_a else text
                    if has_marker:
                        state = 'b'
                else:
                    if has_marker:
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

        # titles appear either as td.headingC, or (e.g. Te Deum on this page)
        # as a span.HeadingARedItalic inside a plain xx-classed td
        heading_c = next((t for t in tds if has_class(t, 'headingC')), None)
        alt_title_span = None
        if heading_c is None:
            for t in tds:
                span = t.find(['span', 'em'], class_='HeadingARedItalic')
                if span is not None:
                    alt_title_span = t
                    break
        if heading_c is not None or alt_title_span is not None:
            title_td = heading_c if heading_c is not None else alt_title_span
            title = td_text(title_td)
            if title:
                flush()
                current = {'title': title, 'section': section, 'citation': None}
            continue

        # citation / rubric-note rows: entire text wrapped in <em>
        text_td = next((t for t in tds if has_class(t, 'xx') and t.get('colspan')), None)
        if text_td is None:
            text_td = next((t for t in tds if t.get('colspan')), None)
        if text_td is not None:
            em = text_td.find('em')
            if em is not None and em.get_text(strip=True) and em.get_text(strip=True) == text_td.get_text(strip=True):
                if current is not None:
                    note = td_text(text_td)
                    if current['citation'] is None:
                        current['citation'] = note
                    raw_rows.append(('BOUNDARY', None, None))
                continue

        xx_tds = [t for t in tds if has_class(t, 'xx')]
        content_tds = xx_tds if xx_tds else [t for t in tds if t.get('colspan')]
        if not content_tds or current is None:
            continue

        number_val = None
        text_val = None
        has_marker = False
        # the verse number cell doesn't always carry the "xx" class (CW pages
        # vary from BCP here), so scan every td in the row for a bare number
        for t in tds:
            raw_text = td_text(t)
            m = re.fullmatch(r'\[?(\d+)\]?', raw_text)
            if m:
                number_val = m.group(1)
        for t in content_tds:
            raw_text = td_text(t)
            if re.fullmatch(r'\[?\d+\]?', raw_text):
                continue
            if raw_text:
                has_marker = is_division_marker_row(t)
                # strip the bullet chant-marker itself - it's a pointing mark,
                # not punctuation meant to be read
                text_val = re.sub(r'\s*\u2022\s*$', '', raw_text).strip('[]').strip()

        if text_val is not None:
            raw_rows.append((number_val, text_val, has_marker))

    flush()
    return canticles

if __name__ == '__main__':
    import sys
    path = sys.argv[1]
    table = load_table(path)
    canticles = parse_table(table)
    print(json.dumps(canticles, indent=2, ensure_ascii=False))
