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

    function show_track_ids(track_list) {
        var w = window.open("", "Test");
        w.document.open();
        _(track_list).each(function(t) {
            w.document.write(t.u + "<br/>");
        });
        w.document.close();
    }
    
    function save_view(view_name) {
        $.ajax({
            type: "POST",
            contentType: "application/json; charset=utf-8",
            url: "/save_view/" + view_name,
            data: JSON.stringify(tt.tracks),
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
    
    var tt = new TrackTable($(".data_main"));
    tt.load_tracks_from_url("j/tracks/" + $("#view").html());
    var manager = new SearchTableManager(tt);
    $("#get_track_ids").click(function() {
        show_track_ids(tt.get_tracks(true));
    });
    $("button.track_search").click(function() {
        main_search(manager);
    });
    $("#track_search_input").keypress(function (e) {
        if (e.which == 13) {
            main_search(manager);
        }
    });
    
    

});