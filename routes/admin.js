var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
//var collection=require('../config/collection')

/* GET users listing. */
//view all products
router.get('/', function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    console.log(products)
    res.render('admin/view-products', { products, admin: true })

  })
})

//add products
router.get('/add-products', (req, res) => {
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
router.get('/delete-product/:id', (req, res) => {
  let proId = req.params.id
  console.log(proId)
  productHelpers.deleteProduct(proId).then((response) => {
    console.log(response)
    res.redirect('/admin')
  })
})

//Edit product
router.get('/edit-product/:id', async (req, res) => {
  let product = await (productHelpers.getProductDetails(req.params.id))
  console.log(product)
  res.render('admin/edit-product',{product,admin:true})
})
 
router.post('/edit-product/:id',(req,res)=>{
  //console.log(req.body)
  let id=req.params.id
  console.log(id)
  productHelpers.updateProduct(req.params.id,req.body).then((response)=>{
    //console.log(response)
   res.redirect('/admin')
   if(req.files.image){
    let image=req.files.image
    image.mv('/images/'+id+'.jpg')
    
   }
 })
  
})
module.exports = router;
