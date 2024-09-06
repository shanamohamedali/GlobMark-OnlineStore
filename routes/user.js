var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var userHelper = require('../helpers/user-helper')
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    let v_status = true
    res.render('user/login', { v_status })
  }

}


/* GET home page. */

router.get('/', function (req, res, next) {

  let user = req.session.user

  productHelpers.getAllProducts().then((products) => {
    console.log(user)
    //console.log(products)
    res.render('user/view-products', { products, user });

  })
});
//signup Page
router.get('/signup', (req, res) => {
  res.render('user/signup')
});

router.post('/signup', (req, res) => {
  userHelper.doSignup(req.body).then((response) => {
    console.log(response)

    req.session.loggedIn = true
    req.session.user = response
    res.redirect('/')
  })
});

//login page
router.get('/login', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { 'loginErr': req.session.LoginErr })
    req.session.loginErr = false
  }

});

router.post('/login', (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      console.log(response)
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      req.session.LoginErr = "Invalid Username or Password"
      res.redirect('/login')
    }
  })

});

//logout
router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
});

//cart
router.get('/cart', verifyLogin, (req, res) => {
  res.render('user/cart')
})

module.exports = router;
