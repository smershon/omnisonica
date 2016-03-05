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
    return render_template('index.html')

@app.route('/tracks/<user_id>')
def tracks(user_id=None):
    tracks = backend.get_tracks(user_id)
    return jsonify({'tracks': [x._to_dict() for x in tracks]})
    
if __name__ == '__main__':
    app.run()