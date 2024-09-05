var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
//var collection=require('../config/collection')

/* GET users listing. */
//view all products
router.get('/', function (req, res, next) {
 productHelpers.getAllProducts().then((products)=>{
  console.log(products)
  res.render('admin/view-products', { products, admin: true });

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
    image.mv('./public/images/'+id+'.jpg',(err,done)=>{
      if(!err){
        res.render('./admin/add-products')
      }
      else {
      console.log(err)
      }
    })
  })
})

module.exports = router;
