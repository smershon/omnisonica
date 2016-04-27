from clients.datatype import Album, Artist, Track, Meta, track_from_dict
from clients import spotify_client
from clients import omni_redis
import random
import os
import logging
import simplejson as json

log = logging.getLogger(__name__)
    
def get_tracks_from_file(view=None):
    tracks = []
    try:
        with open('data/%s.json' % view, 'rb') as f:
            for line in f:
                doc = json.loads(line.strip())
                doc['m'] = doc['m'] or {}
                track = Track(
                    uid=doc.get('u'),
                    title=doc.get('t'),
                    duration=doc.get('d'),
                    popularity=doc.get('p'),
                    artist=Artist(
                        uid=doc.get('a', {}).get('u'),
                        name=doc.get('a', {}).get('n'),
                        country=doc.get('a', {}).get('c')
                    ),
                    album=Album(
                        uid=doc.get('c', {}).get('u'),
                        title=doc.get('c', {}).get('t'),
                        release_date=doc.get('c', {}).get('r')
                    ),
                    meta=Meta(
                        date_added=doc.get('m', {}).get('a'),
                        last_modified=doc.get('m', {}).get('m'),
                        tags=doc.get('m', {}).get('x')
                    )
                )
                log.info(track.title)
                tracks.append(track)
    except Exception as e:
        log.warn('THERE WAS PROBLEM: %r', e)
        pass
    return tracks
    
def get_tracks_from_redis(view, user='default'):
    return omni_redis.get_view(user, view)
    
def get_views(user_id='default'):
    return omni_redis.list_views(user_id)
    
def search_tracks(query):
    return spotify.search_tracks(query)
    
def track_data(track_ids):
    return spotify.track_data(track_ids)
    
def save_view(view_name, tracks, user_id='default'):
    tracks.sort(key=lambda x: x['idx'])
    tracks = [track_from_dict(x) for x in tracks]
    omni_redis.put_view(user_id, view_name, tracks)
   
get_tracks = get_tracks_from_redis
#get_tracks = get_tracks_from_file