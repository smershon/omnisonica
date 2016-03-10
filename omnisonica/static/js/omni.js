function load_tracks(user_id, table_selector) {
    var tmplt = "<tr class=\"trackrow\">" +
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
        var tracks = _.sortBy(data.tracks, function(track) { return track.a.n; });
        var t2 = Date.now(); 
        _(tracks).forEach(function(t) {
            $(table_selector).append(compiled({"track": t}));
        });
        var t3 = Date.now();
        console.log(t1-t0,t2-t1,t3-t2);
    });   
}

function tracks_from_dom() {
    var tracks = [];
    $("#tracktable .data .trackrow").each(function(key, value) {
        var track = {
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

function order_tracks(sort_fn) {
    var tmplt = "<tr class=\"trackrow\">" +
                "<td class=\"uid\"><%= track.u %></td>" +
                "<td class=\"title\"><%= track.t %></td>" + 
                "<td class=\"artist\"><%= track.a.n %></td>" +
                "<td class=\"album\"><%= track.c.t %></td>" +
                "<td class=\"release_date\"><%= track.c.r %></td>" +
                "</tr>";
    
    var compiled = _.template(tmplt);
    var tracks = _.sortBy(tracks_from_dom(), sort_fn);
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

$(document).ready(function() {
   $("#order_track").click(function() {
       order_tracks(function(track) { return track.t; });
   });
       
   $("#order_artist").click(function() {
       order_tracks(function(track) { return track.a.n; });
   });

   $("#order_album").click(function() {
       order_tracks(function(track) { return track.c.t; });
   });
   
   $("#order_release").click(function() {
       order_tracks(function(track) { return track.c.r; });
   });
   
   $("#get_track_ids").click(function() {
      show_track_ids(); 
   });
        
});