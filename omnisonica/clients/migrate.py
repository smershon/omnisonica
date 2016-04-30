from optparse import OptionParser
import simplejson as json
import spotify_client
import datatype
import datetime
import time
import calendar
import wiki
import omni_redis

def migrate_v1(path_in, path_out):
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

def migrate_v2(path_in, view):
    with open(path_in, 'rb') as f:
        tracks = [datatype.track_from_dict(json.loads(line)) for line in f]
    for t in tracks:
        t.meta.date_added = t.meta.date_added or int(round(time.time()))
        t.meta.last_modified = t.meta.last_modified or int(round(time.time()))
    print 'putting %d tracks' % len(tracks)
    omni_redis.put_view('default', view, tracks)
    
migrate = migrate_v2

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