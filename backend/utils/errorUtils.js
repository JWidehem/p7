/* eslint-disable no-console */
exports.handleError = (
  res,
  error,
  message = 'Server error',
  statusCode = 500,
) => {
  console.error(error);
  res.status(statusCode).json({ error: message });
};
