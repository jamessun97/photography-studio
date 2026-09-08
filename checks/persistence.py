"""Run only against a local development server. Uses synthetic practice data."""
import json, urllib.request, urllib.error, http.cookiejar
from datetime import date
base='http://localhost:3000'
jar=http.cookiejar.CookieJar()
client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
client.open(base+'/signin-with-chatgpt?return_to=%2F').read()
def request(method='GET',payload=None,origin=base,auth=True):
    headers={'Content-Type':'application/json','Origin':origin}
    req=urllib.request.Request(base+'/api/progress',data=json.dumps(payload).encode() if payload is not None else None,headers=headers,method=method)
    try:
        res=(client if auth else urllib.request.build_opener()).open(req)
        return res.status,json.load(res)
    except urllib.error.HTTPError as e:
        raw=e.read().decode()
        try: body=json.loads(raw)
        except ValueError: body={"error":raw}
        return e.code,body
code,initial=request();assert code==200
original=initial['state'];revision=initial['revision']
assert request(auth=False)[0]==401
assert request('PUT',{'state':original,'revision':revision},origin='https://invalid.example')[0]==403
assert request('PUT',{'state':{**original,'week':25},'revision':revision})[0]==400
bad={'id':'test-invalid','module':1,'date':str(date.today()),'hours':1,'title':'test','intention':'','evidence':'','reflection':'','feedback':'','next':'','status':'已复盘'}
assert request('PUT',{'state':{**original,'records':[bad]},'revision':revision})[0]==400
r={**bad,'id':'local-integration-proof','title':'本地保存验证','evidence':'local-only-test.jpg','reflection':'同一地点重拍后，主体更清楚。'}
test={**original,'records':[r]}
code,saved=request('PUT',{'state':test,'revision':revision});assert code==200,(code,saved)
assert request()[1]['state']==test
assert request('PUT',{'state':original,'revision':revision})[0]==409
edited={**test,'records':[{**r,'hours':2,'next':'补拍边缘取舍'}]}
code,updated=request('PUT',{'state':edited,'revision':saved['revision']});assert code==200
assert request()[1]['state']==edited
code,restored=request('PUT',{'state':original,'revision':updated['revision']});assert code==200
assert request()[1]['state']==original
print('PASS: unauthenticated access, origin rejection, invalid week, evidence requirement, create/read, stale conflict, edit/read, restore')
