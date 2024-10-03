var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var userHelper = require('../helpers/user-helper');
const session = require('express-session');
const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedIn) {
    next()
  } else {
    let v_status = true
    res.render('user/login', { v_status })
  }

}


/* GET home page. */

router.get('/', async function (req, res, next) {

  let user = req.session.user
  //pasing cart count
  let cartCount = 0
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }

  productHelpers.getAllProducts().then((products) => {
    console.log(user)
    res.render('user/view-products', { products, user, cartCount });

  })
});

//signup Page
router.get('/signup', (req, res) => {
  res.render('user/signup')
});

router.post('/signup', (req, res) => {
  userHelper.doSignup(req.body).then((response) => {
    console.log(response)
    req.session.user = response
    req.session.userLoggedIn = true

    res.redirect('/')
  })
});

//login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/login', { 'loginErr': req.session.userLoginErr })
    req.session.userLoginErr = false
  }

});

router.post('/login', (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      console.log(response)
      req.session.user = response.user
      req.session.userLoggedIn = true
      res.redirect('/')
    } else {
      req.session.userLoginErr = "Invalid Username or Password"
      res.redirect('/login')
    }
  })

});

//logout
router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.userLoggedIn=false
  res.redirect('/')
});

//cartpage
router.get('/cart', verifyLogin, async (req, res) => {
  try {
    let products = await userHelper.getCartProducts(req.session.user._id);
    let totalprice = await userHelper.getTotalPrice(req.session.user._id);

    if (totalprice === 0 && products.length === 0) {
      res.render('user/cart', { message: "Your cart is empty", user: req.session.user });
    } else {
      res.render('user/cart', { products, user: req.session.user, totalprice });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while fetching the cart.");
  }
  //console.log(products)

})


//addtocart
router.get('/add-to-cart/:id', (req, res) => {
  //console.log('api call')
  userHelper.addToCart(req.params.id, req.session.user._id).then((response) => {
    //console.log(response)
    res.json({ status: true })
  })
})

//change cart product quantity
router.post('/change-cart-quantity', (req, res, next) => {
  console.log(req.body)
  userHelper.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelper.getTotalPrice(req.body.userId)
    console.log(req.body.userId)
    res.json(response)
  })
})

//deletecart product
router.post('/delete-cart-product', verifyLogin, (req, res, next) => {
  console.log(req.body)
  userHelper.deleteCartProduct(req.body).then((response) => {
    res.json(response)
  })
})

//total amount & placeorder
router.get('/placeOrder', verifyLogin, async (req, res) => {
  let totalprice = await userHelper.getTotalPrice(req.session.user._id)
  console.log(totalprice)
  res.render('user/place-order', { totalprice, user: req.session.user })
})

router.post('/placeOrder', async (req, res) => {
  //console.log(req.body)
  let products = await userHelper.getCartProductList(req.body.userId)
  let totalprice = await userHelper.getTotalPrice(req.body.userId)
  let count = await userHelper.getCartCount(req.body.userId)
  userHelper.checkOut(req.body, products, totalprice, count).then((orderId) => {
    console.log(orderId)
    if (req.body['payment-method'] === 'cod') {
      res.json({ codSuccess: true })
    } else {
      userHelper.getRazorPay(orderId, totalprice,).then((response) => {
        res.json(response)
      })
    }

  })
})

router.get('/viewOrder', verifyLogin, async (req, res, next) => {
  try {
    let order = await userHelper.viewOrder(req.session.user._id);
    if (order.length > 0) {
      res.render('user/view-order', { order, user: req.session.user });
    } else {
      res.render('user/view-order', { message: 'You have no orders', user: req.session.user });
    }

  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while fetching the orders.");
  }
})
//for orderpage
router.get('/viewOrderProducts/:id', async (req, res) => {
  console.log(req.params.id)
  let product = await userHelper.getOrderProducts(req.params.id)
  res.render("user/order-productDetails", { product, user: req.session.user })
})

//razorpay
router.post('/verify-payment', async (req, res) => {
  console.log(req.body)
  await userHelper.verifyPayment(req.body).then(() => {
    userHelper.changePaymentStatus(req.body['order[receipt]']).then(() => {
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err)
    res.json({ status: false })
  })
})

module.exports = router;
