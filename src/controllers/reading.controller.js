const store = require('../data/store');

const getReadings = (req, res) => {
  const { meter_id, limit, start_time, end_time } = req.query;

  const readings = store.getReadings({
    meter_id,
    limit,
    start_time,
    end_time
  });

  res.status(200).json({
    success: true,
    count: readings.length,
    data: readings
  });
};

const submitReading = (req, res) => {
  const { meter_id, meter_name, voltage, current, power_kw, energy_kwh, timestamp } = req.body;

  if (meter_id === undefined || meter_id === null) {
    return res.status(400).json({
      success: false,
      error: 'Field "meter_id" is required'
    });
  }

  if (voltage === undefined || current === undefined || energy_kwh === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Fields "voltage", "current", and "energy_kwh" are required'
    });
  }

  try {
    const reading = store.addReading({
      meter_id,
      meter_name,
      voltage,
      current,
      power_kw,
      energy_kwh,
      timestamp
    });

    res.status(201).json({
      success: true,
      message: 'Reading recorded successfully',
      data: reading
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

module.exports = {
  getReadings,
  submitReading
};
