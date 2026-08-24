#!/usr/bin/env python3
"""Parse justus.anglican.org Common Worship Collects MHT pages into structured JSON."""
import email, re, json, html as html_module
from bs4 import BeautifulSoup

SEASON_CLASSES = {'headingareditalic', 'headingared'}

def has_class(tag, name):
    classes = tag.get('class') or []
    return any(c.lower() == name.lower() for c in classes)

def find_by_class_ci(tr, name, require_colspan=False):
    for td in tr.find_all('td', recursive=False):
        if has_class(td, name):
            if require_colspan and not td.has_attr('colspan'):
                continue
            return td
    return None

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
    # content table is the largest one by text length
    content_table = max(tables, key=lambda t: len(t.get_text(strip=True)))
    return content_table

def td_text(td):
    """Extract text from a td, converting <br> to newlines, stripping tags."""
    raw = str(td)
    raw = re.sub(r'<br\s*/?>', '\n', raw)
    text = re.sub(r'<[^>]+>', '', raw)
    text = html_module.unescape(text)
    # collapse whitespace within lines but keep newlines
    lines = [re.sub(r'\s+', ' ', l).strip() for l in text.split('\n')]
    lines = [l for l in lines if l]
    return '\n'.join(lines)

def parse_table(content_table):
    records = []
    current_season = None
    current = None
    current_section = None  # 'collect' or 'post_communion'
    pending_alt = False

    for tr in content_table.find_all('tr'):
        tds = tr.find_all('td', recursive=False)
        if not tds:
            continue

        # detect season header row
        season_em = tr.find(class_=lambda c: c and c.lower() in SEASON_CLASSES)
        if season_em and season_em.get_text(strip=True):
            raw_season = season_em.get_text(strip=True)
            current_season = re.sub(r'[^A-Za-z ]', '', raw_season).strip()
            continue

        # detect record heading row (contains td.headingB / td.HeadingB)
        heading_td = find_by_class_ci(tr, 'headingB')
        if heading_td is not None:
            title = td_text(heading_td).replace('\n', ' ').strip()
            if not title:
                continue
            # look for a date td (em>span.ri inside a td that is NOT the color column)
            date_text = None
            color_text = None
            other_tds = [t for t in tds if t is not heading_td]
            for t in other_tds:
                txt = td_text(t)
                if not txt:
                    continue
                # date tds look like "24\nDecember" -> digit-leading
                if re.match(r'^\d', txt):
                    date_text = txt.replace('\n', ' ')
                else:
                    color_text = txt.replace('\n', ' ')
            # If the current record is still empty (no collect/post text yet), this
            # heading row is a continuation of a multi-row title (e.g. "The
            # Presentation of Christ" + "in the Temple") rather than a new record.
            is_continuation = (
                current is not None
                and not current['collect']['main']
                and not current['post_communion']['main']
            )
            if is_continuation:
                current['title'] = (current['title'] + ' ' + title).strip()
                if date_text:
                    current['date'] = date_text
                if color_text:
                    current['color'] = color_text
                continue
            if current:
                records.append(current)
            current = {
                'season': current_season,
                'date': date_text,
                'title': title,
                'color': color_text,
                'notes': [],
                'collect': {'main': None, 'alt': None},
                'post_communion': {'main': None, 'alt': None},
            }
            current_section = None
            pending_alt = False
            continue

        # section label row (Collect / Post Communion)
        label_td = find_by_class_ci(tr, 'headingCLeft')
        if label_td is not None:
            label = td_text(label_td).lower()
            if 'post' in label:
                current_section = 'post_communion'
            elif 'collect' in label:
                current_section = 'collect'
            else:
                current_section = None
            pending_alt = False
            continue

        # any remaining td with a colspan attribute is either a note/marker (class
        # "ri") or plain body text (class "xx" or no class at all)
        colspan_td = tr.find('td', attrs={'colspan': True})
        if colspan_td is not None:
            text = td_text(colspan_td)
            if has_class(colspan_td, 'ri'):
                if re.match(r'^\(?or\b', text, re.IGNORECASE):
                    pending_alt = True
                elif text and current is not None:
                    current['notes'].append(text)
            else:
                if text and current is not None and current_section is not None:
                    slot = current[current_section]
                    key = 'alt' if pending_alt else 'main'
                    if slot[key]:
                        slot[key] += '\n\n' + text
                    else:
                        slot[key] = text
            continue

    if current:
        records.append(current)
    return records

if __name__ == '__main__':
    import sys
    path = sys.argv[1]
    table = load_table(path)
    records = parse_table(table)
    print(json.dumps(records, indent=2, ensure_ascii=False))
