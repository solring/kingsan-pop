(function() {

    var taipei = {
    "中正區": {
      lat: 25.0293008,
      lng: 121.5205833
    },
    "大同區": {
      lat: 25.0645027,
      lng: 121.513314
    },
    "中山區": {
      lat: 25.0685028,
      lng: 121.5456014
    },
    "萬華區": {
      lat: 25.0294936,
      lng: 121.4978838
    },
    "信義區": {
      lat: 25.0287142,
      lng: 121.5723162
    },
    "松山區": {
      lat: 25.0601727,
      lng: 121.5593073
    },
    "大安區": {
      lat: 25.0263074,
      lng: 121.543846
    },
    "南港區": {
      lat: 25.038392,
      lng: 121.6219879
    },
    "北投區": {
      lat: 25.1531486,
      lng: 121.5174287
    },
    "內湖區": {
      lat: 25.0835016,
      lng: 121.5903754
    },
    "士林區": {
      lat: 25.1347802,
      lng: 121.5324453
    },
    "文山區": {
      lat: 24.9880073,
      lng: 121.5752716
    }
    };

    var API = "/api/search";
    var STATIC_API = "/api/kinsan";


    var FIELDS = ['Block','Area','Unit','Address'];

    var getAPIUrl = function(query){

        if (Object.keys(query).length > 0){
            return API + '?' + $.param(query);
        }

        return API;
    };

    var showMap = function(query) {
        var maploading = $("#map-loading");
        maploading.addClass('active');
       
        var lat = 24.7768925;
        var lng = 121.0239258;

        var popinfo = new google.maps.InfoWindow();
        var map = new google.maps.Map(document.getElementById("map-canvas"), {
          zoom: 16,
          scrollwheel: false,
          center: {
            lat: lat,
            lng: lng
          }
        });

        //var JsonUrl = getAPIUrl(query);
        var JsonUrl = STATIC_API;
        console.log("JSON URL: " + JsonUrl);

        $.getJSON(JsonUrl, function(GeoJSON){
            if (! $.isEmptyObject(GeoJSON)){
                var features = GeoJSON.features;
                features.forEach(function(feature){
                    map.data.addGeoJson(feature);
                });
            }
            
        }).always(function(){
            maploading.removeClass('active');
        });



        map.data.setStyle( function(feature){
            var stat = feature.getProperty("listed");
            var icon_path = 'marker_orange.png';
            if(stat!="YES"){
                icon_path = 'marker.png';
            }
            return {
                icon: "http://maps.google.com/mapfiles/"+icon_path
            };
        });

        map.data.addListener('addfeature', function(event){

            var lat = Number(event.feature.getProperty('ycenter'));
            var lng = Number(event.feature.getProperty('xcenter'));
            var latLng = new google.maps.LatLng(lat,lng);

            var marker = new google.maps.Marker({
                position: latLng,
                map: map,
                icon: { 
                    url: 'images/camera-icon.png',
                    scaledSize: new google.maps.Size(15,15)

                },
            });
        });

        map.data.addListener('mouseover', function(event){
            this.overrideStyle(event.feature, {strokeWeight: 2, fillOpacity: 1});
        });

        map.data.addListener('mouseout', function(event){
            this.overrideStyle(event.feature, {strokeWeight: 1, fillOpacity: 0.2});
        });

        map.data.addListener("click", function(event) {
            var properties = ["address", "listed", "floorNum"];
            var content = "<table class='ui table segment'>";

            properties.forEach(function(element, index, array) {
                var property = event.feature.getProperty(element);
                content += "<tr><td>" + element + "</td><td>" + property + "</td></tr>";
            });
            //for urban-renew information
            var image_tpl = '';
            var addr = event.feature.getProperty('address');

            content += "<tr><td>提供圖片</td><td><form id='upload_form' action='/image/upload' method='post' enctype='multipart/form-data'>";
            content += "<input type='hidden' name='id' value='"+ addr + "' />";
            content += "<input type='file' name='image'/><button type='submit' id='img_upload'>上傳</button>";
            content += "<img src='/image/exposure?id="+ addr +"' width='0px'/>";
            content += "</form></td></tr>";
            content += "</table>";
            
            popinfo.close();
            popinfo.setContent(content);
            popinfo.setPosition(event.latLng);
            popinfo.open(map);

            var jqImage = $('.js_image');
            var jqModal = jqImage.siblings('div.js_modal');

            jqImage.on('click', function(event){
                event.preventDefault();

                jqModal.modal('show');
 
                return false;
            });

            $('#upload_form').on('submit', function() {
                
                $(this).ajaxSubmit({
                    success: function(response){
                        if (response.status) {
                            var img_url = '/u/images/' + response.filenames;
                            var img = $('<img>').attr('src', img_url).attr('width','50px');
                            $('.js_upload_image').append(img);

                            event.feature.setProperty('upload_image', response.filenames);
                        }
                    },
                    error: function(response) {
                        console.log('error');
                    }
                });
                return false;
            });
        });
    };

    var Search = function() {
        this.vars = {};
    };

    Search.prototype.set = function(key,val) {
        this.vars[key] = val;
        this.run();
    };
    Search.prototype.get = function(key) {
        var val = this.vars[key];
        
        return val;
    };

    Search.prototype.run = function() {
        var vars = this.vars;
        var query = {};

        FIELDS.forEach(function (field) {
            if (vars[field]){
                query[field] = vars[field];
            }
        });

        if( vars.Address && vars.Block ) {
            delete query.Block;
        }

        showMap(query);
    };

    var search = new Search();

    $(".dropdown").dropdown({
      onChange: function(val) {
        $(".map-notice").remove();
        $("#map-canvas").css('display','table-row');
      }
    });

    $(".data-description").popup({
        on: 'click'
    });

    FIELDS.forEach(function(field){
        var selector = $(".choice-" + field.toLowerCase() + " a");

        selector.click(function(){
          var val;
          val = $(this).attr("data-value");
          search.set(field, val);
        });

    });

    var jqAddress = $('#input-address'),
        updateAddressTimer = null,
        updateAddress = function( e, doUpdate ) {

            if( doUpdate ) {
                updateAddressTimer = null;
                search.set( 'Address', jqAddress.val() );
            } else {
                clearTimeout( updateAddressTimer );
                updateAddressTimer = setTimeout( function() {
                    updateAddress( e, true );
                }, 10000 );
            }
        };

    jqAddress.mousedown( updateAddress );

    $('document').ready(function(){
        showMap();
    });
})();
