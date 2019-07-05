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

const PORT = process.env.PORT || 5000
// const PORT = 5000  // WHY CANT YOU USE 5432 FOR LOCALHOST?!

app
	.use(express.static(path.join(__dirname, 'public')))
	.set('views', path.join(__dirname, 'views'))
	.set('view engine', 'pug')	
  .get('/', reviews.getData, reviews.reformatToGeoJSON, reviews.earthquake)
// client.query('SELECT NOW() as now')
//   .then(res => console.log(res.rows[0]))
//   .catch(e => console.error(e.stack))


app 
	.listen(PORT, () => console.log(`Listening on ${ PORT }`));

