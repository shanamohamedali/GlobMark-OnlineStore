var db=require('../config/connection')
var collection=require('../config/collection')

module.exports={
//functn to add products to product collection using callback

    addProduct:(product,callback)=>{
        //console.log('ADDPRODUCT::::',product)

         db.get().collection('product').insertOne(product).then((data)=>{
           // console.log(data)
            callback(data.insertedId)
            
        })
    },

    //using promise method , funtn to get all products from db collection-product
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.Product_Collection).find().toArray()
            resolve(products)
        })
    }
    

}