function pad(width, n) {
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join("0") + n;
}

function format_time(milliseconds) {
    total_seconds = Math.round(milliseconds/1000);
    var hours = Math.floor(total_seconds/3600);
    var minutes = Math.floor((total_seconds%3600)/60);
    var seconds = total_seconds%60;
    if (hours) {
        return hours + ":" + pad(2, minutes) + ":" + pad(2, seconds);
    } else {
        return minutes + ":" + pad(2, seconds);
    }
}

function format_date_and_time(d) {
    var yr = d.getFullYear();
    var mos = d.getMonth() + 1;
    var day = d.getDate();
    var hr = d.getHours();
    var min = d.getMinutes();
    var sec = d.getSeconds();
    return yr + "-" + pad(2, mos) + "-" + pad(2, day) + " " +
           hr + ":" + pad(2, min) + ":" + pad(2, sec);
}

function parse_time(timestr) {
    if (!timestr) { return undefined; }
    var milliseconds = 0;
    _(timestr.split(":")).each(function(t) {
        milliseconds = 60*milliseconds + parseInt(t);
    });
    return 1000*milliseconds;
}

function search_term_for_track(track) {
    var artist_term = track.a.n.split(" ").filter(function(s) {
        return (s !== "&");
    }).join(" ");
    var track_term = "";
    var tokens = track.t.split(" ");
    for (i=0; i < tokens.length; i++) {
        var token = tokens[i];
        if (token.startsWith("-")) { break; }
        if (token.startsWith("(") && i > 0) { break; }
        track_term += " " + token;
    }
    return {"artist": artist_term, "track": track_term};
}

function track_slice(slice, tracks) {
    var returned_tracks = [];
    var total_time = 0;
    while (total_time < slice) {
        var track = tracks.splice(Math.floor(Math.random() * tracks.length), 1)[0];
        returned_tracks.push(track);
        total_time += track.d;
    }
    for(var i=0; i<50; i++) {
        var track = returned_tracks.splice(Math.floor(Math.random() * returned_tracks.length), 1)[0];
        total_time -= track.d;
        tracks.push(track);
        var next_track = closest_track_by_duration(tracks, slice - total_time);
        if (next_track) {
            returned_tracks.push(next_track);
            total_time += next_track.d;
        }
    }
    return returned_tracks;
}

function closest_track_by_duration(tracks, duration) {
    var best_track = undefined;
    var best_delta = Math.abs(duration);
    _(tracks).each(function(t) {
        var delta = Math.abs(duration - t.d);
        if (delta < best_delta) {
            best_track = t;
            best_delta = delta;
        }
    });
    return best_track;
}

function token_matches(search, tokens) {
    var matches = 0;
    _(tokens).each(function(token) {
        if (token.indexOf(search) > -1) { matches++; }
    });
    return matches;
}

function all_matches(search_tokens, str) {
    var match_tokens = str.toLowerCase().split(" ");
    var matched = true;
    _(search_tokens).each(function(token) {
        if (token_matches(token, match_tokens) < 1) {
            matched = false;
        }
    });
    return matched;   
}

function random_sample(src, max) {
    if (src.length <= max) {
        return src.splice(0, src.length);
    }
    var sample = [];
    var idx;
    while (sample.length < max) {
        idx = Math.floor(Math.random() * src.length);
        sample = sample.concat(src.splice(idx, 1));
    }
    return sample;
}

// Credit: https://github.com/coolaj86/knuth-shuffle
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function smart_shuffle(tracks) {
    var pl = [];
    var sample;
    var history;
    var best_score;
    var best_track;
    var cur_score;
    var artist_track_count = {};
    _(tracks).each(function(t) {
        artist_track_count[t.a.u] = artist_track_count[t.a.u] ?
            artist_track_count[t.a.u] + 1 : 1;
    });
    while (tracks.length > 0) {
        sample = random_sample(tracks, 10);
        history = pl.slice(-10);
        history.reverse();
        best_track = null;
        best_score = 0.0;
        _(sample).each(function(t) {
            cur_score = smart_shuffle_score(t, history, artist_track_count, 
                    tracks.length + sample.length);
            if (cur_score > best_score) {
                best_track = t;
                best_score = cur_score;
            }
        });
        pl.push(best_track);
        artist_track_count[best_track.a.u]--;
        sample.splice(sample.indexOf(best_track), 1);
        tracks = tracks.concat(sample);
    }
    return pl;
}

