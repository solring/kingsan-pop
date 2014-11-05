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
       
        var block = search.get('Block');

        if (block === undefined ||  block === ''){
            block = '中正區';
        }

        var lat = taipei[block].lat;
        var lng = taipei[block].lng;

        var popinfo = new google.maps.InfoWindow();
        var map = new google.maps.Map(document.getElementById("map-canvas"), {
          zoom: 15,
          scrollwheel: false,
          center: {
            lat: lat,
            lng: lng
          }
        });

        var JsonUrl = getAPIUrl(query);
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
            var renew_stat = feature.getProperty("都更狀態");
            var color = 'red';
            if(!renew_stat || renew_stat.length == 0){
                color = 'yellow';
            }
            return {
                fillColor: color,
                strokeWeight: 1
            };
        });

        map.data.addListener("click", function(event) {
            var properties = ["面積", "路段", "地號", "管理者", "使用分區"];
            var content = "<table class='ui table segment'>";

            properties.forEach(function(element, index, array) {
                var property = event.feature.getProperty(element);
                if (element === "面積"){
                  property += " 平方公尺";  
                }
                content += "<tr><td>" + element + "</td><td>" + property + "</td></tr>";
            });
            //for urban-renew information
            var id = event.feature.getProperty('id');
            var caseurl = event.feature.getProperty("caseurl");
            var upload_image = event.feature.getProperty('upload_image');
            var image_tpl = '';
            
            if (upload_image != null) {
                var image_url = '/u/images/' + $.trim(upload_image);
                image_tpl = "<a href='" + image_url + "' target='_blank'><img src='"+ image_url +"' width='50px' /></a>";
            }

            content += "<tr><td>都更狀態</td>";
            content += "<td><a href="+caseurl+" target='_blank'>"+ event.feature.getProperty("都更狀態") + "</a></td></tr>";
            content += "<tr><td>圖片：</td>";
            content += "<td class='js_upload_image'>"+ image_tpl + "</td></tr>";
            content += "<tr><td>提供圖片</td><td><form id='upload_form' action='/image/upload' method='post' enctype='multipart/form-data'>";
            content += "<input type='hidden' name='id' value='"+ id + "' />";
            content += "<input type='file' name='image'/><button type='submit' id='img_upload'>上傳</button>";
            content += "</form></td></tr>";
            content += "</table>";
            popinfo.close();
            popinfo.setContent(content);
            popinfo.setPosition(event.latLng);
            popinfo.open(map);

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
                    updateAddress( e, true )
                }, 10000 );
            }
        }

    jqAddress.mousedown( updateAddress );

})();