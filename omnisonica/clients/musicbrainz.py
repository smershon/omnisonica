import requests
import urllib
import sys
import logging

log = logging.getLogger(__name__)

def earliest_date(artist_name, title, offset=0, us_only=True):
    insert = ' AND country:US' if us_only else ''
    tmpl = 'http://musicbrainz.org/ws/2/recording/?%s'
    url = tmpl % urllib.urlencode({
        'query': '"%s" AND artist:"%s" AND status:official%s' % (title, artist_name, insert), 
        'offset': offset,
        'fmt': 'json'
    })
    log.info(url)
    resp = requests.get(url)
    log.info('... %r', resp.status_code)
    doc = resp.json()
    big_dates = set()
    small_dates = set()
    for rec in doc.get('recordings', []):
        for release in rec['releases']:
            if 'date' in release:
                date = release['date']
                if len(date) >= 10:
                    big_dates.add(date)
                else:
                    small_dates.add(date)
    offset = offset + 25
    earliest_small = '9999'
    if small_dates:
        earliest_small = min(small_dates)
    earliest_big = '9999'
    if big_dates:
        earliest_big = min(big_dates)
    earliest = earliest_small if earliest_small < earliest_big[:4] else earliest_big
        
    if offset < doc['count']:
        earliest = min(earliest, (earliest_date(artist_name, title, offset)))
    return earliest
    
if __name__ == '__main__':
    print earliest_date(sys.argv[1], sys.argv[2])