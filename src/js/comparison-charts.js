var charts = require('./charts')

charts.comparison = (function () {

    var plotOptions = $.extend({}, charts.plotOptions);
    plotOptions.defaults.colors = ['#2D3580'];
    plotOptions.defaults.grid.margin = {
        top: 15, bottom: 10, left: 25, right: 25,
    };
   
    return {
        plotBarsWithLabels: function ($placeholder, data, config)
        {
            var LABEL_X_MARGIN = 8, LABEL_X_PADDING = 8;
            
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
                grid: plotOptions.defaults.grid,
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
        plotBarsWithMarkers: function ($placeholder, data, config)
        {
            // Adjust constants to agree with stylesheet ".value-marker" rules!
            var MARKER_HEIGHT_EM = 1.85,
                MARKER_WIDTH_EM = 2.40,
                MARKER_ARROW_HEIGHT_EM = 0.60;
            
            var em_pixels = parseFloat($placeholder.css('font-size'));
            var marker_outer_height = 
                (MARKER_HEIGHT_EM + (MARKER_ARROW_HEIGHT_EM / Math.SQRT2)) * em_pixels;
            var marker_outer_width =
                (MARKER_WIDTH_EM) * em_pixels;
           
            config = $.extend({
                range: [1, 10], // expected range of values
                points: {}, // configure marked points (see example.html)
                bars: {},
                numSteps: 10, // divide value space in numSteps linear steps
            }, (config || {}));
            config.bars = $.extend({
                color: '#BBB',
                widthRatio: 0.25,
            }, config.bars);
            config.bars.widthRatio = Math.min(config.bars.widthRatio, 0.50);

            // Configure the linear scale, define a linear function for it
            var miny = config.range[0],
                maxy = config.range[1],
                N = config.numSteps;
            var dy = maxy - miny,
                ty = dy / (N - 1),
                f = function (i) {return (miny + ty * (i - 1))},
                invf = function (y) {return (1 + (y - miny) / ty)};            
                       
            // A helper for creating a marker element
            var make_marker = function(plot, point, yoff) {
                var off1 = plot.pointOffset({x: point[0], y: point[1]});
                yoff || (yoff = 0); // additional y-offset (markers may overlap)
                return $('<div>')
                    .addClass('value-marker')
                    .css({
                        'top': off1.top - yoff - marker_outer_height - 2,
                        'left': off1.left - marker_outer_width / 2.0,
                    });
            };
            
            // Find (rounded) x for every marked y
            var marked_data = $.map(data, function (v, i) {
                var y = v[1], x = null;
                if (y > maxy || y < miny)
                    x = null; // skip this point
                else
                    x = Math.round(invf(y)); // round to an integer in [1 .. N]
                return {x: x, y: (x)? f(x) : null, key: v[0]};
            })
           
            var options = {
                series: {
                    points: {show: false},
                    shadowSize: 0,
                    lines: {show: false},
                    bars: {show: true, lineWidth: 1, fill: 1.0},
                },
                xaxis: {
                    ticks: [], 
                },
                yaxis: {
                    ticks: [],
                    min: miny - 0.10 * dy,
                    max: maxy + 0.40 * dy,
                },
                grid: plotOptions.defaults.grid,
                legend: {show: false},
                bars: {
                    barWidth: config.bars.widthRatio,
                    align: 'center',
                    horizontal: false,
                },
            };
 
            // Plot 

            var plotdata = [{
                // Generate data from the linear function
                data: $.map(new Array(N), function(_, i) {
                    return [[i + 1, f(i + 1)]];
                }),
                color: config.bars.color,
            }];
            
            plotdata.push.apply(plotdata, $.map(marked_data, function (v, i) {
                // A seperate series for each marked point
                var cx = config.points.get(v.key) || {};
                return {
                    data: [[v.x, v.y]],
                    color: cx.color,
                    bars: {barWidth: 1.4 * config.bars.widthRatio},
                };
            }));
            
            var plot1 = $.plot($placeholder, plotdata, options);

            // Place markers
            
            var count_markers = (new Array(N)).fill(0);
            
            $.each(marked_data, function (i, v) {
                if (v.x == null)
                    return; // skip out-of-range points

                var cx = config.points.get(v.key) || {},
                    yoff = count_markers[v.x] * marker_outer_height;
                count_markers[v.x]++; // stack markers
                
                var $marker = make_marker(plot1, [v.x, v.y], yoff)
                    .text(cx.label || v.key)
                    .css({
                        'color': cx.labelColor,
                        'background-color': cx.color,
                        'border-color': cx.color,
                    });
                plot1.getPlaceholder().append($marker);
            });
        
            return plot1;
        },
        plotBarsAsPairs: function ($placeholder, data1, data2, config)
        {
            // Todo
        },
    }
})()
