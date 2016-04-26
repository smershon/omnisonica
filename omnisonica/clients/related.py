import requests
import simplejson as json
import sys
from collections import defaultdict
import csv

def main():
    artist_scores = defaultdict(float)
    artist_names = {}
    with open(sys.argv[1], 'rb') as f:
        tracks = [json.loads(x) for x in f]
    for track in tracks:
        uid = track['a']['u']
        name = track['a']['n']
        artist_scores[uid] += 1.0
        artist_names[uid] = name
    extended_artist_scores = defaultdict(float)
    related_artists = []
    total = len(artist_names)
    
    """
    for i,uid in enumerate(artist_names.iterkeys()):
        uri = 'https://api.spotify.com/v1/artists/%s/related-artists' % (uid.split(':')[-1])
        resp = requests.get(uri)
        doc = resp.json()
        extended_artists.update([x['uri'] for x in doc['artists']])
        related_artists.append((uid, artist_names[uid], 
            [(x['uri'], x['name']) for x in doc['artists']]))
        print i,total,len(extended_artists)
    
        
    print 'DONE'

    with open('related_artists.json', 'wb') as f:
        for row in related_artists:
            f.write('%s\n' % json.dumps(row))
    """
    
    with open('related_artists.json', 'rb') as f:
        for line in f:
            uid, name, sims = json.loads(line)
            mm = artist_scores[uid]
            for sim_uid, sim_name in sims:
                artist_names[sim_uid] = sim_name
                extended_artist_scores[sim_uid] += mm*0.05
    
    combined_artist_scores = dict([(uid, artist_scores[uid] + extended_artist_scores[uid]) 
        for uid in set(artist_scores.keys()) | set(extended_artist_scores.keys())])

    with open('classic_rock_scores.csv', 'wb') as f:
        writer = csv.writer(f)
        for uid,score in sorted(combined_artist_scores.items(), key=lambda x: x[1], reverse=True):
            writer.writerow([uid, 
                artist_names[uid].encode('utf-8'), artist_scores[uid], 
                extended_artist_scores[uid], score])
    
if __name__ == '__main__':
    main()