
const plaid = require('plaid');

const config = require('./plaid-config.json');

const plaidSingleton = (() => {
  let plaidClient = null;

  return {
    get: () => {
      if (!plaidClient) {
        plaidClient = new plaid.Client(
          config.clientId,
          config.secret,
          config.publicKey,
          plaid.environments.development
        );
      }

      return plaidClient;
    }
  };
})();

module.exports = {
  plaidSingleton
};
