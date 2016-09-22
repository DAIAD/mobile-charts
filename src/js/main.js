var daiad = require('./index');

require('./model')

require('./meter-charts')
require('./b1-charts')
require('./comparison-charts')

module.exports = daiad;

global.daiad = daiad;
