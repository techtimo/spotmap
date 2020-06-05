function initMap(options = {devices: [], styles: {},dateRange:{},mapcenter: 'all'}) {
    try {
        var spotmap = L.map('spotmap-container', { fullscreenControl: true, });
    } catch (e){
        return;
    }
    var Marker = L.Icon.extend({
        options: {
            shadowUrl: spotmapjsobj.url +'leaflet/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }
    });
    var TinyMarker = L.Icon.extend({
        options: {
            iconSize: [10, 10],
            iconAnchor: [5, 5],
            popupAnchor: [0, 0]
        }
    });
    markers = {
        blue: new Marker({iconUrl: spotmapjsobj.url +'leaflet/images/marker-icon-blue.png'}),
        gold: new Marker({iconUrl: spotmapjsobj.url +'leaflet/images/marker-icon-gold.png'}),
        red: new Marker({iconUrl: spotmapjsobj.url +'leaflet/images/marker-icon-red.png'}),
        green: new Marker({iconUrl: spotmapjsobj.url +'leaflet/images/marker-icon-green.png'}),
        orange: new Marker({iconUrl: spotmapjsobj.url +'leaflet/images/marker-icon-orange.png'}),
        yellow: new Marker({iconUrl: spotmapjsobj.url +'leaflet/images/marker-icon-yellow.png'}),
        violet: new Marker({iconUrl: spotmapjsobj.url +'leaflet/images/marker-icon-violet.png'}),
        gray: new Marker({iconUrl: spotmapjsobj.url +'leaflet/images/marker-icon-gray.png'}),
        black: new Marker({iconUrl: spotmapjsobj.url +'leaflet/images/marker-icon-black.png'}),
        tiny:{
            blue: new TinyMarker({iconUrl: spotmapjsobj.url +'leaflet/images/marker-tiny-icon-blue.png'}),
            gold: new TinyMarker({iconUrl: spotmapjsobj.url +'leaflet/images/marker-tiny-icon-gold.png'}),
            red: new TinyMarker({iconUrl: spotmapjsobj.url +'leaflet/images/marker-tiny-icon-red.png'}),
            green: new TinyMarker({iconUrl: spotmapjsobj.url +'leaflet/images/marker-tiny-icon-green.png'}),
            orange: new TinyMarker({iconUrl: spotmapjsobj.url +'leaflet/images/marker-tiny-icon-orange.png'}),
            yellow: new TinyMarker({iconUrl: spotmapjsobj.url +'leaflet/images/marker-tiny-icon-yellow.png'}),
            violet: new TinyMarker({iconUrl: spotmapjsobj.url +'leaflet/images/marker-tiny-icon-violet.png'}),
            gray: new TinyMarker({iconUrl: spotmapjsobj.url +'leaflet/images/marker-tiny-icon-gray.png'}),
            black: new TinyMarker({iconUrl: spotmapjsobj.url +'leaflet/images/marker-tiny-icon-black.png'}),
        }
    };

    var baseLayers = {"Mapbox Outdoors": L.tileLayer(
        'https://api.mapbox.com/styles/v1/mapbox/outdoors-v11/tiles/{z}/{x}/{y}?access_token={accessToken}', {
            tileSize: 512,
            accessToken: "pk.eyJ1IjoidGVjaHRpbW8iLCJhIjoiY2s2ODg4amxxMDJhYzNtcG03NnZoM2dyOCJ9.5hp1h0z5YPfqIpiP3UOs9w",
            zoomOffset: -1,
            attribution: '© <a href="https://apps.mapbox.com/feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        })};
    for (var map in spotmapjsobj.maps){
        baseLayers[map] = L.tileLayer(spotmapjsobj.maps[map])
    }

    baseLayers[Object.keys(baseLayers)[0]].addTo(spotmap);
    let data = { 
        'action': 'get_positions', 
        'date-range-from': options.dateRange.from, 
        'date-range-to': options.dateRange.to, 
        'date': options.date, 
    }
    if(options.devices){
        data.devices = options.devices;
    }
    jQuery.post(spotmapjsobj.ajaxUrl, data, function (response) {

        if (response.error) {
            spotmap.setView([51.505, -0.09], 13);
            response.title = response.title || "No data found!";
            response.message = response.message || "";
            var popup = L.popup()
                .setLatLng([51.5, -0.09])
                .setContent("<b>" + response.title + "</b><br>" + response.message)
                .openOn(spotmap);
            return;
        }

        var overlays = {},
            devices = [response[0].device],
            group = [], 
            line = [];


        // loop thru the data received from backend
        response.forEach((entry,index) => {
            // device changed in loop
            let color = 'blue';
            if(options.styles[entry.device] && options.styles[entry.device].color)
                color = options.styles[entry.device].color;
            if(devices[devices.length-1] != entry.device){
                let lastDevice = devices[devices.length-1];
                let color = 'blue';
                if(options.styles[lastDevice] && options.styles[lastDevice].color)
                    color = options.styles[lastDevice].color;
                group.push(L.polyline(line, {color: color}))
                overlays[lastDevice] = L.layerGroup(group);
                line = [];
                group = [];
                devices.push(entry.device);
            } else if (options.styles[entry.device] && options.styles[entry.device].splitLines && index > 0 && entry.unixtime - response[index-1].unixtime >= options.styles[entry.device].splitLines*60*60){
                group.push(L.polyline(line, {color: color}));
                line = [];
            }

             else {
                // a normal iteration adding stuff with default values
                line.push([entry.latitude, entry.longitude]);
             }
                let message = 'Date: ' + entry.date + '</br>Time: ' + entry.time + '</br>';
            if(entry.custom_message)
                message += 'Message: ' + entry.custom_message + '</br>';
            if(entry.altitude > 0)
                message += 'Altitude: ' + Number(entry.altitude) + 'm</br>';
            if(entry.battery_status == 'LOW')
                message += 'Battery status is low!' + '</br>';

            var option = {icon: markers[color]};
            let tinyTypes = ['UNLIMITED-TRACK','STOP','EXTREME-TRACK','TRACK'];
            if(options.styles[entry.device] && options.styles[entry.device].tinyTypes)
                tinyTypes = options.styles[entry.device].tinyTypes;

            if(tinyTypes.includes(entry.type))
                option.icon = markers.tiny[color];

            var marker = L.marker([entry.latitude, entry.longitude], option).bindPopup(message);
            group.push(marker);
                
            
            // for last iteration add the rest that is not cought with a device change
            if(response.length == index+1){
                group.push(L.polyline(line, {color: color}));
                overlays[devices[devices.length-1]] = L.layerGroup(group);
            }
        });

        if(devices.length == 1)
            L.control.layers(baseLayers).addTo(spotmap);
        else
            L.control.layers(baseLayers,overlays).addTo(spotmap);
        
        
            var bounds = L.bounds([[0,0],[0,0]]);
            let all = [];
            // loop thru feeds to get the bounds
            for (const feed in overlays) {
                if (overlays.hasOwnProperty(feed)) {
                    const element = overlays[feed];
                    element.addTo(spotmap);
                    const layers = element.getLayers();
                    layers.forEach(element => {
                        all.push(element);
                    });
                }
            }
            if(options.mapcenter == 'all'){
            var group = new L.featureGroup(all);
            spotmap.fitBounds(group.getBounds());
            spotmap.fitBounds(bounds);
        } else {
            var lastPoint;
            var time = 0;
            response.forEach((entry,index) => {
                if( time < entry.unixtime){
                    time = entry.unixtime;
                    lastPoint = [entry.latitude, entry.longitude];
                }
            });
            spotmap.setView([lastPoint[0],lastPoint[1]], 13);

        }

    });
}