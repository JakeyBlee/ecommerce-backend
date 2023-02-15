const AWS = require('aws-sdk');
const db = require('../db/index');
const bcrypt = require('bcrypt');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    signatureVersion: 'v4',
    region: 'eu-west-2',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Authentication middleware
function checkAuthenticated (req, res, next) {
    if(req.session.authenticated === true){
        next();
    } else {
        console.log('Log in required');
        res.status(403).json({message: 'Log in required'});
    }
};

// Authorization middleware
function checkAuthorized (req, res, next) {
    if(req.params.user_id == req.user.rows[0].id || req.user.rows[0].isAdmin){
        next();
    } else {
        console.log('Unauthorized to view/edit other accounts');
        res.status(400).json({message: 'Unauthorized access'});
    }
};

// Checks that username is not already used in the database
function checkUsernameUnique(username) {
    return new Promise((resolve, reject) => {
        db.query(`SELECT * FROM users WHERE username = $1`, [username], (err, results) => {
            if(err) {
                reject(err);
            } else if(results.rowCount!==0) {
                resolve(false);
            } else {
                resolve(true);
            }
        })
    })
};

// Checks a user exists in the users table for a specific user_id
function checkEntryExists(id) {
    return new Promise((resolve, reject) => {
        db.query(`SELECT * FROM users WHERE id = $1`, [id], (err, results) => {
            if(err) {
                reject(err);
            } else if(results.rowCount!==0) {
                resolve(true);
            } else {
                resolve(false);
            }
        })
    })
};

// Creates a new account within the database
async function registerUser(username, password, firstName, lastName) {
    try {
        let hashedPassword = await bcrypt.hash(password, 10);
        let noUser = await checkUsernameUnique(username);
        if(noUser){
            console.log('attempt')
            return new Promise ((resolve, reject) => {
                db.query('INSERT INTO users(username, password, first_name, last_name) VALUES($1, $2, $3, $4)', [username, hashedPassword, firstName, lastName], (err, res) => {
                    if(err) {
                        reject(err);
                    } else {
                        resolve('User registered successfully');
                    }
                })
            })
        } else {
            throw new Error('Username already in use');
        }
    } catch(err){
        throw new Error(err);
    }
};

// Updates the stored password for the associated user ID
async function changeUserPassword(user_id, newPassword) {
    try {
        let newHashedPassword = await bcrypt.hash(newPassword, 10);
        let exists = await checkEntryExists(user_id);
        if(exists){
            return new Promise((resolve, reject) => {
                db.query(`UPDATE users SET password = $2 WHERE id = $1`, [user_id, newHashedPassword], (err) => {
                    if(err) {
                        reject(err);
                    } else {
                        resolve('Password updated successfully')
                    }
                })
            })
        } else {
            throw new Error('User does not exist');
        }
    } catch(err){
        throw new Error(err);
    }
};

// Gets all entries from specified table
function getAllEntries(table) {
    return new Promise((resolve, reject) => {
        db.query(`SELECT * FROM ${table}`, (err, results) => {
            if(err) {
                reject(err);
            } else {
                resolve(results);
            }
        })
    })
};

// Gets a single entry from a specified table by primary key ID
function getEntryById(table, id) {
    return new Promise((resolve, reject) => {
        db.query(`SELECT * FROM ${table} WHERE id = $1`, [id], (err, results) => {
            if(err) {
                reject(err);
            } else {
                resolve(results);
            }
        })
    })
};

// Gets the image url from the AWS S3 server valid for 1 hour
function getImageUrl(filename) {
    if(!filename){
        return;
    }
    const myBucket = 'friendsofthethread';
    const myKey = filename;
    return s3.getSignedUrl('getObject', {
        Bucket: myBucket,
        Key: myKey,
        Expires: 60 * 60
    });
};

// Gets the items in the stored users cart
async function getUserCart(user_id) {
    try {
        let userExists = await checkEntryExists(user_id);
        if(userExists){
            return new Promise((resolve, reject) => {
                db.query('SELECT product_id as id, cost, image, quantity FROM cart_items, products WHERE products.id = cart_items.product_id AND user_id = $1', [user_id], (err, results) => {
                    if(err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                })
            })
        } else {
            throw new Error('Invalid order request');
        }
    } catch(err){
        throw new Error(err);
    }
};

// Deletes an item from the current cart
function deleteCartItem(user_id, product_id) {
    return new Promise((resolve, reject) => {
        db.query(`DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2`, [user_id, product_id], (err) => {
            if(err) {
                reject(err);
            } else {
                resolve('Item removed from cart');
            }
        })
    })
};

// Deletes all items in current users cart
function deleteCart(user_id) {
    return new Promise((resolve, reject) => {
        db.query(`DELETE FROM cart_items WHERE user_id = $1`, [user_id], (err) => {
            if(err) {
                reject(err);
            } else {
                resolve('Cart deleted');
            }
        })
    })
};

// Updates database cart with client cart pre login
async function updateWholeCart(user_id, data) {
    try {
        for(const item of data){
            await addToCart(user_id, item.id, item.quantity);
        }
        const cart = await getUserCart(user_id);
        return cart.rows;
    } catch(err){
        throw new Error(err);
    }
};

// Adds one onto the quantity of an item in the users cart
async function addOneToCart(user_id, product_id, quantity) {
    const cart = await getUserCart(user_id);
    const item = cart.rows.find(item => item.id === product_id);
    if(item) {
        // If product_id already exists in cart
        return await updateItemCart(user_id, product_id, item.quantity+quantity);
    } else {
        // If no current row with product_id exists
        return new Promise((resolve, reject) => {
            db.query('INSERT INTO cart_items(user_id, product_id, quantity) VALUES($1, $2, $3)', [user_id, product_id, quantity], (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    resolve('Item added to cart');
                }
            })
        })
    }
};

