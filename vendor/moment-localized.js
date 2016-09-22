var moment = require('moment');

require('moment/locale/es');
require('moment/locale/el');
require('moment/locale/de');

moment.locale('en');

module.exports = moment;

global.moment = moment;
