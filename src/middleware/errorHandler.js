const createError = require('http-errors');
const { CustomError } = require('../lib/errors');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.log(err.message) // eslint-disable-line no-console
  // if the error is safe to expose to client
  if (err instanceof CustomError || err instanceof createError.HttpError) {
    res.status(err.status || 500).send({ message: err.message });
  } else {
    res.status(500).send(createError.InternalServerError());
  }
};


module.exports = errorHandler;
