require('dotenv').config();
const express = require('express');
const session = require('express-session');
const db = require('./db/index');
const cors = require('cors');
const morgan = require('morgan');
const app = express();
const port = 3000;
const pool = db.pool;
const paymentRouter = require('./routes/payment');
const authRouter = require('./routes/auth');
const indexRouter = require('./routes/index');
const bodyparser = require('body-parser');

app.set("trust proxy", 1);

app.use(session({
    store: new (require('connect-pg-simple')(session))({
      pool: pool,
      createTableIfMissing: true
    }),
    secret: process.env.SSECRET,
    resave: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: false
    },
    saveUninitialized: false
}));

app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(cors({
  origin: process.env.FRONTEND_CORS,
  credentials: true,
}));

app.use(morgan('tiny'));

app.use('/', authRouter);
app.use('/', indexRouter);
app.use('/', paymentRouter);


app.listen(port, () => {
    console.log(`E-Commerce backend is listening on port ${port}`);
});