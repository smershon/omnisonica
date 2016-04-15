from optparse import OptionParser
import simplejson as json
import spotify_client

def migrate(path_in, path_out):
    client = spotify_client.Client()
    uris = []
    with open(path_in, 'rb') as f:
        for line in f:
            doc = json.loads(line)
            uris.append(doc['u'])
    tracks = client.track_data(uris)
    with open(path_out, 'wb') as f:
        for t in tracks:
            f.write('%s\n' % json.dumps(t._to_dict()))

def main():
    parser = OptionParser()
    parser.add_option('-i', dest='input')
    parser.add_option('-o', dest='output')
    
    options, args = parser.parse_args()
    
    migrate(options.input, options.output) 


if __name__ == '__main__':
    main()