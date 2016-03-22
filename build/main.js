(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var charts = require('./charts')

charts.b1 = {
    version: '0.1a',
};

module.exports = charts.b1;

},{"./charts":2}],2:[function(require,module,exports){
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

},{"./index":3}],3:[function(require,module,exports){
module.exports = { 
    VERSION: '0.1dev',
};

},{}],4:[function(require,module,exports){
daiad = require('./index');

require('./model')

require('./meter-charts')
require('./b1-charts')

},{"./b1-charts":1,"./index":3,"./meter-charts":5,"./model":6}],5:[function(require,module,exports){
var charts = require('./charts')

var model = require('./model')

charts.meter = (function () {
    
    var plotOptions = {
        defaults: {
            colors: ['#2D3580'],
            series: {
                points: {
                    radius: 2,
                },
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
    };
    
    function formatLabel(M, level)
    {
        var s = M.value.title + ' (' + M.value.unit + ')';
        if (level && level.description)
            s += ' (' + level.description + ')'; 
        return s;
    };

    function filterForData(level)
    {
        var y0 = level.range[0], y1 = level.range[1];
        return function (m) {
            return (m.value != null && (m.value >= y0) && (m.value < y1)) ? [[m.id, m.value]] : null;
        }
    };
    
    function getDefaultLevel(miny, maxy)
    {
        return {
           range: [miny, maxy + 1],
           color: plotOptions.defaults.colors[0],
        };
    };

    return {
        plotForDay: function ($placeholder, data, config) 
        {
            if (!data || data.length == 0)
                return null;

            var M = data[0].constructor;
            var ry = M.calcRange(data); 
            var miny = ry[0], maxy = ry[1], dy = maxy - miny; 
            
            config = $.extend({bars: {}, xaxis: {}, yaxis: {}}, (config || {}));
            var resolution = config.resolution || 1; // hours
            var bar_width_ratio = config.bars.widthRatio || 0.6; // as part of bucket 
            var tick_size = config.xaxis.tickSize || 4; // 1 tick every tick_size datapoints
            var locale = config.locale

            var options = {
                series: {
                    points: {show: false},
                    shadowSize: 0,
                    lines: {show: false},
                    bars: $.extend({show: true}, plotOptions.defaults.series.bars),
                },
                xaxis: $.extend({}, plotOptions.defaults.xaxis, {
                    ticks: $.map(data, function(v, i) {
                        var t = v.timestamp.getTime(),
                            tm = (locale)? moment(t).locale(locale) : moment(t);
                        return (i % tick_size == 0) ?
                            [[v.id + (bar_width_ratio / 2.0), tm.format('ha')]] : null;
                    }),
                    min: 0,
                    max: data.length,
                }),
                yaxis: $.extend({}, plotOptions.defaults.yaxis, {
                    ticks: charts.generateTicks([miny, maxy], 4, 10),
                    min: miny - 0.15 * dy,
                    max: maxy + 0.15 * dy,
                }),
                grid: plotOptions.defaults.grid,
                legend: {show: false, position: 'ne'},
                bars: $.extend({}, plotOptions.defaults.bars, {barWidth: bar_width_ratio}),
            };

            var levels = config.levels || [getDefaultLevel(miny, maxy)];
            var plotdata = $.map(levels, function(level, i) {
                return {
                    data: $.map(data, filterForData(level)),
                    label: formatLabel(M, level),
                    color: level.color,
                };
            });
            return $.plot($placeholder, plotdata, options);
        },
        
        plotForWeek: function ($placeholder, data, config) 
        {
            if (!data || data.length == 0)
                return null;

            var M = data[0].constructor;
            var ry = M.calcRange(data); 
            var miny = ry[0], maxy = ry[1], dy = maxy - miny; 
            
            config = $.extend({bars: {}, xaxis: {}, yaxis: {}}, (config || {}));
            var resolution = config.resolution || 1; // days
            var bar_width_ratio = config.bars.widthRatio || 0.6; // as part of bucket 
            var locale = config.locale;
            
            var options = {
                series: {
                    points: {show: false},
                    shadowSize: 0,
                    lines: {show: false},
                    bars: $.extend({show: true}, plotOptions.defaults.series.bars),
                },
                xaxis: $.extend({}, plotOptions.defaults.xaxis, {
                    ticks: $.map(data, function(v, i) {
                        var t = v.timestamp.getTime(),
                            tm = (locale)? moment(t).locale(locale) : moment(t);
                        return [[v.id + (bar_width_ratio / 2.0), tm.format('dd')]];
                    }),
                    min: 0,
                    max: data.length,
                }),
                yaxis: $.extend({}, plotOptions.defaults.yaxis, {
                    ticks: charts.generateTicks([miny, maxy], 4, 10),
                    min: miny - 0.15 * dy,
                    max: maxy + 0.15 * dy,
                }),
                grid: plotOptions.defaults.grid,
                legend: {show: false, position: 'ne'},
                bars: $.extend({}, plotOptions.defaults.bars, {barWidth: bar_width_ratio}),
            };
            
            var levels = config.levels || [getDefaultLevel(miny, maxy)];
            var plotdata = $.map(levels, function(level, i) {
                return {
                    data: $.map(data, filterForData(level)),
                    label: formatLabel(M, level),
                    color: level.color,
                };
            });
            return $.plot($placeholder, plotdata, options);
        },

        plotForMonth: function ($placeholder, data, config)
        {
            if (!data || data.length == 0)
                return null;

            var M = data[0].constructor;
            var ry = M.calcRange(data); 
            var miny = ry[0], maxy = ry[1], dy = maxy - miny; 
            
            config = $.extend({bars: {}, xaxis: {}, yaxis: {}}, (config || {}));
            var resolution = config.resolution || 1; // days
            var weeks_in_month = 5; // partially
            var locale = config.locale;
            
            var options = {
                series: {
                    points: $.extend({show: true}, plotOptions.defaults.series.points),
                    shadowSize: 0,
                    lines: $.extend({show: true}, plotOptions.defaults.series.lines, {fill: 0.4}),
                },
                xaxis: $.extend({}, plotOptions.defaults.xaxis, {
                    // Generate a tick for the beggining of each week 
                    ticks: $.map(new Array(weeks_in_month - 1), function(_, k) {
                        var x = (((k + 1) * 7) / resolution);
                        return [[x, (config.weekLabel || 'week') + (k + 1).toString()]];
                    }),
                    min: 0,
                    max: data.length,
                }),
                yaxis: $.extend({}, plotOptions.defaults.yaxis, {
                    ticks: charts.generateTicks([miny, maxy], 4, 10),
                    min: miny - 0.15 * dy,
                    max: maxy + 0.15 * dy,
                }),
                grid: plotOptions.defaults.grid,
                legend: {show: false},
            };
            
            return $.plot($placeholder, [{
                data: $.map(data, function(v) {
                    return (v.value) ? [[v.id, v.value]] : null
                }),
                label: formatLabel(M),
                color: plotOptions.defaults.colors[0],
            }], options);
        },
        
        plotForYear: function ($placeholder, data, config)
        {
            if (!data || data.length == 0)
                return null;
            
            var M = data[0].constructor;
            var ry = M.calcRange(data); 
            var miny = ry[0], maxy = ry[1], dy = maxy - miny; 
            
            config = $.extend({bars: {}, xaxis: {}, yaxis: {}}, (config || {}));
            var resolution = config.resolution || 1; // months
            var locale = config.locale;
            var month_names = moment.monthsShort();
            
            var options = {
                series: {
                    points: $.extend({show: true}, plotOptions.defaults.series.points),
                    shadowSize: 0,
                    lines: $.extend({show: true}, plotOptions.defaults.series.lines, {fill: 0.4}),
                },
                xaxis: $.extend({}, plotOptions.defaults.xaxis, {
                    ticks: $.map(data, function(v, i) {
                        return [[v.id, month_names[i * resolution]]];
                    }),
                    min: 0,
                    max: data.length,
                }),
                yaxis: $.extend({}, plotOptions.defaults.yaxis, {
                    ticks: charts.generateTicks([miny, maxy], 4, 10),
                    min: miny - 0.15 * dy,
                    max: maxy + 0.15 * dy,
                }),
                grid: plotOptions.defaults.grid,
                legend: {show: false},

            };
            
            return $.plot($placeholder, [{
                data: $.map(data, function(v) {
                    return (v.value) ? [[v.id, v.value]] : null
                }),
                label: formatLabel(M),
                color: plotOptions.defaults.colors[0],
            }], options);
        },
    };
})();

module.exports = charts.meter;

},{"./charts":2,"./model":6}],6:[function(require,module,exports){
var daiad = require('./index')

daiad.model || (daiad.model = {});

// Measurements

$.extend(daiad.model, (function () {

    function Measurement(id, timestamp, value) {
        if (!(timestamp instanceof Date)) {
            throw new Error('Expected a instance of Date as timestamp');
        }
        this.id = parseInt(id);
        this.timestamp = timestamp;
        this.value = (value == null)? null : parseFloat(value);
        return this;
    }

    Measurement.prototype.getValue = function(precision) {
        return this.value.toFixed(precision || 2) +
            ' (' + this.constructor.value.unit.toString() + ')';
    }

    $.extend(Measurement, {
        // Class attributes
        timestamp: {
            name: 'timestamp',
            title: 'Time',
            unit: 'milliseconds'
        },
        value: {
            name: 'value',
            title: 'Value',
            unit: null
        },
        // Class methods
        calcRange: function (data) 
        {
            var g = function (m) { return m.value };
            var miny = Math.min.apply(null, $.map(data, g)), 
                maxy = Math.max.apply(null, $.map(data, g));
            return [miny, maxy];
        },
    });

    function EnergyMeasurement(id, timestamp, value) {
        Measurement.call(this, id, timestamp, value);
        return this;
    }

    $.extend(EnergyMeasurement.prototype, Measurement.prototype, {
        // noop
    });

    $.extend(EnergyMeasurement, Measurement, {
        value: {
            name: 'value',
            title: 'Energy',
            unit: 'kW'
        },
    });
    
    return {
        Measurement: Measurement,
        EnergyMeasurement: EnergyMeasurement,
    };
})());

module.exports = daiad.model;

},{"./index":3}]},{},[4]);
