var db=require('../config/connection')
var collection=require('../config/collection')
const {ObjectId}=require('mongodb')
const { resolve } = require('path')
const { response } = require('express')

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
    },

    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
           db.get().collection(collection.Product_Collection).deleteOne({_id:new ObjectId(proId)}).then((response)=>{
                resolve(response)
            })
        
        })
    },

  getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.Product_Collection).findOne({_id:new ObjectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },

    updateProduct:(proID,proDetails)=>{
        return new Promise(async(resolve,reject)=>{
           await db.get().collection(collection.Product_Collection).updateOne({_id:new ObjectId(proID)},{
                $set:{
                    name:proDetails.name,
                    price:proDetails.price,
                    brand:proDetails.brand,
                    category:proDetails.category,
                    description:proDetails.description

                }
            })
        }).then((response)=>{
            resolve(response)
        })
    },


}