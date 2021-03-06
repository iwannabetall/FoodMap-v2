
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


'use strict';
 
const yelp = require('yelp-fusion');
API_KEY= '_Or3Tw9Laony6x9SA9LUEEbNW0vD3s3hLxPZgaSyo-AFyKpUuLpHzSn43idmQdy7nuoCeVt1PqufgxZV24G-UXZTtO973Z-eH9FgWTmDjDcDnsBFf2cb3PSVTkvWW3Yx'

const yelpclient = yelp.client(API_KEY);


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


exports.getRegions = async (req, res, next) => {
	var queryStr = 'select distinct region from restaurantinfo order by region asc;'
	const client = await pool.connect()

	// res.locals.regions = ['Arizona', 'Australia', 'NYC']

	client.query(queryStr, (err, results) => {
		if (err) {
			console.log(err.stack)
		} else {
			console.log(results.rowCount)
			
			var regionList = []
			for (i=0; i < results.rowCount; i++) {
				regionList.push(results.rows[i].region)
			}
			
			res.locals.regions = results.rows
			next()			
			
		}
	})

}
//   pool.query('INSERT INTO users (name, email) VALUES ($1, $2)', [name, email], (error, results) => {


// CREATE NEW CONTROLLER FOR THIS 

exports.newData = (req, res) => {
	// console.log('RES LOCALS WORKS!?', res.locals)
	res.render('newRestaurant')
}


exports.getYelpData = (req, res, next) => {
	// find yelp info for what I have
	var loc = req.body.city + ', ' + req.body.state

	yelpclient.search({
	  term: req.body.restaurant,
	  location: loc,
	}).then(response => {
	  // console.log(response.jsonBody.businesses[0].name);
	  res.locals.yelpData = response.jsonBody.businesses
	  next()
	}).catch(e => {
	  console.log(e);
	});
	// console.log(req.body.restaurant)
	
}

exports.loadResults = (req, res) => {
	var results = res.locals.yelpData
	// console.log(results[0])
	// res.render('yelpResults')
	res.render('yelpResults', { 'yelpResults': results, 'regions': res.locals.regions})

}

exports.saveNewLocations = async (req, res, next) => {	
	// console.log(req.body.selected[0])	
	console.log(req.query)
	try {
		// get max id to create a unique id to tie restaurant info and review tables together
		const client = await pool.connect()
		const result = await client.query('SELECT max(restaurant_id) from restaurantinfo;');
	    var maxid = result.rows[0].max + 1   
	    res.locals.newID = maxid

	    console.log(maxid)
	    //b/c req.body is an object deal with if only one iteration selected 
	    if (req.body.selected == 'selected') {
	    	var categories = req.body.categories.replace('[', '')
			categories = categories.replace(']', '')
			categories = categories.split(',')  // categories should be a text string eg: "Ice Cream & Frozen Yogurt","Shaved Ice"
			var catArray = []
			var entryCount = 0
		
			for (j=0; j< categories.length; j++) {
				catArray.push(categories[j].split('"')[1])					
			}
			var catString = catArray.join(', ')
			
			var text = 'INSERT INTO restaurantinfo(restaurant_id, restaurant, alias, yelpurl, reviewcount, yelprating, longitude, latitude, is_closed, phone, streetaddress, location, categories, city, state, region) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *';
			var values = [maxid, req.body.restaurant, req.body.alias, req.body.yelpurl, req.body.reviewcount, req.body.rating, req.body.longitude, req.body.latitude, false, req.body.phone, req.body.streetaddress, req.body.location, catString, req.body.city, req.body.state, req.body.region]

			client
				.query(text, values)
				.then(results => {
					console.log('added ', req.body.restaurant)
					entryCount = entryCount + 1
					// console.log(res.rows[0])
				})
				.catch(e => console.error(e.stack))	

	    } else {	    	
	    	var iterations = req.body.selected.length
	    	 // insert new values into table
		    for (var i=0; i < iterations; i++) {
				console.log((req.body.selected[i] == 'selected') )
				if (req.body.selected[i] == 'selected') {
					var categories = req.body.categories[i].replace('[', '')
					categories = categories.replace(']', '')
					categories = categories.split(',')  // categories should be a text string eg: "Ice Cream & Frozen Yogurt","Shaved Ice"
					var catArray = []
					var entryCount = 0
				
					for (j=0; j< categories.length; j++) {
						catArray.push(categories[j].split('"')[1])					
					}
					var catString = catArray.join(', ')
					
					var text = 'INSERT INTO restaurantinfo(restaurant_id, restaurant, alias, yelpurl, reviewcount, yelprating, longitude, latitude, is_closed, phone, streetaddress, location, categories, city, state, region) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *';
					var values = [maxid, req.body.restaurant[i], req.body.alias[i], req.body.yelpurl[i], req.body.reviewcount[i], req.body.rating[i], req.body.longitude[i], req.body.latitude[i], false, req.body.phone[i], req.body.streetaddress[i], req.body.location[i], catString, req.body.city[i], req.body.state[i], req.body.region]

					client
						.query(text, values)
						.then(results => {
							console.log('added ', req.body.restaurant[i])
							entryCount = entryCount + 1
							// console.log(res.rows[0])
						})
						.catch(e => console.error(e.stack))			
				}
			}

	    }
	    client.release();
	    next()
	} catch (err) {
		console.error(err);
		res.send("Error " + err);
	}

}

