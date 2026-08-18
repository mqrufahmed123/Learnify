// Centralized error handler. Any error passed to next(err), or thrown inside an
// asyncHandler-wrapped route, ends up here instead of leaking a raw stack trace.
const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ message: err.message });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Something went wrong on the server'
  });
};

module.exports = errorHandler;
