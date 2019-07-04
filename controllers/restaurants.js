

exports.getData = async (req, res, next) => {
	var queryStr = 'SELECT a.id, a.restaurant, a.rating, a.pricerange, a.value, a.PriceDetails, a.tried, a.thoughts, a.WouldIReturn, b.yelpURL, b.latitude, b.longitude, b.is_closed, b.streetAddress, b.categories, b.city, b.state, b.region from reviews a inner join restaurantinfo b on a.id= b.restaurant_id;'
    try {
      const client = await pool.connect()
      const result = await client.query(queryStr);
      // console.log('GOT DATA', result.rows)
      const results = { 'results': (result) ? result.rows : null};      
      // console.log("number of rows", result)
      for (i=0; i<result.rowCount; i++) {      	
      	result.rows[i].rating = parseFloat(result.rows[i].rating)
      	// console.log(result.rows[i].rating, result.rows[i].restaurant)
      }
      res.locals.data = result.rows
      
      // res.send(results)
      // res.render('pages/db', results );
      client.release();
      next()
    } catch (err) {
    	console.log('HELP ME')
      console.error(err);
      res.send("Error " + err);
    }
  }

exports.earthquake = (req, res) => {
	// console.log('RES LOCALS WORKS!?', res.locals)
	res.render('earthquake')
}

exports.reformatToGeoJSON = (req, res, next) => {
	// it's a feature collection (geojson quirk) b/c list of points w/data 
	// require geometry type with lat/long, properties key 
	var dataToConvert = res.locals.data
	var geoJSON = {}
	geoJSON.type = "FeatureCollection"	
	var features = []
	
	for (i=0; i<dataToConvert.length; i++) {
		var rowData = {}
		rowData.type = 'Feature'

		rowData.geometry = {}
		rowData.geometry.type = 'Point'		
		rowData.geometry.coordinates = [parseFloat(dataToConvert[i].longitude), parseFloat(dataToConvert[i].latitude)]

		rowData.properties = {}
		rowData.properties.restaurant = dataToConvert[i].restaurant
		rowData.properties.rating = parseFloat(dataToConvert[i].rating)
		rowData.properties.pricerange = dataToConvert[i].pricerange
		rowData.properties.thoughts = dataToConvert[i].thoughts
		rowData.properties.tried = dataToConvert[i].tried
		rowData.properties.wouldireturn = dataToConvert[i].wouldireturn
		rowData.properties.yelpurl = dataToConvert[i].yelpurl
		rowData.properties.city = dataToConvert[i].city
		rowData.properties.streetaddress = dataToConvert[i].streetaddress
		rowData.properties.streetaddress = dataToConvert[i].streetaddress
		rowData.properties.cuisine = dataToConvert[i].categories
		rowData.properties.id = parseInt(dataToConvert[i].id)

		features.push(rowData)
	}
	geoJSON.features = features
	
	res.locals.geojsonData = geoJSON

	next()
}