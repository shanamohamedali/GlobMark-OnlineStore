var db = require('../config/connection')
var collection = require('../config/collection')
const { ObjectId } = require('mongodb')
const { resolve } = require('path')
const bcrypt = require('bcrypt')



module.exports = {

    // registerAdmin:()=>{
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             const password = await bcrypt.hash('admin@123', 10);
    //             let admin = await db.get().collection(collection.Admin_Collection).insertOne({
    //                 username: 'superadmin',
    //                 password: password
    //             });
    //             resolve();
    //         } catch (err) {
    //             reject(err);
    //         }
    //     });
    // },


    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
          try {
            let response = {};
            let user = await db.get().collection(collection.Admin_Collection).findOne({ username: userData.username });
            if (user) {
              bcrypt.compare(userData.password, user.password).then((status) => {
                if (status) {
                  console.log('login successful');
                  response.user = user; // Corrected from 'admin' to 'user'
                  response.status = true;
                  resolve(response);
                } else {
                  console.log('login failed');
                  resolve({ status: false });
                }
              }).catch((err) => {
                reject(err);
              });
            } else {
              console.log('no user found');
              resolve({ status: false });
            }
          } catch (err) {
            reject(err);
          }
        });
      },


    //functn to add products to product collection using callback

    addProduct: (product, callback) => {
        //console.log('ADDPRODUCT::::',product)

        db.get().collection('product').insertOne(product).then((data) => {
            // console.log(data)
            callback(data.insertedId)

        })
    },

        //using promise method , funtn to get all products from db collection-product
        getAllProducts: () => {
            return new Promise(async (resolve, reject) => {
                let products = await db.get().collection(collection.Product_Collection).find().toArray()
                resolve(products)
            })
        },

            deleteProduct: (proId) => {
                return new Promise((resolve, reject) => {
                    db.get().collection(collection.Product_Collection).deleteOne({ _id: new ObjectId(proId) }).then((response) => {
                        resolve(response)
                    })

                })
            },

                getProductDetails: (proId) => {
                    return new Promise((resolve, reject) => {
                        db.get().collection(collection.Product_Collection).findOne({ _id: new ObjectId(proId) }).then((product) => {
                            resolve(product)
                        })
                    })
                },

                    updateProduct: (proID, proDetails) => {
                        return new Promise(async (resolve, reject) => {
                            await db.get().collection(collection.Product_Collection).updateOne({ _id: new ObjectId(proID) }, {
                                $set: {
                                    name: proDetails.name,
                                    price: proDetails.price,
                                    brand: proDetails.brand,
                                    category: proDetails.category,
                                    description: proDetails.description

                                }
                            })
                        }).then((response) => {
                            resolve(response)
                        })
                    },

                        getAllOrders: () => {
                            return new Promise((resolve, reject) => {
                                let order = db.get().collection(collection.Order_Collection).find().toArray()
                                resolve(order)
                            })
                        },

                            updateOrderStatus: (orderId) => {
                                return new Promise((resolve, reject) => {
                                    console.log(orderId)
                                    let order = db.get().collection(collection.Order_Collection)
                                        .updateOne({ _id: new ObjectId(orderId) }, {
                                            $set: { status: 'Shipped' }
                                        }).then((response) => {
                                            resolve(response)
                                        })
                                })
                            }


}