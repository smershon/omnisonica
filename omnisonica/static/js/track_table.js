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

var TrackTable = function(div) {
    this.div = div;
    this.tracks = [];
    this.track_data = {};
    this.insert_html();
    this.attach_header_listeners();
};

TrackTable.prototype = {
    
    "row_template": _.template(`
        <tr class="trackrow" uid="<%= uid %>">
          <td class="uid"><%= track.u %></td>
          <td class="title"><%= track.t %></td>
          <td class="artist"><%= track.a.n %></td>
          <td class="album"><%= track.c.t %></td>
          <td class="duration"><%= duration %></td>
          <td class="release_date"><%= track.c.r %></td>
          <td>
            <button class="<%= action %>"><%= action %></button>
            <button class="search">search</button>
          </td>
        </tr>
    `),
    
    "insert_html": function() {
        this.div.html(`
            <table class="tracktable">
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
              <tbody class="data">
              </tbody>
            </table>
        `);
    },
    
    "attach_header_listeners": function() {
        this.make_sortable(".column_track", function(t) { return t.t; });
        this.make_sortable(".column_artist", function(t) { return t.a.n; });
        this.make_sortable(".column_album", function(t) { return t.c.t; });
        this.make_sortable(".column_duration", function(t) { return t.d; });
        this.make_sortable(".column_release", function(t) { return t.c.r; });        
    },
    
    "make_sortable": function(column, sort_fn) {
        var table = this;
        table.div.find(".header " + column + " .sort_button").click(function() {
            var sorting = $(this).attr("sorting");
            if (!sorting) {
                $(this).attr("sorting", "asc");
                table.tracks = _.sortBy(table.tracks, function(uri) {
                    return sort_fn(table.track_data[uri]); });
                table.tracks.reverse();
            } else if (sorting === "asc") {
                $(this).attr("sorting", "desc");
                table.tracks = _.sortBy(table.tracks, function(uri) {
                    return sort_fn(table.track_data[uri]); });
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
                "action": "remove",
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
    
    "remove_track": function(uid) {
        console.log(uid);
        console.log(this.track_data[uid]);
        delete(this.track_data[uid]);
        var idx = this.tracks.indexOf(uid);
        if (idx > -1) {
            this.tracks.splice(idx, 1);
        }
        this.div.find("tr[uid='" + uid + "']").remove();
    },
    
    "next_idx": function() {
        var idx = 0;
        _(this.tracks).each(function(uri) {
            if (this.track_data[uri].idx > idx) {
                idx = this.track_data[uri].idx;
            }
        });
        return idx + 1;
    }
    
};
