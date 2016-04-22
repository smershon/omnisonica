import requests
import sys
from HTMLParser import HTMLParser
from collections import defaultdict

class WikiHTMLParser(HTMLParser):
    
    def __init__(self, fields):
        HTMLParser.__init__(self)
        self.in_infobox = False
        self.fields = fields
        self.active_field = None
        self.table_count = 0
        self.field_data = defaultdict(list)
    
    def handle_starttag(self, tag, attrs):
        if tag == 'table':
            attributes = dict(attrs)
            classes = attributes.get('class','').split(' ')
            if 'infobox' in classes:
                self.in_infobox = True
                self.table_count += 1
        
    def handle_endtag(self, tag):
        if self.in_infobox:
            if tag == 'table':
                self.table_count -= 1
                if self.table_count <= 0:
                    self.in_infobox= False
            if tag == 'tr':
                self.active_field = None
        
    def handle_data(self, data):
        if self.in_infobox:
            if data in self.fields:
                self.active_field = data
            elif self.active_field:
                self.field_data[self.active_field].append(data)

def get_page(title):
    url = 'https://en.wikipedia.org/wiki/%s' % title
    r = requests.get(url)
    return r.text
    
def parse_page(title, fields):
    parser = WikiHTMLParser(fields)
    parser.feed(get_page(title))
    return parser.field_data
 
countries = {
    'england': 'UK',
    'wales': 'UK',
    'scotland': 'UK',
    'northern ireland': 'UK',
    'uk': 'UK',
    'united kingdom': 'UK',
    'london': 'UK',
    'essex': 'UK',

    'us': 'US',
    'usa': 'US',
    'united states': 'US',
    'united states of america': 'US',
    'new york city': 'US',
    'CA': 'US',
    'hawaii': 'US',
    'new york': 'US',
    'florida': 'US',
    'missouri': 'US',
    'california': 'US',
    'delaware': 'US',
    'massachusetts': 'US',

    'france': 'FR',
    'germany': 'DE',
    'australia': 'AU',
    'sweden': 'SE',
    'norway': 'NO',
    'canada': 'CA',
    'netherlands': 'NL',
    'ireland': 'IE'
} 
 
def get_country(title):
    fields = ['Born', 'Origin']
    data = parse_page(title, fields)
    for field in fields:
        for token in reversed(data[field]):
            token = str(token)
            token = token.replace(',', '').replace('.', '').strip().lower()
            if token in countries:
                return countries[token]
            else:
                for subtoken in reversed(token.split(' ')):
                    if subtoken in countries:
                        return countries[subtoken]
                bigram = ' '.join(token.split(' ')[-2:])
                if bigram in countries:
                    return countries[bigram]
                trigram = ' '.join(token.split(' ')[-3:])
                if trigram in countries:
                    return countries[trigram]
                
def country_for_artist(artist):
    artist_tokens = []
    for i,token in enumerate(artist.split(' ')):
        if i > 0:
            if token == 'The':
                artist_tokens.append('the')
            elif token == 'Of':
                artist_tokens.append('of')
            else:
                artist_tokens.append(token)
        else:
            artist_tokens.append(token)
    artist = '_'.join(artist_tokens)
    country = get_country(artist)
    if not country:
        country = get_country('%s_(band)' % artist)
    if not country:
        country = get_country('%s_(musician)' % artist)
    if not country:
        country = get_country('%s_(singer)' % artist)
    if not country:
        country = get_country('%s_(American_band)' % artist)
    return country

def from_file():
    import simplejson as json
    artists = set()
    not_found = set()
    with open(sys.argv[1], 'rb') as f:
        for line in f:
            doc = json.loads(line)
            artists.add(doc['a']['n'])
    for i,artist in enumerate(artists):
        country = country_for_artist(artist)
        print '%d/%d' % (i, len(artists)), artist, country
        if not country:
            not_found.add(artist)
    print '\nNOT FOUND'
    for artist in not_found:
        print artist
 
def just_one():
    print country_for_artist(sys.argv[1])
    
if __name__ == '__main__':
    from_file()
