import sys
import simplejson as json
import spotify_client

min_date = '1970'
max_date = '1979-2'

def cleaned(title):
    cleaned_title = []
    for i,token in enumerate(title.split(' ')):
        if token.startswith('-') or (token.startswith('(') and i >= 1):
            break
        cleaned_title.append(token)
    return ' '.join(cleaned_title)

def main():
    spotify = spotify_client.Client()
    covers = []
    with open(sys.argv[1], 'rb') as f:
        tracks = [json.loads(x) for x in f]
    tracks = [x for x in tracks if min_date <= x['c']['r'] <= max_date]
    for t in tracks:
        print cleaned(t['t'])
        try:
            results = spotify.search_tracks(cleaned(t['t']), album_info=False)
            for result in sorted(results, key=lambda x: -x.popularity):
                if (cleaned(result.title).lower() == cleaned(t['t']).lower() 
                        and result.artist.uid != t['a']['u']
                        and result.artist.name.lower() not in ['various artists', 'glee cast']
                        and 'live' not in result.album.title.lower()):
                    covers.append(result)
                    break
        except:
            print '   ...error'
    for cover in covers:
        print cover.uid
    
if __name__ == '__main__':
    main()