const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

router.post("/create-payment-intent", async (req, res) => {
    const items = req.body.items;
    const totalCost = items.reduce((acc, cur) => acc + (cur.cost*cur.quantity), 0);
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalCost*100,
            currency: "gbp",
            payment_method_types: ['card'],
        });
        res.json({
        clientSecret: paymentIntent.client_secret,
        });
    } catch(err) {
        res.status(400).json({error: {message: err.message}});
    }
});

router.get('/stripe-config', async (req, res) => {
    res.json({publishableKey: process.env.STRIPE_PUBLISHABLE_KEY})
});

module.exports = router;