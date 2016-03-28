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
