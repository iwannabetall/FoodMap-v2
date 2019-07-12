console.log(reviews)
mapboxgl.accessToken = 'pk.eyJ1IjoidGFyaGVlbDMwMDciLCJhIjoiY2p4aHlocXJ1MGkwZjN5bzVhZm5sd3N5ZyJ9.CPURwnBFE4Wk-674CYd5NA';
var map = new mapboxgl.Map({
    container: 'map',
    zoom: 0.3,
    center: [0, 20],
    style: 'mapbox://styles/mapbox/light-v10'
});

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());

// filters for classifying earthquakes into five categories based on magnitude
var mag1 = ["<", ["get", "mag"], 2];
// ["get", "mag"] - ["get", string] Retrieves a property value from the current feature's properties, or from another object if a second argument is provided.
// /["all", boolean, boolean] - returns true if all true 
// >= Returns true if the first input is greater than or equal to the second -> [">=", ["get", "mag"], 2] returns true if mag is  2 
var mag2 = ["all", [">=", ["get", "mag"], 2], ["<", ["get", "mag"], 3]];
var mag3 = ["all", [">=", ["get", "mag"], 3], ["<", ["get", "mag"], 4]];
var mag4 = ["all", [">=", ["get", "mag"], 4], ["<", ["get", "mag"], 5]];
var mag5 = [">=", ["get", "mag"], 5];

// colors to use for the categories
var colors = ['#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c'];

map.on('load', function () {
    // add a clustered GeoJSON source for a sample set of earthquakes
    // Add a new source from our GeoJSON data and set the
// 'cluster' option to true. GL-JS will add the point_count property to your source data.
    map.addSource('earthquakes', {
        "type": "geojson",
        "data": "https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson",
        "cluster": true,
        "clusterRadius": 80, // Radius of each cluster when clustering points - larger = fewer clusters
        "clusterProperties": { // keep separate counts for each magnitude category in a cluster - sum of ["case", mag1, 1, 0] - 1s if in mag1, 0s if not - mag1 is a boolean
            "mag1": ["+", ["case", mag1, 1, 0]],
            "mag2": ["+", ["case", mag2, 1, 0]],
            "mag3": ["+", ["case", mag3, 1, 0]],
            "mag4": ["+", ["case", mag4, 1, 0]],
            "mag5": ["+", ["case", mag5, 1, 0]]
        }
    });
    console.log(map)
    // circle and symbol layers for rendering individual earthquakes (unclustered points)
    map.addLayer({
        "id": "earthquake_circle",
        "type": "circle",
        "source": "earthquakes",
        "filter": ["!=", "cluster", true],
        "paint": {
        	//"case" Selects the first output whose corresponding test condition evaluates to true, or the fallback value otherwise. -mag1 is a boolean
            "circle-color": ["case",
                mag1, colors[0],
                mag2, colors[1],
                mag3, colors[2],
                mag4, colors[3], colors[4]],
            "circle-opacity": 0.6,
            "circle-radius": 12
        }
    });
    map.addLayer({
        "id": "earthquake_label",
        "type": "symbol",
        "source": "earthquakes",
        "filter": ["!=", "cluster", true],  //cluster != true ?? ie if it's one single thing 
        "layout": {
            "text-field": ["number-format", ["get", "mag"], {"min-fraction-digits": 1, "max-fraction-digits": 1}],
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-size": 10
        },
        "paint": {
        	// black font if it's < 3 mag, white if it's not 
            "text-color": ["case", ["<", ["get", "mag"], 3], "black", "white"]
        }
    });

    // objects for caching and keeping track of HTML marker objects (for performance)
    var markers = {};
    var markersOnScreen = {};
    console.log(markers)
    console.log(markersOnScreen)
    function updateMarkers() {
        var newMarkers = {};
        var features = map.querySourceFeatures('earthquakes');
        // console.log(features) // features = all the clusters/markers with their metadata/properties
        // for every cluster on the screen, create an HTML marker for it (if we didn't yet),
        // and add it to the map if it's not there already
        for (var i = 0; i < features.length; i++) {
        	console.log(features[i])
            var coords = features[i].geometry.coordinates;            
            var props = features[i].properties;

            if (!props.cluster) continue;  // if it's not a cluster, create a marker with the cluster_id as a key                
            var id = props.cluster_id;
            console.log(coords) 
            var marker = markers[id];

            // if it's a cluster, create a donut chart
            if (!marker) {
            	// console.log(props)
            	// console.log(id)
                var el = createDonutChart(props);
                // console.log(el)                
                marker = markers[id] = new mapboxgl.Marker({element: el}).setLngLat(coords);
                
            }
            newMarkers[id] = marker;
            console.log(newMarkers)
            if (!markersOnScreen[id])
                marker.addTo(map);
        }
        // for every marker we've added previously, remove those that are no longer visible
        for (id in markersOnScreen) {
            if (!newMarkers[id])
                markersOnScreen[id].remove();
        }
        markersOnScreen = newMarkers;
    }

    // after the GeoJSON data is loaded, update markers on the screen and do so on every map move/moveend
    map.on('data', function (e) {
        if (e.sourceId !== 'earthquakes' || !e.isSourceLoaded) return;

        map.on('move', updateMarkers);
        map.on('moveend', updateMarkers);
        updateMarkers();
    });
});



