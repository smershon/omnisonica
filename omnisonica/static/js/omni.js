function load_tracks(user_id, table_selector) {
    var tmplt = "<tr class=\"trackrow\" idx=\"<%= track.idx %>\">" +
                "<td class=\"uid\"><%= track.u %></td>" +
                "<td class=\"title\"><%= track.t %></td>" + 
                "<td class=\"artist\"><%= track.a.n %></td>" +
                "<td class=\"album\"><%= track.c.t %></td>" +
                "<td class=\"release_date\"><%= track.c.r %></td>" +
                "</tr>";
    
    var compiled = _.template(tmplt);
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

function tracks_from_dom() {
    var tracks = [];
    $("#tracktable .data .trackrow").each(function(key, value) {
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

function order_tracks(sort_fn, reverse) {
    var tmplt = "<tr class=\"trackrow\" idx=\"<%= track.idx %>\">" +
                "<td class=\"uid\"><div style=\"display:none;\"><%= track.idx %></div><%= track.u %></td>" +
                "<td class=\"title\"><%= track.t %></td>" + 
                "<td class=\"artist\"><%= track.a.n %></td>" +
                "<td class=\"album\"><%= track.c.t %></td>" +
                "<td class=\"release_date\"><%= track.c.r %></td>" +
                "</tr>";
    
    var compiled = _.template(tmplt);
    var tracks = _.sortBy(tracks_from_dom(), sort_fn);
    if (reverse) {
        tracks.reverse();
    }
    $("#tracktable .data").html("");
    _(tracks).forEach(function(t) {
        $("#tracktable .data").append(compiled({"track": t}));
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

function make_sortable(column, sort_fn) {
    $("#tracktable .header " + column + " .sort_button").click(function() {
        var sorting = $(this).attr("sorting");
        if (!sorting) {
            $(this).attr("sorting", "asc");
            order_tracks(sort_fn);
        } else if (sorting === "asc") {
            $(this).attr("sorting", "desc");
            order_tracks(sort_fn, true);
        } else {
            $(this).removeAttr("sorting");
            order_tracks(function(track) { return track.idx; });
        }     
    });
}

$(document).ready(function() {
   make_sortable(".column_track", function(track) { return track.t; });
   make_sortable(".column_artist", function(track) { return track.a.n; });
   make_sortable(".column_album", function(track) { return track.c.t; });
   make_sortable(".column_release", function(track) { return track.c.r; });
   
   $("#get_track_ids").click(function() {
      show_track_ids(); 
   });
        
});