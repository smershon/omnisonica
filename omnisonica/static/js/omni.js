$(function() {

    var tmplt = "<tr class=\"trackrow <%= rowtype %>\" idx=\"<%= track.idx %>\">" +
                "<td class=\"uid\"><%= track.u %></td>" +
                "<td class=\"title\"><%= track.t %></td>" + 
                "<td class=\"artist\"><%= track.a.n %></td>" +
                "<td class=\"album\"><%= track.c.t %></td>" +
                "<td class=\"release_date\"><%= track.c.r %></td>" +
                "</tr>";

    var compiled = _.template(tmplt);
    var tracks = [];
    
    var search_row_tmplt = "<tr class=\"trackrow <%= rowtype %>\" idx=\"<%= track.idx %>\">" +
                           "<td class=\"uid\"><%= track.u %></td>" +
                           "<td class=\"title\"><%= track.t %></td>" + 
                           "<td class=\"artist\"><%= track.a.n %></td>" +
                           "<td class=\"album\"><%= track.c.t %></td>" +
                           "<td class=\"release_date\"><%= track.c.r %></td>" +
                           "<td><button class=\"add_remove\">add</button></td>" +
                           "</tr>";
    var search_row = _.template(search_row_tmplt);
    
    function insert_search_results(selector, found_tracks, destination) {
        var results_html = "";
        var rowtypes = ["even", "odd"];
        _(found_tracks).each(function(t,i) {
            results_html += search_row({"track": t, "rowtype": rowtypes[i%2]});
        });
        $(selector).html(results_html);
        $(selector + " .add_remove").click(function() {
            var row = $(this).parent().parent();
            var rowtypes = ["even", "odd"];
            var track = {
                "u": row.find(".uid").html(),
                "t": row.find(".title").html(),
                "a": {
                    "n": row.find(".artist").html()
                },
                "c": {
                    "t": row.find(".album").html(),
                    "r": row.find(".release_date").html()
                },
                "idx": tracks.length
            }
            tracks.push(track);
            $(destination).append(compiled({"track": track, "rowtype": rowtypes[track.idx%2]}));
        });
    }

    function load_tracks(view, table_selector) {
        $.get("j/tracks/" + view, function(data) {
            var idx = 0;
            var rowtypes = ["even", "odd"];
            _(data.tracks).forEach(function(t) {
                t.idx = idx++;
                tracks.push(t);
                $(table_selector).append(compiled({"track": t, "rowtype": rowtypes[t.idx%2]}));
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
        tracks = _.sortBy(tracks, sort_fn);
        if (reverse) {
            tracks.reverse();
        }
        $(table + " .data").html("");
        var rowtypes = ["even", "odd"];
        var i = 0;
        _(tracks).forEach(function(t,i) {
            if (show_track(t)) {
                $(table + " .data").append(compiled({"track": t, "rowtype":rowtypes[i++%2]}));
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
    

    sortable_table("#tracktable");
    load_tracks($("#view").html(), "#tracktable .data");
    $("#get_track_ids").click(function() {
        show_track_ids();
    });
    $("button.track_search").click(function() {
        search_tracks("#tracktable .data");
    });

});