const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const Order = require('../models/Order');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

const randomString = require('randomstring');
const nodemailer = require('nodemailer');

const jwtSecret = process.env.JWT_SECRET;
const adminLayout = "../views/layouts/admin";

//---------------------------------------------------------
// Middleware
//---------------------------------------------------------

/**
 * Check Login
 */
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

//---------------------------------------------------------
// OTP Handling
//---------------------------------------------------------

// Store generated OTPs and corresponding email addresses
const otpCache = {};

// POST request for sending OTP to email and storing email and OTP
router.post('/request-otp', authMiddleware, async (req, res) => {
  // Generate OTP
  function generateOtp() {
    return randomString.generate({ length: 4, charset: "numeric" });
  }

  const userId = req.userId;
  const user = await User.findById(userId);
  const cartId = user.cart;

  const cart = await Cart.findById(cartId).populate('totalPrice');

  const total = cart.totalPrice;
  console.log(cart.totalPrice);


  const { email } = req.body;
  const otp = generateOtp();
  otpCache[email] = otp;

  // Send OTP via email
  function sendOtp(email, otp) {
    const mailOptions = {
      from: 'mbungogary13@gmail.com',
      to: email,
      subject: 'Email Verification',
      text: `Thank you for shopping with Ecospace. Your OTP verification code is ${otp}. Your total is ${total} KSH.`,
    };

    let transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'mbungogary13@gmail.com',
        pass: 'rcic yesx gjvm cnvs',
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('OTP sent successfully:', info.response);
      }
    });
  }

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Send OTP via email
    sendOtp(email, otp);
    res.cookie('otpCache', otpCache, { maxAge: 30000, httpOnly: true });
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check DB for email and verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  // If either email or OTP is empty, return error
  if (!email || !otp) {
    return res.status(400).json({ error: 'All fields must be filled' });
  }

  try {
    // Check if email exists in the cache
    if (!otpCache.hasOwnProperty(email)) {
      return res.status(400).json({ message: 'Email not found' });
    }

    // Check if OTP matches the one in the cache
    if (otpCache[email] === otp.trim()) {
      // Remove OTP from cache after successful verification
      delete otpCache[email];

      res.status(200).json({
        success: 'OTP verified successfully. Order created.',
      });
    } else {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

//---------------------------------------------------------
// Admin Authentication Routes
//---------------------------------------------------------

// GET Admin - Login page
router.get('/admin', async (req, res) => {
  try {
    const locals = {
      title: "admin page",
      description:
        "An e-commerce web application built using NodeJs, Express and MongoDb.",
    };
    res.render('admin/index', { locals, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});

// POST Admin - Check Login
router.post('/admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret);
    res.cookie('token', token, { httpOnly: true });

    res.redirect('/analytics');
  } catch (error) {
    console.log(error);
  }
});

// POST Admin - Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, designation } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user first
    const user = await User.create({
      username,
      password: hashedPassword,
      designation,
    });

    // Create an empty cart for the new user
    const newCart = new Cart({ user: user._id, items: [], totalPrice: 0 });
    await newCart.save();

    // Associate the cart with the user
    user.cart = newCart._id;
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, jwtSecret, {
      expiresIn: '1h',
    });

    // Set cookie with the token
    res.cookie('token', token, { httpOnly: true });

    // Redirect to dashboard
    res.redirect('/analytics');
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});




//---------------------------------------------------------
// Product Routes
//---------------------------------------------------------

/**
 * POST /
 * Admin - Add new product
 */
router.post('/add-product', authMiddleware, async (req, res) => {
  try {
    try {
      const newProduct = new Product({
        title: req.body.title,
        price: req.body.price,
        imageURL: req.body.imageURL,
        category: req.body.category,
        seller: req.userId,
      });

      await Product.create(newProduct);
      // console.log(newProduct);
      res.redirect('/analytics');
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    console.log(error);
  }
});



router.post('/get-messages/:chatroomId', authMiddleware, async (req, res) => {
  try {
    const chatroomId = req.params.chatroomId;
    const chatroom = await ChatRoom.findById(chatroomId).populate('messages')
    const messages = chatroom.messages;
    // console.log(messages)

    res.json({ messages: messages })




  } catch (error) {

  }
})
//---------------------------------------------------------
// Cart Routes
//---------------------------------------------------------

// POST /add-to-cart/:productId
router.post('/add-to-cart/:productId', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const productId = req.params.productId;
    const quantity = parseInt(req.body.quantity); // Capture the quantity from the form

    const user = await User.findOne({ _id: userId });

    // If the user doesn't exist, return a 404 response
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let cart = user.cart;

    if (!cart) {
      // Create a new cart for the user
      const newCart = new Cart({ user: userId });
      await newCart.save();
      user.cart = newCart._id;
      await user.save();
      cart = newCart; // Update the cart reference
    }

    const updatedUser = await user.populate({ path: 'cart' });

    const product = await Product.findById(productId);
    // Check if the product is already in the cart
    const existingItem = updatedUser.cart.items.find((item) =>
      item.product.equals(productId)
    );
    if (existingItem) {
      // If the product is already in the cart, increment the quantity
      existingItem.quantity++;
    } else {
      // If the product doesn't exist, add it to the cart
      updatedUser.cart.items.push({
        product: productId,
        quantity: quantity,
        price: product.price,
      });
    }

    // // Update the total price of the cart
    updatedUser.cart.totalPrice = updatedUser.cart.items.reduce(
      (total, item) => total + item.quantity * item.price,
      0
    );

    await updatedUser.cart.save();
    setTimeout(() => res.redirect('/buy-products'), 2000);

    ; // Redirect to the cart page
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});


