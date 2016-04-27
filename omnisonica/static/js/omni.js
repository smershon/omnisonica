$(function() {

    function show_track_ids(track_list) {
        var w = window.open("", "Test");
        w.document.open();
        w.document.write(`<body style="font-family:Courier;">`);
        _(track_list).each(function(t) {
            w.document.write("spotify:track:" + t.u + "<br/>");
        });
        w.document.write(`</body>`);
        w.document.close();
    }
    
    function save_view(view_name) {
        var tracks = tt.get_tracks().map(function(t) {
            var track = jQuery.extend(true, {}, t);
            track.m.a = track.m.a.getTime()/1000;
            track.m.m = track.m.m.getTime()/1000;
            return track
        });
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
    
    function main_search(manager) {
        var search_term = $("#track_search_input").val();
        if (!search_term) { return; }
        $("#search_results").html("<div class=\"search_inner\"></div>")
        var st = new SearchTable($("#search_results .search_inner"), manager);
        st.search_from_url("j/search/tracks", { "term": search_term });      
    }

    $("button.save_view").click(function() {
        save_view($("#view").html());
    });
    
    var tt = new TrackTable($(".data_main"), $(".track_meta"));
    var manager = new SearchTableManager(tt);
    
    tt.search_manager = manager;
        
    $("#get_track_ids").click(function() {
        var slice = parse_time($("#track_sample_time").val());
        var ordering = $("#track_ordering").val();
        show_track_ids(tt.get_tracks(true, slice, ordering));
    });
    
    $("button.track_search").click(function() {
        main_search(manager);
    });
    
    $("#track_search_input").keypress(function (e) {
        if (e.which == 13) {
            main_search(manager);
        }
    });
    
    $("button.injest_playlist").click(function() {
        var pl = $("#playlist_input").val().split(" ").map(function(uri) {
            return uri.split("/").pop().split(":").pop();
        });
        tt.injest_tracks(pl);
    });
    
    $("button.filter_columns").click(function() {
        tt.filter_columns();
    });
    
    tt.load_tracks_from_url("j/tracks/" + $("#view").html());

});
