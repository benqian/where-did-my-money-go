const AWS = require('aws-sdk');

const docClient = new AWS.DynamoDB.DocumentClient();
const { plaidSingleton } = require('./plaid');

const plaidClient = plaidSingleton.get();

const generatePublicToken = async (accessToken) => {
  const { public_token } = await plaidClient.createPublicToken(accessToken);
  const publicToken = public_token;
  return publicToken;
};

const getAccessTokens = async (itemIds) => {
  const requestKeys = itemIds.map(itemId => ({ itemId }));
  const params = {
    RequestItems: {
      items: {
        Keys: requestKeys,
        ProjectionExpression: 'accessToken'
      }
    }
  };

  return docClient.batchGet(params).promise()
    .then((data) => {
      const accessTokens = data.Responses.items.map(item => item.accessToken);
      return accessTokens;
    });
};

module.exports = {
  generatePublicToken,
  getAccessTokens
};
