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

    function getDefaultLevel(y0, y1)
    {
        return {
           range: [y0, y1 + 1],
           color: plotOptions.defaults.colors[0],
        };
    };

    return {
        plotForMinutes: function($placeholder, data, config)
        {
            // Todo
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
            var locale = config.locale;
            
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
                            tm = (locale)? moment(t).locale(locale) : moment(t);
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
            
            if (n1 > 0) 
                plotdata.push({
                    data: data1,
                    label: formatLabel(M1),
                    color: plotOptions.defaults.colormap.get('measured-data'),
                });

            // Todo: successive data points in data2 have same value!!
            if (n2 > 0) 
                plotdata.push({
                    data: data1,
                    label: formatLabel(M2),
                    color: plotOptions.defaults.colormap.get('estimated-data'),
                });

            return $.plot($placeholder, plotdata, options);
        },
        plotForMonth: function($placeholder, data, config)
        {
            // Todo
        },
        plotForYear: function($placeholder, data, config)
        {
            // Todo
        },
    };
})(); 

module.exports = charts.b1;
