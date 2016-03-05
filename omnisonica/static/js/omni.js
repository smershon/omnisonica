function load_tracks(user_id, table_selector) {
    var compiled = _.template("<tr class=\"trackrow\"><td class=\"title\"><%= track.t %></td><td class=\"artist\"><%= track.a.n %></td><td class=\"album\"><%= track.c.t %></td></tr>");
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
            "t": $(this).find(".title").html(),
            "a": { "n": $(this).find(".artist").html() },
            "c": { "t": $(this).find(".album").html() }
        };
        tracks.push(track);
    });
    return tracks;
}

function order_tracks(sort_fn) {
    var compiled = _.template("<tr class=\"trackrow\"><td class=\"title\"><%= track.t %></td><td class=\"artist\"><%= track.a.n %></td><td class=\"album\"><%= track.c.t %></td></tr>");
    var tracks = _.sortBy(tracks_from_dom(), sort_fn);
    $("#tracktable .data").html("");
    _(tracks).forEach(function(t) {
        $("#tracktable .data").append(compiled({"track": t}));
    });    
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
        
});