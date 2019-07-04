console.log(reviews)
mapboxgl.accessToken = 'pk.eyJ1IjoidGFyaGVlbDMwMDciLCJhIjoiY2p4aHlocXJ1MGkwZjN5bzVhZm5sd3N5ZyJ9.CPURwnBFE4Wk-674CYd5NA';
var map = new mapboxgl.Map({
    container: 'map',
    zoom: 1.43,
    center: [7.045, 0], //center from map.getCenter()
    style: 'mapbox://styles/mapbox/light-v10'
});

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());

// filters for classifying earthquakes into five categories based on tiernitude
var tier1 = ["<", ["get", "rating"], 3];
// ["get", "rating"] - ["get", string] Retrieves a property value from the current feature's properties, or from another object if a second argument is provided.
// /["all", boolean, boolean] - returns true if all true 
// >= Returns true if the first input is greater than or equal to the second -> [">=", ["get", "rating"], 2] returns true if tier is  2 
var tier2 = ["all", [">=", ["get", "rating"], 3], ["<", ["get", "rating"], 5]];
var tier3 = ["all", [">=", ["get", "rating"], 5], ["<", ["get", "rating"], 7]];
var tier4 = ["all", [">=", ["get", "rating"], 7], ["<", ["get", "rating"], 8]];
var tier5 = [">=", ["get", "rating"], 8];

// colors to use for the categories
var colors = ['#ff0000', '#ffae19', '#ffff32', '#66b266', '#008000'];

