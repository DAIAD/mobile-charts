(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var moment = require('moment');

var charts = require('./charts');

var model = require('./model');

charts.b1 = function () {

  var plotOptions = $.extend({}, charts.plotOptions);
  plotOptions.defaults.colors = ['#2D3580'];
  plotOptions.defaults.colormap = new Map([['default', '#2D3580'], ['measured-data', '#2D3580'], ['estimated-data', '#AAAEB1']]);

  var formatLabel = charts.formatLabel;

  return {
    plotForEvent: function plotForEvent($placeholder, data, config) {
      // Expect data that decribe successive events (no timestamps supplied).
      // Assume data is sorted on `id`.

      if (!data || data.length == 0) return null;

      var M = data[0].constructor,
          ry = M.getRange(data),
          miny = ry[0],
          maxy = ry[1],
          dy = maxy - miny,
          minx = data[0].id,
          maxx = data[data.length - 1].id,
          rx = [minx, maxx],
          dx = maxx - minx;

      config = $.extend({
        bars: true,
        xaxis: {},
        yaxis: {},
        barWidth: 0.5 }, config || {});

      config.xaxis.ticks || (config.xaxis.ticks = Math.min(10, data.length));

      var options = {
        series: {
          points: { show: false, radius: 1 },
          shadowSize: 0,
          lines: config.bars ? { show: false } : $.extend({ show: true }, plotOptions.defaults.series.lines, { fill: 0.4 }),
          bars: !config.bars ? { show: false } : $.extend({ show: true }, plotOptions.defaults.series.bars, { barWidth: config.barWidth })
        },
        xaxis: $.extend({}, plotOptions.defaults.xaxis, {
          ticks: charts.generateTicks(rx, config.xaxis.ticks, null, function (x) {
            return x.toFixed(0);
          }, config.bars ? 0.5 * config.barWidth : .0).filter(function (p) {
            return p[0] < maxx + 1;
          }),
          tickLength: 6,
          min: minx - 0,
          max: maxx + 1 }),
        yaxis: $.extend({}, plotOptions.defaults.yaxis, {
          ticks: charts.generateTicks(ry, 4, config.yaxis.tickUnit),
          min: miny - 0.00 * dy,
          max: maxy + 0.10 * dy
        }),
        grid: plotOptions.defaults.grid,
        legend: { show: false }
      };

      return $.plot($placeholder, [{
        data: $.map(data, function (v) {
          return v.value ? [[v.id, v.value]] : null;
        }),
        label: formatLabel(M),
        color: plotOptions.defaults.colors[0]
      }], options);
    },
    plotForTimedEvent: function plotForTimedEvent($placeholder, data, config) {
      // Expect data that describe events marked with time
      // Assume data is sorted on `timestamp`.

      if (!data || data.length == 0) return null;

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

      config = $.extend({ bars: {}, xaxis: {}, yaxis: {} }, config || {});

      var options = {
        series: {
          points: { show: false, radius: 1 },
          shadowSize: 0,
          lines: $.extend({ show: true }, plotOptions.defaults.series.lines, { fill: 0.4 })
        },
        xaxis: $.extend({}, plotOptions.defaults.xaxis, {
          // Display xaxis ticks at multiples of minutes
          ticks: charts.generateTicks(rx, config.xaxis.ticks || 5, 5 * 60 * 1000, function (x) {
            return moment(x).format('hh:mm a');
          }),
          tickLength: 6,
          min: minx,
          max: maxx
        }),
        yaxis: $.extend({}, plotOptions.defaults.yaxis, {
          ticks: charts.generateTicks(ry, 4, config.yaxis.tickUnit),
          min: miny - 0.00 * dy,
          max: maxy + 0.10 * dy
        }),
        grid: plotOptions.defaults.grid,
        legend: { show: false }
      };

      return $.plot($placeholder, [{
        data: $.map(data, function (v) {
          return v.value ? [[v.timestamp.getTime(), v.value]] : null;
        }),
        label: formatLabel(M),
        color: plotOptions.defaults.colors[0]
      }], options);
    },
    plotForDay: function plotForDay($placeholder, data, config) {
      // Todo
    },
    plotForWeek: function plotForWeek($placeholder, data1, data2, config) {
      // Note:
      // param data1: measured (aka realtime) data
      // param data2: estimated data

      var n1 = data1 && data1.length ? data1.length : 0,
          n2 = data2 && data2.length ? data2.length : 0;

      if (!(n1 > 0 || n2 > 0)) return null;

      var M1 = n1 > 0 ? data1[0].constructor : null,
          M2 = n2 > 0 ? data2[0].constructor : null,
          ry1 = M1.getRange(data1),
          ry2 = M2.getRange(data2),
          miny = Math.min(ry1[0], ry2[0]),
          maxy = Math.max(ry1[1], ry2[1]),
          ry = [miny, maxy],
          dy = maxy - miny,
          n = Math.max(n1, n2);

      config = $.extend({ bars: {}, xaxis: {}, yaxis: {} }, config || {});
      var resolution = config.resolution || 1; // days
      var bar_width_ratio = config.bars.widthRatio || 0.6; // as part of bucket 

      var options = {
        series: {
          points: { show: false },
          shadowSize: 0,
          lines: { show: false },
          bars: $.extend({ show: true }, plotOptions.defaults.series.bars)
        },
        xaxis: $.extend({}, plotOptions.defaults.xaxis, {
          ticks: $.map(data1, function (v, i) {
            var t = v.timestamp.getTime(),
                tm = config.locale ? moment(t).locale(config.locale) : moment(t);
            return [[v.id + bar_width_ratio / 2.0, tm.format('dd')]];
          }),
          min: 0,
          max: n
        }),
        yaxis: $.extend({}, plotOptions.defaults.yaxis, {
          ticks: charts.generateTicks(ry, 4, config.yaxis.tickUnit),
          min: miny - 0.00 * dy,
          max: maxy + 0.10 * dy
        }),
        grid: plotOptions.defaults.grid,
        legend: { show: false, position: 'ne' },
        bars: $.extend({}, plotOptions.defaults.bars, { barWidth: bar_width_ratio })
      };

      var plotdata = [];

      if (n1 > 0) {
        var points1 = $.map(data1, function (m, i) {
          return [[i, m.value]];
        });
        plotdata.push({
          data: points1,
          label: formatLabel(M1),
          color: plotOptions.defaults.colormap.get('measured-data')
        });
      }
      // Plot successive data points in data2 (same value, interpolated between 
      // data points of data1) as 1 continous bar
      if (n2 > 0) {
        var points2 = [],
            i = 0;
        while (i < n2) {
          if (data2[i].value == null) {
            i++;
            continue;
          }
          // Compute span of this data2 value (until next non-null value of data1)
          var j = i + 1,
              span = null;
          while (j < n1 && data1[j].value == null) {
            j++;
          }span = j == n1 ? n2 - i : j - i;
          plotdata.push({
            data: [[i, data2[i].value]],
            label: formatLabel(M2),
            color: plotOptions.defaults.colormap.get('estimated-data'),
            bars: { barWidth: bar_width_ratio + span - 1 }
          });
          i = j;
        }
      }

      return $.plot($placeholder, plotdata, options);
    },
    plotForMonth: function plotForMonth($placeholder, data, config) {
      if (!data || data.length == 0) return null;

      var M = data[0].constructor;
      var ry = M.getRange(data);
      var miny = ry[0],
          maxy = ry[1],
          dy = maxy - miny;

      config = $.extend({ bars: {}, xaxis: {}, yaxis: {} }, config || {});
      var resolution = config.resolution || 1; // days

      var options = {
        series: {
          points: $.extend({ show: true }, plotOptions.defaults.series.points),
          shadowSize: 0,
          lines: $.extend({ show: true }, plotOptions.defaults.series.lines, { fill: 0.4 })
        },
        xaxis: $.extend({}, plotOptions.defaults.xaxis, {
          // Generate a tick for the beggining of each week 
          ticks: $.map(new Array(charts.WEEKS_IN_MONTH - 1), function (_, k) {
            var x = (k + 1) * 7 / resolution;
            return [[x, (config.weekLabel || 'week') + ' ' + (k + 1).toString()]];
          }),
          min: 0,
          max: data.length
        }),
        yaxis: $.extend({}, plotOptions.defaults.yaxis, {
          ticks: charts.generateTicks(ry, 4, config.yaxis.tickUnit),
          min: miny - 0.00 * dy,
          max: maxy + 0.10 * dy
        }),
        grid: plotOptions.defaults.grid,
        legend: { show: false }
      };

      return $.plot($placeholder, [{
        data: $.map(data, function (v) {
          return v.value ? [[v.id, v.value]] : null;
        }),
        label: formatLabel(M),
        color: plotOptions.defaults.colors[0]
      }], options);
    },
    plotForYear: function plotForYear($placeholder, data, config) {
      if (!data || data.length == 0) return null;

      var M = data[0].constructor;
      var ry = M.getRange(data);
      var miny = ry[0],
          maxy = ry[1],
          dy = maxy - miny;

      config = $.extend({ bars: {}, xaxis: {}, yaxis: {} }, config || {});
      var resolution = config.resolution || 1; // months
      var month_names = moment.monthsShort();

      var options = {
        series: {
          points: $.extend({ show: true }, plotOptions.defaults.series.points),
          shadowSize: 0,
          lines: $.extend({ show: true }, plotOptions.defaults.series.lines, { fill: 0.4 })
        },
        xaxis: $.extend({}, plotOptions.defaults.xaxis, {
          ticks: $.map(data, function (v, i) {
            return [[v.id, month_names[i * resolution]]];
          }),
          min: 0,
          max: data.length
        }),
        yaxis: $.extend({}, plotOptions.defaults.yaxis, {
          ticks: charts.generateTicks(ry, 4, config.yaxis.tickUnit),
          min: miny - 0.00 * dy,
          max: maxy + 0.10 * dy
        }),
        grid: plotOptions.defaults.grid,
        legend: { show: false }

      };

      return $.plot($placeholder, [{
        data: $.map(data, function (v) {
          return v.value ? [[v.id, v.value]] : null;
        }),
        label: formatLabel(M),
        color: plotOptions.defaults.colors[0]
      }], options);
    }
  };
}();

module.exports = charts.b1;

},{"./charts":2,"./model":7,"moment":"moment"}],2:[function(require,module,exports){
'use strict';

var daiad = require('./index');

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
          radius: 2
        },
        shadowSize: 0,
        lines: {
          lineWidth: 1
        },
        bars: {
          lineWidth: 1,
          fill: 0.8
        }
      },
      bars: {
        align: 'left',
        horizontal: false
      },
      xaxis: {
        tickLength: 0,
        tickColor: '#bbb'
      },
      yaxis: {
        tickLength: 0,
        tickColor: '#bbb'
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
        }
      }
    }
  },

  //
  // Utilities
  //

  formatLabel: function formatLabel(M, level) {
    var s = M.value.title + ' (' + M.value.unit + ')';
    if (level && level.description) s += ' (' + level.description + ')';
    return s;
  },

  filterForData: function filterForData(level) {
    var y0 = level.range[0],
        y1 = level.range[1];
    return function (m) {
      return m.value != null && m.value >= y0 && m.value < y1 ? [[m.id, m.value]] : null;
    };
  },

  getDefaultLevel: function getDefaultLevel(y0, y1, color) {
    return { range: [y0, y1 + 1], color: color };
  },

  generateTicks: function generateTicks(r, n, m, formatter, offset) {
    // Generate approx n ticks in range r. Use only multiples of m.
    var dx = r[1] - r[0],
        step,
        x0,
        n1;

    // Compute m, if missing
    if (!m) {
      // Estimate order of magnitude using maximum value
      var e1 = Math.floor(Math.log10(Math.abs(r[1])));
      m = Math.pow(10, e1);
      // Check if this choice yields too few (<n-2) ticks
      if (dx > 0) {
        while (dx < (n - 2) * Math.ceil(dx / (n * m)) * m) {
          m = 0.1 * m;
        }
      }
    }

    console.debug('generateTicks: Using m=' + m);

    // Compute x0, step, n1 (actual number of ticks)
    if (dx > 0) {
      step = Math.ceil(dx / (n * m)) * m;
      x0 = Math.floor(r[0] / m) * m;
      n1 = r[1] - x0 < n * step ? n + 1 : n + 2;
    } else {
      step = Math.max(Math.floor(r[0] * 0.2 / m), 1) * m;
      x0 = Math.floor(r[0] / m) * m;
      n1 = 2;
    }

    if (!formatter) formatter = function formatter(x, i, step) {
      var precision = Number.isInteger(x) ? 0 : 1;
      return x.toFixed(precision);
    };

    offset = offset == null ? 0 : Number(offset);

    return $.map(new Array(n1), function (_, i) {
      var x = x0 + i * step;
      return [[x + offset, formatter.call(null, x, i, step)]];
    });
  }

});