function smart_shuffle_score(track, hist, artist_track_count, total) {
    if (hist.length <= 0) { return track.p; }
    var score = 0.0;
    _(hist).each(function(h,i) {
        score += track_diff_score(track, h)/(i + 1.0);
    });
    return score + artist_track_count[track.a.u]/total;
}

function track_diff_score(t0, t1) {
    var score = 0.0;
    if (t0.a.u !== t1.a.u) { score += 1.0; }
    if (t0.c.u !== t1.c.u) { score += 0.5; }
    score += Math.abs(t0.p - t1.p)/200.0;
    var ddur = Math.abs(t0.d - t1.d)/1000.0;
    if (ddur > 180) { ddur = 180; }
    score += ddur/720.0;
    return score;
}

var TrackTable = function(div, meta_div) {
    this.table_type = "TrackTable";
    this.div = div;
    this.meta_div = meta_div;
    this.search_manager = new SearchTableManager(this);
    this.tracks = [];
    this.track_data = {};
    this.insert_html();
    this.attach_header_listeners();
    this.page = 1;
    this.page_size = 100;
};

TrackTable.prototype = {
    
    "row_template": _.template(`
        <tr class="trackrow" uid="<%= uid %>">
          <td class="uid">spotify:track:<%= track.u %></td>
          <td class="title"><%= track.t %></td>
          <td class="artist"><%= track.a.n %></td>
          <td class="album"><%= track.c.t %></td>
          <td class="duration"><%= duration %></td>
          <td class="release_date"><%= track.c.r %></td>
          <td class="popularity"><%= track.p %></td>
          <td class="original_release"><%= track.r %></td>
          <td class="artist_country"><%= track.a.c %></td>
          <td class="added"><%= added %></td>
          <td class="modified"><%= modified %></td>
          <td>
            <button class="remove">X</button>
            <button class="search">...</button>
          </td>
        </tr>
    `),
    
    "meta_template": _.template(`
        <div class="shown_track_meta">Shown: <%= shown.tracks %> / <%= shown.time %></div>
        <div class="total_track_meta">Total: <%= total.tracks %> / <%= total.time %></div>
    `),
    
    "insert_html": function() {
        this.div.html(`
            <button class="last_page">last</button>
            <button class="next_page">next</button>
            <table class="tracktable">
              <thead>
                <tr class="header">
                  <th class="column_uid">uid</th>
                  <th class="column_track">
                    <button class="sort_button">Title</button>
                    <input type="text" id="title_filter"></input>
                  </th>
                  <th class="column_artist">
                    <button class="sort_button">Artist</button>
                    <input type="text" id="artist_filter"></input>
                  </th>
                  <th class="column_album">
                    <button class="sort_button">Album</button>
                    <input type="text" id="album_filter"></input>
                  </th>
                  <th class="column_duration">
                    <button class="sort_button">Duration</button>
                    <div>Min: <input type="text" class="duration" id="min_duration"></input></div>
                    <div>Max: <input type="text" class="duration" id="max_duration"></input></div>    
                  </th>
                  <th class="column_release_date">
                    <button class="sort_button">Release Date</button><br/>
                    <div>Min: <input type="text" class="date" id="min_date"></input></div>
                    <div>Max: <input type="text" class="date" id="max_date"></input></div>
                  </th>
                  <th class="column_popularity">
                    <button class="sort_button">Popularity</button>
                    <div>Min: <input type="text" class="popularity" id="min_popularity"></input></div>
                    <div>Max: <input type="text" class="popularity" id="max_popularity"></input></div>
                  </th>
                  <th class="column_original_release">
                    <button class="sort_button">Original Release Date</button>
                    <div>Min: <input type="text" class="date" id="min_orig_date"></input></div>
                    <div>Max: <input type="text" class="date" id="max_orig_date"></input></div>
                  </th>
                  <th class="column_artist_country">
                    <button class="sort_button">Country</button>
                    <input type="text" id="artist_country_filter"></input>
                  </th>
                  <th class="column_added">
                    <button class="sort_button">Added</button>
                  </th>
                  <th class="column_modified">
                    <button class="sort_button">Modified</button>
                  </th>
                  <th class="column_action">Action</th>
                </tr>
              </thead>
              <tbody class="data">
              </tbody>
            </table>
            <button class="last_page">last</button>
            <button class="next_page">next</button>
        `);
    },
    
    "attach_header_listeners": function() {
        var table = this;
        table.make_sortable(".column_track", function(t) { return t.t.toLowerCase(); });
        table.make_sortable(".column_artist", function(t) { return t.a.n.toLowerCase(); });
        table.make_sortable(".column_album", function(t) { return t.c.t.toLowerCase(); });
        table.make_sortable(".column_duration", function(t) { return t.d; });
        table.make_sortable(".column_release_date", function(t) { return t.c.r; });
        table.make_sortable(".column_popularity", function(t) { return -t.p; });
        table.make_sortable(".column_original_release", function(t) { return t.r; });
        table.make_sortable(".column_artist_country", function(t) { return t.a.c; });
        table.make_sortable(".column_added", function(t) { return t.m.a; });
        table.make_sortable(".column_modified", function(t) { return t.m.m; });
        table.div.find("th input").keypress(function(e) {
            if (e.which == 13) {
                table.filter_display();
            }
        });
        table.div.find("button.last_page").click(function() { table.last_page(); });
        table.div.find("button.next_page").click(function() { table.next_page(); });
    },
    
    "compile_filter": function() {
        return {
            "title_filter": this.div.find("#title_filter").val().toLowerCase().split(" "),
            "artist_filter": this.div.find("#artist_filter").val().toLowerCase().split(" "),
            "album_filter": this.div.find("#album_filter").val().toLowerCase().split(" "),
            "max_duration": parse_time(this.div.find("#max_duration").val()),
            "min_duration": parse_time(this.div.find("#min_duration").val()),
            "max_date": this.div.find("#max_date").val(),
            "min_date": this.div.find("#min_date").val(),
            "min_popularity": this.div.find("#min_popularity").val(),
            "max_popularity": this.div.find("#max_popularity").val(),
            "min_orig_date": this.div.find("#min_orig_date").val(),
            "max_orig_date": this.div.find("#max_orig_date").val(),
            "artist_country_filter": this.div.find("#artist_country_filter").val()
        }
    },
    
    "show_track": function(uid, params) {
        var track = this.track_data[uid];
        if (params.title_filter && !all_matches(params.title_filter, track.t)) {
            return false;
        }
        if (params.artist_filter && !all_matches(params.artist_filter, track.a.n)) {
            return false;
        }
        if (params.album_filter && !all_matches(params.album_filter, track.c.t)) {
            return false;
        }
        if (params.min_duration && track.d < params.min_duration) {
            return false;
        }
        if (params.max_duration && track.d > params.max_duration) {
            return false;
        }
        if (params.min_date && track.c.r < params.min_date) {
            return false;
        }
        if (params.max_date && track.c.r > params.max_date) {
            return false;
        }
        if (params.min_popularity && track.p < params.min_popularity) {
            return false;
        }
        if (params.max_popularity && track.p > params.max_popularity) {
            return false;
        }
        if (params.min_orig_date && track.r < params.min_orig_date) {
            return false;
        }
        if (params.max_orig_date && track.r > params.max_orig_date) {
            return false;
        }
        if (params.artist_country_filter && track.a.c != params.artist_country_filter) {
            return false;
        }
        
        return true;
    },
    
    "filter_display": function() {
        var table = this;
        var params = table.compile_filter();
        var uid;
        var track;
        var trackrow;
        
        _(table.tracks).each(function(uid) {
            track = table.track_data[uid];
            track.v = table.show_track(uid, params);
        });
        
        /*
        table.div.find(".trackrow").each(function(i,row) {
            trackrow = $(row);
            uid = trackrow.attr("uid");
            track = table.track_data[uid]; 
            track.v = table.show_track(uid, params);
            if(track.v) {
                trackrow.show();
            } else {
                trackrow.hide();
            }
        });*/
        
        table.reset_display();
        table.redisplay_meta();
    },
    
    "filter_columns": function() {
        var table = this;
        $("#column_selection input").each(function(i,e) {
            var header_column = table.div.find("th.column_" + $(e).val());
            var body_column = table.div.find("td." + $(e).val());
            if ($(e).is(":checked")) {
                header_column.show();
                body_column.show();
            } else {
                header_column.hide();
                body_column.hide();
            }
        });   
    },
    
    "make_sortable": function(column, sort_fn) {
        var table = this;
        table.div.find(".header " + column + " .sort_button").click(function() {
            var sorting = $(this).attr("sorting");
            $(table.div).find(".sort_button").removeAttr("sorting");
            if (!sorting) {
                $(this).attr("sorting", "asc");
                table.tracks = _.sortBy(table.tracks, function(uri) {
                    return sort_fn(table.track_data[uri]); });
            } else if (sorting === "asc") {
                $(this).attr("sorting", "desc");
                table.tracks = _.sortBy(table.tracks, function(uri) {
                    return sort_fn(table.track_data[uri]); });
                table.tracks.reverse();
            } else {
                $(this).removeAttr("sorting");
                table.tracks = _.sortBy(table.tracks, function(uri) {
                    return table.track_data[uri].idx; });
            }
            table.reset_display();
            table.reset_row_listeners();    
        });        
    },
    
    "load_tracks_from_url": function(url, callback) {
        var table = this;
        $.get(url, function(data) {
            var idx = table.next_idx();
            _(data.tracks).each(function(t) {
                t.idx = idx++;
                t.v = true;
                t.d = parseInt(t.d);
                t.p = parseInt(t.p);
                t.m.a = new Date(1000*parseInt(t.m.a));
                t.m.m = new Date(1000*parseInt(t.m.m));
                var uid = t.u.split(":").pop();
                table.tracks.push(uid);
                table.track_data[uid] = t;
            });
            table.reset_display();
            table.reset_row_listeners();
            if (callback) {
                callback();
            }
        });        
    },
    
    "reset_display": function() {
        var table = this;
        track_html = "";
        var shown = 0;
        for (var i = 0; i < table.tracks.length && shown < table.page*table.page_size; i++) {
            var uid = table.tracks[i];
            var track = table.track_data[uid];
            if (track.v) {
                if (shown >= (table.page - 1)*table.page_size) {
                    track_html += table.row_template({
                        "track": track,
                        "uid": uid,
                        "duration": format_time(track.d),
                        "added": format_date_and_time(track.m.a),
                        "modified": format_date_and_time(track.m.m)
                    });
                }
                shown++;              
            }
        }    
        table.div.find(".data").html(track_html);
        table.filter_columns();
        table.redisplay_meta();
    },
    
    "reset_row_listeners": function() {
        var table = this;
        table.div.find("button.remove").unbind("click");
        table.div.find("button.search").unbind("click");
        table.div.find("button.remove").click(function() {
            table.remove_track($(this).parent().parent().attr("uid"));
        });
        table.div.find("button.search").click(function() {
            table.inline_search_results($(this).parent().parent());
        });
    },
    
    "next_page": function() {
        this.page++;
        this.reset_display();
    },
    
    "last_page": function() {
        this.page--;
        this.reset_display();
    },
    
    "add_track": function(track) {
        track.idx = this.next_idx();
        track.m = {"a": new Date(), "m": new Date()};
        var uid = track.u.split(":").pop();
        this.tracks.push(uid);
        this.track_data[uid] = track;
        track.v = this.show_track(uid, this.compile_filter());
        this.div.find(".data").append(this.row_template({
            "track": track,
            "uid": uid,
            "visibility": track.v ? "table-row" : "none",
            "duration": format_time(track.d),
            "added": format_date_and_time(track.m.a),
            "modified": format_date_and_time(track.m.m)
        }));
        this.reset_row_listeners();
        this.filter_columns();
        this.redisplay_meta();
    },
    
    "remove_track": function(uid) {

        var idx = this.tracks.indexOf(uid);
        if (idx > -1) {
            this.tracks.splice(idx, 1);
        }
        if (this.tracks.indexOf(uid) < 0) {
            delete(this.track_data[uid]);
        }
        this.div.find("tr[uid='" + uid + "']").first().remove();
        this.redisplay_meta();
    },
    
    "replace_track": function(uid, track) {
        var new_uid = track.u.split(":").pop();
        var old_track = this.track_data[uid];
        track.idx = old_track.idx;
        track.m = {"a": old_track.m.a, "m": new Date()};
        delete(this.track_data[uid])
        var idx = this.tracks.indexOf(uid);
        if (idx >= -1) { 
            this.tracks[idx] = new_uid;
        }
        this.track_data[new_uid] = track;
        track.v = this.show_track(new_uid, this.compile_filter());
        var row = this.div.find(".trackrow[uid='" + uid + "']");
        row.replaceWith(this.row_template({
            "track": track,
            "uid": new_uid,
            "visibility": track.v ? "table-row" : "none",
            "duration": format_time(track.d),
            "added": format_date_and_time(track.m.a),
            "modified": format_date_and_time(track.m.m)
        }));
        this.reset_row_listeners();
        this.filter_columns();
    },
    
    "injest_tracks": function(tracklist) {
        var table = this;
        var seen_tracks = new Set();
        tracklist = tracklist.filter(function(uid) {
            if (seen_tracks.has(uid) || table.track_data[uid]) { return false; }
            seen_tracks.add(uid);
            return true;
        });
        $.ajax({
            type: "POST",
            contentType: "application/json; charset=utf-8",
            url: "j/trackdata",
            data: JSON.stringify(tracklist),
            success: function(data) {
                var seen_artist_tracks = new Set();
                _(table.tracks).each(function(uid) {
                    var keys = search_term_for_track(table.track_data[uid]);
                    seen_artist_tracks.add(keys.artist + "###sep###" + keys.track);
                });
                _(data.tracks).each(function(track) {
                    var keys = search_term_for_track(track);
                    var key = keys.artist + "###sep###" + keys.track;
                    if (!seen_artist_tracks.has(key)) {
                        table.add_track(track);
                        seen_artist_tracks.add(key);
                    }
                });
            },
            dataType: "json"          
        });
    },
    
    inline_search_results: function(row) {
        var table = this;
        var uid = row.attr("uid");
        var track = table.track_data[uid];
        var search_term = search_term_for_track(track);
        var div = $(`<tr><td colspan="6"></td></tr>`);
        div.insertAfter(row);
        var st = new InlineSearchTable(div.find("td"), this.search_manager, uid, {
            "on_hide": function() { div.remove(); }
        });
        st.search_from_url("j/search/tracks", 
            { "term": search_term.artist + " " + search_term.track }
        );      
    },
    
    "get_tracks": function(visible, slice, ordering) {
        var table = this;
        var returned_tracks = [];
        _(table.tracks).each(function(uid) {
            var t = table.track_data[uid];
            if (!visible || t.v) { returned_tracks.push(t); }
        });
        
        if (slice) {
            returned_tracks = track_slice(slice, returned_tracks)
        }
        
        if (ordering === "random") {
            returned_tracks = shuffle(returned_tracks);
        } else if (ordering === "smart") {
            returned_tracks = smart_shuffle(returned_tracks);
        }
        
        return returned_tracks;
    },

    "get_meta": function() {
        var table = this;
        var total_tracks = 0;
        var total_time = 0;
        var shown_tracks = 0;
        var shown_time = 0;
        _(table.tracks).each(function(uid) {
            var track = table.track_data[uid];
            total_tracks += 1;
            total_time += track.d;
            if (track.v) {
                shown_tracks += 1;
                shown_time += track.d;
            }
        });
        return {
            "total": {
                "tracks": total_tracks,
                "time": format_time(total_time)
            },
            "shown": {
                "tracks": shown_tracks,
                "time": format_time(shown_time)
            }
        }
    },
    
    "redisplay_meta": function() {
        this.meta_div.html(this.meta_template(this.get_meta()));
    },
    
    "next_idx": function() {
        var table = this;
        var idx = 0;
        _(this.tracks).each(function(uri) {
            if (table.track_data[uri].idx > idx) {
                idx = table.track_data[uri].idx;
            }
        });
        return idx + 1;
    },
    
    "log_me": function() {
        console.log(this.table_type + " " + this.div.selector);
    }
    
};

