const repository = require('../data/repository');

const getMeters = async (req, res, next) => {
  try {
    const meters = await repository.getAllMeters();
    res.status(200).json({
      success: true,
      count: meters.length,
      data: meters
    });
  } catch (err) {
    next(err);
  }
};

const getMeterById = async (req, res, next) => {
  try {
    const meter = await repository.getMeterById(req.params.id);
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
  } catch (err) {
    next(err);
  }
};

const registerMeter = async (req, res) => {
  const { id, name, location, status } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Field "id" (numeric) is required'
    });
  }

  try {
    const newMeter = await repository.addMeter({ id, name, location, status });
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