// code for creating an SVG donut chart from feature properties
function createDonutChart(props) {
    var offsets = [];
    // console.log(props)
    // props: {cluster: true, cluster_id: 34, mag1: 2136, mag2: 514, mag3: 130, mag4: 12, mag5: 3, point_count: 2795, point_count_abbreviated: "2.8k"},
    var counts = [props.mag1, props.mag2, props.mag3, props.mag4, props.mag5];
    var total = 0;
    for (var i = 0; i < counts.length; i++) {
        offsets.push(total);
        total += counts[i];
    }
    var fontSize = total >= 1000 ? 22 : total >= 100 ? 20 : total >= 10 ? 18 : 16;
    var r = total >= 1000 ? 50 : total >= 100 ? 32 : total >= 10 ? 24 : 18;
    var r0 = Math.round(r * 0.6);
    var w = r * 2;

    var html = '<svg width="' + w + '" height="' + w + '" viewbox="0 0 ' + w + ' ' + w +
        '" text-anchor="middle" style="font: ' + fontSize + 'px sans-serif">';

    for (i = 0; i < counts.length; i++) {
        html += donutSegment(offsets[i] / total, (offsets[i] + counts[i]) / total, r, r0, colors[i]);
    }
    html += '<circle cx="' + r + '" cy="' + r + '" r="' + r0 +
        '" fill="white" /><text dominant-baseline="central" transform="translate(' +
        r + ', ' + r + ')">' + total.toLocaleString() + '</text></svg>';

    var el = document.createElement('div');
    el.innerHTML = html;
    return el.firstChild;
}

function donutSegment(start, end, r, r0, color) {
    if (end - start === 1) end -= 0.00001;
    var a0 = 2 * Math.PI * (start - 0.25);
    var a1 = 2 * Math.PI * (end - 0.25);
    var x0 = Math.cos(a0), y0 = Math.sin(a0);
    var x1 = Math.cos(a1), y1 = Math.sin(a1);
    var largeArc = end - start > 0.5 ? 1 : 0;

    return ['<path d="M', r + r0 * x0, r + r0 * y0, 'L', r + r * x0, r + r * y0,
        'A', r, r, 0, largeArc, 1, r + r * x1, r + r * y1,
        'L', r + r0 * x1, r + r0 * y1, 'A',
        r0, r0, 0, largeArc, 0, r + r0 * x0, r + r0 * y0,
        '" fill="' + color + '" />'].join(' ');
}