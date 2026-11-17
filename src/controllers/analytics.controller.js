const repository = require('../data/repository');

const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await repository.getAnalytics();
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: analytics
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnalytics
};
