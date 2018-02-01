const Promise = require('bluebird')

module.exports.sleep = timeout =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, timeout)
  })