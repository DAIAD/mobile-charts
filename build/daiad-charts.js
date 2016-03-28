(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var charts = require('./charts')

var model = require('./model')

charts.b1 = (function () {
    
    var plotOptions = $.extend({}, charts.plotOptions);
    plotOptions.defaults.colors = ['#2D3580'];
    plotOptions.defaults.colormap = new Map([
        ['default', '#2D3580'],
        ['measured-data', '#2D3580'],
        ['estimated-data', '#AAAEB1'],
    ]);
    
    var formatLabel = charts.formatLabel;

    return {
        plotForEvent: function($placeholder, data, config)
        {   
            if (!data || data.length == 0)
                return null;

            var M = data[0].constructor,
                ry = M.calcRange(data),
                miny = ry[0],
                maxy = ry[1],
                dy = maxy - miny,
                ts = data[0].timestamp.getTime(),
                te = data[data.length - 1].timestamp.getTime(),
                dt = te - ts,
                minx = ts - Math.floor(0.15 * dt),
                maxx = te + Math.floor(0.15 * dt),
                rx = [minx, maxx];

            config = $.extend({bars: {}, xaxis: {}, yaxis: {}}, (config || {}));

            var options = {
                series: {
                    points: {show: false, radius: 1},
                    shadowSize: 0,
                    lines: $.extend({show: true}, plotOptions.defaults.series.lines, {fill: 0.4}),
                },
                xaxis: $.extend({}, plotOptions.defaults.xaxis, {
                    // Display xaxis ticks at multiples of minutes
                    ticks: charts.generateTicks(rx, (config.xaxis.ticks || 5), 5 * 60 * 1000, function (x) {
                        return moment(x).format('hh:mm a')
                    }),
                    tickLength: 9, 
                    min: minx,
                    max: maxx,
                }),
                yaxis: $.extend({}, plotOptions.defaults.yaxis, {
                    ticks: charts.generateTicks(ry, 4, 10),
                    min: miny - 0.15 * dy,
                    max: maxy + 0.15 * dy,
                }),
                grid: plotOptions.defaults.grid,
                legend: {show: false},
            };
            
            return $.plot($placeholder, [{
                data: $.map(data, function(v) {
                    return (v.value) ? [[v.timestamp.getTime(), v.value]] : null;
                }),
                label: formatLabel(M),
                color: plotOptions.defaults.colors[0],
            }], options);
           
        },
        plotForDay: function($placeholder, data, config)
        {
            // Todo
        },
        plotForWeek: function($placeholder, data1, data2, config)
        {
            // Note:
            // param data1: measured (aka realtime) data
            // param data2: estimated data

            var n1 = (data1 && data1.length)? (data1.length) : 0,
                n2 = (data2 && data2.length)? (data2.length) : 0;

            if (!(n1 > 0 || n2 > 0))
                return null;

            var M1 = (n1 > 0)? (data1[0].constructor) : (null),
                M2 = (n2 > 0)? (data2[0].constructor) : (null),
                ry1 = M1.calcRange(data1),
                ry2 = M2.calcRange(data2),
                miny = Math.min(ry1[0], ry2[0]),
                maxy = Math.max(ry1[1], ry2[1]),
                ry = [miny, maxy],
                dy = maxy - miny,
                n = Math.max(n1, n2); 
            
            config = $.extend({bars: {}, xaxis: {}, yaxis: {}}, (config || {}));
            var resolution = config.resolution || 1; // days
            var bar_width_ratio = config.bars.widthRatio || 0.6; // as part of bucket 
            
            var options = {
                series: {
                    points: {show: false},
                    shadowSize: 0,
                    lines: {show: false},
                    bars: $.extend({show: true}, plotOptions.defaults.series.bars),
                },
                xaxis: $.extend({}, plotOptions.defaults.xaxis, {
                    ticks: $.map(data1, function(v, i) {
                        var t = v.timestamp.getTime(),
                            tm = (config.locale)? moment(t).locale(config.locale) : moment(t);
                        return [[v.id + (bar_width_ratio / 2.0), tm.format('dd')]];
                    }),
                    min: 0,
                    max: n,
                }),
                yaxis: $.extend({}, plotOptions.defaults.yaxis, {
                    ticks: charts.generateTicks(ry, 4, 10),
                    min: miny - 0.15 * dy,
                    max: maxy + 0.15 * dy,
                }),
                grid: plotOptions.defaults.grid,
                legend: {show: false, position: 'ne'},
                bars: $.extend({}, plotOptions.defaults.bars, {barWidth: bar_width_ratio}),
            };
           
            var plotdata = [];
            
            if (n1 > 0) {
                var points1 = $.map(data1, function (m, i) {return [[i, m.value]]});
                plotdata.push({
                    data: points1,
                    label: formatLabel(M1),
                    color: plotOptions.defaults.colormap.get('measured-data'),
                });
            }
            // Plot successive data points in data2 (same value, interpolated between 
            // data points of data1) as 1 continous bar
            if (n2 > 0) {
                var points2 = [], i = 0;
                while (i < n2) {
                    if (data2[i].value == null) {
                        i++;
                        continue;
                    }
                    // Compute span of this data2 value (until next non-null value of data1)
                    var j = i + 1, span = null;
                    while (j < n1 && data1[j].value == null) j++;
                    span = (j == n1)? (n2 - i) : (j - i);
                    plotdata.push({
                        data: [[i, data2[i].value]],
                        label: formatLabel(M2),
                        color: plotOptions.defaults.colormap.get('estimated-data'),
                        bars: {barWidth: bar_width_ratio + span - 1},
                    })
                    i = j;
                }
            }

            return $.plot($placeholder, plotdata, options);
        },
        plotForMonth: function($placeholder, data, config)
        {
            if (!data || data.length == 0)
                return null;

            var M = data[0].constructor;
            var ry = M.calcRange(data); 
            var miny = ry[0], maxy = ry[1], dy = maxy - miny; 
            
            config = $.extend({bars: {}, xaxis: {}, yaxis: {}}, (config || {}));
            var resolution = config.resolution || 1; // days
            
            var options = {
                series: {
                    points: $.extend({show: true}, plotOptions.defaults.series.points),
                    shadowSize: 0,
                    lines: $.extend({show: true}, plotOptions.defaults.series.lines, {fill: 0.4}),
                },
                xaxis: $.extend({}, plotOptions.defaults.xaxis, {
                    // Generate a tick for the beggining of each week 
                    ticks: $.map(new Array(charts.WEEKS_IN_MONTH - 1), function(_, k) {
                        var x = (((k + 1) * 7) / resolution);
                        return [[x, (config.weekLabel || 'week') + ' ' + (k + 1).toString()]];
                    }),
                    min: 0,
                    max: data.length,
                }),
                yaxis: $.extend({}, plotOptions.defaults.yaxis, {
                    ticks: charts.generateTicks(ry, 4, 10),
                    min: miny - 0.15 * dy,
                    max: maxy + 0.15 * dy,
                }),
                grid: plotOptions.defaults.grid,
                legend: {show: false},
            };
            
            return $.plot($placeholder, [{
                data: $.map(data, function(v) {return (v.value) ? [[v.id, v.value]] : null}),
                label: formatLabel(M),
                color: plotOptions.defaults.colors[0],
            }], options);
        },
        plotForYear: function($placeholder, data, config)
        {
            if (!data || data.length == 0)
                return null;
            
            var M = data[0].constructor;
            var ry = M.calcRange(data); 
            var miny = ry[0], maxy = ry[1], dy = maxy - miny; 
            
            config = $.extend({bars: {}, xaxis: {}, yaxis: {}}, (config || {}));
            var resolution = config.resolution || 1; // months
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
                    ticks: charts.generateTicks(ry, 4, 10),
                    min: miny - 0.15 * dy,
                    max: maxy + 0.15 * dy,
                }),
                grid: plotOptions.defaults.grid,
                legend: {show: false},

            };
            
            return $.plot($placeholder, [{
                data: $.map(data, function(v) {return (v.value) ? [[v.id, v.value]] : null}),
                label: formatLabel(M),
                color: plotOptions.defaults.colors[0],
            }], options);
        },
    };
})(); 