var SearchTable = function(div, manager, fns) {
    this.table_type = "SearchTable";
    this.div = div;
    this.fns = fns || {};
    this.manager = manager;
    this.manager.tables.push(this);
    this.tracks = [];
    this.track_data = {};
    this.insert_html();
    //this.attach_header_listeners();    
};

SearchTable.prototype = {
  
    "row_template": _.template(`
        <tr class="searchrow" uid="<%= uid %>">
          <td class="uid"><%= track.u %></td>
          <td class="title"><%= track.t %></td>
          <td class="artist"><%= track.a.n %></td>
          <td class="album"><%= track.c.t %></td>
          <td class="duration"><%= duration %></td>
          <td class="release_date"><%= track.c.r %></td>
          <td class="actions"><button class="<%= action.clazz %>"><%= action.txt %></button></td>
        </tr>
    `),
    
    "template_values": {
        "add": { "clazz": "add", "txt": "+" },
        "remove": { "clazz": "remove", "txt": "X" },
        "replace": { "clazz": "replace", "txt": "=" }
    },
  
    "insert_html": function() {
        this.div.html(`
            <table class="searchtable">
              <thead>
                <tr class="header">
                  <th class="column_uid">uid</th>
                  <th class="column_track"><button class="sort_button">title</button></th>
                  <th class="column_artist"><button class="sort_button">artist</button></th>
                  <th class="column_album"><button class="sort_button">album</button></th>
                  <th class="column_duration"><button class="sort_button">duration</button></th>
                  <th class="column_release_date"><button class="sort_button">release date</button><br/></th>
                  <th class="column_action">action</th>
                </tr>
              </thead>
              <tbody class="data">
              </tbody>
            </table>
        `);
    },
    
    "reset_display": function() {
        var table = this;
        track_html = "";
        _(table.tracks).each(function(uid) {
            var track = table.track_data[uid];
            track_html += table.row_template({
                "track": track,
                "uid": uid,
                "duration": format_time(track.d)
            });
        });
        table.div.find(".data").html(track_html);
    },
 
    "inject_search_results": function(tracks) {
        var table = this;
        var results_html = `<button class="hide_results" style="float: right;">hide</button><br/>
                            <table class="search_results_table"><tbody>`;
                            
        if (table.fns.on_pre) { table.fns.pre(); }
        
        _(tracks).each(function(t) {
            var uid = t.u.split(":").pop();
            table.tracks.push(uid);
            table.track_data[uid] = t;
            results_html += table.row_template({
                "track": t,
                "action": table.manager.target_table.track_data[uid] ? 
                    table.template_values.remove : table.template_values.add,
                "duration": format_time(t.d),
                "uid": uid
            });
            if (table.fns.on_success) { table.fns.on_success(); }
        });
        
        results_html += "</tbody></table>";
        table.div.html(results_html);
        table.reset_row_listeners(); 
    },
    
    "reset_row_listeners": function() {
        var table = this;
        
        table.div.find(".add").unbind("click");
        table.div.find(".remove").unbind("click");
        table.div.find(".hide_results").unbind("click");
        
        table.div.find(".add").click(function() {
            table.add_track($(this).parent().parent().attr("uid"));
            if (table.fns.on_add) { table.fns.on_add(); }
        });
        
        table.div.find(".remove").click(function() {
            table.remove_track($(this).parent().parent().attr("uid"));
            if (table.fns.on_remove) { table.fns.on_remove(); }
        });
        
        table.div.find(".hide_results").click(function() {
            table.div.html("");
            table.manager.remove_table(table);
            if (table.fns.on_hide) { table.fns.on_hide(); }
        });         
    },
    
    "add_track": function(uid) {
        this.manager.add_track(this.track_data[uid]);
    },
    
    "remove_track": function(uid) {
        this.manager.remove_track(uid);
    },
    
    "mark_track_added": function(uid) {
        this.div.find("tr[uid='" + uid + "']").find(".actions").html(`
            <button class="remove">X</button>
        `);
        this.reset_row_listeners();
    },
    
    "mark_track_removed": function(uid) {
        this.div.find("tr[uid='" + uid + "']").find(".actions").html(`
            <button class="add">+</button>
        `);
        this.reset_row_listeners();       
    },
    
    "search_from_url": function(url, form) {
        var table = this;
        $.get(url, form, function(data) {
            table.inject_search_results(data.tracks);
        });
    },
  
    "log_me": TrackTable.prototype.log_me
    
};

