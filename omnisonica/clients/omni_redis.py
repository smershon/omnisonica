import redis
import simplejson as json
import datatype

r = redis.Redis()

def list_views(user):
    return r.smembers('U:%s:views' % user)
    
def add_view(user, view):
    r.sadd('U:%s:views' % user, view)

def get_view(user, name):
    key = 'V:%s:%s' % (user, name)
    track_rows = [json.loads(x) for x in r.lrange(key, 0, -1)]
    tracks = []
    for row in track_rows:
        track = get_track(row[0])
        track['m'] = row[1]
        tracks.append(datatype.track_from_dict(track))
    return tracks
    
def put_view(user, name, tracks):
    add_view(user, name)
    key = 'V:%s:%s' % (user, name)
    r.delete(key)
    data = [json.dumps((t.uid.split(':')[-1], t.meta._to_dict())) for t in tracks]
    r.rpush(key, *data)
    for track in tracks:
        put_track(track)

def get_track(track_uid):
    key = 'T:%s' % track_uid
    track = r.hgetall(key)
    track['u'] = track_uid
    track['a'] = get_artist(track['a'])
    track['c'] = get_album(track['c'])
    return track
    
def put_track(track):
    key = 'T:%s' % track.uid.split(':')[-1]
    r.hmset(key, {
        't': track.title,
        'd': track.duration,
        'p': track.popularity,
        'a': track.artist.uid.split(':')[-1],
        'c': track.album.uid.split(':')[-1]
    })
    put_artist(track.artist)
    put_album(track.album)
    
def get_artist(artist_uid):
    key = 'A:%s' % artist_uid
    artist = r.hgetall(key)
    artist['u'] = artist_uid
    return artist 
    
def put_artist(artist):
    key = 'A:%s' % artist.uid.split(':')[-1]
    r.hmset(key, {
        'n': artist.name,
        'c': artist.country
    })
        
def get_album(album_uid):
    key = 'C:%s' % album_uid
    album = r.hgetall(key)
    album['u'] = album_uid
    return album
    
def put_album(album):
    key = 'C:%s' % album.uid.split(':')[-1]
    r.hmset(key, {
        't': album.title,
        'r': album.release_date,
        'i': album.image_url
    })
