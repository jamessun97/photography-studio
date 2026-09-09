"""Check generated teaching delivery, not just source-file presence."""
from pathlib import Path
import json,re
from html.parser import HTMLParser
root=Path(__file__).resolve().parents[1]
book=json.loads((root/'content/textbook.json').read_text())
assert [l['id'] for l in book['lessons']]==list(range(1,25))
class Page(HTMLParser):
 def __init__(self):super().__init__();self.ids=set();self.links=[];self.images=[];self.answers=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.add(a['id'])
  if tag=='a' and a.get('href','').startswith('#'):self.links.append(a['href'][1:])
  if tag=='img':self.images.append(a.get('src',''))
  if tag=='details':self.answers+=1
page=Page();offline=(root/'public/teaching/photography-textbook.html').read_text();page.feed(offline)
assert all(link in page.ids for link in page.links)
assert page.answers==24 and len(page.images)==3
assert all(src.startswith('data:image/jpeg;base64,') for src in page.images)
assert 'beforeprint' in offline
for lesson in book['lessons']:
 source=(root/f"content/lessons/{lesson['id']:02}.md").read_text()
 assert lesson['title'] in source and lesson['title'] in offline
 assert lesson['characters']>=900
 types=[b['type'] for b in lesson['blocks']]
 assert types.count('answer')==1 and 'table' in types and 'list' in types
 assert '自测' in source and re.search(r'## (75|90) 分钟',source)
 answer=next(b['text'] for b in lesson['blocks'] if b['type']=='answer')
 assert re.search(r'^1\.',answer,re.M) and re.search(r'^2\.',answer,re.M)
 for b in lesson['blocks']:
  if b['type']=='table':assert all(len(row)==len(b['rows'][0]) for row in b['rows'])
for asset in json.loads((root/'content/image-sources.json').read_text())['assets']:
 assert (root/'public'/asset['path'].lstrip('/')).is_file()
 assert asset['source_url'].startswith('https://') and asset['rights']
print('PASS: 24 delivered lessons, 48 answered questions, table integrity, offline navigation and 3 embedded sourced images')
