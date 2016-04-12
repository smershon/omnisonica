$(function() {
    
    var existing_views = new Set();
    
    $("button.create_new").click(function() {
        var view_name = $("#new_view").val();
        if (!view_name || existing_views.has(view_name)) {
            console.log("error: " + view_name);
        }
        window.location = "/" + view_name;
    }); 
    
});