module.exports = charts.b1;

},{"./charts":2,"./model":7}],2:[function(require,module,exports){
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

},{"./index":4}],3:[function(require,module,exports){
var charts = require('./charts')

charts.comparison = (function () {
    
    var plotOptions = $.extend({}, charts.plotOptions);
    plotOptions.defaults.colors = ['#2D3580'];

    return {
        plotBarsWithLabels: function ($placeholder, data, config)
        {
            var LABEL_X_MARGIN = 8, LABEL_X_PADDING = 8

            var value_getter = function (v) {return v[1]},
                miny = Math.min.apply(null, $.map(data, value_getter)),
                maxy = Math.max.apply(null, $.map(data, value_getter)),
                dy = maxy - miny; 
            
            config = $.extend(
                {points: {}, labels: {}, bars: {}},
                (config || {}));
            config.labels = $.extend({
                paddingX: LABEL_X_PADDING,
                marginX: LABEL_X_MARGIN,
                align: 'right',
            }, config.labels);
            config.bars = $.extend({widthRatio: 0.85}, config.bars);
            
            var options = {
                series: {
                    points: {show: false},
                    shadowSize: 0,
                    lines: {show: false},
                    bars: {show: true, lineWidth: 1, fill: 0.9},
                },
                xaxis: {
                    ticks: [],
                    // We plot horizontally, so these boundaries are for X axis!
                    //min: miny,
                    max: maxy + 0.40 * dy,
                },
                yaxis: {
                    ticks: [], 
                },
                grid: $.extend({}, plotOptions.defaults.grid, {
                    margin: {top: 15, bottom: 15, left: 10, right: 10},
                }),
                legend: {show: false},
                bars: {
                    barWidth: config.bars.widthRatio,
                    align: 'right',
                    horizontal: true,
                },
            };
            
            var plotdata = $.map(data, function (v, i) {
                var x = v[0], y = v[1], cx = config.points.get(x);
                return {
                    data: [[y, i]],
                    color: cx.color,
                    label: cx.label,
                }
            });
            
            var plot = $.plot($placeholder, plotdata, options);
            
            $.each(data, function (i, v) {
                var x = v[0], 
                    y = v[1],
                    cx = config.points.get(x),
                    o0 = plot.pointOffset({x: 0, y: i}),
                    o1 = plot.pointOffset({x: y, y: i}),
                    o2 = plot.pointOffset({x: y, y: i - (config.bars.widthRatio * 1)});
                
                var style_settings = {
                    'top': o1.top.toString() + 'px',
                    'left': o1.left.toString() + 'px',
                    'height': (o2.top - o1.top).toString() + 'px',
                    'line-height': (o2.top - o1.top - 4).toString() + 'px',
                    'padding-left': config.labels.paddingX.toString() + 'px',
                    'padding-right': config.labels.paddingX.toString() + 'px',
                };
                
                $('<div>')
                    .addClass('value-label')
                    .addClass('value')
                    .text(y.toFixed(0))
                    .css(style_settings)
                    .appendTo($placeholder);
                
                $('<div>')
                    .addClass('value-label')
                    .addClass('label')
                    .text(cx.label)
                    .css($.extend({}, style_settings, {
                        'width': (o1.left - o0.left - 2 * (config.labels.marginX + config.labels.paddingX))
                            .toString() + 'px',
                        'left': (o0.left + config.labels.marginX).toString() + 'px',
                        'text-align': config.labels.align,
                        'color': cx.labelColor,
                    }))
                    .appendTo($placeholder);
            })
            
            return plot;
        },
        plotMarkersInScale: function ($placeholder, data, config)
        {
            // Todo
        },
        plotBarsAsPairs: function ($placeholder, data1, data2, config)
        {
            // Todo
        },
    }
})()

},{"./charts":2}],4:[function(require,module,exports){
module.exports = { 
    VERSION: '0.1dev',
};

},{}],5:[function(require,module,exports){
daiad = require('./index');

require('./model')

require('./meter-charts')
require('./b1-charts')
require('./comparison-charts')

},{"./b1-charts":1,"./comparison-charts":3,"./index":4,"./meter-charts":6,"./model":7}],6:[function(require,module,exports){
var charts = require('./charts')

var model = require('./model')

charts.meter = (function () {
    
    var plotOptions = $.extend({}, charts.plotOptions);
    plotOptions.defaults.colors = ['#2D3580'];

    var formatLabel = charts.formatLabel, 
        filterForData = charts.filterForData;

    function getDefaultLevel(y0, y1)
    {
        return charts.getDefaultLevel(y0, y1, plotOptions.defaults.colors[0]);
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
                            tm = (config.locale)? moment(t).locale(config.locale) : moment(t);
                        return (i % tick_size == 0) ?
                            [[v.id + (bar_width_ratio / 2.0), tm.format('ha')]] : null;
                    }),
                    min: 0,
                    max: data.length,
                }),
                yaxis: $.extend({}, plotOptions.defaults.yaxis, {
                    ticks: charts.generateTicks(ry, 4, 10),
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
                            tm = (config.locale)? moment(t).locale(config.locale) : moment(t);
                        return [[v.id + (bar_width_ratio / 2.0), tm.format('dd')]];
                    }),
                    min: 0,
                    max: data.length,
                }),
                yaxis: $.extend({}, plotOptions.defaults.yaxis, {
                    ticks: charts.generateTicks(ry, 4, 10),
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
            
            var options = {
                series: {
                    points: $.extend({show: true}, plotOptions.defaults.series.points),
                    shadowSize: 0,
                    lines: $.extend({show: true}, plotOptions.defaults.series.lines, {fill: 0.4}),
                },
                xaxis: $.extend({}, plotOptions.defaults.xaxis, {
                    // Generate a tick for the beggining of each week 
                    ticks: $.map(new Array(charts.WEEKS_IN_MONTH - 1), function(_, k) {
                        var x = (((k + 1) * 7) / resolution);
                        return [[x, (config.weekLabel || 'week') + ' ' + (k + 1).toString()]];
                    }),
                    min: 0,
                    max: data.length,
                }),
                yaxis: $.extend({}, plotOptions.defaults.yaxis, {
                    ticks: charts.generateTicks(ry, 4, 10),
                    min: miny - 0.15 * dy,
                    max: maxy + 0.15 * dy,
                }),
                grid: plotOptions.defaults.grid,
                legend: {show: false},
            };
            
            return $.plot($placeholder, [{
                data: $.map(data, function(v) {return (v.value) ? [[v.id, v.value]] : null}),
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
                    ticks: charts.generateTicks(ry, 4, 10),
                    min: miny - 0.15 * dy,
                    max: maxy + 0.15 * dy,
                }),
                grid: plotOptions.defaults.grid,
                legend: {show: false},

            };
            
            return $.plot($placeholder, [{
                data: $.map(data, function(v) {return (v.value) ? [[v.id, v.value]] : null}),
                label: formatLabel(M),
                color: plotOptions.defaults.colors[0],
            }], options);
        },
    };
})();

module.exports = charts.meter;

},{"./charts":2,"./model":7}],7:[function(require,module,exports){
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
            if (!(data && data.length > 0))
                return [-Infinity, +Infinity];

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

},{"./index":4}]},{},[5]);
