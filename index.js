console.log(process.env.DATABASE_URL)
const { Pool } = require('pg');
const pool = new Pool({	
  connectionString: process.env.DATABASE_URL,
  ssl: true
});
const path = require('path')
const express = require('express')
const PORT = process.env.PORT || 5000
// const PORT = 5000
// console.log(PORT)
// let port = process.env.PORT;
// if (port == null || port == "") {
//   port = 8000;
// }
express()
	.use(express.static(path.join(__dirname, 'public')))
	.set('views', path.join(__dirname, 'views'))
	.set('view engine', 'ejs')
	.get('/db', async (req, res) => {
    try {
      const client = await pool.connect()
      const result = await client.query('SELECT * FROM restaurantinfo');
      const results = { 'results': (result) ? result.rows : null};      
      console.log('GOT DATA', results[0])
      res.render('pages/db', results[0] );
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
	.listen(PORT, () => console.log(`Listening on ${ PORT }`));

// const { Client } = require('pg');

// const client = new Client({
//   connectionString: process.env.DATABASE_URL,
//   ssl: true,
// });

// client.connect();

// // console.log(client)

// client.query('SELECT * FROM restaurantinfo LIMIT 10;', (err, res) => {
//   if (err) throw err;
//   for (let row of res.rows) {
//     console.log(JSON.stringify(row));
//   }
//   client.end();
// });