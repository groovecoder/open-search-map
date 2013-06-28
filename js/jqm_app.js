jQuery(document).ready(function() {

    //init the map
    var currentLatlng  = currentLatlng || new google.maps.LatLng(35.339,-97.489),
        ttown= ttown || new search_map(document.getElementById("map_content"));
    var layers = {'sparks': {visible: false}};

    // init search data
    var search_data = search_data || new search_db();
    search_data.init(ttown);
    var user_guid = user_guid || search_data.user_guid();

    //init socket
    var socket = io.connect('http://206.214.164.229');
    socket.on('message', function (data) {
      console.log(data);
      $.event.trigger(data.message.eventType,data.message.payload);
      
    });            

    //socket events
    $(document).on("newSearch", function(e,response){
        var search_loc = new google.maps.LatLng(response.latitude,response.longitude);
        search_data.searches[response.place_id]=ttown.addSearch(search_loc,response.place_id,response.extra);
    });
      
    $(document).on("endSearch", function(e,response){
        marker=search_data.searches[response.place_id];
        marker.setIcon("./img/search_end.svg");
        marker.search_window.setSearchWindowContent(response.extra)        
    });
    
    $(document).on("moveSearch", function(e,response){
        marker=search_data.searches[response.place_id];
        var search_loc = new google.maps.LatLng(response.latitude,response.longitude);
        marker.setPosition(search_loc);
    });
    


    //client events
    $(document).on("endSearch_click", function(e,marker_key){
        search_data.post(
            'place/update/'+marker_key,
            {extra: {end_time:Date()}},
            function(response, error){
                if(!error){
                    marker=search_data.searches[marker_key];
                    marker.setIcon("./img/search_end.svg");
                    marker.search_window.setSearchWindowContent(response.extra)
                    socket.emit('message',{eventType: 'endSearch', payload: response});                        
                }
        });        
    });        



    $(document).on("search_position_changed", function(e,marker_key){
        marker=search_data.searches[marker_key];
        search_data.post(
            'place/update/'+marker_key,
            {latitude:  marker.position.lat(),
             longitude: marker.position.lng()},
            function(response, error){
                if(!error){
                    socket.emit('message',{eventType: 'moveSearch', payload: response});                        
                }
        });        
    });

//panel menu choices
    $("#addSearch").on('click',function(){
        $( "#menu_panel" ).panel( "close" );

        ttown.setOptions({ draggableCursor : "url(http://s3.amazonaws.com/besport.com_images/status-pin.png) 64 64, auto" })
        
        google.maps.event.addListenerOnce(ttown, "click",function(e){
            ttown.setOptions({ draggableCursor : "" })
            search_data.post("place/create", {
              latitude: e.latLng.lat(),
              longitude: e.latLng.lng(),
              layer_id:"96yV",
              name:e.latLng.lat()+e.latLng.lng(),
              radius: 100,
              extra: {start_time:Date()}
            }, function(response, error){
                console.log(response, error)
                if(!error){
                    search_data.searches[response.place_id]=ttown.addSearch(e.latLng,response.place_id,response.extra);
                    socket.emit('message', {eventType: 'newSearch', payload: response});
                }
            });
        });
    });
    
    $('a#viewSearches').click(function(){
        $( "#menu_panel" ).panel( "close" );
        ttown.fitBounds(search_data.searchBounds());
    });    

    $('a#viewSparkRelief').click(function(){
        $( "#menu_panel" ).panel( "close" );
        // go to OKC
        ttown.panTo(new google.maps.LatLng(35.466,-97.515));
        ttown.setZoom(11);
        var visible = layers['sparks'].visible;
        $(search_data.sparks).each(function(index, spark){
            if (visible) {
                spark.marker.setVisible(false);
            } else {
                spark.marker.setVisible(true);
            }
            spark.infowindow.close();
        });
        layers['sparks'].visible = !visible;
    });

    $('a#viewUser').click(function(){
         $( "#menu_panel" ).panel( "close" );
        ttown.setZoom(18);
        ttown.panTo(ttown.user.position);
    });    

    $('button#signin').click(function(){
      var auth={}; auth.username = $('input#email').val(),
          auth.password = $('input#password').val();
          search_data.login(auth);
    });    


    var userPositionChange = function(pos) {
        var crd = pos.coords;
        currentLatlng = new google.maps.LatLng(crd.latitude, crd.longitude);          
        ttown.user.setPosition(currentLatlng);
        ttown.user_accuracy=crd.accuracy;
        ttown.setCenter(currentLatlng);
    };

     var errorPositionChange = function (err) {
      console.warn('ERROR(' + err.code + '): ' + err.message);
    };
    
    posOptions = {enableHighAccuracy: true}; 
        
    distWatchID = navigator.geolocation.watchPosition(userPositionChange, errorPositionChange, posOptions);       

    $("#mapPage").on("pageshow",function(){
        google.maps.event.trigger(ttown, 'resize');
    });
 
  
  $('#mapPage').trigger('pageshow');
    
});

