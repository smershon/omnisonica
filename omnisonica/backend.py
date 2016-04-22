from clients.datatype import Album, Artist, Track, Meta
from clients import spotify_client
import random
import os
import logging
import simplejson as json

log = logging.getLogger(__name__)

consonants = ['b','c','d','f','g','h','j','k','l','m',
              'n','p','q','r','s','t','v','w','x','z']
vowels = ['a','e','i','o','u','y']

spotify = spotify_client.Client()

def get_two_sample_tracks(user_id=None):
    return [
        Track(
            uid='t00000000000',
            title='My Eternal Dream',
            duration=363250,
            artist=Artist(
                uid='a00000000000',
                name='Stratovarius'
            ),
            album=Album(
                uid='c00000000000',
                title='Eternal',
                release_date='2015-09-18'
            )
         ),
         Track(
            uid='t00000000001',
            title='Thunderhoof',
            duration=578000,
            artist=Artist(
                uid='a0000000001',
                name='Conan'
            ),
            album=Album(
                uid='c0000000001',
                title='Revengeance',
                release_date='2016-01-29'
            )
        )
    ]

def random_word():
    word = ''
    for _ in range(random.randint(1,5)):
        word += random.choice(consonants)
        word += random.choice(vowels)
    return word
    
def random_track(idx):
    return Track(
        uid='t' + '%011d' % idx,
        title=random_word(),
        duration=240000,
        artist=Artist(
            uid='a' + '%011d' % idx,
            name=random_word(),
        ),
        album=Album(
            uid='c' + '%011d' % idx,
            title=random_word(),
            release_date='2016-03-04'
        )
    )
            
def get_random_tracks(user_id=None):
    return [random_track(i) for i in xrange(1000)]
    
def get_tracks_from_file(view=None):
    tracks = []
    try:
        with open('data/%s.json' % view, 'rb') as f:
            for line in f:
                doc = json.loads(line.strip())
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
                tracks.append(track)
    except:
        pass
    return tracks
    
def get_views(user_id=None):
    return [x.split('.')[0] for x in os.listdir('data')]
    
def search_tracks(query):
    return spotify.search_tracks(query)
    
def track_data(track_ids):
    return spotify.track_data(track_ids)
    
def save_view(view_name, tracks):
    tracks.sort(key=lambda x: x['idx'])
    with open('data/%s.json' % view_name, 'wb') as f:
        for track in tracks:
            track.pop('idx')
            track.pop('v')
            f.write('%s\n' % json.dumps(track))
   
get_tracks = get_tracks_from_file 