var daiad = require('./index')

daiad.charts || (daiad.charts = {});

$.extend(daiad.charts, {
   
    WEEKS_IN_MONTH: 5, // partially

    // Defaults

    plotOptions: {
        defaults: {
            series: {
                points: {
                    radius: 2,
                },
                shadowSize: 0,
                lines: {
                    lineWidth: 1,
                },
                bars: {
                    lineWidth: 1,
                    fill: 0.8,
                },
            },
            bars: {
                align: 'left',
                horizontal: false,
            },
            xaxis: {
                tickLength: 0,
                tickColor: '#bbb',
            },
            yaxis: {
                tickLength: 0,
                tickColor: '#bbb',
            },
            grid: {
                color: '#bbb',
                backgroundColor: null,
                margin: {
                    top: 15,
                    bottom: 10,
                    left: 20,
                    right: 10
                },
                borderWidth: {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0
                },
            },
        },
    },

    // Utilities
    
    formatLabel: function(M, level)
    {
        var s = M.value.title + ' (' + M.value.unit + ')';
        if (level && level.description)
            s += ' (' + level.description + ')'; 
        return s;
    },

    filterForData: function(level)
    {
        var y0 = level.range[0], y1 = level.range[1];
        return function (m) {
            return (m.value != null && (m.value >= y0) && (m.value < y1)) ? [[m.id, m.value]] : null;
        }
    },
    
    getDefaultLevel: function(y0, y1, color)
    {
        return {range: [y0, y1 + 1], color: color};
    },

    generateTicks: function (r, n, m, formatter) {
        // Generate approx n ticks in range r. Use only multiples of m.
        var dx = r[1] - r[0],
            step = Math.ceil(dx / (n * m)) * m,
            x0 = Math.floor(r[0] / m) * m;

        var f = null;
        if (formatter)
            f = function(_, i) {
                var x = x0 + i * step;
                return [[x, formatter.call(null, x, i, step)]];
            };
        else
            f = function(_, i) {
                var x = x0 + i * step;
                return [[x, x.toString()]];
            };

        var l = (r[1] - x0 < n * step) ? (n + 1) : (n + 2);
        return $.map(new Array(l), f);
    },

});

module.exports = daiad.charts;
