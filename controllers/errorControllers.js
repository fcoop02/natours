const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = Object.values(err.keyValue)[0];
  const message = `Duplicate field value: ${value}. Use another value!`;
  return new AppError(message, 400);
};
const handleValidatonError = err => {
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid input data! ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  // a) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  //b) rendered website
  console.error('ERROR!!!!!!!!!!!!', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  //a) API
  if (req.originalUrl.startsWith('/api')) {
    // OPERATIONAL, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        msg: err.message
      });
    }
    //1) LOG ERROR
    console.error('ERROR!!!!!!!!!!!!', err);

    //2)PROGRAMING OR OTHER UNKOWN ERROR: DONT LEAK ERROR DETAILS!
    return res.status(500).json({
      status: 'error',
      msg: 'Something went very wrong!'
    });
  }
  // OPERATIONAL, trusted error: send message to client
  //b) RENDERED WEBSITE
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
  //1) LOG ERROR
  console.error('ERROR!!!!!!!!!!!!', err);

  //2)PROGRAMING OR OTHER UNKOWN ERROR: DONT LEAK ERROR DETAILS!
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.'
  });
};

const handleJWTError = err =>
  new AppError('Invalid token. Please login again!', 401);

const handleJWTExpired = err =>
  new AppError('Expired token. Please login again!', 401);

module.exports = (err, req, res, next) => {
  //console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidatonError(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (err.name === 'TokenExpiredError') error = handleJWTExpired(error);
    sendErrorProd(error, req, res);
  }
};
