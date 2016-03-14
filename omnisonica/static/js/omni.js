$(function() {

    var tmplt = "<tr class=\"trackrow\" idx=\"<%= track.idx %>\">" +
                "<td class=\"uid\"><%= track.u %></td>" +
                "<td class=\"title\"><%= track.t %></td>" + 
                "<td class=\"artist\"><%= track.a.n %></td>" +
                "<td class=\"album\"><%= track.c.t %></td>" +
                "<td class=\"release_date\"><%= track.c.r %></td>" +
                "</tr>";

    var compiled = _.template(tmplt);

    function load_tracks(user_id, table_selector) {
        var t0 = Date.now();
        $.get("tracks/" + user_id, function(data) {
            var t1 = Date.now();
            var idx = 0;
            _(data.tracks).forEach(function(t) {
                t.idx = idx++;
                $(table_selector).append(compiled({"track": t}));
            });
            var t2 = Date.now();
            console.log(t1-t0,t2-t1);
        });   
    }

    function tracks_from_dom(table) {
        var tracks = [];
        $(table + " .data .trackrow").each(function(key, value) {
            var track = {
                "idx": parseInt($(this).attr("idx")),
                "u": $(this).find(".uid").html(),
                "t": $(this).find(".title").html(),
                "a": { "n": $(this).find(".artist").html() },
                "c": { "t": $(this).find(".album").html(),
                       "r": $(this).find(".release_date").html() }
            };
            tracks.push(track);
        });
        return tracks;
    }

    function apply_filters() {
        $("#tracktable .data .trackrow").each(function(key, value) {
            var max_date = $("#max_date").val();
            var min_date = $("#min_date").val();
            if (max_date && $(this).find(".release_date").html() > max_date) {
                $(this).hide();
            } else if (min_date && $(this).find(".release_date").html() < min_date) {
                $(this).hide();
            } else {
                $(this).show();
            }
        });
    }

    function order_tracks(table, sort_fn, reverse) {
        var tracks = _.sortBy(tracks_from_dom(table), sort_fn);
        if (reverse) {
            tracks.reverse();
        }
        $(table + " .data").html("");
        _(tracks).forEach(function(t) {
            $(table + " .data").append(compiled({"track": t}));
        });
        apply_filters();    
    }

    function show_track_ids() {
        var w = window.open("", "Test");
        w.document.open();
        $("#tracktable .data .trackrow").each(function(key, value) {
            if ($(this).is(":visible")) {
                w.document.write($(this).find(".uid").html() + "<br/>");
            }
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
    

    sortable_table("#tracktable");
    load_tracks("some_id", "#tracktable .data");

});