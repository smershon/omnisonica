import simplejson as json
import sys
import musicbrainz
import kt
import time
import omni_redis
import wiki
import spotify_client
import logging

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

spotify = spotify_client.Client()

def get_original_release(track):
    artist = track.artist.name.lower()
    title = kt.normalize(track.title)
    release_date = None
    for i in range(5):
        try:
            release_date = musicbrainz.earliest_date(artist, title)
        except Exception as e:
            print 'PROBLEM:', e
            time.sleep(0.5 * 2*i)
        else:
            break
    return release_date if release_date != '9999' else None

def update_track(track_uid):
    track = omni_redis.get_track(track_uid)
    
    if not track.original_release or track.original_release == 'None':
        log.info('getting original release date')
        try:
            track.original_release = get_original_release(track)
            time.sleep(0.5)
        except Exception as e:
            log.warn(e)
    if not track.artist.country or track.artist.country == 'None':
        log.info('getting country')
        try:
            track.artist.country = wiki.country_for_artist(track.artist.name)
            time.sleep(0.5)
        except Exception as e:
            log.warn(e)
    if not track.album.release_date or track.album.release_date == 'None':
        log.info('getting spotify release date')
        try:
            albums = list(spotify.get_albums([track.album.uid]))
            if albums:
                track.album.release_date = albums[0].release_date
            else:
                track.album.release_date = None
            time.sleep(0.5)
        except Exception as e:
            log.warn(e)
    
    log.info('putting track')
    omni_redis.put_track(track)

def main():
    while True:
        uid = omni_redis.qpop('tracks')
        if uid:
            log.info(uid)
            try:
                update_track(uid)
            except Exception as e:
                log.warn(e)
        else:
            time.sleep(1)
    
if __name__ == '__main__':
    main()