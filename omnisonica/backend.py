from datatype import Album, Artist, Track
import random

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
   
get_tracks = get_random_tracks 