import time

class Track(object):
    def __init__(self, uid,
            title=None,
            duration=None,
            popularity=None,
            original_release=None,
            artist=None, 
            album=None,
            meta=None):
        self.uid = uid
        self.title = title
        self.duration=duration
        self.popularity=popularity
        self.original_release=original_release
        self.artist = artist
        self.album = album
        self.meta = meta
        
    def _to_dict(self):
        return {
            'u': self.uid,
            't': self.title,
            'd': self.duration,
            'p': self.popularity,
            'r': self.original_release,
            'a': self.artist._to_dict() if self.artist else None,
            'c': self.album._to_dict() if self.album else None,
            'm': self.meta._to_dict() if self.meta else None
        }
        
    def __repr__(self):
        return '%s: %s [%s]' % (self.artist.name, self.title, self.album.title)

def track_from_dict(d):
    return Track(
        d['u'],
        title=d.get('t'),
        duration=d.get('d'),
        popularity=d.get('p'),
        original_release=d.get('r'),
        artist=artist_from_dict(d.get('a')),
        album=album_from_dict(d.get('c')),
        meta=meta_from_dict(d.get('m'))
    )
        
class Artist(object):
    def __init__(self, uid,
            name=None,
            country=None):
        self.uid = uid
        self.name = name
        self.country = country
        
    def _to_dict(self):
        return {
            'u': self.uid,
            'n': self.name,
            'c': self.country
        }
        
def artist_from_dict(d):
    return Artist(
        d['u'],
        name=d.get('n'),
        country=d.get('c')
    )
        
class Album(object):
    def __init__(self, uid,
            title=None,
            release_date=None,
            image_url=None):
        self.uid = uid
        self.title = title
        self.release_date = release_date
        self.image_url=image_url
        
    def _to_dict(self):
        return {
            'u': self.uid,
            't': self.title,
            'r': self.release_date,
            'i': self.image_url
        }
        
def album_from_dict(d):
    return Album(
        d['u'],
        title=d.get('t'),
        release_date=d.get('r'),
        image_url=d.get('i')
    )
        
class Meta(object):
    def __init__(self,
            date_added=None,
            last_modified=None,
            tags=None):
        self.date_added = date_added
        self.last_modified = last_modified
        self.tags = tags or []
        
    def _to_dict(self):
        return {
            'a': self.date_added,
            'm': self.last_modified,
            'x': self.tags
        }
        
def blank_meta():
    return Meta(
        date_added=int(round(time.time())),
        last_modified=int(round(time.time())))
        
def meta_from_dict(d):
    d = d or {}
    return Meta(
        date_added=d.get('a'),
        last_modified=d.get('m'),
        tags=d.get('x')
    )