if (process.env.NODE_ENV === 'production') {
  exports.config = require('./prod')
}
if (process.env.NODE_ENV === 'development') {
  exports.config = require('./dev')
}
