var daiad = require('./index')

daiad.charts || (daiad.charts = {});

// Utilities

$.extend(daiad.charts, {

    generateTicks: function (r, n, m, precision) {
        // Generate approx n ticks in range r. Use only multiples of m.
        var dx = r[1] - r[0],
            step = Math.ceil(dx / (n * m)) * m,
            x0 = Math.floor(r[0] / m) * m;

        var f = null;
        if (precision)
            f = function(_, i) {
                var x = x0 + i * step;
                return [
                    [x, x.toFixed(precision)]
                ];
            };
        else
            f = function(_, i) {
                var x = x0 + i * step;
                return [
                    [x, x]
                ];
            };

        var l = (r[1] - x0 < n * step) ? (n + 1) : (n + 2);
        return $.map(new Array(l), f);
    },

});

module.exports = daiad.charts;
