class Track(object):
    def __init__(self, uid,
            title=None,
            duration=None,
            popularity=None,
            artist=None, 
            album=None,
            meta=None):
        self.uid = uid
        self.title = title
        self.duration=duration
        self.popularity=popularity
        self.artist = artist
        self.album = album
        
    def _to_dict(self):
        return {
            'u': self.uid,
            't': self.title,
            'd': self.duration,
            'p': self.popularity,
            'a': self.artist._to_dict() if self.artist else None,
            'c': self.album._to_dict() if self.album else None,
            'm': self.meta._to_dict() if self.meta else None
        }
        
    def __repr__(self):
        return '%s: %s [%s]' % (self.artist.name, self.title, self.album.title)
        
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
        
class Meta(object):
    def __init__(self,
            date_added=None,
            last_modified=None):
        self.date_added = date_added
        self.last_modified = last_modified
        
    def to_dict(self):
        return {
            'a': self.date_added,
            'm': self.last_modified
        }