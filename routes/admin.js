var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
const session = require('express-session');
const { response } = require('express')
const bcrypt = require('bcrypt')
var db=require('../config/connection')
var collection=require('../config/collection')
const verifyLogin=(req,res,next)=>{
  if(req.session.adminLoggedIn){
    next()
  }else{
    let v_status=true
    res.render('admin/login',{v_status})
  }
}

//login page
router.get('/login', async(req, res) => {
 
  if (req.session.admin) {
    res.redirect('/admin')
  } else {
    res.render('/admin/login', { 'loginErr': req.session.adminLoginErr })
    req.session.adminLoginErr = false
  }
});

router.post('/login', (req, res,next) => {
  console.log(req.body)
  productHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      console.log(response)
      req.session.admin = response.user
      req.session.adminLoggedIn = true
      res.redirect('/admin',{admin:true})
    } else {
      req.session.adminLoginErr = "Invalid Username or Password"
      res.render('admin/login',{loginErr:req.session.adminLoginErr})
    }
  })

});

router.get('/logout',(req,res,next)=>{
  req.session.admin=null
  req.session.adminLoggedIn=false
  res.redirect('/')
})

//view all products
router.get('/',verifyLogin, function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    console.log(products)
    //res.redirect('admin/admin-login')
    res.render('admin/view-products', { products, admin: true})

  })
})

//add products
router.get('/add-products',verifyLogin, (req, res) => {
  res.render('admin/add-products', { admin: true })
})

router.post('/add-products', (req, res) => {
  console.log(req.body)
  console.log(req.files.image)

  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.image
    console.log(id)
    image.mv('./public/images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.render('./admin/add-products', { admin: true })
      }
      else {
        console.log(err)
      }
    })
  })
})
//query method
//router.get('/delete-product', (req, res) => {
// let proId=req.query.id
//console.log(proId)
//})

//params method(delete)
router.get('/delete-product/:id',verifyLogin, (req, res) => {
  let proId = req.params.id
  console.log(proId)
  productHelpers.deleteProduct(proId).then((response) => {
    console.log(response)
    res.redirect('/admin')
  })
})

//Edit product
router.get('/edit-product/:id',verifyLogin, async (req, res) => {
  let product = await (productHelpers.getProductDetails(req.params.id))
  console.log(product)
  res.render('admin/edit-product',{product,admin:true})
})
 
router.post('/edit-product/:id',async(req,res)=>{
  //console.log(req.body)
  let id=req.params.id
  //console.log(id)
  await productHelpers.updateProduct(req.params.id,req.body).then((response)=>{
    console.log(response)
   if (req.files && req.files.image) {
    let image = req.files.image;
    image.mv('./public/images/' + id + '.jpg');
  }
  res.redirect('/admin')
 })
})

//view all orders
router.get('/view-orders',verifyLogin,async(req,res)=>{
  let orders=await productHelpers.getAllOrders()
  if(orders.length>0)
  {
    res.render('admin/all-orders',{orders,admin:true})
  }else{
    res.render('admin/empty-page',{message:"No orders found",admin:true})
  }
})

//update order status
router.get('/change-status/:id',verifyLogin,async(req,res)=>{
  console.log(req.params.id)
  await productHelpers.updateOrderStatus(req.params.id).then((response)=>{
    console.log("dzff",response)
    res.redirect('/admin/view-orders')
  })
 
})


module.exports = router;
