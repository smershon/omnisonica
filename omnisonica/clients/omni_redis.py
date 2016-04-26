import redis

r = redis.Redis()

def get_view(user, name):
    key = 'V:%s:%s' % (user, name)
    track_uids = r.lrange(key, 0, -1)
    return [get_track(x) for x in track_uids]
    
def put_view(user, name, tracks):
    key = 'V:%s:%s' % (user, name)
    r.delete(key)
    r.rpush(key, *[t.uid.split(':')[-1] for t in tracks])
    for track in tracks:
        put_track(track)

def get_track(track_uid):
    key = 'T:%s' % track_uid
    return r.hgetall(key)
    
def put_track(track):
    key = 'T:%s' % track.uid
    r.hmset(key,
        't': track.title,
        'd': track.duration,
        'p': track.popularity,
        'a': track.artist.uid,
        'c': track.album.uid)
    put_artist(track.artist)
    put_album(track.album)
    
def get_artist(artist_uid):
    key = 'A:%s' % artist_uid
    return r.hgetall(key)
    
def put_artist(artist):
    key = 'A:%s' % artist_uid
    r.hmset(key,
        'n', artist.name,
        'c', artist.country)
        
def get_album(album_uid):
    key = 'C:%s' % album_uid
    return r.hgetall(key)
    
def put_album(album):
    key = 'C:%s' % album.uid
    r.hmset(key,
        't': album.title,
        'r': album.release_date,
        'i': album.image_url)
