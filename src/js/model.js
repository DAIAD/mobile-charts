var daiad = require('./index')

daiad.model || (daiad.model = {});

// Measurements

$.extend(daiad.model, (function () {
  
  //
  // Measurement
  //

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

  var value_getter = function (m) {return m.value};

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
    computeRange: function (data) 
    {
      if (!(data && data.length > 0))
        return [-Infinity, +Infinity];
      var miny = Math.min.apply(null, $.map(data, value_getter)), 
        maxy = Math.max.apply(null, $.map(data, value_getter));
      return [miny, maxy];
    },

    // Compute the range [0, M] for a series of positive values
    computePositiveRange: function (data)
    {
      if (!(data && data.length > 0))
        return [.0, +Infinity];
      var maxy = Math.max.apply(null, $.map(data, value_getter));
      
      if (!(maxy > 0))
        console.warn('Expected positive maximum value (' + maxy + ')');
      return [.0, maxy];
    },

    formatLabel: function()
    {
      return this.value.title + ' (' + this.value.unit + ')';
    },

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
    },
  });
  
  //
  // Export model
  //

  return {
    Measurement: Measurement,
    EnergyMeasurement: EnergyMeasurement,
  };
})());

module.exports = daiad.model;
