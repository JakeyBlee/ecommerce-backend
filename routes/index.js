const express = require('express');
const router = express.Router();

const {checkAuthenticated,
    checkAuthorized,
    getAllEntries,
    getEntryById,
    deleteUserById,
    changeUserPassword,
    getUserCart,
    addToCart,
    updateCart,
    deleteCart,
    deleteCartItem,
    checkoutCart,
    getOrders
    } = require('../util/helpers');

// Products endpoints
router.get('/products', checkAuthenticated, async (req, res, next) => {
    try {
        let products = await getAllEntries('products');
        res.status(200).send(products.rows);
    } catch(err) {
        console.log(err);
        res.status(400).send({ message: err.message });
    }
});
router.get('/products/:id', checkAuthenticated, async (req, res, next) => {
    try {
        let products = await getEntryById('products', req.params.id);
        if(products.rows.length > 0){
            res.status(200).send(products.rows[0]);
        } else {
            res.status(404).send({ "error": 'Invalid product ID' })
        }
    } catch(err) {
        console.log(err);
        res.status(400).send({ message: err.message });
    }
});

// Users endpoints
router.get('/users', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try {
        let users = await getAllEntries('users');
        res.status(200).send(users.rows);
    } catch(err) {
        console.log(err);
        res.status(400).send({ message: err.message });
    }
});
router.get('/users/:user_id', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try {
        let users = await getEntryById('users', req.params.user_id);
        if(users.rows.length > 0){
            res.status(200).send(users.rows[0]);
        } else {
            console.log('Invalid user ID');
            res.status(404).send({ "error": 'Invalid user ID' });
        }
    } catch(err) {
        console.log(err);
        res.status(400).send({ message: err.message });
    }
});
router.delete('/users/:user_id', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try {
        let response = await deleteUserById(req.params.user_id);
        res.status(204).send(response);
        req.logout(function(err) {
        if(err) return next(err);
        console.log('Logout Success.');
    })
    } catch(err) {
        console.log(err);
        res.status(400).send({ message: err.message });
    }
});
router.put('/users/:user_id', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try {
        let response = await changeUserPassword(req.params.user_id, req.body.password);
        res.status(200).send(response);
    } catch(err) {
        console.log(err);
        res.status(400).send({ message: err.message });
    }
});

// Cart endpoints
router.get('/cart/:user_id', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try {
        let response = await getUserCart(req.params.user_id);
        res.status(200).send(response.rows);
    } catch(err) {
        console.log(err);
        res.status(400).send({ message: err.message });
    }
});
router.post('/cart/:user_id', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try{
        let response = await addToCart(req.params.user_id, req.body.product_id, req.body.quantity);
        res.status(201).send(response);
    } catch(err) {
        console.log(err);
        res.status(400).send({ message: err.message });
    }
});
router.delete('/cart/:user_id', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try {
        let response = await deleteCart(req.params.user_id);
        res.status(204).send(response);
    } catch(err) {
        console.log(err);
        res.status(400).send({ message: err.message });
    }
});
router.put('/cart/:user_id/:product_id', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try{
        let response = await updateCart(req.params.user_id, req.params.product_id, req.body.quantity);
        res.status(201).send(response);
    } catch(err) {
        console.log(err);
        res.status(400).send({ message: err.message });
    }
});
router.delete('/cart/:user_id/:product_id', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try {
        let response = await deleteCartItem(req.params.user_id, req.params.product_id);
        res.status(204).send(response);
    } catch(err) {
        console.log(err);
        res.status(400).send({ message: err.message });
    }
});

// Orders endpoints
router.get('/orders', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try {
        let response = await getOrders(null, null);
        res.status(200).send(response.rows);
    } catch(err) {
        console.log(err);
        res.status(400).send({ message: err.message });
    }
});
router.get('/orders/:user_id', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try {
        let response = await getOrders(req.params.user_id, null);;
        res.status(200).send(response.rows);
    } catch(err) {
        console.log(err);
        res.status(400).send({ message: err.message });
    }
});
router.get('/orders/:user_id/:order_id', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try {
        let response = await getOrders(req.params.user_id, req.params.order_id);;
        res.status(200).send(response.rows);
    } catch(err) {
        console.log(err);
        res.status(400).send({ message: err.message });
    }
});

// Checkout endpoint
router.post('/cart/:user_id/checkout', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try {
        let response = await checkoutCart(req.params.user_id);
        res.status(200).send(response);
    } catch(err) {
        console.log(err);
        res.status(400).send({ "error": "Not enough stock to complete order" });
    }
});

module.exports = router;