router.post('/remove-from-cart/:productId', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const cart = await Cart.findOne({ user: userId });
    const productId = req.params.productId;
    const quantity = parseInt(req.body.quantity);

    // If the quantity is 0, remove the item from the cart
    if (quantity === 0) {
      cart.items = cart.items.filter(item => !item.product.equals(productId));
    }
    // If the quantity is greater than 0, just update the quantity
    else {
      const item = cart.items.find(item => item.product.equals(productId));
      if (item) {
        item.quantity = quantity;
      }
    }
    // Update the total price of the cart
    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.quantity * item.price,
      0
    );
    await cart.save();
    res.redirect('/cart'); // Redirect to the cart page

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });

  }
})


//---------------------------------------------------------
// Order Routes
//---------------------------------------------------------

// POST /create-order
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    // console.log(req.)
    const userId = req.userId; // Extract user ID from the authenticated user

    // Find the user to associate the order
    const user = await User.findById(userId).populate('cart');

    // console.log(user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user has a cart
    if (!user.cart) {
      return res.status(400).json({ message: 'User does not have a cart' });
    }

    const cart = user.cart;

    // Check if the cart has any items
    if (cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Create a new order object
    const newOrder = new Order({
      user: userId,
      items: cart.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
      })),
      totalPrice: cart.totalPrice,
    });

    // Save the new order
    await newOrder.save();

    // Update the user's orders array
    user.orders.push(newOrder._id);

    // Save the updated user
    await user.save();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: cart.items.map((item) => {
        // const cartItem = cart.items.get(item.product);

        return {
          price_data: {
            currency: 'kes',
            product_data: {
              name: 'Product',
            },
            unit_amount: item.price, //Price in cents fro stripe
          },
          quantity: item.quantity,
        };
      }),
      success_url: "http://ecospace.onrender.com/analytics", //On successful payment, here is where we go
      cancel_url: "http://ecospace.onrender.com/analytics",
    });
    // res.json({ url: session.url});

    // Clear the user's cart (Optional: You can decide to keep the cart items after creating an order)
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    // console.log(order);
    // res.status(201).json({ message: 'Order created successfully', order: newOrder });

    res.redirect(session.url);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Server Error',
    });
  }
});