exports.getReviewed = async (req, res, next) => {
	var queryStr = 'select distinct restaurant_id, restaurant from restaurantinfo order by restaurant asc;'
	const client = await pool.connect()

	client.query(queryStr, (err, results) => {
		if (err) {
			console.log(err.stack)
			next(err)
		} else {
			console.log(results.rows[0])
			
			res.locals.reviewed = results.rows			
			next()
		}
	})

}

exports.checkCode = (req, res, next) => {	
	if (req.body.password == process.env.CODE) {
		next()
	} else {
		res.send('Incorrect Password')
	}
}

exports.loadNewReviewForm = (req, res, next) => {
	res.render('newReview', { 'reviewed': res.locals.reviewed})
}


exports.newOrUpdate = async (req, res, next) => {
	var queryStr = 'select count(*) from reviews where id = $1'

	try {
		// get max id to create a unique id to tie restaurant info and review tables together
		const client = await pool.connect()	
		
		var id = req.body.restaurant_id
		client
			.query(queryStr, [id])
			.then(results => {
				res.locals.entryCount = parseInt(results.rows[0].count)
				client.release()
				// res.send(results.rows[0])
				next()
			})
			.catch(e => console.error(e.stack))	

	} catch (err) {    			
		console.error(err);
		res.send("Error " + err);
	}
}


exports.saveReview = async (req, res, next) => {

	if (res.locals.entryCount == 0) {
		console.log('new entry')
		try {	
			// get max id to create a unique id to tie restaurant info and review tables together
			const client = await pool.connect()
					
			var text = 'INSERT INTO reviews(id, restaurant, rating, cuisine, pricerange, value, pricedetails, tried, thoughts, wouldireturn, highlights, goodfor, website) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *';
			var values = [req.body.restaurant_id, req.body.restaurant, req.body.rating, req.body.cuisine, req.body.priceRange, req.body.value, req.body.priceDetails, req.body.itemsTried, req.body.thoughts, req.body.wouldireturn, req.body.highlights, req.body.goodfor, req.body.website]

			client
				.query(text, values)
				.then(results => {
					console.log(results.rows[0])				
				})
				.catch(e => console.error(e.stack))			
			res.locals.restaurant = req.body.restaurant
			res.locals.addedID = req.body.restaurant_id
		    // console.log(result.rows)
		    client.release();
		    next()
		} catch (err) {    			
			console.error(err);
			res.send("Error " + err);
		}
	} else {
		console.log('updating review for ', req.body.restaurant)
		try {	
			// get max id to create a unique id to tie restaurant info and review tables together
			const client = await pool.connect()
					
			var text = 'UPDATE reviews SET rating=$1, pricerange=$2, value=$3, pricedetails=$4, tried=$5, thoughts=$6, wouldireturn=$7, highlights=$8, goodfor=$9, website=$10, cuisine=$11 where id=$12';
			var values = [req.body.rating, req.body.priceRange, req.body.value, req.body.priceDetails, req.body.itemsTried, req.body.thoughts, req.body.wouldireturn, req.body.highlights, req.body.goodfor, req.body.website, req.body.cuisine, req.body.restaurant_id]

			client
				.query(text, values)
				.then(results => {
					res.locals.restaurant = req.body.restaurant
					res.locals.addedID = req.body.restaurant_id
				    // console.log(result.rows)
				    client.release();
				    next()
				})
				.catch(e => console.error(e.stack))			
			
		} catch (err) {    			
			console.error(err);
			res.send("Error " + err);
		}
	}

}

exports.saveSuccessful = (req, res, next) => {
	if (res.locals.entryCount == 0) {
		var title = 'Successfully added '
	} else {
		var title = 'Successfully updated '
	}
	res.render("success", {newData: res.locals.restaurant, newId:res.locals.addedID, title: title})
}

exports.getCurrentReview = async (req, res, next) => {

	// get current review to edit
	try {
		// get max id to create a unique id to tie restaurant info and review tables together
		const client = await pool.connect()	
		
		var queryStr = 'select * from reviews where id = $1'

		var id = req.query.id
		client
			.query(queryStr, [id])
			.then(results => {

				client.release()
				res.send(results.rows[0])
			})
			.catch(e => console.error(e.stack))	

	} catch (err) {    			
		console.error(err);
		res.send("Error " + err);
	}
}