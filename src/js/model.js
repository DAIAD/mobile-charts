var daiad = require('./index')

daiad.model || (daiad.model = {});

// Measurements

$.extend(daiad.model, (function () {

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

    $.extend(Measurement, {
        // Class attributes
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
        // Class methods
        calcRange: function (data) 
        {
            if (!(data && data.length > 0))
                return [-Infinity, +Infinity];

            var g = function (m) { return m.value };
            var miny = Math.min.apply(null, $.map(data, g)), 
                maxy = Math.max.apply(null, $.map(data, g));
            return [miny, maxy];
        },
    });

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
    
    return {
        Measurement: Measurement,
        EnergyMeasurement: EnergyMeasurement,
    };
})());

module.exports = daiad.model;
