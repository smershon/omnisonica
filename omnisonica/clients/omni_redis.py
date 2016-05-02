import redis
import simplejson as json
import datatype
import util

r = redis.Redis()

def qpop(topic):
    return r.lpop('Q:%s' % topic)
    
def qpush(topic, datum):
    r.rpush('Q:%s' % topic, datum)

def list_views(user):
    return r.smembers('U:%s:views' % user)
    
def add_view(user, view):
    r.sadd('U:%s:views' % user, view)

def get_view(user, name):
    key = 'V:%s:%s' % (user, name)
    track_rows = [json.loads(x) for x in r.lrange(key, 0, -1)]
    track_lookup = get_tracks([x[0] for x in track_rows])
    tracks = []
    for row in track_rows:
        track = track_lookup.get(row[0])
        if track:
            track['m'] = row[1]
            tracks.append(track)
    util.batch_retrieve(tracks, 'a', get_artists)
    util.batch_retrieve(tracks, 'c', get_albums)       
    return [datatype.track_from_dict(x) for x in tracks]
    
def put_view(user, name, tracks):
    add_view(user, name)
    key = 'V:%s:%s' % (user, name)
    r.delete(key)
    data = [json.dumps((t.uid.split(':')[-1], t.meta._to_dict())) for t in tracks]
    r.rpush(key, *data)
    for track in tracks:
        put_track(track)
        
def export_view(user, name, uids):
    data = [json.dumps((uid, datatype.blank_meta()._to_dict())) for uid in uids]
    add_view(user, name)
    key = 'V:%s:%s' % (user, name)
    r.delete(key)
    r.rpush(key, *data)

def get_track(track_uid):
    key = 'T:%s' % track_uid
    track = r.hgetall(key)
    track['u'] = track_uid
    track['a'] = get_artist(track['a'])
    track['c'] = get_album(track['c'])
    return datatype.track_from_dict(track)
    
def get_tracks(uids):
    pipe = r.pipeline()
    for uid in uids:
        pipe.hgetall('T:%s' % uid)
    docs = pipe.execute()
    data = (zip(uids, docs))
    for uid, doc in data:
        doc['u'] = uid
    return dict(data)
    
def put_track(track):
    key = 'T:%s' % track.uid.split(':')[-1]
    r.hmset(key, {
        't': track.title,
        'd': track.duration,
        'p': track.popularity,
        'r': track.original_release,
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
    
def get_artists(uids):
    pipe = r.pipeline()
    for uid in uids:
        pipe.hgetall('A:%s' % uid)
    docs = pipe.execute()
    data = (zip(uids, docs))
    for uid, doc in data:
        doc['u'] = uid
    return dict(data)
    
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
    
def get_albums(uids):
    pipe = r.pipeline()
    for uid in uids:
        pipe.hgetall('C:%s' % uid)
    docs = pipe.execute()
    data = (zip(uids, docs))
    for uid, doc in data:
        doc['u'] = uid
    return dict(data)
    
def put_album(album):
    key = 'C:%s' % album.uid.split(':')[-1]
    r.hmset(key, {
        't': album.title,
        'r': album.release_date,
        'i': album.image_url
    })
