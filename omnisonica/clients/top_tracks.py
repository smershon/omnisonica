import sys
import spotify_client
import simplejson as json
import csv

def main():
    client = spotify_client.Client()
    with open(sys.argv[1], 'rb') as f:
        reader = csv.reader(f)
        artists = [(row[0],row[1]) for row in reader]
        #tracks = [json.loads(x) for x in f]
    #artists = set([x['a']['u'] for x in tracks])
    with open(sys.argv[2], 'wb') as f:
        for i,artist_pair in enumerate(artists):
            uid, name = artist_pair
            print uid
            tracks = client.top_tracks(uid, 62)
            tracks.sort(key=lambda x: x.popularity, reverse=True)
            print '%d/%d %s' % (i+1, len(artists), name)
            datum = (uid, name, [x._to_dict() for x in tracks])
            f.write('%s\n' % json.dumps(datum))
    
if __name__ == '__main__':
    arg = sys.argv[1]
    if arg.startswith('spotify:'):
        client = spotify_client.Client()
        tracks = client.top_tracks(arg, 62)
        for t in tracks:
            print json.dumps(t._to_dict())
    else:
        main()