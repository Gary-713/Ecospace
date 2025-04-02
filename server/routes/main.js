const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Routes
// GET
// Home
router.get('', (req, res) => {
  const locals = {
    title: "eco_space",
    description: "An e-commerce web application built using NodeJs, Express and MongoDb."
  }
  res.render('index', { locals });
});


// GET
// Products
router.get('/products', async (req, res) => {

  const query = req.query.query; // Extract the query parameter

  try {
    const data =  await Product.find();
    res.render('products', { data, query });
  
  } catch (error) {
    console.log(error);
  }
});
  



module.exports = router;





// // Function to insert multiple product records
// function insertProductData() {
//   Product.insertMany([
//     {
//       title: "Fresh Apples (5kg)",
//       price: 150000,
//       imageURL: "img/apples.jpg",
//       category: "Fruit",
//     },
//     {
//       title: "Organic Bananas (10kg)",
//       price: 200000,
//       imageURL: "img/bananas.jpg",
//       category: "Fruit",
//     },
//     {
//       title: "Carrots (10kg)",
//       price: 250000,
//       imageURL: "img/carrots.jpg",
//       category: "Vegetable",
//     },
//     {
//       title: "Tomatoes (15kg)",
//       price: 300000,
//       imageURL: "img/tomatoes.jpg",
//       category: "Vegetable",
//     },
//     {
//       title: "Potatoes (50kg Sack)",
//       price: 500000,
//       imageURL: "img/potatoes.jpg",
//       category: "Vegetable",
//     },
//     {
//       title: "Mangoes (10kg)",
//       price: 400000,
//       imageURL: "img/mangoes.jpg",
//       category: "Fruit",
//     },
//     {
//       title: "Pineapples (5 Pieces)",
//       price: 350000,
//       imageURL: "img/pineapples.jpg",
//       category: "Fruit",
//     },
//     {
//       title: "Eggs (Tray of 30)",
//       price: 120000,
//       imageURL: "img/eggs.jpg",
//       category: "Animal Produce",
//     },
//     {
//       title: "Fresh Milk (20L)",
//       price: 700000,
//       imageURL: "img/milk.jpg",
//       category: "Animal Produce",
//     },
//     {
//       title: "Beef (10kg)",
//       price: 850000,
//       imageURL: "img/beef.jpg",
//       category: "Animal Produce",
//     },
//     {
//       title: "Goat Meat (10kg)",
//       price: 900000,
//       imageURL: "img/goatmeat.jpg",
//       category: "Animal Produce",
//     },
//     {
//       title: "Honey (5kg Pure)",
//       price: 680000,
//       imageURL: "img/honey.jpg",
//       category: "Animal Produce",
//     },
//     {
//       title: "Hoe (Steel Handle)",
//       price: 300000,
//       imageURL: "img/hoe.jpg",
//       category: "Farm Tool",
//     },
//     {
//       title: "Shovel (Heavy Duty)",
//       price: 450000,
//       imageURL: "img/shovel.jpg",
//       category: "Farm Tool",
//     },
//     {
//       title: "Watering Can (10L)",
//       price: 150000,
//       imageURL: "img/wateringcan.jpg",
//       category: "Farm Tool",
//     },
//     {
//       title: "Oranges (20kg)",
//       price: 500000,
//       imageURL: "img/oranges.jpg",
//       category: "Fruit",
//     },
//     {
//       title: "Cabbages (10 Heads)",
//       price: 300000,
//       imageURL: "img/cabbages.jpg",
//       category: "Vegetable",
//     }
//   ])
//   .then(() => console.log("Product data inserted successfully"))
//   .catch((err) => console.error("Error inserting products:", err)); 
// }

// insertProductData(); 