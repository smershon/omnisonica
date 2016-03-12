from datatype import Album, Artist, Track
import random
import simplejson as json

consonants = ['b','c','d','f','g','h','j','k','l','m',
              'n','p','q','r','s','t','v','w','x','z']
vowels = ['a','e','i','o','u','y']

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
    
def get_tracks_from_file(user_id=None):
    tracks = []
    with open('data/funk.json', 'rb') as f:
        for line in f:
            doc = json.loads(line.strip())
            track = Track(
                uid=doc.get('u'),
                title=doc.get('t'),
                duration=doc.get('d'),
                artist=Artist(
                    doc.get('a', {}).get('u'),
                    doc.get('a', {}).get('n'),
                ),
                album=Album(
                    uid=doc.get('c', {}).get('u'),
                    title=doc.get('c', {}).get('t'),
                    release_date=doc.get('c', {}).get('r')
                )
            )
            tracks.append(track)
    return tracks
                    
   
get_tracks = get_tracks_from_file 