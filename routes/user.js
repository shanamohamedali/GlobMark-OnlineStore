var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var userHelper = require('../helpers/user-helper');
const session = require('express-session');
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
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
  let cartCount=0
  if(req.session.user){
    cartCount=await userHelper.getCartCount(req.session.user._id)   
}
  
  productHelpers.getAllProducts().then((products) => {
  console.log(user)
  res.render('user/view-products', { products, user , cartCount });

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

//cartpage
router.get('/cart', verifyLogin, async (req, res) => {
  let products = await userHelper.getCartProducts(req.session.user._id)
  let totalprice=await userHelper.getTotalPrice(req.session.user._id)
  console.log(products)
res.render('user/cart',{products,user:req.session.user,totalprice})
})


//addtocart
router.get('/add-to-cart/:id',(req,res)=>{
  //console.log('api call')
  userHelper.addToCart(req.params.id,req.session.user._id).then((response)=>{
    //console.log(response)
    res.json({status:true})
  })
})

//change cart product quantity
router.post('/change-cart-quantity',(req,res,next)=>{
  console.log(req.body)
  userHelper.changeProductQuantity(req.body).then(async(response)=>{
  response.total= await userHelper.getTotalPrice(req.body.userId)
  console.log(req.body.userId)
    res.json(response)
  })
})

//deletecart product
router.post('/delete-cart-product',verifyLogin,(req,res,next)=>{
  console.log(req.body)
  userHelper.deleteCartProduct(req.body).then((response)=>{
    res.json(response)
  })
})

//total amount & placeorder
router.get('/placeOrder',verifyLogin,async(req,res)=>{
  let totalprice=await userHelper.getTotalPrice(req.session.user._id)
  console.log(totalprice)
  res.render('user/place-order',{totalprice,user:req.session.user})
  })
 
  router.post('/placeOrder',async(req,res)=>{
    //console.log(req.body)
    let products=await userHelper.getCartProductList(req.body.userId)
   let totalprice=await userHelper.getTotalPrice(req.body.userId)
    userHelper.checkOut(req.body,products,totalprice).then((response)=>{
      res.json({status:true})
    })
  })

module.exports = router;
