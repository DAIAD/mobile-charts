(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var $ = (typeof window !== "undefined" ? window['jQuery'] : typeof global !== "undefined" ? global['jQuery'] : null);
var moment = require('moment');

var daiad = (typeof window !== "undefined" ? window['daiad'] : typeof global !== "undefined" ? global['daiad'] : null);

var charts = daiad.charts;
var Measurement = daiad.model.Measurement;

var qs = new Map($.map(window.location.search.replace(/^[?]/, '').split('&'), function (v) {
  return [v.split('=')];
}));
var locale = qs.get('locale') || 'en';
moment.locale(locale);
console.info('Using locale: ' + locale);

$(document).ready(function () {
  var href = window.location.hash || "#meter-charts-tab";
  $('[href="' + href + '"]').tab('show');
});

$('[href="#meter-charts-tab"]').one('shown.bs.tab', function () {

  //
  // Meter - Day
  //

  function getMeterDataForDay(miny, maxy, resolution) {
    var dy = maxy - miny;
    var now = moment(),
        t0 = moment().startOf('day');
    var num_points = 24 / resolution;
    return $.map(new Array(num_points), function (_, i) {
      var t = t0.clone().add(i * resolution, 'hour');
      var val = miny + Math.random() * dy;
      return new Measurement(-1, t.toDate(), val);
    });
  }

  var data1 = getMeterDataForDay(50, 200, 1);
  var data2 = getMeterDataForDay(50, 200, 1);
  var data3 = getMeterDataForDay(50, 200, 1);
  var series = [
  // seriers #1
  {
    data: data1,
    levels: [{
      range: [50, 80],
      color: '#6976EB',
      description: 'Low'
    }, {
      range: [80, 120],
      color: '#3843A5',
      description: 'Mid'
    }, {
      range: [120, 160],
      color: '#2D3580',
      description: 'High'
    }, {
      range: [160, 200],
      color: '#2F3565',
      description: 'Very High'
    }]
  },
  // series #2
  {
    data: data2,
    levels: null,
    color: null }];
  charts.meter.plotForDay($('#meter-chart-day-view'), series);

  //
  // Meter - Week
  //

  function getMeterDataForWeek(miny, maxy, resolution) {
    var dy = maxy - miny;
    var now = moment(),
        t0 = moment().startOf('isoweek');
    var num_points = Math.ceil(7 / resolution);
    return $.map(new Array(num_points), function (_, i) {
      var t = t0.clone().add(i * resolution, 'day');
      var val = miny + Math.random() * dy;
      return new Measurement(-1, t.toDate(), val);
    });
  }

  var data1 = getMeterDataForWeek(50, 200, 1);
  var data2 = getMeterDataForWeek(50, 200, 1);
  var series = [{ data: data1 }];
  charts.meter.plotForWeek($('#meter-chart-week-view'), series);

  //
  // Meter - Month
  //

  function getMeterDataForMonth(miny, maxy, resolution) {
    var dy = maxy - miny;
    var now = moment(),
        t0 = moment().startOf('month');
    var num_points = Math.ceil(t0.daysInMonth() / resolution);
    return $.map(new Array(num_points), function (_, i) {
      var t = t0.clone().add(i * resolution, 'day');
      var val = miny + Math.random() * dy;
      return new Measurement(-1, t.toDate(), val);
    });
  }

  var data1 = getMeterDataForMonth(50, 200, 1);
  var data2 = getMeterDataForMonth(50, 200, 1);
  var series = [{
    data: data1,
    color: null,
    fill: 0.33
  }, {
    data: data2,
    color: '#D84116',
    fill: null
  }];
  charts.meter.plotForMonth($('#meter-chart-month-view'), series);

  //
  // Meter - Month (with forecast)
  //

  // Simulate K forecasted data points
  var K = 5,
      N = data1.length - K;

  var series = [{
    // actual data measurements
    data: data1.map(function (p, i) {
      return i < N ? p : _extends({}, p, { value: null });
    }),
    fill: 0.33
  }, {
    // forecast
    data: data1.slice(-(K + 1)),
    fill: null,
    color: '#aaa'
  }];

  charts.meter.plotForMonth($('#meter-chart-month-view-1'), series);

  //
  // Meter - Year
  //

  function getMeterDataForYear(miny, maxy, resolution) {
    var dy = maxy - miny;
    var now = moment(),
        t0 = moment().startOf('year');
    var num_points = Math.ceil(12 / resolution);
    return $.map(new Array(num_points), function (_, i) {
      var t = t0.clone().add(i * resolution, 'month');
      var val = miny + Math.random() * dy;
      return new Measurement(-1, t.toDate(), val);
    });
  }

  var data1 = getMeterDataForYear(50, 200, 1);
  var data2 = getMeterDataForYear(50, 200, 1);
  var series = [{
    data: data1,
    fill: 0.33
  }];
  charts.meter.plotForYear($('#meter-chart-year-view'), series);
});

$('[href="#b1-charts-tab"]').one('shown.bs.tab', function () {
  var data = null,
      real_data = null,
      /* realtime (measured) data points */
  comp_data = null; /* historical (computed) data points */

  //
  // B1 - Shower Event
  //

  function getB1DataForEvent(miny, maxy, resolution) {
    var dy = maxy - miny;
    var now = moment(),
        t0 = moment().add(-2, 'hour');
    // Simulate 1 shower event before 1 hour
    var t1 = t0.clone().add(1, 'hour');
    var data = [],
        i = 1000;
    // A duration of 1h (as seconds)
    var duration = 3600;
    var t1e = t1.clone().add(duration, 'second');
    // Measure every approx resolution seconds
    var t = t1.clone();
    while (t < t1e) {
      var val = miny + Math.random() * dy;
      data.push(new Measurement(++i, new Date(t.valueOf()), val));
      t.add(resolution, 'second');
    }
    return data;
  }

  data = getB1DataForEvent(120, 200, 180);
  charts.b1.plotForEvent($('#b1-chart-event-view'), data, {
    bars: false,
    xaxis: {
      ticks: 10 }
  });

  data = getB1DataForEvent(120, 200, 30);
  charts.b1.plotForTimedEvent($('#b1-chart-timed-event-view'), data, {
    resolution: 60, // seconds
    xaxis: {
      ticks: 6 }
  });

  //
  // B1 - Day
  //

  // Todo

  //
  // B1 - Week
  //

  // Generate 2 series with complementary data points
  function getB1DataSeriesForWeek(miny, maxy, resolution) {
    var dy = maxy - miny;
    var now = moment(),
        t0 = moment().startOf('isoweek');
    var n = 7;
    var choices1 = $.map(new Array(n), function () {
      return Math.random() < 0.4;
    });
    var genSample = function genSample(i, t) {
      return miny + Math.random() * dy;
    };
    var data1 = [],
        data2 = [];
    for (var i = 0; i < n; i++) {
      var t = t0.clone().add(i * 1, 'day').toDate();

      if (choices1[i]) {
        data1[i] = new Measurement(i, t, genSample(i, t));
        data2[i] = new Measurement(i, t, null);
      } else {
        data1[i] = new Measurement(i, t, null);
        data2[i] = i > 0 && data2[i - 1].value ? data2[i - 1] : new Measurement(i, t, genSample(i, t));
      }
    }
    return [data1, data2];
  }

  (function () {
    var res = getB1DataSeriesForWeek(50, 200, 1);
    real_data = res[0];comp_data = res[1];
  })();

  var pad = function pad(s, n) {
    return (' '.repeat(n) + s.toString()).slice(-n);
  };
  var dump;
  dump = $.map(real_data, function (m) {
    return pad(m.value ? m.value.toFixed(1) : 'NULL', 8);
  }).join();
  console.log('R: ' + dump);
  dump = $.map(comp_data, function (m) {
    return pad(m.value ? m.value.toFixed(1) : 'NULL', 8);
  }).join();
  console.log('C: ' + dump);

  charts.b1.plotForWeek($('#b1-chart-week-view'), real_data, comp_data, {
    resolution: 1 });

  //
  // B1 - Month
  //

  function getB1DataForMonth(miny, maxy, resolution) {
    var dy = maxy - miny;
    var now = moment(),
        t0 = moment().startOf('month');
    var num_points = Math.ceil(t0.daysInMonth() / resolution);
    return $.map(new Array(num_points), function (_, i) {
      var t = t0.clone().add(i * resolution, 'day');
      var val = miny + Math.random() * dy;
      return new Measurement(i, t.toDate(), val);
    });
  }

  data = getB1DataForMonth(50, 200, 2);
  charts.b1.plotForMonth($('#b1-chart-month-view'), data, {
    resolution: 2, // days
    weekLabel: 'W' });

  //
  // B1 - Year
  //

  function getB1DataForYear(miny, maxy, resolution) {
    var dy = maxy - miny;
    var now = moment(),
        t0 = moment().startOf('year');
    var num_points = Math.ceil(12 / resolution);
    return $.map(new Array(num_points), function (_, i) {
      var t = t0.clone().add(i * resolution, 'month');
      var val = miny + Math.random() * dy;
      return new Measurement(i, t.toDate(), val);
    });
  }

  data = getB1DataForYear(50, 200, 1);
  charts.b1.plotForYear($('#b1-chart-year-view'), data, {
    resolution: 1 });
});

$('[href="#comparison-charts-tab"]').one('shown.bs.tab', function () {
  var data, config;

  // Comparison - Labels

  data = [['best', 110], ['avg', 150], ['me', 180]];
  config = {
    // Provide labels for data points
    points: new Map([['me', {
      label: 'My Home',
      color: '#2D3580',
      labelColor: '#FFF'
    }], ['avg', {
      label: 'Average',
      color: '#7F7E83',
      labelColor: '#FFF'
    }], ['best', {
      label: 'Best',
      color: '#7BD3AB',
      labelColor: '#445C92'
    }]]),
    // Style labels
    labels: {
      paddingX: 8,
      marginX: 8,
      align: 'right'
    }
  };
  charts.comparison.plotBarsWithLabels($('#comparison-chart-labels'), data, config);

  // Comparison - Markers in a linear scale of efficiency

  data = [['best', 176], ['avg', 169], ['me', 166]];
  config = {
    // Define the expected range of values
    range: [50, 200],
    // How many steps in the linear scale (keep it between 10 and 20)?
    numSteps: 15,
    // Provide labels for markers on data points
    points: new Map([['me', {
      label: 'Me',
      color: '#3D97D8',
      labelColor: '#FFF'
    }], ['avg', {
      label: 'Avg',
      color: '#CE363B',
      labelColor: '#FFF'
    }], ['best', {
      label: 'Best',
      color: '#7BD3AB',
      labelColor: '#445C92'
    }]]),
    // Style background bars (linear scale)
    bars: {
      color: '#BBB',
      widthRatio: 0.35
    }
  };

  charts.comparison.plotBarsWithMarkers($('#comparison-chart-markers'), data, config);

  // Comparison - Breakdown (plot 2 data series side-by-side)

  var data1 = [['D', 57.8], ['A', 51.8], ['E', 55.6], ['F', 80.3], ['B', 62.1], ['G', 71.8], ['H', 38.7], ['C', 48.0]];
  var data2 = [['B', 50.1], ['C', 60.4], ['A', 59.3], ['F', 67.1], ['G', 70.0], ['E', 70.6], ['H', 46.9], ['D', 64.2]];

  config = {
    // Define the expected range of values (or set to null to be computed)
    range: [20, 100],
    // Provide metadata for supplied data series (required!)
    meta: [
    // data #1
    {
      label: 'Similar',
      color: '#FFF',
      labelColor: '#ADAEB6'
    },
    // data #2
    {
      label: 'Yours',
      color: '#FFF',
      labelColor: '#2D3580'
    }],
    // Provide metadata for datapoints (domain).
    // Omit it (or set to null), if you want the X-axis to be blank.
    points: new Map([['A', { label: 'Aa' }], ['B', { label: 'Bb' }], ['C', { label: 'Cc' }], ['D', { label: 'Dd' }], ['E', { label: 'Ee' }], ['F', { label: 'Ff' }], ['G', { label: 'Gg' }], ['H', { label: 'Hh' }]]),
    // Style legend
    legend: 'centre', // choose between: 'default', 'centre' 
    // Style bars
    bars: {
      widthRatio: 0.30 }
  };

  charts.comparison.plotBarsAsPairs($('#comparison-chart-breakdown'), data1, data2, config);
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"moment":"moment"}]},{},[1]);
