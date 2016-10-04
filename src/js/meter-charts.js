var moment = require('moment');

var charts = require('./charts')

var model = require('./model')

charts.meter = (function () {
  
  var plotOptions = $.extend(true, {}, charts.plotOptions, {
    defaults: {
      colors: ['#2D3580', '#C53A3A', '#1DA809'],
    }
  });

  var filterForData = function (level)
  {
    var [y0, y1] = level.range;
    return (v) => (
      (v.value != null) && (v.value >= y0) && (v.value < y1)
    );
  };

  var computeDataRange = function (series) {
    return series.reduce(([y0, y1], s, i) => {
      var values = s.data.map(t => t.value);
      return [
        Math.min(y0, Math.min.apply(null, values)),
        Math.max(y1, Math.max.apply(null, values)),
      ];
    }, [+Infinity, -Infinity]);
  };

  var computeTimeRange = function (series) {
    return series.reduce(([t0, t1], s, i) => {
      return [
        Math.min(t0, s.data[0].timestamp.getTime()),
        Math.max(t1, s.data[s.data.length - 1].timestamp.getTime()),
      ];
    }, [+Infinity, 0]);
  };

  var computeStep = function (series) {
    // The step for this collection of series is the minimum step
    return Math.min.apply(null, series.map(s => {
      // Compute step for this series (must be uniform!)
      var steps = s.data.map((p, i, data) => (
        (i > 0)? (data[i].timestamp - data[i - 1].timestamp) : null
      ));
      return Math.min.apply(null, steps.slice(1));
    })); 
  };

  var plotAsBars = function ($placeholder, series, granularity='auto', config={})
  {
    if (!series || series.length == 0)
      return null;
    
    var data0 = series[0].data; // pilot data
    var M = data0[0].constructor; // class of measurements
    var [miny, maxy] = computeDataRange(series); 
    var [ts, te] = computeTimeRange(series); 
    var step = computeStep(series);
 
    config = $.extend(
      true, //deep
      {
        bars: {
          widthRatio: 0.50, // as part of bucket
        }, 
        xaxis: {}, 
        yaxis: {},
      }, 
      config
    );
    
    var {xaxis: {tickSize, tickFilter, formatter: formatTime}} = config;
   
    var getPoint = (granularity == 'auto')? 
      (p) => ([moment(p.timestamp).diff(ts) / step, p.timestamp, p.value]):
      (p) => ([moment(p.timestamp).diff(ts, granularity), p.timestamp, p.value]);
    
    var getDataPoint = (p) => {
      var [x, t, y] = getPoint(p);
      return [x, y];
    };

    var maxx = (granularity == 'auto')?
      (moment(te).diff(ts) / step):
      (moment(te).diff(ts, granularity));

    // Compute ticks on X axis
    
    var tickPoints = data0;
    if ($.isNumeric(tickSize) && tickSize > 1)
      tickPoints = data0.filter((v, i) => (i % tickSize == 0));
    else if ($.isFunction(tickFilter))
      tickPoints = data0.filter((v) => tickFilter(v.timestamp));
    tickPoints = tickPoints.map(getPoint);

    // Center tick position when flot-orderBars is not engaged
    var tickOffset = (series.length == 1)? (config.bars.widthRatio * 0.5) : 0.0;

    // Compute Flot options
    
    var options = {
      series: {
        points: {show: false},
        shadowSize: 0,
        lines: {show: false},
        bars: $.extend({show: true}, plotOptions.defaults.series.bars),
      },
      xaxis: $.extend({}, plotOptions.defaults.xaxis, {
        ticks: tickPoints
          .map(([x, t, y]) => ([x + tickOffset, formatTime(t)])),
        min: null, // let Flot compute it, so that 1st bar shows up
        max: maxx + 1,
      }),
      yaxis: $.extend({}, plotOptions.defaults.yaxis, {
        ticks: charts.generateTicks([.0, maxy], 4, config.yaxis.tickUnit),
        min: .0,
        max: maxy + 0.20 * (maxy - miny),
      }),
      grid: plotOptions.defaults.grid,
      legend: {
        show: false, 
        position: 'ne'
      },
      bars: $.extend({}, plotOptions.defaults.bars, {
        barWidth: config.bars.widthRatio / series.length
      }),
    };
   
    // Transform to series data understood by Flot 
    // Order bars (flot-orderBars plugin) by their series number
    
    series = series.map((s, i) => {
      if ($.isArray(s.levels))
        return s.levels.map((level) => ({
          data: s.data.filter(filterForData(level)).map(getDataPoint),
          label: M.formatLabel() + ' (' + level.description + ')',
          color: level.color,
          bars: {order: i},
        }));
      else
        return {
          data: s.data.map(getDataPoint),
          label: M.formatLabel(),
          color: s.color || plotOptions.defaults.colors[i],
          bars: {order: i},
        };
    });

    // Flatten by 1 level
    series = [].concat(...series);
    
    return $.plot($placeholder, series, options);
  };

  var plotAsLines = function ($placeholder, series, granularity='auto', config={})
  {
    if (!series || series.length == 0)
      return null;

    var data0 = series[0].data; // pilot data
    var M = data0[0].constructor; // class of measurements
    var [miny, maxy] = computeDataRange(series); 
    var [ts, te] = computeTimeRange(series); 
    var step = computeStep(series);
 
    config = $.extend(
      true, //deep
      {
        xaxis: {}, 
        yaxis: {},
        lines: {fill: null},
      }, 
      config
    );
      
    var {xaxis: {tickSize, tickFilter, formatter: formatTime}} = config;
    
    var getPoint = (granularity == 'auto')? 
      (p) => ([moment(p.timestamp).diff(ts) / step, p.timestamp, p.value]):
      (p) => ([moment(p.timestamp).diff(ts, granularity), p.timestamp, p.value]);
    
    var getDataPoint = (p) => {
      var [x, t, y] = getPoint(p);
      return [x, y];
    };

    var maxx = (granularity == 'auto')?
      (moment(te).diff(ts) / step):
      (moment(te).diff(ts, granularity));

    //Compute ticks on X axis
    
    var tickPoints = data0; 
    if ($.isNumeric(tickSize) && tickSize > 1)
      tickPoints = data0.filter((v, i) => (i % tickSize == 0));
    else if ($.isFunction(tickFilter))
      tickPoints = data0.filter((v) => tickFilter(v.timestamp));
    tickPoints = tickPoints.map(getPoint);
    
    // Compute Flot options
    
    var options = {
      series: {
        points: $.extend({}, plotOptions.defaults.series.points, {
          show: true,
        }),
        shadowSize: 0,
        lines: $.extend({}, plotOptions.defaults.series.lines, {
          show: true,
        }),
      },
      xaxis: $.extend({}, plotOptions.defaults.xaxis, {
        ticks: tickPoints
          .map(([x, t, y]) => ([x, formatTime(t)])),
        min: 0,
        max: maxx + 1,
      }),
      yaxis: $.extend({}, plotOptions.defaults.yaxis, {
        ticks: charts.generateTicks([.0, maxy], 4, config.yaxis.tickUnit),
        min: .0,
        max: maxy + 0.20 * (maxy - miny),
      }),
      grid: plotOptions.defaults.grid,
      legend: {show: false},
    };
      
    // Transform series to the shape undestood by Flot
    series = series.map((s, i) => ({
      data: s.data.filter(t => t.value).map(getDataPoint),
      label: M.formatLabel(),
      color: s.color || plotOptions.defaults.colors[i],
      lines: {
        fill: s.fill === undefined?  config.lines.fill : s.fill,  
      },
    }));
      
    return $.plot($placeholder, series, options);
  };
  
  return {
    
    plotForDay: function ($placeholder, series, config={}, locale=null)
    {
      var formatter = locale?
        (t) => (moment(t).locale(locale).format('ha')):
        (t) => (moment(t).format('ha'));
 
      var granularity = 'hour';

      config = $.extend(
        true,
        {
          bars: {
            widthRatio: 0.50,
          },
          xaxis: {
            tickSize: 4, // 1 tick every tickSize datapoints (hours)
            formatter,
          },
        },
        config
      );

      return plotAsBars($placeholder, series, granularity, config); 
    },
    
    plotForWeek: function ($placeholder, series, config, locale=null) 
    {
      var formatter = locale?
        (t) => (moment(t).locale(locale).format('dd')):
        (t) => (moment(t).format('dd'));
      
      var granularity = 'day';

      config = $.extend(
        true,
        {
          bars: {
            widthRatio: 0.50,
          },
          xaxis: {
            tickSize: 1, // 1 tick every tickSize datapoints (days)
            formatter,
          },
        },
        config
      );

      return plotAsBars($placeholder, series, granularity, config);
    },

    plotForMonth: function ($placeholder, series, config, locale=null)
    {
      var formatter = locale?
        (t) => (moment(t).locale(locale).format('dd D MMM')):
        (t) => (moment(t).format('dd D MMM'));
      
      var tickFilter = (t) => (
        moment(t).diff(moment(t).startOf('isoweek'), 'day') == 0
      );
      
      var granularity = 'day';
      
      config = $.extend(
        true,
        {
          lines: {
            fill: null,
          },
          xaxis: {
            //tickSize: 7, // 1 tick every tickSize datapoints (days)
            tickFilter,
            formatter,
          },
        },
        config
      );

      return plotAsLines($placeholder, series, granularity, config);
    },
    
    plotForYear: function ($placeholder, series, config, locale=null)
    {
      var formatter = locale?
        (t) => (moment(t).locale(locale).format('MMM')):
        (t) => (moment(t).format('MMM'));
      
      var granularity = 'month';

      config = $.extend(
        true,
        {
          lines: {
            fill: null,
          },
          xaxis: {
            tickSize: 1, // 1 tick every tickSize datapoints (month)
            formatter,
          },
        },
        config
      );

      return plotAsLines($placeholder, series, granularity, config);
    },
  };
})();

module.exports = charts.meter;
