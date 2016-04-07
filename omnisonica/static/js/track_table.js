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

var TrackTable = function(div) {
    this.table_type = "TrackTable";
    this.div = div;
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
    
    "filter_display": function() {
        var table = this;
        var max_date = table.div.find("#max_date").val();
        var min_date = table.div.find("#min_date").val();
        _(table.tracks).each(function(uid) {
            var track = table.track_data[uid];
            var row = table.div.find("tr[uid='" + uid + "']");
            if (max_date && track.c.r > max_date) {
                track.v = false;
                row.hide();
            } else if (min_date && track.c.r < min_date) {
                track.v = false;
                row.hide();
            } else {
                track.v = true;
                row.show();
            }
        });
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
    },
    
    "reset_row_listeners": function() {
        var table = this;
        table.div.find("button.remove").unbind("click");
        table.div.find("button.search").unbind("click");
        table.div.find("button.remove").click(function() {
            table.remove_track($(this).parent().parent().attr("uid"));
        });
        table.div.find("button.search").click(function() {
            console.log("search");
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
    
    "get_tracks": function(visible) {
        var returned_tracks = [];
        for (i=0; i<this.tracks.length; i++) {
           var t = this.track_data[this.tracks[i]]
           if (!visible || t.v) { returned_tracks.push(t); } 
        }
        return returned_tracks;
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
 
    "inject_search_results": function(tracks) {
        var table = this;
        var results_html = `<button class="hide_results" style="float: right;">hide</button><br/>
                            <table class="search_results_table"><tbody>`
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
        });
        results_html += "</tbody></table>";
        table.div.html(results_html);
        table.div.find(".add").click(function() {
            table.add_track($(this).parent().parent().attr("uid"));
        });
        table.div.find(".remove").click(function() {
            table.remove_track($(this).parent().parent().attr("uid"));
        });
        table.div.find(".hide_results").click(function() {
            table.div.html("");
        });  
    },
    
    "add_track": function(uid) {
        this.manager.target_table.add_track(this.track_data[uid]);
    },
    
    "remove_track": function(uid) {
        this.manager.target_table.remove_track(uid);
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
