import requests
import sys

def earliest_date(artist_name, title, offset=0):
    tmpl = 'http://musicbrainz.org/ws/2/recording/?query="%s" AND artist:"%s" AND status:official&offset=%d&fmt=json'
    url = tmpl % (title, artist_name, offset)
    print url
    resp = requests.get(url)
    doc = resp.json()
    big_dates = set()
    small_dates = set()
    for rec in doc['recordings']:
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