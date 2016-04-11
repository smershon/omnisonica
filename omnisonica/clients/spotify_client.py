import simplejson as json

import requests

from datatype import Album
from datatype import Artist
from datatype import Track

import util

def track_from_json(doc):
    if doc['album']['images']:
        image_url = doc['album']['images'][0]['url']
    else:
        image_url = None
    artist = Artist(doc['artists'][0]['uri'],
            name=doc['artists'][0]['name'])
    album = Album(doc['album']['uri'],
            title=doc['album']['name'],
            image_url=image_url)
    return Track(doc['uri'],
            title=doc['name'],
            duration=doc['duration_ms'],
            artist=artist,
            album=album)
            
def album_from_json(doc):
    if doc['images']:
        image_url = doc['images'][0]['url']
    else:
        image_url = None
    return Album(doc['uri'],
        title=doc['name'],
        image_url=image_url,
        release_date=doc['release_date'])

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
        
    def get_albums(self, album_uris):
        return util.batch_as_stream(album_uris, self._batch_albums, batch_size=20)
        
    def _batch_tracks(self, track_uris):
        track_ids = [x.split(':')[-1] for x in track_uris]
        resp = requests.get('https://api.spotify.com/v1/tracks?ids=%s' % ','.join(track_ids))
        doc = resp.json()
        return [track_from_json(x) for x in doc['tracks']]
        
    def _batch_albums(self, album_uris):
        album_ids = [x.split(':')[-1] for x in album_uris]
        resp = requests.get('https://api.spotify.com/v1/albums?ids=%s' % ','.join(album_ids))
        doc = resp.json()
        return [album_from_json(x) for x in doc['albums']]
    
    def track_data(self, track_uris):
        tracks = list(self.get_tracks(track_uris))
        albums = self.get_albums(set([x.album.uid for x in tracks]))
        album_lookup = dict([(x.uid, x) for x in albums])
        for track in tracks:
            if track.album.uid in album_lookup:
                track.album = album_lookup[track.album.uid]
        return tracks
      
    def search_tracks(self, query):
        resp = requests.get('https://api.spotify.com/v1/search?type=track&q=%s' % query)
        doc = resp.json()
        tracks = []
        for track in doc['tracks']['items']:
            tracks.append(track_from_json(track))
        albums = self.get_albums(set([x.album.uid for x in tracks]))
        album_lookup = dict([(x.uid, x) for x in albums])
        for track in tracks:
            if track.album.uid in album_lookup:
                track.album = album_lookup[track.album.uid]
        return tracks  
        