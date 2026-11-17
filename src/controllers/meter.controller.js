const store = require('../data/store');

const getMeters = (req, res) => {
  const meters = store.getAllMeters();
  res.status(200).json({
    success: true,
    count: meters.length,
    data: meters
  });
};

const getMeterById = (req, res) => {
  const meter = store.getMeterById(req.params.id);
  if (!meter) {
    return res.status(404).json({
      success: false,
      error: `Meter with id ${req.params.id} not found`
    });
  }
  res.status(200).json({
    success: true,
    data: meter
  });
};

const registerMeter = (req, res) => {
  const { id, name, location, status } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Field "id" (numeric) is required'
    });
  }

  try {
    const newMeter = store.addMeter({ id, name, location, status });
    res.status(201).json({
      success: true,
      message: 'Meter successfully registered',
      data: newMeter
    });
  } catch (err) {
    const statusCode = err.status || 400;
    res.status(statusCode).json({
      success: false,
      error: err.message
    });
  }
};

module.exports = {
  getMeters,
  getMeterById,
  registerMeter
};

