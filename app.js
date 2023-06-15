const path = require('path');
const cors = require('cors');
const express = require('express');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const cookieParser = require('cookie-parser');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorControllers');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

//Start express app

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
//Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// SET SECURITY HTTP headers, helmet config
app.use(cors());
app.options('*', cors());

const defaultSrcUrls = [
  'https://js.stripe.com/',
  'data:',
  'blob:',
  'https:',
  'ws:'
];

const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://cdnjs.cloudflare.com/ajax/libs/axios/1.0.0-alpha.1/axios.min.js',
  'https:',
  'http:',
  'blob:',
  'https://js.stripe.com/v3/',
  'https://m.stripe.network',
  'https://*.cloudflare.com'
];

const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/'
];

const connectSrcUrls = [
  'https://*.stripe.com',
  'https://unpkg.com',
  'https://tile.openstreetmap.org',
  'https://*.cloudflare.com',
  'http://localhost:8000/api/v1/users/login',
  'http://localhost/api/v1/bookings/checkout-session/',
  "'self'",
  "'unsafe-inline'",
  'data:',
  'blob:',
  'https://bundle.js:*',
  'ws://127.0.0.1:*/'
];

const fontSrcUrls = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'https:',
  'data:'
];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", ...defaultSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      connectSrc: ["'self'", ...connectSrcUrls],
      fontSrc: ["'self'", ...fontSrcUrls],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'", ...styleSrcUrls],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      formAction: ["'self'"],
      workerSrc: ["'self'", 'blob:', 'https://m.stripe.network'],
      childSrc: ["'self'", 'blob:'],
      objectSrc: ["'none'"],
      frameSrc: ["'self'", 'https://js.stripe.com'],
      baseUri: ["'self'"],
      upgradeInsecureRequests: []
    }
  })
);

//DEV logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// LIMIT requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, try again later!'
});

app.use('/api', limiter);

//BODY PARSER, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

//test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.cookies);
  next();
});

// 2) ROUTE HANDLERS

// 3) ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  /* res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  }); 
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  err.status = 'fail';
  err.statusCode = 404; */

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

// 4) STARTING SERVER

module.exports = app;
