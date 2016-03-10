import simplejson as json

import requests

from datatype import Album
from datatype import Artist
from datatype import Track

import util

def track_from_json(doc):
    artist = Artist(doc['artists'][0]['uri'],
            name=doc['artists'][0]['name'])
    album = Album(doc['album']['uri'],
            title=doc['album']['name'],
            image_url=doc['album']['images'][0]['url'])
    return Track(doc['uri'],
            title=doc['name'],
            length=doc['duration_ms'],
            artist=artist,
            album=album)

class Client(object):
    def __init__(self, config='/etc/polytonik/config.json'):
        self.config_path = config
        self.client_id = None
        self.client_secret = None
        self._init_from_file(self.config_path)
        
    def _init_from_file(self, filepath):
        with open(filepath, 'rb') as f:
            config = json.loads(''.join(f.readlines()))
        self.client_id = config['spotify']['client_id']
        self.client_secret = config['spotify']['client_secret']
        
    def get_tracks(self, track_uris):
        return util.batch_as_stream(track_uris, self._batch_tracks, batch_size=50) 
        
    def _batch_tracks(self, track_uris):
        track_ids = [x.split(':')[-1] for x in track_uris]
        resp = requests.get('https://api.spotify.com/v1/tracks?ids=%s' % ','.join(track_ids))
        doc = resp.json()
        return [track_from_json(x) for x in doc['tracks']]  
        