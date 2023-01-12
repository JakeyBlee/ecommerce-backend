const db = require('../db/index');
const bcrypt = require('bcrypt');

// Authentication middleware
function checkAuthenticated (req, res, next) {
    if(req.session.authenticated === true){
        next();
    } else {
        console.log('Log in required');
        res.redirect('/login');
    }
};

// Authorization middleware
function checkAuthorized (req, res, next) {
    if(req.params.user_id == req.user.rows[0].id || req.user.rows[0].isAdmin){
        next();
    } else {
        console.log('Unauthorized to view/edit other accounts');
        res.status(400).send({ "error": "Unauthorized access" });
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

// Checks a row exists in the users table for a specific user_id
function checkEntryExists(table, id) {
    return new Promise((resolve, reject) => {
        db.query(`SELECT * FROM ${table} WHERE id = $1`, [id], (err, results) => {
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
async function registerUser(username, password) {
    try {
        let hashedPassword = await bcrypt.hash(password, 10);
        let noUser = await checkUsernameUnique(username);
        if(noUser){
            return new Promise ((resolve, reject) => {
                db.query('INSERT INTO users(username, password) VALUES($1, $2)', [username, hashedPassword], (err, res) => {
                    if(err) {
                        reject(err);
                    } else {
                        resolve('User registered successfully');
                    }
                })
            })
        } else {
            throw new Error('User already exists');
        }
    } catch(err){
        throw new Error(err);
    }
};

// Updates the stored password for the associated user ID
async function changeUserPassword(user_id, newPassword) {
    try {
        let newHashedPassword = await bcrypt.hash(newPassword, 10);
        let exists = await checkEntryExists('users', user_id);
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

// Deletes a single user from a specified table by primary key ID
async function deleteUserById(user_id) {
    try {
        let exists = await checkUserExists(user_id);
        if(exists){
            return new Promise((resolve, reject) => {
                db.query('DELETE FROM users WHERE id = $1', [user_id], (err) => {
                    if(err) {
                        reject(err);
                    } else {
                        resolve('Delete successful');
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

// Gets the items in the users cart
async function getUserCart(user_id) {
    try {
        let userExists = await checkEntryExists('users', user_id);
        if(userExists){
            return new Promise((resolve, reject) => {
                db.query('SELECT * FROM cart_items WHERE user_id = $1', [user_id], (err, results) => {
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

// Updates quantity of item already in cart
async function updateCart(user_id, product_id, quantity) {
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

// Adds an item with a set quantity to the users cart
async function addToCart(user_id, product_id, quantity) {
    const cart = await getUserCart(user_id);
    const item = cart.rows.find(item => item.product_id === product_id)
    if(item) {
        // If product_id already exists in cart
        return await updateCart(user_id, product_id, quantity+item.quantity);
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

// Gets orders dependant on supplied parameters
async function getOrders(user_id, order_id){
    if(user_id && order_id) {
        try {
            let userExists = await checkEntryExists('users', user_id);
            let orderExists = await checkEntryExists('orders', user_id);
            if(userExists && orderExists){
                return new Promise((resolve, reject) => {
                    db.query('SELECT * FROM orders_products WHERE order_id = $1', [order_id], (err, results) => {
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
    } else if (user_id && !order_id) {
        try {
            let userExists = await checkEntryExists('users', user_id);
            if(userExists){
                return new Promise((resolve, reject) => {
                    db.query('SELECT * FROM orders WHERE user_id = $1', [user_id], (err, results) => {
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
    } else {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM orders', (err, results) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            })
        })
    }
};

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
async function checkoutCart(user_id) {
    try {
        const cart = await getUserCart(user_id);
        await Promise.all(cart.rows.map(x => checkStock(x.product_id, x.quantity)));
        // if stock exists then order proceeds
        return new Promise((resolve, reject) => {
                // Order is listed within orders table and attributed to user
                db.query('INSERT INTO orders(user_id) VALUES($1) RETURNING id', [user_id], (err, res) => {
                    if(err) {
                        reject(err);
                    } else {
                        // Contents of cart is added into orders_products with id from orders table
                        db.query(`INSERT INTO orders_products(order_id, product_id, quantity) SELECT $1, product_id, quantity FROM cart_items WHERE user_id = $2`, [res.rows[0].id, user_id], (err, res) => {
                            if(err) {
                                reject(err);
                            } else {
                                // Stock is decreased for products in database
                                Promise.all(cart.rows.map(x => decreaseStock(x.product_id, x.quantity)));
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
    getEntryById: getEntryById,
    deleteUserById: deleteUserById,
    getUserCart: getUserCart,
    deleteCartItem: deleteCartItem,
    deleteCart: deleteCart,
    updateCart: updateCart,
    addToCart: addToCart,
    getOrders: getOrders,
    checkoutCart: checkoutCart
};