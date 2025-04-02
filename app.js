require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./server/config/db');
const Product = require('./server/models/Product');
const mongoose = require('mongoose');

const app = express();
const PORT = 4000 || process.env.PORT;

// Connect to db
connectDB();

// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON data
app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
}));

app.use(express.static('public'));

// Templating engine
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

app.use('/', require('./server/routes/main'));
app.use('/', require('./server/routes/admin'));

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

// const sampleProducts = [
//   {
//       title: 'Fresh Apples',
//       price: 45000,
//       imageURL: 'https://example.com/images/apples.jpg',
//       category: 'Fruit'
//   },
//   {
//       title: 'Organic Carrots',
//       price: 38000,
//       imageURL: 'https://example.com/images/carrots.jpg',
//       category: 'Vegetable'
//   },
//   {
//       title: 'Hoe',
//       price: 72000,
//       imageURL: 'https://example.com/images/hoe.jpg',
//       category: 'Farm Tool'
//   },
//   {
//       title: 'Fresh Eggs',
//       price: 50000,
//       imageURL: 'https://example.com/images/eggs.jpg',
//       category: 'Animal Produce'
//   },
//   {
//       title: 'Bananas',
//       price: 63000,
//       imageURL: 'https://example.com/images/bananas.jpg',
//       category: 'Fruit'
//   },
//   {
//       title: 'Tomatoes',
//       price: 31000,
//       imageURL: 'https://example.com/images/tomatoes.jpg',
//       category: 'Vegetable'
//   }
// ];

// // Insert products using insertMany
// Product.insertMany(sampleProducts)
//   .then(() => {
//       console.log('Products added successfully!');
//       mongoose.connection.close();
//   })
//   .catch(err => console.log('Error inserting products:', err));