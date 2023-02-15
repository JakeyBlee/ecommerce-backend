const express = require('express');
const router = express.Router();

const {checkAuthenticated,
    checkAuthorized,
    getAllEntries,
    getImageUrl,
    getEntryById,
    changeUserPassword,
    getUserCart,
    addOneToCart,
    addToCart,
    updateWholeCart,
    deleteCart,
    deleteCartItem,
    checkoutCart,
    getOrders,
    getOrderProducts
    } = require('../util/helpers');

// Products endpoints
router.get('/products', async (req, res, next) => {
    try {
        let products = await getAllEntries('products');
        for(const item of products.rows){
        item.image = getImageUrl(item.image);
        item.image2 = getImageUrl(item.image2);
        item.image3 = getImageUrl(item.image3);
        };
        res.status(200).json(products.rows);
    } catch(err) {
        console.log(err);
        res.status(400).json(err.message);
    }
});
router.get('/products/:id', async (req, res, next) => {
    try {
        let products = await getEntryById('products', req.params.id);
        if(products.rows.length > 0){
            res.status(200).json(products.rows[0]);
        } else {
            res.status(404).json({ message: 'Invalid product ID' })
        }
    } catch(err) {
        console.log(err);
        res.status(400).json(err.message);
    }
});

// Users endpoints
router.get('/users/:user_id', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try {
        let users = await getEntryById('users', req.params.user_id);
        if(users.rows.length > 0){
            res.status(200).json(users.rows[0]);
        } else {
            console.log('Invalid user ID');
            res.status(404).json({ message: 'Invalid user ID' });
        }
    } catch(err) {
        console.log(err);
        res.status(400).json(err.message);
    }
});
router.put('/users/:user_id', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try {
        let response = await changeUserPassword(req.params.user_id, req.body.password);
        res.status(200).json(response);
    } catch(err) {
        console.log(err);
        res.status(400).json(err.message);
    }
});

// Cart endpoints
router.get('/cart/:user_id', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try {
        let response = await getUserCart(req.params.user_id);
        res.status(200).json(response.rows);
    } catch(err) {
        console.log(err);
        res.status(400).json(err.message);
    }
});
router.post('/cart/:user_id', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try{
        let response = await addOneToCart(req.params.user_id, req.body.product_id, req.body.quantity);
        res.status(201).json(response);
    } catch(err) {
        console.log(err);
        res.status(400).json(err.message);
    }
});
router.delete('/cart/:user_id', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try {
        let response = await deleteCart(req.params.user_id);
        res.status(204).json(response);
    } catch(err) {
        console.log(err);
        res.status(400).json(err.message);
    }
});

router.put('/cart/:user_id', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try{
        let response = await updateWholeCart(req.params.user_id, req.body);
        for(const item of response){
            item.image = getImageUrl(item.image)
            };
        res.status(201).json(response);
    } catch(err) {
        console.log(err);
        res.status(400).json(err.message);
    }
});

router.put('/cart/:user_id/:product_id', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try{
        let response = await addToCart(req.params.user_id, req.body.product_id, req.body.quantity);
        res.status(201).json(response);
    } catch(err) {
        console.log(err);
        res.status(400).json(err.message);
    }
});
router.delete('/cart/:user_id/:product_id', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try {
        let response = await deleteCartItem(req.params.user_id, req.params.product_id);
        res.status(204).json(response);
    } catch(err) {
        console.log(err);
        res.status(400).json(err.message);
    }
});

// Orders endpoints
router.get('/orders/:user_id', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try {
        let response = await getOrders(req.params.user_id);;
        res.status(200).json(response.rows);
    } catch(err) {
        console.log(err);
        res.status(400).json(err.message);
    }
});
router.get('/orders/:user_id/:order_id', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try {
        let response = await getOrderProducts(req.params.order_id);;
        res.status(200).json(response.rows);
    } catch(err) {
        console.log(err);
        res.status(400).json(err.message);
    }
});

// Checkout endpoint
router.post('/cart/:user_id/checkout', checkAuthenticated, checkAuthorized, async (req, res, next) => {
    try {
        let response = await checkoutCart(req.params.user_id, req.body.date, req.body.total_cost);
        res.status(200).json(response);
    } catch(err) {
        console.log(err);
        res.status(400).json('Not enough stock to complete order');
    }
});

module.exports = router;