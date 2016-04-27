import simplejson as json
import heapq
import sys
import csv

tier5 = {'min': 1,
         'max': 2,
         'gmean': 1.414,
         'count': 707
        }
tier4 = {'min': 3,
         'max': 6,
         'gmean': 4.243,
         'count': 236
        }         
tier3 = {'min': 7,
         'max': 14,
         'gmean': 9.899,
         'count': 101
        }
tier2 = {'min': 15,
         'max': 30,
         'gmean': 21.213,
         'count': 47
        }
tier1 = {'min': 31,
         'max': 62,
         'gmean': 43.841,
         'count': 23
        }

def artist_tracks(filename, excluded=None):
    excluded = excluded or set()
    with open(filename, 'rb') as f:
        for line in f:
            doc = json.loads(line)
            if doc[0] not in excluded:
                yield doc
            
def default_idx(l, n, default=None):
    if len(l) <= n:
        return default
    return l[n]

def main():
    
    with open('classic_rock_scores.csv', 'rb') as f:
        reader = csv.reader(f)
        scores = dict([(x[0], float(x[4])**3) for x in reader])
        
    def score(row, n):
        return default_idx(row[2], n, {'p':0})['p'] * scores[row[0]]
    
    tier1 = heapq.nlargest(23, artist_tracks(sys.argv[1]),
            key=lambda x: score(x, 43))
    excluded = set([x[0] for x in tier1])
    tracks = []
    i = 0
    while len(tracks) < 1000:
        for row in tier1:
            track = default_idx(row[2], i)
            if track:
                tracks.append(track)
                if len(tracks) >= 1000:
                    break
        i += 1
    #for uri in track_uris:
    #    print uri
    for track in tracks:
        print json.dumps(track)
    

    tier2 = heapq.nlargest(47, artist_tracks(sys.argv[1], excluded=excluded),
            key=lambda x: score(x, 20))
    excluded |= set([x[0] for x in tier2])
    tracks = []
    i = 0
    while len(tracks) < 1000:
        for row in tier2:
            track = default_idx(row[2], i)
            if track:
                tracks.append(track)
                if len(tracks) >= 1000:
                    break
        i += 1
    #for uri in track_uris:
    #    print uri
    for track in tracks:
        print json.dumps(track)
    
    
    tier3 = heapq.nlargest(101, artist_tracks(sys.argv[1], excluded=excluded),
            key=lambda x: score(x, 9))
    excluded |= set([x[0] for x in tier3])
    tracks = []
    i = 0
    while len(tracks) < 1000:
        for row in tier3:
            track = default_idx(row[2], i)
            if track:
                tracks.append(track)
                if len(tracks) >= 1000:
                    break
        i += 1
    #for uri in track_uris:
    #    print uri
    for track in tracks:
        print json.dumps(track)
        
    tier4 = heapq.nlargest(236, artist_tracks(sys.argv[1], excluded=excluded),
            key=lambda x: score(x, 3))
    excluded |= set([x[0] for x in tier4])
    tracks = []
    i = 0
    while len(tracks) < 1000:
        for row in tier4:
            track = default_idx(row[2], i)
            if track:
                tracks.append(track)
                if len(tracks) >= 1000:
                    break
        i += 1
    #for uri in track_uris:
    #    print uri
    for track in tracks:
        print json.dumps(track)
        
    tier5 = heapq.nlargest(707, artist_tracks(sys.argv[1], excluded=excluded),
            key=lambda x: score(x, 0))
    tracks = []
    i = 0
    while len(tracks) < 1000:
        for row in tier5:
            track = default_idx(row[2], i)
            if track:
                tracks.append(track)
                if len(tracks) >= 1000:
                    break
        i += 1
    #for uri in track_uris:
    #    print uri
    for track in tracks:
        print json.dumps(track)

if __name__ == '__main__':
    main()