var SearchTableManager = function(target_table) {
    this.tables = [];
    this.target_table = target_table;
};

var InlineSearchTable = function(div, manager, parent_uid, fns) {
    this.table_type = "InlineSearchTable";
    this.div = div;
    this.parent_uid = parent_uid;
    this.fns = fns || {};
    this.manager = manager;
    this.manager.tables.push(this);
    this.tracks = [];
    this.track_data = {};
    this.insert_html();
    //this.attach_header_listeners();    
};

InlineSearchTable.prototype = {

    "row_template": _.template(`
        <tr class="searchrow" uid="<%= uid %>">
          <td class="uid"><%= track.u %></td>
          <td class="title"><%= track.t %></td>
          <td class="artist"><%= track.a.n %></td>
          <td class="album"><%= track.c.t %></td>
          <td class="duration"><%= duration %></td>
          <td class="release_date"><%= track.c.r %></td>
          <td class="actions">
            <button class="<%= action.clazz %>"><%= action.txt %></button>
            <button class="replace">=</button>
          </td>
        </tr>
    `),
    
    "mark_track_added": function(uid) {
        this.div.find("tr[uid='" + uid + "']").find(".actions").html(`
            <button class="remove">X</button>
            <button class="replace">=</button>
        `);
        this.reset_row_listeners();
    },
    
    "mark_track_removed": function(uid) {
        this.div.find("tr[uid='" + uid + "']").find(".actions").html(`
            <button class="add">+</button>
            <button class="replace">=</button>
        `);
        this.reset_row_listeners();       
    },
    
    "reset_row_listeners": function() {
        var table = this;
        SearchTable.prototype.reset_row_listeners.call(table);
        table.div.find(".replace").click(function() {
            var uid = $(this).parent().parent().attr("uid");
            table.manager.replace_track(table.parent_uid, table.track_data[uid])
            table.parent_uid = uid;
        });
    },
    
    "insert_html": SearchTable.prototype.insert_html,
    "search_from_url": SearchTable.prototype.search_from_url,
    "inject_search_results": SearchTable.prototype.inject_search_results,
    "add_track": SearchTable.prototype.add_track,
    "remove_track": SearchTable.prototype.remove_track,
    "template_values": SearchTable.prototype.template_values
    
};

SearchTableManager.prototype = {
  
    "add_track": function(track) {
        this.target_table.add_track(track);
        var uid = track.u.split(":").pop();
        _(this.tables).each(function(t) {
            t.mark_track_added(uid);
        });
    },
    
    "remove_track": function(uid) {
        this.target_table.remove_track(uid);
        _(this.tables).each(function(t) {
            t.mark_track_removed(uid);
        });
    },
    
    "remove_table": function(table) {
        var idx = this.tables.indexOf(table);
        if (idx > -1) {
            this.tables.splice(idx, 1);
        }       
    },
    
    "replace_track": function(uid, track) {
        var new_uid = track.u.split(":").pop();
        this.target_table.replace_track(uid, track);
        _(this.tables).each(function(t) {
            t.mark_track_added(new_uid);
            t.mark_track_removed(uid);
        });
    }
    
};
