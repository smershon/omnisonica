import spotify_client
import omni_redis
import sys

def inject_tracks(user, view, uids):
    client = spotify_client.Client()
    tracks = client.track_data(uids)
    for track in tracks:
        omni_redis.put_track(track)
    omni_redis.export_view(user, view, uids)
    for uid in uids:
        omni_redis.qpush('tracks', uid)
    
if __name__ == '__main__':
    with open(sys.argv[2], 'rb') as f:
        uids = [x.split('/')[-1].split(':')[-1].strip() for x in f]
    inject_tracks('default', sys.argv[1], uids)