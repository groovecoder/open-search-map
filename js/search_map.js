//  map object 
var search_map= function (element) {    
    // 'tulsa 36.1539,-95.9925'
    // 'moore 35.339,-97.489'
        var this_map,
        search_overlay,
        map_element = null,
        tulsaLatlng =  tulsaLatlng ||  new google.maps.LatLng(36.1539,-95.9925),
        mooreLatlng =  mooreLatlng ||  new google.maps.LatLng(35.339,-97.489),
        sparkrelief_icon = './img/sparkrelief_icon.png',
        searchMapOptions = {
            visualRefresh:true,
            zoom: 18,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            center:tulsaLatlng,
            panControl: false,
            scaleControl: false,
            overviewMapControl: false,

            streetViewControl: true,
            streetViewControlOptions: {
                position: google.maps.ControlPosition.LEFT_CENTER,
            },

            mapTypeControl: true,
            mapTypeControlOptions: {
                position: google.maps.ControlPosition.LEFT_BOTTOM,
            },

            zoomControl: true,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.SMALL,
                position: google.maps.ControlPosition.RIGHT_CENTER,
            },
        },
       
    geo=google.maps.geometry.spherical,    
    
    search_list = {}, spark_list = {},

    search_info = function (key,info_obj) {
        var response = [];
        i=0;
        for (var p in info_obj){
            response[i] = "<p>"+p+": "+info_obj[p]+"</p>";
            i+=1;
        };
        content_text=response.join("") 
        if (!info_obj.end_time){
            content_text +="</br><button id='"+key+"_button'>End Search</button"
        }
        return content_text;
    },

    set_search_click = function (marker, key, info_obj) {
        var infowindow = new google.maps.InfoWindow({
                content:  search_info(key, info_obj),
                position: marker.LatLng                     
         });

         google.maps.event.addListener(infowindow, 'domready',function(){
             var endButton = document.getElementById(marker.search_key+'_button');
             if(endButton){
                 google.maps.event.addDomListener(endButton,'click', function(event){
                     event.preventDefault();
                     $.event.trigger("endSearch_click",marker.search_key);
                     infowindow.close();
                 });
             }
         });

         google.maps.event.addListener(marker, 'click',function () {
             infowindow.open(this_map, marker);
             //TODO: close info window on click but re-open on next click
             // google.maps.event.addListenerOnce(marker,'click',function(){
             //     infowindow.close();                        
             // });
             }
         );

         google.maps.event.addListener(marker, 'dragend',function () {
              $.event.trigger("search_position_changed",marker.search_key);
             }
         );
         
         
         this_infowindow=infowindow;
         infowindow.setSearchWindowContent = function(extra){
             
              this_infowindow.setContent(search_info(key,extra))
         }
         
         return infowindow;  
    },

    addSearch = function (position,key,info_obj) {
        
        search_icon= (info_obj.end_time && "./img/search_end.svg") || "./img/search_start.svg";
        
        if (!search_list[key]) {
            var marker = new google.maps.Marker({
                  draggable:true,
                  map: this_map,
                  position: position,
                  visible:true,
                  icon:{
                      anchor: new google.maps.Point(32, 32),
                      scaledSize: new google.maps.Size(50,50,'px','px'),
                      url: search_icon
                      
                  }
              });
            marker.search_key=key;
            marker.search_window= set_search_click(marker, key, info_obj);
        }
        return marker;
    },

    addSparkOffer = function (offer) {
        var position = new google.maps.LatLng(offer.lat, offer.lng);
        if (!spark_list[offer._id]) {
            var marker = new google.maps.Marker({
                draggable:true,
                map: this_map,
                position: position,
                visible:true,
                icon:{
                    anchor: new google.maps.Point(32, 32),
                    scaledSize: new google.maps.Size(30,30,'px','px'),
                    url: sparkrelief_icon
                }
            });
        }
        var infowindow_content = '<h1>' + offer.offerType + '</h1>'+
            '<p>' + offer.offerDesc + '</p>';
        var infowindow = new google.maps.InfoWindow({
            content: infowindow_content
        });
        google.maps.event.addListener(marker, 'click', function(){
            infowindow.open(this_map, marker);
        });
        return {position: position, marker: marker, infowindow: infowindow};
    };
        
    if (element !== map_element){
        map_element = element;
        google.maps.visualRefresh=true;
        this.map = new google.maps.Map(element, searchMapOptions); 

       var user_marker = user_marker || new google.maps.Marker({
            map: this.map,
            visible:false,
        });

        // user circle
         var user_circle = new google.maps.Circle({
           map: this.map,
           radius: 2,  
           fillColor: 'blue',
           fillOpacity: 1,
           strokeColor:"white",
           strokeOpacity:1
         });
         user_circle.bindTo('center', user_marker, 'position');

        // Add circle overlay and bind to marker
         var user_accuracy_circle = new google.maps.Circle({
           map: this.map,
           clickable:false,
           radius: 10,  
           fillColor: 'aqua',
           fillOpacity: 0.3,
           strokeOpacity:0
         });
         user_accuracy_circle.bindTo('center', user_marker, 'position');        
    }
    
    this.map.user = user_marker;
    this.map.user.accuracy=user_accuracy_circle.radius;
    this.map.addSearch = addSearch;      
    this.map.addSparkOffer = addSparkOffer;
    this_map=this.map;
    return this.map;
};
