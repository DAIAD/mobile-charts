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
        plotForEvent: function ($placeholder, data, config)
        {
            // Expect data that decribe successive events (no timestamps supplied).
            // Assume data is sorted on `id`.

            if (!data || data.length == 0)
                return null;
            
            var M = data[0].constructor,
                ry = M.getRange(data),
                miny = ry[0],
                maxy = ry[1],
                dy = maxy - miny,
                minx = data[0].id,
                maxx = data[data.length -1].id,
                rx = [minx, maxx],
                dx = maxx - minx;
            
            config = $.extend({bars: true, xaxis: {}, yaxis: {}}, (config || {}));
            
            var options = {
                series: {
                    points: {show: false, radius: 1},
                    shadowSize: 0,
                    lines: config.bars? {show: false} :
                        $.extend({show: true}, plotOptions.defaults.series.lines, {fill: 0.4}),
                    bars: !config.bars? {show: false} : 
                        $.extend({show: true}, plotOptions.defaults.series.bars, {barWidth: 0.5}),
                },
                xaxis: $.extend({}, plotOptions.defaults.xaxis, {
                    ticks: config.xaxis.ticks || 5,
                    // Todo Provide a formatter that can take advantage of sporadic timestamps 
                    tickLength: 6, 
                    min: minx - Math.floor(0.05 * dx),
                    max: maxx + Math.floor(0.05 * dx),
                }),
                yaxis: $.extend({}, plotOptions.defaults.yaxis, {
                    ticks: charts.generateTicks(ry, 4, config.yaxis.tickUnit),
                    min: miny - 0.00 * dy,
                    max: maxy + 0.10 * dy,
                }),
                grid: plotOptions.defaults.grid,
                legend: {show: false},
            };

            return $.plot($placeholder, [{
                data: $.map(data, function(v) {
                    return (v.value) ? [[v.id, v.value]] : null;
                }),
                label: formatLabel(M),
                color: plotOptions.defaults.colors[0],
            }], options);
        },
        plotForTimedEvent: function($placeholder, data, config)
        {   
            // Expect data that describe events marked with time
            // Assume data is sorted on `timestamp`.
            
            if (!data || data.length == 0)
                return null;

            var M = data[0].constructor,
                ry = M.getRange(data),
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
                    tickLength: 6, 
                    min: minx,
                    max: maxx,
                }),
                yaxis: $.extend({}, plotOptions.defaults.yaxis, {
                    ticks: charts.generateTicks(ry, 4, config.yaxis.tickUnit),
                    min: miny - 0.00 * dy,
                    max: maxy + 0.10 * dy,
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
                ry1 = M1.getRange(data1),
                ry2 = M2.getRange(data2),
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
                    ticks: charts.generateTicks(ry, 4, config.yaxis.tickUnit),
                    min: miny - 0.00 * dy,
                    max: maxy + 0.10 * dy,
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
            var ry = M.getRange(data); 
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
                    ticks: charts.generateTicks(ry, 4, config.yaxis.tickUnit),
                    min: miny - 0.00 * dy,
                    max: maxy + 0.10 * dy,
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
            var ry = M.getRange(data); 
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
                    ticks: charts.generateTicks(ry, 4, config.yaxis.tickUnit),
                    min: miny - 0.00 * dy,
                    max: maxy + 0.10 * dy,
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
