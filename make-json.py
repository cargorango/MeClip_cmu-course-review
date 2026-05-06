import json
with open('prisma/free-electives.json', 'r', encoding='utf-8-sig') as f:
    existing = json.load(f)
existing_codes = {c['code'] for c in existing}
more = [
    {'code':'357110','name':'Insects and Mankind','nameTh':'\u0e41\u0e21\u0e25\u0e07\u0e01\u0e31\u0e1a\u0e21\u0e19\u0e38\u0e29\u0e22\u0e0a\u0e32\u0e15\u0e34','credits':'3 (3-0-6)','description':'\u0e04\u0e27\u0e32\u0e21\u0e2a\u0e33\u0e04\u0e31\u0e0d\u0e41\u0e25\u0e30\u0e1a\u0e17\u0e1a\u0e32\u0e17\u0e02\u0e2d\u0e07\u0e41\u0e21\u0e25\u0e07\u0e43\u0e19\u0e2a\u0e31\u0e07\u0e04\u0e21\u0e21\u0e19\u0e38\u0e29\u0e22\u0e4c'},
    {'code':'154104','name':'Environmental Conservation','nameTh':'\u0e01\u0e32\u0e23\u0e2d\u0e19\u0e38\u0e23\u0e31\u0e01\u0e29\u0e4c\u0e2a\u0e34\u0e48\u0e07\u0e41\u0e27\u0e14\u0e25\u0e49\u0e2d\u0e21','credits':'3 (3-0-6)','description':'\u0e1b\u0e31\u0e0d\u0e2b\u0e32\u0e43\u0e19\u0e01\u0e32\u0e23\u0e08\u0e31\u0e14\u0e01\u0e32\u0e23\u0e41\u0e25\u0e30\u0e01\u0e32\u0e23\u0e43\u0e0a\u0e49\u0e1b\u0e23\u0e30\u0e42\u0e22\u0e0a\u0e19\u0e4c\u0e08\u0e32\u0e01\u0e17\u0e23\u0e31\u0e1e\u0e22\u0e32\u0e01\u0e23\u0e18\u0e23\u0e23\u0e21\u0e0a\u0e32\u0e15\u0e34'},
]
added = 0
for c in more:
    if c['code'] not in existing_codes:
        existing.append(c)
        added += 1
with open('prisma/free-electives.json', 'w', encoding='utf-8') as f:
    json.dump(existing, f, ensure_ascii=False, indent=2)
print(f'Added {added}, Total: {len(existing)}')
