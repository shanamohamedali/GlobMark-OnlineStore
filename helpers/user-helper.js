
var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt')
const { resolve } = require('path')
const { Collection } = require('mongo')
const { ObjectId } = require('mongodb')
const { response } = require('express')
const { receiveMessageOnPort } = require('worker_threads')
const { lookup } = require('dns')
const { pipeline } = require('stream')
const { count, group } = require('console')
const { rejects } = require('assert')



module.exports = {
    doSignup: (userData) => {

        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            db.get().collection(collection.User_Collection).insertOne(userData).then((data) => {
                // resolve(data.insertedId)
                resolve(data)

            })


        })
    },

    doLogin: (userData) => {

        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.User_Collection).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        console.log('login succesful')
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('login failed')
                        resolve({ status: false })
                    }
                })
            } else {
                console.log('no user found')
                resolve({ status: false })
            }
        })

    },

    //cart 
    addToCart: (proId, userId) => {
        let proObj = {
            item: new ObjectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.Cart_Collection).findOne({ user: new ObjectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                //console.log(proExist)
                if (proExist != -1) {
                    db.get().collection(collection.Cart_Collection)
                        .updateOne({user:new ObjectId(userId),'products.item': new ObjectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }).then(() => {
                                resolve()
                            })

                } else {
                    db.get().collection(collection.Cart_Collection).updateOne({ user: new ObjectId(userId) },
                        {
                            $push: { products: proObj }
                        }).then((response) => {
                            resolve()
                        })

                }
            } else {//user adding cart for first time
                let cartObj = {
                    user: new ObjectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.Cart_Collection).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }

        })

    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            const cartItems = await db.get().collection(collection.Cart_Collection).aggregate([
                {
                    $match: { user: new ObjectId(userId) } // Match cart user ID to the received ID from router
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'

                    }
                },
              {
                $lookup:{
                    from:collection.Product_Collection,
                    localField:'item',
                    foreignField:'_id',
                    as:'productDetails'

                }
              },
            {  //changing productdetails array as obj
                $project:{
                    item:1,quantity:1,productDetails:{$arrayElemAt:['$productDetails',0]}
                }
              }
            
             
            ]).toArray();
           
            //console.log(cartItems[0].productDetails)
            resolve(cartItems);

        })
    },
    
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.Cart_Collection).findOne({ user: new ObjectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },

    changeProductQuantity:(details)=>{
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
                db.get().collection(collection.Cart_Collection)
                .updateOne({_id:new ObjectId(details.cartId)},
                    {
                        $pull:{products:{item:new ObjectId(details.proId)}}
                }).then((response)=>{
                    resolve({removeProduct:true})
                })
            }
                else{
                    db.get().collection(collection.Cart_Collection)
                    .updateOne({_id:new ObjectId(details.cartId),'products.item':new ObjectId(details.proId)},
                {
                    $inc:{'products.$.quantity':details.count}
                }).then((response)=>{
                    resolve({status:true})
                })

                }
            
        })

    },

    getTotalPrice:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            total=await db.get().collection(collection.Cart_Collection).aggregate([
                {
                    $match:{user:new ObjectId(userId)}
            },
            {
                $unwind:'$products'
            },
            {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'

                }
            },
          {
            $lookup:{
                from:collection.Product_Collection,
                localField:'item',
                foreignField:'_id',
                as:'productDetails'

            }
          },
        {  //changing productdetails array as obj
            $project:{
                item:1,quantity:1,productDetails:{$arrayElemAt:['$productDetails',0]}
            }
          },
          {
            $group:{
                _id:null,

                total:{$sum:{$multiply:['$quantity',{ $toDouble: { $trim: { input: '$productDetails.price' } } }]}}
                
            }
          }
        
        ]).toArray();
        console.log(total)
        resolve(total[0].total);
       
        })
    },

    deleteCartProduct:(details)=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collection.Cart_Collection).updateOne({_id:new ObjectId(details.cartId)},
                {
                    $pull:{products:{item:new ObjectId(details.proId)}}
            }).then((response)=>{
                resolve(response)
            })
            }) 
    },

    //for order collection
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.Cart_Collection).findOne({user:new ObjectId(userId)})
            //console.log(cart.products)
            resolve(cart.products)
        })
    },

    checkOut:(order,products,totalprice)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(order)
           let status=order['payment-method']==='cod'?'placed':'pending'
           let orderObj={
            deliveryDetails:{
                address:order.address,
                pincode:order.pincode,
                phone:order.phone
            },
            userId:new ObjectId(order.userId),
            paymentMethod:order['payment-method'],
            products:products,
            totalprice:totalprice,
            date:new date(),
            status:status
           }
            await db.get().collection(collection.Order_Collection).insertOne(orderObj).then((respond)=>{
                db.get().collection(collection.Cart_Collection).deleteOne({user:new ObjectId(order.userId)})
                resolve()
            })
        })

    }

}


/*  {
                    $lookup: {
                        from: collection.Product_Collection,
                        let: { proList: '$products' }, // Cart products
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ['$_id', '$$proList'] // Ensure proList is an array
                                    }
                                }
                            }
                        ],
                        as: 'cartItems'
                    }
               }*/ 
