import logging

from flask import Flask
from flask import render_template
from flask import jsonify
from flask import request

import backend

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html', views=backend.get_views())

@app.route('/<view>')
def view(view='all'):
    return render_template('tracks.html', view=view)

@app.route('/j/tracks/<view>')
def tracks(view=None):
    tracks = backend.get_tracks(view)
    return jsonify({'tracks': [x._to_dict() for x in tracks]})
    
@app.route('/j/search/tracks')
def search_tracks():
    search_term = request.args.get('term');
    return jsonify({'results': backend.search_tracks(search_term)})
    
if __name__ == '__main__':
    app.run()