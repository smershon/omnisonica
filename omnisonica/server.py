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
    search_term = request.args.get('term')
    return jsonify({'tracks': [x._to_dict() for x in backend.search_tracks(search_term)]})
 
@app.route('/j/trackdata', methods=['POST'])
def trackdata():
    tracks = ['spotify:track:%s' % x for x in request.json]
    return jsonify({'tracks': [x._to_dict() for x in backend.track_data(tracks)]})
    
@app.route('/save_view/<view_name>', methods=['POST'])
def save_view(view_name):
    data = request.json
    backend.save_view(view_name, data)
    return jsonify({'result': 'saved'})
    
@app.route('/export_view/<view_name>', methods=['POST'])
def export_view(view_name):
    uids = request.json
    backend.export_view(view_name, uids)
    return jsonify({'results': 'exported'})
    
if __name__ == '__main__':
    app.run()