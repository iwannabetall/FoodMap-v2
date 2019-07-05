const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const app = express()
const { Pool } = require('pg');
// const port = 3000

const reviews = require('./controllers/restaurants.js')

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

// const PORT = process.env.PORT || 5000
const PORT = 5000  // WHY CANT YOU USE 5432 FOR LOCALHOST?!

app
	.use(express.static(path.join(__dirname, 'public')))
	.set('views', path.join(__dirname, 'views'))
	.set('view engine', 'pug')
	// .get('/', (req, res) => res.render('pages/index'))
	.get('/', reviews.getData)
  .get('/earthquake', reviews.getData, reviews.reformatToGeoJSON, reviews.earthquake)
// client.query('SELECT NOW() as now')
//   .then(res => console.log(res.rows[0]))
//   .catch(e => console.error(e.stack))


app 
	.listen(PORT, () => console.log(`Listening on ${ PORT }`));


// const getAllData = (req, res) => {
//   var queryStr = 'SELECT a.restaurant, a.rating, a.pricerange, a.value, a.PriceDetails, a.tried, a.thoughts, a.WouldIReturn, b.yelpURL, b.latitude, b.longitude, b.is_closed, b.streetAddress, b.categories, b.city, b.state, b.region from reviews a inner join restaurantinfo b on a.id= b.restaurant_id limit 10;'
//   pool.query(queryStr, (err, results) => {
//     if (err) {
//       throw err
//     }
//     console.log(results[1])
//     res.status(200).json(results.row)
//   })

  
// }

// app.get('/test', getAllData)


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