// Adds an item with a set quantity to the users cart
async function addToCart(user_id, product_id, quantity) {
    const cart = await getUserCart(user_id);
    const item = cart.rows.find(item => item.id === product_id);
    if(item) {
        // If product_id already exists in cart
        return await updateItemCart(user_id, product_id, quantity);
    } else {
        // If no current row with product_id exists
        return new Promise((resolve, reject) => {
            db.query('INSERT INTO cart_items(user_id, product_id, quantity) VALUES($1, $2, $3)', [user_id, product_id, quantity], (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    resolve('Item added to cart');
                }
            })
        })
    }
};

// Updates quantity of item already in cart
async function updateItemCart(user_id, product_id, quantity) {
    if(quantity === 0) {
        // If new quantity warrants removal from cart
        return await deleteCartItem(user_id, product_id)
    } else {
        return new Promise((resolve, reject) => {
            db.query(`UPDATE cart_items SET quantity = $3 WHERE user_id = $1 AND product_id = $2`, [user_id, product_id, quantity], (err) => {
                if(err) {
                    reject(err);
                } else {
                    resolve('Cart updated successfully')
                }
            })
        })    
    } 
};

async function getOrderProducts(order_id){
    try {
        return new Promise((resolve, reject) => {
            db.query("SELECT orders.id, products.name, products.image, products.cost, orders_products.quantity FROM products, orders, orders_products WHERE products.id = orders_products.product_id AND orders_products.order_id = orders.id AND orders.id = $1", [order_id], (err, results) =>{
                if(err){
                    reject(err)
                } else {
                    resolve(results)
                }
            })
        })
    } catch(err) {
        throw new Error(err);
    }
};

async function getOrders(user_id){
    try {
        let userExists = await checkEntryExists(user_id);
        if(userExists){
            return new Promise((resolve, reject) => {
                db.query('SELECT id, date, total_cost FROM orders WHERE user_id = $1', [user_id], (err, results) => {
                    if(err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                })
            })
        } else {
            throw new Error('Invalid order request');
        }
    } catch(err){
        throw new Error(err);
    }
}

// Checks there is enough stock of a product to make an order
function checkStock(product_id, buyQuantity) {
    return new Promise((resolve, reject) => {
        db.query(`SELECT stock_count FROM products WHERE id = $1`, [product_id], (err, results) => {
            if(err) {
                reject(err);
            } else if(results.rows[0].stock_count<buyQuantity) {
                reject(`Not enough stock of product ${product_id} to complete order`)
            } else {
                resolve(true);
            }
        })
    })
};

// Decreases stock of product by amount in order
function decreaseStock(product_id, buyQuantity) {
    return new Promise((resolve, reject) => {
        db.query(`UPDATE products SET stock_count = stock_count - $2 WHERE id = $1`, [product_id, buyQuantity], (err, results) => {
            if(err) {
                reject(err);
            } else {
                resolve('Stock updated');
            }
        })
    })
};

// Transfers current cart data into orders with unique ID and deletes current cart
async function checkoutCart(user_id, date, total_cost) {
    try {
        const cart = await getUserCart(user_id);
        await Promise.all(cart.rows.map(x => checkStock(x.id, x.quantity)));
        // if stock exists then order proceeds
        return new Promise((resolve, reject) => {
                // Order is listed within orders table and attributed to user
                db.query('INSERT INTO orders(user_id, date, total_cost) VALUES($1, $2, $3) RETURNING id', [user_id, date, total_cost], (err, res) => {
                    if(err) {
                        reject(err);
                    } else {
                        // Contents of cart is added into orders_products with id from orders table
                        db.query(`INSERT INTO orders_products(order_id, product_id, quantity) SELECT $1, product_id, quantity FROM cart_items WHERE user_id = $2`, [res.rows[0].id, user_id], (err, res) => {
                            if(err) {
                                reject(err);
                            } else {
                                // Stock is decreased for products in database
                                Promise.all(cart.rows.map(x => decreaseStock(x.id, x.quantity)));
                                // Cart is emptied
                                deleteCart(user_id);
                                resolve('Order successfully submitted');
                            }
                        })
                    }
                })
            })
    } catch(err){
        throw new Error(err);
    }
};

module.exports = {
    checkAuthenticated: checkAuthenticated,
    checkAuthorized: checkAuthorized,
    checkUsernameUnique: checkUsernameUnique,
    registerUser: registerUser,
    changeUserPassword: changeUserPassword,
    getAllEntries: getAllEntries,
    getImageUrl: getImageUrl,
    getEntryById: getEntryById,
    getUserCart: getUserCart,
    deleteCartItem: deleteCartItem,
    deleteCart: deleteCart,
    updateWholeCart: updateWholeCart,
    addOneToCart: addOneToCart,
    addToCart: addToCart,
    getOrders: getOrders,
    getOrderProducts: getOrderProducts,
    checkoutCart: checkoutCart
};