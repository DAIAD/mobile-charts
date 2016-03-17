var charts = require('./charts')

var model = require('./model')

charts.meter = (function () {
    
    var plotOptions = {
        defaults: {
            colors: ['#2D3580'],
            series: {
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

    function makeFilter(y0, y1)
    {
        // Todo
        return function (m) {
            return (v.value != null && (v.value >= level.range[0]) && (v.value < level.range[1])) ? [
                [v.id, v.value]
            ] : null;
        }
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
                        return (i % tick_size == 0) ? [
                            [
                                v.id + (bar_width_ratio / 2.0),
                                moment(v.timestamp.getTime()).format('ha')
                            ]
                        ] : null;
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

            var levels = config.levels || [{
                range: [miny, maxy + 1],
                color: plotOptions.defaults.colors[0],
            }];

            var plotdata = $.map(levels, function(level, i) {
                return {
                    data: $.map(data, function (v) {
                        return (v.value != null && (v.value >= level.range[0]) && (v.value < level.range[1])) ? [
                            [v.id, v.value]
                        ] : null;
                    }),
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
                        return [[
                            v.id + (bar_width_ratio / 2.0),
                            moment(v.timestamp.getTime()).format('dd')
                        ]];
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
        },

        plotForMonth: function ($placeholder, data, config)
        {
            // Todo
        },
        
        plotForYear: function ($placeholder, data, config)
        {
            // Todo
        },
    };
})();

module.exports = charts.meter;
