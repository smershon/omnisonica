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

function search_term_for_track(track) {
    var artist_term = track.a.n.split(" ").filter(function(s) {
        return (s !== "&amp;");
    }).join(" ");
    var track_term = "";
    var tokens = track.t.split(" ");
    for (i=0; i < tokens.length; i++) {
        var token = tokens[i];
        if (token.startsWith("-")) { break; }
        if (token.startsWith("(") && i > 0) { break; }
        track_term += " " + token;
    }
    return artist_term + track_term;
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
};

TrackTable.prototype = {
    
    "row_template": _.template(`
        <tr class="trackrow" uid="<%= uid %>" style="display:<%= visibility %>;">
          <td class="uid"><%= track.u %></td>
          <td class="title"><%= track.t %></td>
          <td class="artist"><%= track.a.n %></td>
          <td class="album"><%= track.c.t %></td>
          <td class="duration"><%= duration %></td>
          <td class="release_date"><%= track.c.r %></td>
          <td>
            <button class="remove">remove</button>
            <button class="search">search</button>
          </td>
        </tr>
    `),
    
    "meta_template": _.template(`
        <div class="shown_track_meta">Shown: <%= shown.tracks %> / <%= shown.time %></div>
        <div class="total_track_meta">Total: <%= total.tracks %> / <%= total.time %></div>
    `),
    
    "insert_html": function() {
        this.div.html(`
            <table class="tracktable">
              <thead>
                <tr class="header">
                  <th class="column_uid">uid</th>
                  <th class="column_track"><button class="sort_button">title</button></th>
                  <th class="column_artist"><button class="sort_button">artist</button></th>
                  <th class="column_album"><button class="sort_button">album</button></th>
                  <th class="column_duration"><button class="sort_button">duration</button></th>
                  <th class="column_release">
                    <button class="sort_button">release date</button><br/>
                    Max:<input type="text" id="max_date"></input><br/>
                    Min:<input type="text" id="min_date"></input>
                  </th>
                  <th class="column_action">action</th>
                </tr>
              </thead>
              <tbody class="data">
              </tbody>
            </table>
        `);
    },
    
    "attach_header_listeners": function() {
        var table = this;
        table.make_sortable(".column_track", function(t) { return t.t; });
        table.make_sortable(".column_artist", function(t) { return t.a.n; });
        table.make_sortable(".column_album", function(t) { return t.c.t; });
        table.make_sortable(".column_duration", function(t) { return t.d; });
        table.make_sortable(".column_release", function(t) { return t.c.r; });
        table.div.find("th input").keypress(function(e) {
            if (e.which == 13) {
                table.filter_display();
            }
        });
    },
    
    "compile_filter": function() {
        return {
            "max_date": this.div.find("#max_date").val(),
            "min_date": this.div.find("#min_date").val()
        }
    },
    
    "show_track": function(uid, params) {
        var track = this.track_data[uid];
        if (params.min_date && track.c.r < params.min_date) {
            return false;
        }
        if (params.max_date && track.c.r > params.max_date) {
            return false;
        }
        return true;
    },
    
    "filter_display": function() {
        var table = this;
        var params = table.compile_filter();
        _(table.tracks).each(function(uid) {
            var track = table.track_data[uid];
            var row = table.div.find("tr[uid='" + uid + "']");
            track.v = table.show_track(uid, params);
            if (track.v) { 
                row.show();
            } else {
                row.hide();
            }
        });
        table.redisplay_meta();
    },
    
    "make_sortable": function(column, sort_fn) {
        var table = this;
        table.div.find(".header " + column + " .sort_button").click(function() {
            var sorting = $(this).attr("sorting");
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
    
    "load_tracks_from_url": function(url) {
        var table = this;
        $.get(url, function(data) {
            var idx = table.next_idx();
            _(data.tracks).each(function(t) {
                t.idx = idx++;
                t.v = true;
                t.d = parseInt(t.d);
                var uid = t.u.split(":").pop();
                table.tracks.push(uid);
                table.track_data[uid] = t;
            });
            table.reset_display();
            table.reset_row_listeners();
        });        
    },
    
    "reset_display": function() {
        var table = this;
        track_html = "";
        _(table.tracks).each(function(uid) {
            var track = table.track_data[uid];
            track_html += table.row_template({
                "track": track,
                "uid": uid,
                "visibility": track.v ? "table-row" : "none",
                "duration": format_time(track.d)
            });
        });
        table.div.find(".data").html(track_html);
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
    
    "add_track": function(track) {
        var idx = this.next_idx();
        track.idx = idx;
        track.v = true;
        var uid = track.u.split(":").pop();
        this.tracks.push(uid);
        this.track_data[uid] = track;
        this.reset_display();
        this.reset_row_listeners();
        this.filter_display();
    },
    
    "remove_track": function(uid) {
        delete(this.track_data[uid]);
        var idx = this.tracks.indexOf(uid);
        if (idx > -1) {
            this.tracks.splice(idx, 1);
        }
        this.div.find("tr[uid='" + uid + "']").remove();
    },
    
    inline_search_results: function(row) {
        var table = this;
        var uid = row.attr("uid");
        var track = table.track_data[uid];
        var search_term = search_term_for_track(track);
        var div = $(`<tr><td colspan="6"></td></tr>`);
        div.insertAfter(row);
        var st = new SearchTable(div.find("td"), this.search_manager);
        st.search_from_url("j/search/tracks", { "term": search_term }, {
            "on_hide": function() { div.remove(); }
        });      
    },
    
    "get_tracks": function(visible) {
        var table = this;
        var returned_tracks = [];
        _(table.tracks).each(function(uid) {
            var t = table.track_data[uid];
            if (!visible || t.v) { returned_tracks.push(t); }
        });
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

var SearchTable = function(div, manager) {
    this.table_type = "SearchTable";
    this.div = div;
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
          <td><button class="<%= action %>"><%= action %></button></td>
        </tr>
    `),
  
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
                  <th class="column_release"><button class="sort_button">release date</button><br/></th>
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
 
    "inject_search_results": function(tracks, fns) {
        var table = this;
        var results_html = `<button class="hide_results" style="float: right;">hide</button><br/>
                            <table class="search_results_table"><tbody>`;
                            
        if (fns.on_pre) { fns.pre(); }
        
        _(tracks).each(function(t) {
            var uid = t.u.split(":").pop();
            table.tracks.push(uid);
            table.track_data[uid] = t;
            results_html += table.row_template({
                "track": t,
                "action": table.manager.target_table.track_data[uid] ? "remove" : "add",
                "duration": format_time(t.d),
                "uid": uid
            });
            if (fns.on_success) { fns.on_success(); }
        });
        
        results_html += "</tbody></table>";
        table.div.html(results_html);
        table.reset_row_listeners(fns); 
    },
    
    "reset_row_listeners": function(fns) {
        var table = this;
        
        table.div.find(".add").unbind("click");
        table.div.find(".remove").unbind("click");
        table.div.find(".hide_results").unbind("click");
        
        table.div.find(".add").click(function() {
            table.add_track($(this).parent().parent().attr("uid"));
            if (fns.add) { fns.on_add(); }
        });
        
        table.div.find(".remove").click(function() {
            table.remove_track($(this).parent().parent().attr("uid"));
            if (fns.remove) { fns.on_remove(); }
        });
        
        table.div.find(".hide_results").click(function() {
            table.div.html("");
            table.manager.remove_table(table);
            if (fns.on_hide) { fns.on_hide(); }
        });         
    },
    
    "add_track": function(uid) {
        this.manager.add_track(this.track_data[uid]);
    },
    
    "remove_track": function(uid) {
        this.manager.target_table.remove_track(uid);
    },
    
    "search_from_url": function(url, form, fns) {
        var table = this;
        $.get(url, form, function(data) {
            table.inject_search_results(data.tracks, fns || {});
        });
    },
  
    "log_me": TrackTable.prototype.log_me
    
};

var SearchTableManager = function(target_table) {
    this.tables = [];
    this.target_table = target_table;
};

SearchTableManager.prototype = {
  
    "add_track": function(track) {
        this.target_table.add_track(track);
    },
    
    "remove_table": function(table) {
        var idx = this.tables.indexOf(table);
        if (idx > -1) {
            this.tables.splice(idx, 1);
        }       
    }
    
};
