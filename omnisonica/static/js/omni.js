$(function() {

    // 1965-1971: 136 -> 186
    // 1972-1978: 205 -> 257
    // 1979-1985: 150 -> 243

    var tmplt = "<tr class=\"trackrow\" id=\"<%= row_id %>\">" +
                "<td class=\"uid\"><%= track.u %></td>" +
                "<td class=\"title\"><%= track.t %></td>" + 
                "<td class=\"artist\"><%= track.a.n %></td>" +
                "<td class=\"album\"><%= track.c.t %></td>" +
                "<td class=\"duration\"><%= duration %></td>" +
                "<td class=\"release_date\"><%= track.c.r %></td>" +
                "<td><button class=\"<%= action %>\"><%= action %></button>" +
                    "<button class=\"search\">search</button></td>" +
                "</tr>";

    var compiled = _.template(tmplt);
    var tracks = {};
    
    var search_row_tmplt = "<tr class=\"trackrow searchrow\" id=\"<%= row_id %>\">" +
                           "<td class=\"uid\"><%= track.u %></td>" +
                           "<td class=\"title\"><%= track.t %></td>" + 
                           "<td class=\"artist\"><%= track.a.n %></td>" +
                           "<td class=\"album\"><%= track.c.t %></td>" +
                           "<td class=\"duration\"><%= duration %></td>" +
                           "<td class=\"release_date\"><%= track.c.r %></td>" +
                           "<td><button class=\"<%= action %>\"><%= action %></button></td>" +
                           "</tr>";
    var search_row = _.template(search_row_tmplt);
    
    function next_idx() {
        var idx = 0;
        _(Object.keys(tracks)).each(function(key) {
            if (tracks[key].idx > idx) {
                idx = tracks[key].idx;
            }
        });
        return idx + 1;
    }
    
    function track_from_row(row) {
        return {
            "u": row.find(".uid").html(),
            "t": row.find(".title").html(),
            "d": row.find(".duration").html(),
            "a": {
                "n": row.find(".artist").html()
            },
            "c": {
                "t": row.find(".album").html(),
                "r": row.find(".release_date").html()
            },
            "idx": next_idx()
        }        
    }
    
    function pad(width, n) {
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join("0") + n;
    }
    
    function format_time(total_seconds) {
        total_seconds = Math.round(total_seconds/1000);
        var hours = Math.floor(total_seconds/3600);
        var minutes = Math.floor((total_seconds%3600)/60);
        var seconds = total_seconds%60;
        if (hours) {
            return hours + ":" + pad(2, minutes) + ":" + pad(2, seconds);
        } else {
            return minutes + ":" + pad(2, seconds);
        }
    }
    
    function reload_meta(selector) {
        var total_tracks = 0;
        var total_time = 0;
        var shown_tracks = 0;
        var shown_time = 0;
        Object.keys(tracks).forEach(function(key) {
            total_tracks += 1;
            total_time += parseInt(tracks[key].d);
        });
        $(selector + " .trackrow:not(.searchrow)").each(function(i, row) {
            shown_tracks += 1;
            shown_time += parseInt($(row).find(".duration").html());
        });
        $(".shown_track_meta").html("shown: " + shown_tracks + " / " + format_time(shown_time));
        $(".total_track_meta").html("total: " + total_tracks + " / " + format_time(total_time));
    }
    
    function add_track(button, selector) {
        var row = button.parent().parent();
        var track = track_from_row(row);
        tracks[track.u.split(":").pop()] = track;
        $(selector).append(compiled({
            "track": track,
            "action": "remove",
            "duration": format_time(track.t),
            "row_id": track.u.split(":").pop()}));
        button.html("remove");
        button.unbind("click");
        button.click(function() {
            remove_track(button, selector)
        });
    }
    
    function remove_track(button, selector) {
        var row = button.parent().parent();
        var uid = row.find(".uid").html().split(":").pop();
        delete(tracks[uid]);
        $(selector + " #" + uid).remove();
        button.html("add");
        button.unbind("click");
        button.click(function() {
            add_track(button, selector);
        });
        reload_meta(selector);
    }
    
    function inject_search_results(div, found_tracks, destination, callback) {
        var results_html = "<button class=\"hide_results\" style=\"float: right;\">hide</button><br/>" +
                           "<table class=\"search_results_table\"><tbody>"
        _(found_tracks).each(function(t) {
            var uid = t.u.split(":").pop();
            results_html += search_row({
                "track": t,
                "action": tracks[uid] ? "remove" : "add",
                "duration": format_time(t.d),
                "row_id": "search_" + uid
            });
        });
        results_html += "</tbody></table>";
        div.html(results_html);
        div.find(".add").click(function() {
            add_track($(this), destination);
        });
        div.find(".remove").click(function() {
            remove_track($(this), destination);
        });
        div.find(".hide_results").click(function() {
            div.html("");
            if (callback) { callback(); }
        });
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
        console.log(track_term);
        return artist_term + track_term;
    }
    
    function inline_search_results(row, destination) {
        var track = track_from_row(row);
        var search_term = search_term_for_track(track);
        $.get("/j/search/tracks", { "term": search_term }, function(data) {
            var div = $("<tr><td colspan=\"6\"></td></tr>");
            div.insertAfter(row);
            inject_search_results(div.find("td"), data.tracks, destination, function() {
                div.remove();
            });
        });
    }

    function delete_search_results(row) {
        row.nextUntil(".trackrow:not(.searchrow)").each(function(i,t) {
            t.remove();
        });
    }

    function load_tracks(view, table_selector) {
        $.get("j/tracks/" + view, function(data) {
            var idx = 0;
            _(data.tracks).forEach(function(t) {
                t.idx = idx++;
                tracks[t.u.split(":").pop()] = t;
                $(table_selector).append(compiled({
                    "track": t,
                    "action": "remove",
                    "duration": format_time(t.d), 
                    "row_id": t.u.split(":").pop()}));
            });
            $(table_selector + " .remove").click(function() {
                remove_track($(this), table_selector);
            });
            $(table_selector + " .search").click(function() {
                inline_search_results($(this).parent().parent());
            });
            reload_meta(table_selector);
        });  
    }
    
    function show_track(t) {
        var max_date = $("#max_date").val();
        var min_date = $("#min_date").val();
        if (max_date && t.c.r > max_date) {
            return false;
        }
        if (min_date && t.c.r < min_date) {
            return false
        }
        return true;     
    }

    function order_tracks(table, sort_fn, reverse) {
        var trackArray = Object.keys(tracks).map(function(key) {
            return tracks[key];
        });
        trackArray = _.sortBy(trackArray, sort_fn);
        if (reverse) {
            trackArray.reverse();
        }
        $(table + " .data").html("");
        _(trackArray).forEach(function(t) {
            if (show_track(t)) {
                $(table + " .data").append(compiled({
                    "track": t,
                    "action": "remove",
                    "duration": format_time(t.d), 
                    "row_id": t.u.split(":").pop()}));
            }
        });
        $(table + " .data .remove").click(function() {
            remove_track($(this), table + " .data");
        });
        $(table + " .data .search").click(function() {
            inline_search_results($(this).parent().parent(), table + " .data");
        }); 
        reload_meta(table + " .data");   
    }

    function show_track_ids() {
        var w = window.open("", "Test");
        w.document.open();
        $("#tracktable .data .trackrow").each(function(key, value) {
            w.document.write($(this).find(".uid").html() + "<br/>");
        });
        w.document.close();
    }

    function make_sortable(table, column, sort_fn) {
        $(table + " .header " + column + " .sort_button").click(function() {
            var sorting = $(this).attr("sorting");
            if (!sorting) {
                $(this).attr("sorting", "asc");
                order_tracks(table, sort_fn);
            } else if (sorting === "asc") {
                $(this).attr("sorting", "desc");
                order_tracks(table, sort_fn, true);
            } else {
                $(this).removeAttr("sorting");
                order_tracks(table, function(track) { return track.idx; });
            }     
        });
    }

    function sortable_table(selector) {
        make_sortable(selector, ".column_track", function(t) { return t.t; });
        make_sortable(selector, ".column_artist", function(t) { return t.a.n; });
        make_sortable(selector, ".column_album", function(t) { return t.c.t; });
        make_sortable(selector, ".column_duration", function(t) { return t.d; });
        make_sortable(selector, ".column_release", function(t) { return t.c.r; });
    }
    
    function search_tracks(search_term, destination) {
        if (search_term) {
            $.get("/j/search/tracks", { "term": search_term }, function(data) {
                inject_search_results($("#search_results"), data.tracks, destination);
            });
        }
    }
    
    function save_view(view_name) {
        $.ajax({
            type: "POST",
            contentType: "application/json; charset=utf-8",
            url: "/save_view/" + view_name,
            data: JSON.stringify(tracks),
            success: function(data) {
                console.log(data);
            },
            dataType: "json"
        });
    }
    

    sortable_table("#tracktable");
    //load_tracks($("#view").html(), "#tracktable .data");
    $("#get_track_ids").click(function() {
        show_track_ids();
    });
    $("button.track_search").click(function() {
        search_tracks($("#track_search_input").val(), "#tracktable .data");
    });
    $("button.save_view").click(function() {
        save_view($("#view").html());
    });
    
    var tt = new TrackTable($(".data_main"));
    tt.load_tracks_from_url("j/tracks/" + $("#view").html());

});