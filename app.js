require('dotenv').config();
const express = require('express');
const session = require('express-session');
const db = require('./db/index');
const app = express();
const port = 3000;
const pool = db.pool;

const authRouter = require('./routes/auth');
const indexRouter = require('./routes/index');

app.use(session({
    store: new (require('connect-pg-simple')(session))({
      pool: pool,
      createTableIfMissing: true    
    }),
    secret: process.env.SSECRET,
    resave: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
    saveUninitialized: false
}));

app.use('/', authRouter);
app.use('/', indexRouter);

app.listen(port, () => {
    console.log(`E-Commerce backend is listening on port ${port}`);
});