import logging

from flask import Flask
from flask import render_template
from flask import jsonify

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
    
if __name__ == '__main__':
    app.run()