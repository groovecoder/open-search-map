"use strict";

// This object contains all the relevant methods for retrieve information on searches
// currently this data is stored with geoloqi so this is mainly a wrapper on geoloqi functions

var search_db = function (){
    var search_list={}, spark_list=[], searchers_list={},user_list={};

    this.searchBounds = function (arrayLatlng){        
        // Based on Google Maps API v3 
        // Purpose: given an array of Latlng's return a LatlngBounds
        // Why: This is helpful when using fitBounds, panTo
        var newBounds = new google.maps.LatLngBounds,p=0;

        for (var m in search_list){
            newBounds.extend(search_list[m].position);
        }
        return newBounds;
    };


    this.user_guid = function(){
        var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
             return v.toString(16);
        });     
        return guid;
    };

    this.init = function (this_map){
        
        // initialize geoloqi
        // d8fa36c91c761155e82795a6745b4e23 j
        // dd261f12d13b5817c631826b5c209c57 l
        geoloqi.init({
          client_id: 'd8fa36c91c761155e82795a6745b4e23',
          package_name: 'Open Search & Rescue',
          package_verison: '0.1',
          persist: 'cookies'
        });

        geoloqi.onAuthorize = function(response, error){
          console.log("You are a user!");
          // start watching position
          $.mobile.changePage('#mapPage');
        };
        geoloqi.onLoginError = function(error){
          console.log("You are not a user!");
          $('#linkDialog').click();
        }

        geoloqi.auth={'access_token':'fb75d-ddf59124a0403299ea67e6c001d14c676806459d'};
        
        geoloqi.get("place/list", {
          layer_id:"96yV"
        }, function(response, error){
            for (var i = 0; i < response.places.length; i++){
                var p=response.places[i];
                var search_loc = new google.maps.LatLng(p.latitude,p.longitude);
                search_list[p.place_id] = this_map.addSearch(search_loc,p.place_id,p.extra);
                this_map.panTo(search_loc);
            };
        });

        // Get offer data from sparkrelief.org
        // https://sparkrelief.org/offers/for/oklahoma-city-tornado?disaster=oklahoma-city-tornado
        $.getJSON('js/okc_tornado_offers.json', function(data){
            $(data).each(function(index, offer){
                spark_list.push(this_map.addSparkOffer(offer));
            });
        });
        
        
        watch_user: new geoloqi.watchPosition({
          success: this_map.goodPositionChange,
          error: this_map.badPositionChange
        });    
    
    };

    
    this.searches=search_list,
    this.sparks=spark_list,
    this.searchers=searchers_list,
    this.get= geoloqi.get;
    this.post=geoloqi.post;
    this.login=geoloqi.login;
        
};
