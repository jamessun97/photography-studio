from pathlib import Path
import json,re,html,base64
ROOT=Path(__file__).resolve().parents[1]
def blocks(text):
 lines=text.splitlines(); out=[];i=0
 while i<len(lines):
  line=lines[i].strip()
  if not line or line.startswith('# '):i+=1;continue
  if line==':::answer':
   j=i+1
   while j<len(lines) and lines[j].strip()!=':::':j+=1
   if j==len(lines):raise ValueError('Unclosed answer')
   out.append({'type':'answer','text':'\n'.join(lines[i+1:j])});i=j+1;continue
  if line.startswith('## '):out.append({'type':'heading','text':line[3:]});i+=1;continue
  if line.startswith('|'):
   rows=[]
   while i<len(lines) and lines[i].strip().startswith('|'):
    cells=[x.strip() for x in lines[i].strip().strip('|').split('|')]
    if not all(re.match(r'^:?-+:?$',c) for c in cells):rows.append(cells)
    i+=1
   out.append({'type':'table','rows':rows});continue
  if re.match(r'^\d+\. ',line) or line.startswith('- '):
   ordered=bool(re.match(r'^\d+\. ',line));items=[]
   while i<len(lines) and (re.match(r'^\d+\. ',lines[i].strip()) if ordered else lines[i].strip().startswith('- ')):
    items.append(re.sub(r'^(\d+\.|-) ','',lines[i].strip()));i+=1
   out.append({'type':'list','ordered':ordered,'items':items});continue
  parts=[line];i+=1
  while i<len(lines) and lines[i].strip() and not lines[i].strip().startswith(('## ',':::','|','- ')) and not re.match(r'^\d+\. ',lines[i].strip()):parts.append(lines[i].strip());i+=1
  out.append({'type':'paragraph','text':'\n'.join(parts)})
 return out
lessons=[]
for p in sorted((ROOT/'content/lessons').glob('*.md')):
 text=p.read_text();n=int(p.stem)
 lessons.append({'id':n,'moduleId':(n+1)//2,'title':text.splitlines()[0][5:].strip(),'blocks':blocks(text),'characters':sum('\u4e00'<=x<='\u9fff' for x in text)})
assert [x['id'] for x in lessons]==list(range(1,25))
book={'version':'2026-v2','title':'观照 · 从观察到作品的摄影自学教材','lessons':lessons}
(ROOT/'content/textbook.json').write_text(json.dumps(book,ensure_ascii=False,indent=2))
merged='# 观照 · 摄影自学教材\n\n第二版 · 24节完整课 · 24周可调整实践路线\n\n'+ '\n\n---\n\n'.join(p.read_text() for p in sorted((ROOT/'content/lessons').glob('*.md')))
(ROOT/'public/teaching/photography-textbook.md').write_text(merged)
def rich(s):return re.sub(r'\*\*(.*?)\*\*',r'<strong>\1</strong>',html.escape(s)).replace('\n','<br>')
def render(b):
 t=b['type']
 if t=='heading':return '<h2>'+rich(b['text'])+'</h2>'
 if t=='paragraph':return '<p>'+rich(b['text'])+'</p>'
 if t=='answer':return '<details><summary>揭晓参考答案</summary><p>'+rich(b['text'])+'</p></details>'
 if t=='list':
  tag='ol' if b['ordered'] else 'ul';return '<'+tag+'>'+''.join('<li>'+rich(x)+'</li>' for x in b['items'])+'</'+tag+'>'
 if t=='table':return '<div class="scroll"><table>'+''.join('<tr>'+''.join(('<th>' if i==0 else '<td>')+rich(c)+('</th>' if i==0 else '</td>') for c in row)+'</tr>' for i,row in enumerate(b['rows']))+'</table></div>'
parts=['<!doctype html><html lang="zh-CN"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>观照 · 完整摄影教材</title><style>body{font:18px/1.9 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 24px;color:#172c23}h1{font-size:32px}h2{font-size:24px;margin-top:40px}a{color:#245c3b}section{border-top:2px solid #bccbc1;margin-top:50px;padding-top:24px}table{border-collapse:collapse;width:100%;font-size:16px}td,th{border:1px solid #ccd5ce;padding:10px;text-align:left}.scroll{overflow:auto}details{background:#eef3ee;padding:16px}summary{cursor:pointer}img{max-width:100%;max-height:680px;object-fit:contain}figcaption{font-size:14px}@media print{section{break-before:page}details{display:block}details p{display:block}nav{display:none}tr{break-inside:avoid}}</style><h1>观照 · 完整摄影自学教材</h1><p>第二版 · 24节课。每课含讲解、案例、实践、自测与补练。每周40小时中，核心课60–90分钟，其余用于重复拍摄、选片和项目。理论可在本教材内学完，能力必须由实际拍摄验证。站内工具位于学习网页；本文件是可离线阅读的完整教材，示例图已内嵌。</p><nav>']
parts+=['<p><a href="#lesson-'+str(l['id'])+'">'+str(l['id']).zfill(2)+' '+html.escape(l['title'])+'</a></p>' for l in lessons];parts+=['</nav>']
for l in lessons:parts.append('<section id="lesson-'+str(l['id'])+'"><h1>'+str(l['id']).zfill(2)+' '+html.escape(l['title'])+'</h1>'+''.join(render(b) for b in l['blocks'])+'</section>')
parts.append('<section><h1>示例库与来源</h1><p>以下分析先区分可见事实、个人解读和馆藏背景。图片保留来源与权利说明，不作为学员作品。</p>')
for a in json.loads((ROOT/'content/image-sources.json').read_text())['assets']:
 data=base64.b64encode((ROOT/'public'/a['path'].lstrip('/')).read_bytes()).decode()
 parts.append('<figure><img src="data:image/jpeg;base64,'+data+'" alt="'+html.escape(a['original_title'])+'"><figcaption>'+html.escape(a['author']+' · '+a['date'])+'</figcaption></figure><h2>'+html.escape(a['original_title'])+'</h2><p>'+html.escape(a['background'])+'</p><ul>'+''.join('<li>'+html.escape(x)+'</li>' for x in a['visible_elements'])+'</ul><p>'+html.escape(a['rights'])+' <a href="'+html.escape(a['source_url'])+'">馆藏来源</a></p>')
parts.append('''</section><script>let closed=[];addEventListener('beforeprint',()=>{closed=[...document.querySelectorAll('details:not([open])')];closed.forEach(d=>d.open=true)});addEventListener('afterprint',()=>{closed.forEach(d=>d.open=false);closed=[]});</script></html>''')
(ROOT/'public/teaching/photography-textbook.html').write_text(''.join(parts))
print(f'Compiled {len(lessons)} lessons; {sum(x["characters"] for x in lessons)} Chinese characters; offline textbook ready.')
