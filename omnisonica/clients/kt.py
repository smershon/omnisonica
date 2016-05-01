import simplejson as json
from collections import defaultdict
import itertools
import sys

def normalize(s):
    s = s.lower()
    for c in '\'".,:;!?/':
        s = s.replace(c, '')
    s = s.replace('&', 'and')
    r = []
    for i,token in enumerate(s.split(' ')):
        if (token.startswith('-') or 
                (token.startswith('(') and i > 0) or 
                (token.startswith('[') and i > 0)):
            break
        r.append(token)
    r = ' '.join(r)
    r = r.replace('-', '')
    r = r.replace('(', '').replace(')', '')
    return r

def order(L, x, y):
    for token in L:
        if token == x:
            return 1
        if token == y:
            return -1
    return 0

def kendall_tau(s0, s1):
    if s0 == s1:
        return 1.0
    all_pairs = set()
    for pair in itertools.combinations(set(s0) | set(s1), 2):
        all_pairs.add(pair)
    if not all_pairs:
        return 1.0
    score = 0
    for x,y in all_pairs:
        #print x,y
        if order(s0, x, y) == order(s1, x, y):
            #print '   ... match'
            score += 1
        else:
            #print '   ... fail'
            score -= 1
    return float(score)/len(all_pairs)
    
def unordered_distance(s0, s1):
    all_items = set(s0) | set(s1)
    score = 0.0
    for c in all_items:
        s0_count = s0.count(c)
        s1_count = s1.count(c)
        score += float(abs(s0_count - s1_count))/max(s0_count, s1_count)
    return 1.0 - (score/len(all_items))
    
def is_int(s):
    try:
        int(s)
        return True
    except:
        return False
    
def numeral_diff(s0, s1):
    n0 = set([x for x in s0 if is_int(x)])
    n1 = set([x for x in s1 if is_int(x)])
    if n0 - n1 and n1 - n0:
        return 0.0
    return 1.0

def matches(base, candidate):
    kt = kendall_tau(base, candidate)
    kt_reverse = kendall_tau(base[::-1], candidate[::-1])
    kt = max(kt, kt_reverse)
    ud = unordered_distance(base, candidate)
    sub = 1.0 if base in candidate or candidate in base else 0.0
    ns = numeral_diff(base.split(' '), candidate.split(' '))
    if kt >= 0.7:
        if ud >= 0.8:
            return ns >= 0.5
        else:
            return sub >= 0.5
    return False

def main():
    file_in = sys.argv[1]
    seen_by_artist = defaultdict(set)
    with open(file_in, 'rb') as f:
        for line in f:
            doc = json.loads(line)
            title = doc['t']
            title = normalize(title)
            uid = doc['a']['u']
            if title in seen_by_artist[uid]:
                print 'DUPE:', doc['a']['n'], title
            else:
                for seen_title in seen_by_artist[uid]:
                    if matches(seen_title, title):
                        print 'FAIL: %s // %s // %s' % (doc['a']['n'], seen_title, title)
            seen_by_artist[uid].add(title)
            
    phrase_pairs = [
        ('horse with no name', 'a horse with no name'),
        ('rock and roll hoochie koo', 'i love rock and roll'),
        ('magnet and steel', 'hold on im comin')
    ]
            
    for pair in phrase_pairs:
        print pair, kendall_tau(*pair)
    
if __name__ == '__main__':
    main()