module.exports = daiad.charts;

},{"./index":4}],3:[function(require,module,exports){
'use strict';

var charts = require('./charts');

charts.comparison = function () {

  var plotOptions = $.extend({}, charts.plotOptions);
  plotOptions.defaults.colors = ['#2D3580'];
  plotOptions.defaults.grid.margin = {
    top: 15, bottom: 10, left: 25, right: 25
  };

  var generateTicks = charts.generateTicks;

  return {
    plotBarsWithLabels: function plotBarsWithLabels($placeholder, data, config) {
      var LABEL_X_MARGIN = 8,
          LABEL_X_PADDING = 8;

      var value_getter = function value_getter(v) {
        return v[1];
      },
          miny = Math.min.apply(null, $.map(data, value_getter)),
          maxy = Math.max.apply(null, $.map(data, value_getter)),
          dy = maxy - miny;

      config = $.extend({ points: {}, labels: {}, bars: {} }, config || {});
      config.labels = $.extend({
        paddingX: LABEL_X_PADDING,
        marginX: LABEL_X_MARGIN,
        align: 'right'
      }, config.labels);
      config.bars = $.extend({ widthRatio: 0.85 }, config.bars);

      var options = {
        series: {
          points: { show: false },
          shadowSize: 0,
          lines: { show: false },
          bars: { show: true, lineWidth: 1, fill: 0.9 }
        },
        xaxis: {
          ticks: [],
          // We plot horizontally, so these boundaries are for X axis!
          //min: miny,
          max: maxy + 0.40 * dy
        },
        yaxis: {
          ticks: []
        },
        grid: plotOptions.defaults.grid,
        legend: { show: false },
        bars: {
          barWidth: config.bars.widthRatio,
          align: 'right',
          horizontal: true
        }
      };

      var plotdata = $.map(data, function (v, i) {
        var x = v[0],
            y = v[1],
            cx = config.points.get(x);
        return {
          data: [[y, i]],
          color: cx.color,
          label: cx.label
        };
      });

      var plot = $.plot($placeholder, plotdata, options);

      $.each(data, function (i, v) {
        var x = v[0],
            y = v[1],
            cx = config.points.get(x),
            o0 = plot.pointOffset({ x: 0, y: i }),
            o1 = plot.pointOffset({ x: y, y: i }),
            o2 = plot.pointOffset({ x: y, y: i - config.bars.widthRatio * 1 });

        var style_settings = {
          'top': o1.top.toString() + 'px',
          'left': o1.left.toString() + 'px',
          'height': (o2.top - o1.top).toString() + 'px',
          'line-height': (o2.top - o1.top - 4).toString() + 'px',
          'padding-left': config.labels.paddingX.toString() + 'px',
          'padding-right': config.labels.paddingX.toString() + 'px'
        };

        $('<div>').addClass('value-label').addClass('value').text(y.toFixed(0)).css(style_settings).appendTo($placeholder);

        $('<div>').addClass('value-label').addClass('label').text(cx.label).css($.extend({}, style_settings, {
          'width': (o1.left - o0.left - 2 * (config.labels.marginX + config.labels.paddingX)).toString() + 'px',
          'left': (o0.left + config.labels.marginX).toString() + 'px',
          'text-align': config.labels.align,
          'color': cx.labelColor
        })).appendTo($placeholder);
      });

      return plot;
    },
    plotBarsWithMarkers: function plotBarsWithMarkers($placeholder, data, config) {
      // Adjust constants to agree with stylesheet ".value-marker" rules!
      var MARKER_HEIGHT_EM = 1.80,
          MARKER_WIDTH_EM = 2.30,
          MARKER_ARROW_HEIGHT_EM = 0.60;

      var em_pixels = parseFloat($placeholder.css('font-size')),
          marker_margin = 2,
          // vertical margin between stacked markers
      marker_outer_height = (MARKER_HEIGHT_EM + MARKER_ARROW_HEIGHT_EM / Math.SQRT2) * em_pixels + marker_margin,
          marker_outer_width = MARKER_WIDTH_EM * em_pixels;

      config = $.extend({
        range: [1, 10], // expected range of values
        points: {}, // configure marked points (see example.html)
        bars: {},
        numSteps: 10 }, config || {});
      config.bars = $.extend({
        color: '#BBB',
        widthRatio: 0.25
      }, config.bars);
      config.bars.widthRatio = Math.min(config.bars.widthRatio, 0.50);

      // Configure the linear scale, define a linear function for it
      var miny = config.range[0],
          maxy = config.range[1],
          N = config.numSteps;
      var dy = maxy - miny,
          ty = dy / (N - 1),
          f = function f(i) {
        return miny + ty * (i - 1);
      },
          invf = function invf(y) {
        return 1 + (y - miny) / ty;
      };

      // A helper for creating a marker element
      var make_marker = function make_marker(plot, point, yoff) {
        var off1 = plot.pointOffset({ x: point[0], y: point[1] });
        yoff || (yoff = 0); // additional y-offset (markers may overlap)
        return $('<div>').addClass('value-marker').css({
          'top': off1.top - yoff - marker_outer_height,
          'left': off1.left - marker_outer_width / 2.0
        });
      };

      // Find (rounded) x for every marked y
      var marked_data = $.map(data, function (v, i) {
        var y = v[1],
            x = null;
        if (y > maxy || y < miny) x = null; // skip this point
        else x = Math.round(invf(y)); // round to an integer in [1 .. N]
        return { x: x, y: x ? f(x) : null, key: v[0] };
      });

      var options = {
        series: {
          points: { show: false },
          shadowSize: 0,
          lines: { show: false },
          bars: { show: true, lineWidth: 1, fill: 1.0 }
        },
        xaxis: {
          ticks: []
        },
        yaxis: {
          ticks: [],
          min: miny - 0.05 * dy,
          max: maxy + 0.40 * dy
        },
        grid: plotOptions.defaults.grid,
        legend: { show: false },
        bars: {
          barWidth: config.bars.widthRatio,
          align: 'center',
          horizontal: false
        }
      };

      // Plot 

      var plotdata = [{
        // Generate data from the linear function
        data: $.map(new Array(N), function (_, i) {
          return [[i + 1, f(i + 1)]];
        }),
        color: config.bars.color
      }];

      plotdata.push.apply(plotdata, $.map(marked_data, function (v, i) {
        // A seperate series for each marked point
        var cx = config.points.get(v.key) || {};
        return {
          data: [[v.x, v.y]],
          color: cx.color,
          bars: { barWidth: 1.4 * config.bars.widthRatio }
        };
      }));

      var plot1 = $.plot($placeholder, plotdata, options);

      // Place markers

      var count_markers = new Array(N).fill(0);

      $.each(marked_data, function (i, v) {
        if (v.x == null) return; // skip out-of-range points

        var cx = config.points.get(v.key) || {},
            yoff = count_markers[v.x] * marker_outer_height;
        count_markers[v.x]++; // stack markers

        var $marker = make_marker(plot1, [v.x, v.y], yoff).text(cx.label || v.key).css({
          'color': cx.labelColor,
          'background-color': cx.color,
          'border-color': cx.color
        });
        plot1.getPlaceholder().append($marker);
      });

      return plot1;
    },
    plotBarsAsPairs: function plotBarsAsPairs($placeholder, data1, data2, config) {
      var name_comparator = function name_comparator(a, b) {
        return a[0].localeCompare(b[0]);
      },
          name_getter = function name_getter(v) {
        return v[0];
      },
          names = null;
      data1.sort(name_comparator);
      data2.sort(name_comparator);
      names = $.map(data1, name_getter);

      var value_getter = function value_getter(v) {
        return v[1];
      },
          miny1 = Math.min.apply(null, $.map(data1, value_getter)),
          maxy1 = Math.max.apply(null, $.map(data1, value_getter)),
          miny2 = Math.min.apply(null, $.map(data2, value_getter)),
          maxy2 = Math.max.apply(null, $.map(data2, value_getter)),
          miny = Math.min(miny1, miny2),
          maxy = Math.max(maxy1, maxy2),
          dy = maxy - miny;

      config = $.extend({
        range: null,
        meta: [{ label: 'A' }, { label: 'B' }],
        points: null,
        legend: 'default',
        yaxis: {},
        bars: {}
      }, config || {});
      config.range || (config.range = [miny, maxy]);
      config.bars = $.extend({ widthRatio: 0.85 }, config.bars);

      // Build flot options

      var options = {
        series: {
          points: { show: false },
          shadowSize: 0,
          lines: { show: false },
          bars: { show: true, lineWidth: 1, fill: 1.0 }
        },
        xaxis: {
          ticks: config.points instanceof Map ? $.map(names, function (name, i) {
            var c = config.points.get(name) || {};
            return [[i + 0, (c.label || name).toString()]];
          }) : [],
          tickLength: 0,
          tickColor: plotOptions.defaults.xaxis.tickColor,
          // Note: Autoadjust (set to null) so both bar sides are shown
          min: null, /* 0, */
          max: null },
        yaxis: {
          ticks: generateTicks([miny, maxy], 5, config.yaxis.tickUnit),
          tickLength: 0,
          tickColor: plotOptions.defaults.yaxis.tickColor,
          min: miny - 0.05 * dy,
          max: maxy + 0.40 * dy
        },
        grid: plotOptions.defaults.grid,
        legend: { show: false },
        bars: {
          barWidth: config.bars.widthRatio,
          horizontal: false,
          fill: 0.95
        }
      };

      config.legend == 'default' && (options.legend = {
        show: true,
        position: 'ne',
        backgroundOpacity: 0.0,
        noColumns: 2,
        margin: 5
      });

      // Plot

      var plotdata = $.map([data1, data2], function (data, i) {
        return {
          data: $.map(data, function (v, i) {
            return [[i, v[1]]];
          }),
          color: config.meta[i].labelColor,
          label: config.meta[i].label,
          bars: { align: i == 0 ? 'right' : 'left' }
        };
      });

      var plot = $.plot($placeholder, plotdata, options);

      // Place legend

      switch (config.legend) {
        case 'center':
        case 'centre':
          {
            // Adjust constants to agree with stylesheet ".legend-centered" rules! 
            var LEGEND_WIDTH_EM = 16;

            var em_pixels = parseFloat($placeholder.css('font-size')),
                legend_width = LEGEND_WIDTH_EM * em_pixels; // px

            var $legend = $('<div>').addClass('legend-centered').css({
              width: legend_width,
              top: 8,
              left: ($placeholder.width() - legend_width) / 2
            });
            $legend.appendTo($placeholder);

            $.each(plot.getData(), function (i, data) {
              $legend.append($('<div>').addClass('color-box').text(data.label).css({ backgroundColor: data.color }));
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
    }
  };
}();

},{"./charts":2}],4:[function(require,module,exports){
'use strict';

module.exports = {
  VERSION: '0.1dev'
};

},{}],5:[function(require,module,exports){
(function (global){
'use strict';

var daiad = require('./index');

require('./model');

require('./meter-charts');
require('./b1-charts');
require('./comparison-charts');

module.exports = daiad;

global.daiad = daiad;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./b1-charts":1,"./comparison-charts":3,"./index":4,"./meter-charts":6,"./model":7}],6:[function(require,module,exports){
'use strict';

var moment = require('moment');

var charts = require('./charts');

var model = require('./model');

charts.meter = function () {

  var plotOptions = $.extend({}, charts.plotOptions);
  plotOptions.defaults.colors = ['#2D3580'];

  var formatLabel = charts.formatLabel,
      filterForData = charts.filterForData;

  function getDefaultLevel(y0, y1) {
    return charts.getDefaultLevel(y0, y1, plotOptions.defaults.colors[0]);
  };

  return {
    plotForDay: function plotForDay($placeholder, data, config) {
      if (!data || data.length == 0) return null;

      var M = data[0].constructor;
      var ry = M.getRange(data);
      var miny = ry[0],
          maxy = ry[1],
          dy = maxy - miny;

      config = $.extend({ bars: {}, xaxis: {}, yaxis: {} }, config || {});
      var resolution = config.resolution || 1; // hours
      var bar_width_ratio = config.bars.widthRatio || 0.6; // as part of bucket 
      var tick_size = config.xaxis.tickSize || 4; // 1 tick every tick_size datapoints

      var options = {
        series: {
          points: { show: false },
          shadowSize: 0,
          lines: { show: false },
          bars: $.extend({ show: true }, plotOptions.defaults.series.bars)
        },
        xaxis: $.extend({}, plotOptions.defaults.xaxis, {
          ticks: $.map(data, function (v, i) {
            var t = v.timestamp.getTime(),
                tm = config.locale ? moment(t).locale(config.locale) : moment(t);
            return i % tick_size == 0 ? [[v.id + bar_width_ratio / 2.0, tm.format('ha')]] : null;
          }),
          min: 0,
          max: data.length
        }),
        yaxis: $.extend({}, plotOptions.defaults.yaxis, {
          ticks: charts.generateTicks(ry, 4, config.yaxis.tickUnit),
          min: miny - 0.00 * dy,
          max: maxy + 0.10 * dy
        }),
        grid: plotOptions.defaults.grid,
        legend: { show: false, position: 'ne' },
        bars: $.extend({}, plotOptions.defaults.bars, { barWidth: bar_width_ratio })
      };

      var levels = config.levels || [getDefaultLevel(miny, maxy)];
      var plotdata = $.map(levels, function (level, i) {
        return {
          data: $.map(data, filterForData(level)),
          label: formatLabel(M, level),
          color: level.color
        };
      });
      return $.plot($placeholder, plotdata, options);
    },

    plotForWeek: function plotForWeek($placeholder, data, config) {
      if (!data || data.length == 0) return null;

      var M = data[0].constructor;
      var ry = M.getRange(data);
      var miny = ry[0],
          maxy = ry[1],
          dy = maxy - miny;

      config = $.extend({ bars: {}, xaxis: {}, yaxis: {} }, config || {});
      var resolution = config.resolution || 1; // days
      var bar_width_ratio = config.bars.widthRatio || 0.6; // as part of bucket 

      var options = {
        series: {
          points: { show: false },
          shadowSize: 0,
          lines: { show: false },
          bars: $.extend({ show: true }, plotOptions.defaults.series.bars)
        },
        xaxis: $.extend({}, plotOptions.defaults.xaxis, {
          ticks: $.map(data, function (v, i) {
            var t = v.timestamp.getTime(),
                tm = config.locale ? moment(t).locale(config.locale) : moment(t);
            return [[v.id + bar_width_ratio / 2.0, tm.format('dd')]];
          }),
          min: 0,
          max: data.length
        }),
        yaxis: $.extend({}, plotOptions.defaults.yaxis, {
          ticks: charts.generateTicks(ry, 4, config.yaxis.tickUnit),
          min: miny - 0.00 * dy,
          max: maxy + 0.10 * dy
        }),
        grid: plotOptions.defaults.grid,
        legend: { show: false, position: 'ne' },
        bars: $.extend({}, plotOptions.defaults.bars, { barWidth: bar_width_ratio })
      };

      var levels = config.levels || [getDefaultLevel(miny, maxy)];
      var plotdata = $.map(levels, function (level, i) {
        return {
          data: $.map(data, filterForData(level)),
          label: formatLabel(M, level),
          color: level.color
        };
      });
      return $.plot($placeholder, plotdata, options);
    },

    plotForMonth: function plotForMonth($placeholder, data, config) {
      if (!data || data.length == 0) return null;

      var M = data[0].constructor;
      var ry = M.getRange(data);
      var miny = ry[0],
          maxy = ry[1],
          dy = maxy - miny;

      config = $.extend({ bars: {}, xaxis: {}, yaxis: {} }, config || {});
      var resolution = config.resolution || 1; // days

      var options = {
        series: {
          points: $.extend({ show: true }, plotOptions.defaults.series.points),
          shadowSize: 0,
          lines: $.extend({ show: true }, plotOptions.defaults.series.lines, { fill: 0.4 })
        },
        xaxis: $.extend({}, plotOptions.defaults.xaxis, {
          // Generate a tick for the beggining of each week 
          ticks: $.map(new Array(charts.WEEKS_IN_MONTH - 1), function (_, k) {
            var x = (k + 1) * 7 / resolution;
            return [[x, (config.weekLabel || 'week') + ' ' + (k + 1).toString()]];
          }),
          min: 0,
          max: data.length
        }),
        yaxis: $.extend({}, plotOptions.defaults.yaxis, {
          ticks: charts.generateTicks(ry, 4, config.yaxis.tickUnit),
          min: miny - 0.00 * dy,
          max: maxy + 0.10 * dy
        }),
        grid: plotOptions.defaults.grid,
        legend: { show: false }
      };

      return $.plot($placeholder, [{
        data: $.map(data, function (v) {
          return v.value ? [[v.id, v.value]] : null;
        }),
        label: formatLabel(M),
        color: plotOptions.defaults.colors[0]
      }], options);
    },

    plotForYear: function plotForYear($placeholder, data, config) {
      if (!data || data.length == 0) return null;

      var M = data[0].constructor;
      var ry = M.getRange(data);
      var miny = ry[0],
          maxy = ry[1],
          dy = maxy - miny;

      config = $.extend({ bars: {}, xaxis: {}, yaxis: {} }, config || {});
      var resolution = config.resolution || 1; // months
      var month_names = moment.monthsShort();

      var options = {
        series: {
          points: $.extend({ show: true }, plotOptions.defaults.series.points),
          shadowSize: 0,
          lines: $.extend({ show: true }, plotOptions.defaults.series.lines, { fill: 0.4 })
        },
        xaxis: $.extend({}, plotOptions.defaults.xaxis, {
          ticks: $.map(data, function (v, i) {
            return [[v.id, month_names[i * resolution]]];
          }),
          min: 0,
          max: data.length
        }),
        yaxis: $.extend({}, plotOptions.defaults.yaxis, {
          ticks: charts.generateTicks(ry, 4, config.yaxis.tickUnit),
          min: miny - 0.00 * dy,
          max: maxy + 0.10 * dy
        }),
        grid: plotOptions.defaults.grid,
        legend: { show: false }

      };

      return $.plot($placeholder, [{
        data: $.map(data, function (v) {
          return v.value ? [[v.id, v.value]] : null;
        }),
        label: formatLabel(M),
        color: plotOptions.defaults.colors[0]
      }], options);
    }
  };
}();

module.exports = charts.meter;

},{"./charts":2,"./model":7,"moment":"moment"}],7:[function(require,module,exports){
'use strict';

var daiad = require('./index');

daiad.model || (daiad.model = {});

// Measurements

$.extend(daiad.model, function () {

  //
  // Measurement
  //

  function Measurement(id, timestamp, value) {
    if (!(timestamp instanceof Date)) {
      throw new Error('Expected a instance of Date as timestamp');
    }
    this.id = parseInt(id);
    this.timestamp = timestamp;
    this.value = value == null ? null : parseFloat(value);
    return this;
  }

  Measurement.prototype.getValue = function (precision) {
    return this.value.toFixed(precision || 2) + ' (' + this.constructor.value.unit.toString() + ')';
  };

  var value_getter = function value_getter(m) {
    return m.value;
  };

  $.extend(Measurement, {
    //
    // Class attributes
    //

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

    //
    // Class methods
    //

    // Compute the range for a series
    computeRange: function computeRange(data) {
      if (!(data && data.length > 0)) return [-Infinity, +Infinity];
      var miny = Math.min.apply(null, $.map(data, value_getter)),
          maxy = Math.max.apply(null, $.map(data, value_getter));
      return [miny, maxy];
    },

    // Compute the range [0, M] for a series of positive values
    computePositiveRange: function computePositiveRange(data) {
      if (!(data && data.length > 0)) return [.0, +Infinity];
      var maxy = Math.max.apply(null, $.map(data, value_getter));

      if (!(maxy > 0)) console.warn('Expected positive maximum value (' + maxy + ')');
      return [.0, maxy];
    }
  });

  // Set default method for getting the range of values (override in "derived" objects)
  Measurement.getRange = Measurement.computePositiveRange;

  //
  // EnergyMeasurement
  //

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
    }
  });

  //
  // Export model
  //

  return {
    Measurement: Measurement,
    EnergyMeasurement: EnergyMeasurement
  };
}());

module.exports = daiad.model;

},{"./index":4}]},{},[5]);
