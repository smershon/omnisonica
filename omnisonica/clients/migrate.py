from optparse import OptionParser
import simplejson as json
import spotify_client
import datatype
import datetime
import calendar
import wiki

def migrate(path_in, path_out):
    client = spotify_client.Client()
    uris = []
    with open(path_in, 'rb') as f:
        for line in f:
            doc = json.loads(line)
            uris.append(doc['u'])
    tracks = client.track_data(uris)
    with open(path_out, 'wb') as f:
        for t in tracks:
            ts = calendar.timegm(datetime.datetime.now().utctimetuple())
            t.meta = datatype.Meta(date_added=ts, last_modified=ts)
            f.write('%s\n' % json.dumps(t._to_dict()))

def add_countries(path_in, path_out):
    tracks = []
    artist_countries = {}
    with open(path_in, 'rb') as f:
        for line in f:
            doc = json.loads(line)
            tracks.append(doc)
            artist_countries[doc['a']['n']] = None
    for i,artist in enumerate(artist_countries.iterkeys()):
        artist_countries[artist]=wiki.country_for_artist(artist)
        print '%d/%d %s: %s' % (i+1, len(artist_countries), artist, artist_countries[artist])
    with open(path_out, 'wb') as f:
        for t in tracks:
            t['a']['c'] = artist_countries[t['a']['n']]
            f.write('%s\n' % json.dumps(t))

def main():
    parser = OptionParser()
    parser.add_option('-i', dest='input')
    parser.add_option('-o', dest='output')
    parser.add_option('-w', dest='wiki', action="store_true")
    
    options, args = parser.parse_args()
    
    if options.wiki:
        add_countries(options.input, options.output)
    else:
        migrate(options.input, options.output) 


if __name__ == '__main__':
    main()