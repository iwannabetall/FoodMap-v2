console.log(process.env.DATABASE_URL)
const { Pool } = require('pg');
const pool = new Pool({	
  connectionString: process.env.DATABASE_URL,
  // user: process.env.USER,
  // password: process.env.PASSWORD,
  // database: process.env.DATABASE,
  // port: process.env.PORT,
  // host: process.env.HOST,
  ssl: true
});
const path = require('path')
const express = require('express')
// const PORT = process.env.PORT || 5000
const PORT = 5000  // WHY CANT YOU USE 5432 FOR LOCALHOST?!
// console.log(PORT)
// let port = process.env.PORT;
// if (port == null || port == "") {
//   port = 8000;
// }
express()
	.use(express.static(path.join(__dirname, 'public')))
	.set('views', path.join(__dirname, 'views'))
	.set('view engine', 'ejs')
	.get('/', (req, res) => res.render('pages/index'))
	.get('/db', async (req, res) => {
    try {
      const client = await pool.connect()
      const result = await client.query('SELECT restaurant FROM restaurantinfo limit 20');
      console.log('GOT DATA', result)
      const results = { 'results': (result) ? result.rows : null};      
      console.log("number of rows", results)
      res.send(results)
      // res.render('pages/db', results );
      client.release();
    } catch (err) {
    	console.log('HELP ME')
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