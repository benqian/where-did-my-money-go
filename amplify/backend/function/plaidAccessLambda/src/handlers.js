const { generatePublicToken } = require('./tokens');

const loginWrapper = async (clientFunc, accessToken) => {
  try {
    return await clientFunc;
  } catch (err) {
    if (err.message === 'ITEM_LOGIN_REQUIRED') {
      err.accessToken = accessToken;
    }

    throw err;
  }
};

const itemLoginHandler = async (err, req, res, next) => {
  if (err.message === 'ITEM_LOGIN_REQUIRED') {
    const publicToken = await generatePublicToken(err.accessToken);
    res.status(500).send({ error: err.message, publicToken });
  } else {
    next(err);
  }
};

module.exports = {
  loginWrapper,
  itemLoginHandler
};
