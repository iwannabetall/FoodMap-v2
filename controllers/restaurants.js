
const { Pool } = require('pg');

// production side 
const pool = new Pool({	
  connectionString: process.env.DATABASE_URL,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.PORT,
  host: process.env.HOST,
  ssl: true
  // sslfactory: org.postgresql.ssl.NonValidatingFactory
});


exports.getData = async (req, res, next) => {
	var queryStr = "SELECT a.id, b.restaurant, a.rating, a.pricerange, a.value, a.PriceDetails, a.tried, a.thoughts, a.WouldIReturn, b.yelpURL, b.yelpRating, b.reviewcount, b.latitude, b.longitude, b.phone, b.is_closed, b.streetAddress, b.categories, b.location, b.city, b.state, b.region from reviews a inner join restaurantinfo b on a.id= b.restaurant_id where is_closed IS NOT TRUE;"

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


exports.getClosed = async (req, res, next) => {
	var queryStr = "SELECT a.id, b.restaurant, a.rating, a.pricerange, a.value, a.PriceDetails, a.tried, a.thoughts, a.WouldIReturn, b.yelpURL, b.yelpRating, b.reviewcount, b.latitude, b.longitude, b.phone, b.is_closed, b.streetAddress, b.categories, b.location, b.city, b.state, b.region from reviews a inner join restaurantinfo b on a.id= b.restaurant_id where is_closed = 'TRUE';"

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

// SELECT a.id, b.restaurant, b.yelpRating from reviews a inner join restaurantinfo b on a.id= b.restaurant_id where is_closed = 'FALSE';

exports.reformatToGeoJSON = (req, res, next) => {
	// it's a feature collection (geojson quirk) b/c list of points w/data 
	// require geometry type with lat/long, properties key 
	var dataToConvert = res.locals.data
	var geoJSON = {}
	geoJSON.type = "FeatureCollection"	
	var features = []
	
	// console.log(dataToConvert[0])
	for (i=0; i<dataToConvert.length; i++) {
		var rowData = {}
		rowData.type = 'Feature'

		rowData.geometry = {}
		rowData.geometry.type = 'Point'		
		rowData.geometry.coordinates = [parseFloat(dataToConvert[i].longitude), parseFloat(dataToConvert[i].latitude)]

		rowData.properties = {}
		rowData.properties.restaurant = dataToConvert[i].restaurant
		rowData.properties.rating = parseFloat(dataToConvert[i].rating)
		rowData.properties.yelprating = parseFloat(dataToConvert[i].yelprating)
		rowData.properties.pricerange = dataToConvert[i].pricerange
		rowData.properties.thoughts = dataToConvert[i].thoughts
		rowData.properties.tried = dataToConvert[i].tried
		rowData.properties.wouldireturn = dataToConvert[i].wouldireturn
		rowData.properties.yelpurl = dataToConvert[i].yelpurl
		rowData.properties.city = dataToConvert[i].city
		rowData.properties.location = dataToConvert[i].location // more precise location/city - from yelp
		rowData.properties.phone = dataToConvert[i].phone
		rowData.properties.streetaddress = dataToConvert[i].streetaddress
		rowData.properties.cuisine = dataToConvert[i].categories
		rowData.properties.id = parseInt(dataToConvert[i].id)
		rowData.properties.reviewcount = parseInt(dataToConvert[i].reviewcount)

		features.push(rowData)
	}
	// console.log(features[0])
	geoJSON.features = features
	
	res.locals.geojsonData = geoJSON

	next()
}


const getUserById = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('SELECT restaurant FROM reviews WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}
//   pool.query('INSERT INTO users (name, email) VALUES ($1, $2)', [name, email], (error, results) => {