map.on('load', function () {
    // add a clustered GeoJSON source for a sample set of earthquakes
    // Add a new source from our GeoJSON data and set the
// 'cluster' option to true. GL-JS will add the point_count property to your source data.
    map.addSource('earthquakes', {
        "type": "geojson",
        "data": reviews,        
        "cluster": true,
        "clusterRadius": 42, // Radius of each cluster when clustering points - larger = fewer clusters
        "clusterProperties": { // keep separate counts for each tiernitude category in a cluster - sum of ["case", tier1, 1, 0] - 1s if in tier1, 0s if not - tier1 is a boolean
            "tier1": ["+", ["case", tier1, 1, 0]],
            "tier2": ["+", ["case", tier2, 1, 0]],
            "tier3": ["+", ["case", tier3, 1, 0]],
            "tier4": ["+", ["case", tier4, 1, 0]],
            "tier5": ["+", ["case", tier5, 1, 0]]
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
        	//"case" Selects the first output whose corresponding test condition evaluates to true, or the fallback value otherwise. -tier1 is a boolean
            "circle-color": ["case",
                tier1, colors[0],
                tier2, colors[1],
                tier3, colors[2],
                tier4, colors[3], colors[4]],
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
            "text-field": ["number-format", ["get", "rating"], {"min-fraction-digits": 0, "max-fraction-digits": 1}],
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-size": 10
        },
        "paint": {
        	// black font if it's < 3 tier, white if it's not 
            "text-color": 'black'
            // "text-color": ["case", [">=", ["get", "rating"], 7], "black", "white"]
        }
    });
    
    // new layer for clustered points
    // map.addLayer({
    //     "id": "cluster",
    //     "type": "symbol",
    //     "source": "earthquakes",
    //     "interactive": true,
    //     "layout": {
    //         "icon-image": "star-15",
    //         "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
    //         "text-anchor": "top",
    //         "text-field": "{point_count}",
    //         "text-offset": [0, 0.6],
    //         "text-size" : 12
    //     },
    //     "filter": [">=", "point_count", 2]
    // });

    // objects for caching and keeping track of HTML marker objects (for performance)
    var markers = {};
    var markersOnScreen = {};
    
    function updateMarkers() {
        var newMarkers = {};
        var features = map.querySourceFeatures('earthquakes');
        // console.log(features) // features = all the clusters/markers with their metadata/properties
        // for every cluster on the screen, create an HTML marker for it (if we didn't yet),
        // and add it to the map if it's not there already
        for (var i = 0; i < features.length; i++) {
        	// console.log(features[i])
            var coords = features[i].geometry.coordinates;
            var props = features[i].properties;
            if (!props.cluster) continue;  // if it's not a cluster, create a marker 
            var id = props.cluster_id;
            // console.log(markers)            
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
            // console.log(newMarkers)
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

map.on('click', 'earthquake_circle', function(e) {
    console.log(e.point)
})

// code for creating an SVG donut chart from feature properties
function createDonutChart(props) {
    var offsets = [];
    // console.log(props)
    // props: {cluster: true, cluster_id: 34, tier1: 2136, tier2: 514, tier3: 130, tier4: 12, tier5: 3, point_count: 2795, point_count_abbreviated: "2.8k"},
    var counts = [props.tier1, props.tier2, props.tier3, props.tier4, props.tier5];
    var total = 0;
    for (var i = 0; i < counts.length; i++) {
        offsets.push(total);
        total += counts[i];
    }
    var fontSize = total >= 1000 ? 22 : total >= 100 ? 20 : total >= 10 ? 18 : 16;
    var r = total >= 1000 ? 50 : total >= 100 ? 32 : total >= 10 ? 24 : 18;
    var r0 = Math.round(r * 0.6);
    var w = r * 2;

    var html = '<svg data-id=' + props.cluster_id + ' data-point_count=' + props.point_count + ' width="' + w + '" height="' + w + '" viewbox="0 0 ' + w + ' ' + w +
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


// side bar display 

document.addEventListener('click', function (e) {
      // console.log(e.target.parentNode)
      // if click on a cluster - check by using e.target.parentNode to see if clicked SVG 
      // use parent class svg b/c - e.target could be path or text 
    if (hasClass(e.target.parentNode, 'mapboxgl-marker')) {
        var clusterId = parseInt(e.target.parentNode.dataset.id)
        var point_count = parseInt(e.target.parentNode.dataset.point_count)
        clusterSource = map.getSource('earthquakes'); /* cluster layer data source id */
          
        // Get Next level cluster Children--idk what this does 
        clusterSource.getClusterChildren(clusterId, function(err, aFeatures){
        	// console.log('getClusterChildren', err, aFeatures);
        });

	      // Get all points under a cluster
	      clusterSource.getClusterLeaves(clusterId, point_count, 0, function(err, aFeatures){
	        // console.log('getClusterLeaves', err, aFeatures);
	        // sort points in order of favs to least fav 
	        
	        var sortedRecs = aFeatures.sort(function(a, b) {
	        	return b.properties.rating - a.properties.rating;
	        });
	        
	        var recs = sortedRecs.filter((x) => (x.properties.rating >= 8))

	        // if no recs, look for places >=6
	        if (recs.length == 0) {
	        	recs = sortedRecs.filter((x) => (x.properties.rating >= 6))
	        }
	        if (recs.length > 0) {
		        	// creat rec list to show on cluster click
		        var recList = []
		        var noDupes = [] // keep track of what's here to count number of locations?	     	        
		        var displayCount = recs.length >= 20 ? 20 : recs.length	
		        var recHTML = "Some recs! Faves are &#x1F31F'd<br>"
	        	for (i=0; i < displayCount; i++) {
	        		// var rec = {}
	        		if (!noDupes.includes(recs[i].properties.id) && noDupes.length <= 10){
	        			
	        			var fav = recs[i].properties.rating == 10 ? '&#x1F31F' : ''
	        			
	        			// not all places have websites
	        			if (recs[i].properties.yelpurl == null) {
	        				recHTML = recHTML + '<div data-id=' + recs[i].properties.id + ' class=displayRecs ' + recs[i].properties.id + '>' + fav + recs[i].properties.restaurant + '</a> - ' + recs[i].properties.city + ' (' + recs[i].properties.cuisine + ') </div>'
	        			} else {
	        				recHTML = recHTML + '<div data-id=' + recs[i].properties.id + ' class=displayRecs ' + recs[i].properties.id + '>' + fav + '<a href="' + recs[i].properties.yelpurl + '">' + recs[i].properties.restaurant + '</a> - ' + recs[i].properties.city + ' (' + recs[i].properties.cuisine + ') </div>'	
	        			}
	        				        			
	        			// console.log(recHTML)
	         		// 	rec.restaurant = recs[i].properties.restaurant
				        // rec.city = recs[i].properties.city
				        // rec.rating = recs[i].properties.rating
				        // rec.yelpurl = recs[i].properties.yelpurl
				        // rec.cuisine = recs[i].properties.cuisine
				        noDupes.push(recs[i].properties.id)
				        // recList.push(rec)
	        		} 
        		}        			        	
        		map.flyTo({center: recs[0].geometry.coordinates, zoom: map.getZoom() + 2});	
	        } else {
	        	// no recs 
	        	var recHTML = "<div class=displayRecs>Let's just say that I didn't starve when I was in " + sortedRecs[0].properties.city + '. </div>'
	        	// have map zoom to towards cluster-just use the top rec to ballpark
	        	map.flyTo({center: sortedRecs[0].geometry.coordinates, zoom: map.getZoom() + 2});	
	        }
	        document.getElementById('infoBox').innerHTML = recHTML

	      })
        
    }

    // if individual marker 


}, false);

// popup window on marker click

map.on('click', 'earthquake_circle', function(e) {
	// console.log(e.features[0].properties.description)
	// console.log(e.features[0])
	var coordinates = e.features[0].geometry.coordinates.slice();
	if (e.features[0].properties.yelpurl == 'null') { //why is null a string here
		var header = '<h3>' + e.features[0].properties.restaurant + '</h3>' + '<br>'
	} else {
		var header = '<h3> <a target="_blank" href=' + e.features[0].properties.yelpurl + '>'+ e.features[0].properties.restaurant + '</a></h3>' + '<br>'
	}
	
	var cuisine = '<u>Price</u>: ' +e.features[0].properties.cuisine + '<br>'
	var price = '<u>Price</u>: ' + e.features[0].properties.pricerange + '<br>'
	var tried = '<u>Tried</u>: ' + e.features[0].properties.tried + '<br>'
	var thoughts = '<u>Thoughts</u>: ' + e.features[0].properties.thoughts + '<br>'
	var wouldIreturn = '<u>Would I Return</u>: ' + e.features[0].properties.wouldireturn + '<br>'

	var description = '<div>' + header + price + tried + thoughts + wouldIreturn + '</div>'
	 
	// Ensure that if the map is zoomed out such that multiple
	// copies of the feature are visible, the popup appears
	// over the copy being pointed to.
	while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
		coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
	}

// marker height adjusts space btwn tooltip and marker??
	var markerHeight = 50, markerRadius = 10, linearOffset = 25;
	var popupOffsets = {
	 'top': [0, 0],
	 'top-left': [0,0],
	 'top-right': [0,0],
	 'bottom': [0, -markerHeight],
	 'bottom-left': [linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
	 'bottom-right': [-linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
	 'left': [markerRadius, (markerHeight - markerRadius) * -1],
	 'right': [-markerRadius, (markerHeight - markerRadius) * -1]
	 };
		 
		new mapboxgl.Popup({offset: popupOffsets, className: 'popup'})
			.setLngLat(coordinates)
			.setHTML(description)
			.setMaxWidth("320px")
			.addTo(map);
})

function hasClass(elem, className) {
    return elem.classList.contains(className);
}