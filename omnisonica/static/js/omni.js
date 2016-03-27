$(function() {

    var tmplt = "<tr class=\"trackrow\" id=\"<%= row_id %>\">" +
                "<td class=\"uid\"><%= track.u %></td>" +
                "<td class=\"title\"><%= track.t %></td>" + 
                "<td class=\"artist\"><%= track.a.n %></td>" +
                "<td class=\"album\"><%= track.c.t %></td>" +
                "<td class=\"release_date\"><%= track.c.r %></td>" +
                "<td><button class=\"<%= action %>\"><%= action %></button></td>" +
                "</tr>";

    var compiled = _.template(tmplt);
    var tracks = {};
    
    var search_row_tmplt = "<tr class=\"trackrow\" id=\"<%= row_id %>\">" +
                           "<td class=\"uid\"><%= track.u %></td>" +
                           "<td class=\"title\"><%= track.t %></td>" + 
                           "<td class=\"artist\"><%= track.a.n %></td>" +
                           "<td class=\"album\"><%= track.c.t %></td>" +
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
    
    function add_track(button, selector) {
        var row = button.parent().parent();
        var track = track_from_row(row);
        console.log(track);
        tracks[track.u.split(":").pop()] = track;
        $(selector).append(compiled({
            "track": track,
            "action": "remove",
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
    }
    
    function insert_search_results(selector, found_tracks, destination) {
        var results_html = "";
        _(found_tracks).each(function(t,i) {
            var add_remove = (tracks[t.u.split(":").pop()]) ? "remove" : "add";
            results_html += search_row({
                "track": t,
                "action": add_remove,
                "row_id": t.u.split(":").pop()});
        });
        $(selector).html(results_html);
        $(selector + " .add").click(function() {
            add_track($(this), destination);
        });
        $(selector + " .remove").click(function() {
            remove_track($(this), destination);
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
                    "row_id": t.u.split(":").pop()}));
            });
            $(table_selector + " .remove").click(function() {
                remove_track($(this), table_selector);
            }); 
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
                $(table + " .data").append(compiled({"track": t, "row_id": t.u.split(":").pop()}));
            }
        });   
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
        make_sortable(selector, ".column_release", function(t) { return t.c.r; });
    }
    
    function search_tracks(destination) {
        var search_term = $("#track_search_input").val();
        var rowtypes = ["even", "odd"];
        if (search_term) {
            $.get("/j/search/tracks", { "term": search_term }, function(data) {
                insert_search_results("#searchtable .results", data.tracks, destination);
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
    load_tracks($("#view").html(), "#tracktable .data");
    $("#get_track_ids").click(function() {
        show_track_ids();
    });
    $("button.track_search").click(function() {
        search_tracks("#tracktable .data");
    });
    $("button.save_view").click(function() {
        save_view($("#view").html());
    });

});