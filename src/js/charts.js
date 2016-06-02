var daiad = require('./index')

daiad.charts || (daiad.charts = {});

$.extend(daiad.charts, {
   
    WEEKS_IN_MONTH: 5, // partially

    //
    // Defaults
    //

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

    //
    // Utilities
    //

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
    
    generateTicks: function (r, n, m, formatter, offset) {
        // Generate approx n ticks in range r. Use only multiples of m.
        var dx = r[1] - r[0], step, x0, n1;
        
        // Compute m, if missing
        if (!m) {
            // Estimate order of magnitude using maximum value
            var e1 = Math.floor(Math.log10(Math.abs(r[1])));
            m = Math.pow(10, e1);
            // Check if this choice yields too few (<n-2) ticks
            if (dx > 0) {
                while (dx < (n - 2) * Math.ceil(dx / (n * m)) * m)
                   m = 0.1 * m;
            }
        }
       
        console.debug('generateTicks: Using m=' + m)

        // Compute x0, step, n1 (actual number of ticks)
        if (dx > 0) {
            step = Math.ceil(dx / (n * m)) * m;
            x0 = Math.floor(r[0] / m) * m;
            n1 = (r[1] - x0 < n * step)? (n + 1) : (n + 2);
        } else {
            step = Math.max(Math.floor((r[0] * 0.2) / m), 1) * m;
            x0 = Math.floor(r[0] / m) * m;
            n1 = 2;
        }
        
        if (!formatter)
            formatter = function (x, i, step) {
                var precision = (Number.isInteger(x))? 0 : 1;
                return x.toFixed(precision);
            }
        
        offset = (offset == null)? 0 : Number(offset) ;
     
        return $.map(new Array(n1), function (_, i) {
            var x = x0 + i * step;
            return [[x + offset, formatter.call(null, x, i, step)]];
        });
    },

});

module.exports = daiad.charts;
