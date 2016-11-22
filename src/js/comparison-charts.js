/**
 * @module comparison-charts
 */ 

var charts = require('./charts')

var plotOptions = $.extend({}, charts.plotOptions);
plotOptions.defaults.colors = ['#2D3580'];
plotOptions.defaults.grid.margin = {
  top: 15, bottom: 10, left: 25, right: 25,
};

var generateTicks = charts.generateTicks;

charts.comparison = module.exports = {
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
    
    var Y_DC = 0.04 * dy; // for presentation purposes for small values

    var transform = (y) => (y + Y_DC);

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
        max: maxy + 0.10 * dy,
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
    
    var plotdata = $.map(data, function ([x, y], i) {
      var cx = config.points.get(x);
      return {
        data: [[transform(y), i]],
        color: cx.color,
        label: cx.label,
      }
    });
    
    var plot = $.plot($placeholder, plotdata, options);
    
    $.each(data, function (i, [x, y]) {
      var
        cx = config.points.get(x),
        o0 = plot.pointOffset({x: 0, y: i}),
        o1 = plot.pointOffset({x: transform(y), y: i}),
        o2 = plot.pointOffset({x: transform(y), y: i - (config.bars.widthRatio * 1)});
      
      var style = {
        top: o1.top.toString() + 'px',
        left: o1.left.toString() + 'px',
        height: (o2.top - o1.top).toString() + 'px',
        lineHeight: (o2.top - o1.top - 4).toString() + 'px',
        paddingTop: '0px',
        paddingBottom: '0px',
        paddingLeft: config.labels.paddingX.toString() + 'px',
        paddingRight: config.labels.paddingX.toString() + 'px',
        overflowX: 'hidden',
      };
      
      $('<div>')
        .addClass('value-label')
        .addClass('value')
        .text(y.toFixed(0))
        .css(style)
        .appendTo($placeholder);
      
      $('<div>')
        .addClass('value-label')
        .addClass('label')
        .text(cx.label)
        .css($.extend({}, style, {
          width: (o1.left - o0.left - 2 * (config.labels.marginX)).toString() + 'px',
          left: (o0.left + config.labels.marginX).toString() + 'px',
          textAlign: config.labels.align,
          color: cx.labelColor,
        }))
        .appendTo($placeholder);
    })
    
    return plot;
  },
  
  plotBarsWithMarkers: function ($placeholder, data, config)
  {
    // Adjust constants to agree with stylesheet ".value-marker" rules!
    var MARKER_HEIGHT_EM = 1.80,
      MARKER_WIDTH_EM = 2.30,
      MARKER_ARROW_HEIGHT_EM = 0.60;
    
    var em_pixels = parseFloat($placeholder.css('font-size')),
      marker_margin = 2, // vertical margin between stacked markers
      marker_outer_height =
        (MARKER_HEIGHT_EM + (MARKER_ARROW_HEIGHT_EM / Math.SQRT2)) * em_pixels + marker_margin,
      marker_outer_width =
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
          'top': off1.top - yoff - marker_outer_height,
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
        min: miny - 0.05 * dy,
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
    var name_comparator = function (a, b) {return a[0].localeCompare(b[0])},
      name_getter = function (v) {return v[0]}, 
      names = null;
    data1.sort(name_comparator);
    data2.sort(name_comparator);
    names = $.map(data1, name_getter);

    var value_getter = function (v) {return v[1]},
      miny1 = Math.min.apply(null, $.map(data1, value_getter)),
      maxy1 = Math.max.apply(null, $.map(data1, value_getter)),
      miny2 = Math.min.apply(null, $.map(data2, value_getter)),
      maxy2 = Math.max.apply(null, $.map(data2, value_getter)),
      miny = Math.min(miny1, miny2),
      maxy = Math.max(maxy1, maxy2),
      dy = maxy - miny;
       
    config = $.extend({
      range: null,
      meta: [{label: 'A'}, {label: 'B'}],
      points: null, 
      legend: 'default',
      yaxis: {},
      bars: {}
    },(config || {}));
    config.range || (config.range = [miny, maxy]);
    config.bars = $.extend({widthRatio: 0.85}, config.bars);
    
    // Build flot options

    var options = {
      series: {
        points: {show: false},
        shadowSize: 0,
        lines: {show: false},
        bars: {show: true, lineWidth: 1, fill: 1.0},
      },
      xaxis: {
        ticks: (config.points instanceof Map)? 
          ($.map(names, function (name, i) {
            var c = config.points.get(name) || {};
            return [[i + (0), (c.label || name).toString()]];
          })):
          ([]),
        tickLength: 0,
        tickColor: plotOptions.defaults.xaxis.tickColor,
        // Note: Autoadjust (set to null) so both bar sides are shown
        min: null, /* 0, */
        max: null, /* data1.length - 1, */
      },
      yaxis: {
        ticks: generateTicks([miny, maxy], 5, config.yaxis.tickUnit),
        tickLength: 0,
        tickColor: plotOptions.defaults.yaxis.tickColor,
        min: miny - 0.05 * dy,
        max: maxy + 0.40 * dy,
      },
      grid: plotOptions.defaults.grid, 
      legend: {show: false},
      bars: {
        barWidth: config.bars.widthRatio,
        horizontal: false,
        fill: 0.95,
      },
    };
    
    (config.legend == 'default') && (options.legend = {
      show: true,
      position: 'ne',
      backgroundOpacity: 0.0,
      noColumns: 2,
      margin: 5,
    });
    
    // Plot
    
    var plotdata = $.map([data1, data2], function (data, i) {
      return {
        data: $.map(data, function (v, i) {return [[i, v[1]]];}),
        color: config.meta[i].labelColor,
        label: config.meta[i].label,
        bars: {align: (i == 0)? 'right' : 'left'},
      };
    });
    
    var plot = $.plot($placeholder, plotdata, options);
    
    // Place legend
    
    switch (config.legend)
    {
      case 'center':
      case 'centre':
      {
        // Adjust constants to agree with stylesheet ".legend-centered" rules! 
        var LEGEND_WIDTH_EM = 16;
        
        var em_pixels = parseFloat($placeholder.css('font-size')),
          legend_width = LEGEND_WIDTH_EM * em_pixels; // px
        
        var $legend = $('<div>')
           .addClass('legend-centered')
           .css({
             width: legend_width,
             top: 8,
             left: ($placeholder.width() - legend_width)/2,
           });
        $legend.appendTo($placeholder);
        
        $.each(plot.getData(), function (i, data) {     
          $legend.append($('<div>')
             .addClass('color-box')
             .text(data.label)
             .css({backgroundColor: data.color}));
        });
        break;
      }
      case 'default':
      default:
      {
        break;
      }
    }
    
    return plot;
  },
};