// POST confirm-order/:orderId
router.post('/confirm-order/:orderId', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const orderId = req.params.orderId;

    // Find the user and their orders
    const user = await User.findById(userId).populate('orders');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const order = user.orders.find(
      (order) => order._id.toString() === orderId
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update the order status
    order.status = 'delivered';
    await order.save();

    res.redirect('/orders');
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

//---------------------------------------------------------
// Chat Routes
//---------------------------------------------------------

// POST /contact-seller
// Admin
router.post('/contact-seller', authMiddleware, async (req, res) => {
  try {
    //The sender
    const userId = req.userId;
    // const sender = await User.findById(userId);

    //Form data
    // const { productId, title, price, category, sellerName, message } = req.body;
    const { productId, message } = req.body;

    // Fetch the product and seller
    const product = await Product.findById(productId).populate('seller');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const recipient = product.seller._id;

    // Check if a chatroom already exists between the sender and recipient
    let chatroom = await ChatRoom.findOne({
      participants: { $all: [userId, recipient] },
    });

    // console.log(userId)
    // console.log(recipient)
    // console.log(chatroom.messages)
    if (!chatroom) {
      // Create new chatroom if one doesn't exist
      chatroom = new ChatRoom({
        participants: [userId, recipient],
        messages: [],
      });
      await chatroom.save();

      // Add chatroom to both users
      await User.findByIdAndUpdate(userId, {
        $push: { chatrooms: chatroom._id },
      });
      await User.findByIdAndUpdate(recipient, {
        $push: { chatrooms: chatroom._id },
      });
    }
    // Create new message
    const newMessage = new Message({
      chatRoom: chatroom._id,
      sender: userId,
      content: message,
    });

    await newMessage.save();

    // Add message to chatroom
    chatroom.messages.push(newMessage._id);
    chatroom.lastMessage = newMessage._id;
    await chatroom.save();

    res.redirect('/buy-products');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


router.post("/message-seller", authMiddleware, async (req, res) => {
  try {

    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: No user ID provided" });
    }

    const { message, chatroom } = req.body;

    // Check if a chatroom already exists between the sender and recipient
    const myChatroom = await ChatRoom.findById(chatroom).populate("participants")


    if (!myChatroom) {
      return res.status(404).json({ error: "Chatroom not found" });
    }

    // Create a new message
    const newMessage = new Message({
      chatRoom: myChatroom._id,
      sender: userId,
      content: message,
    });

    await newMessage.save();

    // Update chatroom with new message
    myChatroom.messages.push(newMessage._id);
    myChatroom.lastMessage = newMessage._id;
    await myChatroom.save();

    // Fully populate messages with their actual content and sender details
    const updatedChatroom = await ChatRoom.findById(chatroom)
      .populate({
        path: "messages",
        model: "Message",
        populate: {
          path: "sender",
          select: "username _id profilePicture", // Get sender's name and profile picture
        },
      })
      .populate("participants", "username _id profilePicture");

    const updatedMessages = updatedChatroom.messages.map(each => ({
      content: each.content,
      sender: each.sender.username,
      senderId: each.sender._id,
      user: userId
    }));



    res.json({ updatedMessages: updatedMessages });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});





router.get("/chatroom/:chatroomId/messages", authMiddleware, async (req, res) => {
  try {
    const { chatroomId } = req.params;


    const userId = req.userId;


    const chatroom = await ChatRoom.findById(chatroomId)
      .populate({
        path: "messages",
        model: "Message",
        populate: {
          path: "sender",
          select: "username _id profilePicture", // Get sender's name and profile picture
        },
      })
      .populate("participants", "username _id profilePicture");

    if (!chatroom) {
      return res.status(404).json({ error: "Chatroom not found" });
    }

    // Update messages where sender is not the current user
    await Message.updateMany(
      { _id: { $in: chatroom.messages.map((msg) => msg._id) }, sender: { $ne: userId } },
      { $set: { isRead: true } }
    );


    console.log(chatroom.messages)
    res.json({ messages: chatroom.messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});



//---------------------------------------------------------
// Logout Route
//---------------------------------------------------------

// GET /logout
// Admin - Logout
router.get('/logout', (req, res) => {
  res.clearCookie('token'); // Remove the authentication token
  res.redirect('/'); // Redirect to the login page
});


// Admin GET /messages
router.get('/messages', authMiddleware, async (req, res) => {

  try {
    // Fetch the user based on userId from the JWT token
    const user = await User.findById(req.userId);
    const userId = req.userId;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userWithChatrooms = await User.findById(req.userId)
      .populate({
        path: 'chatrooms',
        populate: [
          {
            path: 'messages',
            model: 'Message',
            populate: {
              path: 'sender', model: 'User',
              select: 'username', // Ensure sender's username is included
            },
          },
          {
            path: 'participants',
            model: 'User',
            select: 'username email', // Get usernames and emails of participants
          },
        ],
      })
      .lean();

    const chatrooms = userWithChatrooms.chatrooms;

    // Sort chatrooms by lastUpdatedAt in descending order (most recent first)
    chatrooms.sort((a, b) => new Date(b.lastUpdatedAt) - new Date(a.lastUpdatedAt));
    // console.log(chatrooms[0].messages)


    chatrooms.forEach((chatroom) => {
      chatroom.lastUpdatedAtFormatted = chatroom.lastUpdatedAt
        ? new Date(chatroom.lastUpdatedAt).toLocaleString()
        : 'No messages yet';
    });


    res.render('admin/messages', {
      chatrooms,
      userId,
      user,
      layout: adminLayout,

    })


  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });

  }



})



router.get('/orders', authMiddleware, async (req, res) => {
  try {
    // Fetch the user based on userId from the JWT token
    const user = await User.findById(req.userId);
    const userWithOrders = await user.populate('orders');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.render('admin/orders', { userWithOrders, layout: adminLayout })

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });

  }
})


router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    // Fetch the user based on userId from the JWT token
    const user = await User.findById(req.userId);
    const userWithOrders = await user.populate('orders');
    // console.log(userWithOrders)


    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.render('admin/analytics', { user, userWithOrders, layout: adminLayout })


  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "internal server error" });

  }
})


router.get('/cart', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const cart = await Cart.findById(user.cart).populate('items.product'); // Populate the product field in items
    const cartItems = cart.items;

    res.render('admin/cart', { cart, cartItems, user, layout: adminLayout })

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "internal server error" });
  }
})


router.get('/products', authMiddleware, async (req, res) => {
  try {
    // Fetch the user based on userId from the JWT token
    const user = await User.findById(req.userId);
    const userId = req.userId;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const products = await Product.find();

    res.render('admin/products', { data: products, layout: adminLayout })

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "internal server error" });
  }
})

router.get('/sell', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    res.render('admin/sell', { user, layout: adminLayout });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "internal server error" });
  }
})


router.get('/buy-products', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const userId = req.userId;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const products = await Product.find();

    res.render('admin/buy-products', { data: products, layout: adminLayout, user })

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "internal server error" });

  }
})
module.exports = router;