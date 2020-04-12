const AWS = require('aws-sdk');

const { plaidSingleton } = require('./plaid');

const plaidClient = plaidSingleton.get();
AWS.config.update({ region: 'us-east-1' });
const docClient = new AWS.DynamoDB.DocumentClient();

const generateItem = async (publicToken, userId) => {
  let accessToken;
  let itemId;
  return plaidClient.exchangePublicToken(publicToken)
    .then((tokenResponse) => {
      accessToken = tokenResponse.access_token;
      itemId = tokenResponse.item_id;

      const params = {
        TableName: 'items',
        Item: {
          userId,
          accessToken,
          itemId
        }
      };

      return docClient.put(params).promise();
    })
    .then(() => ({ accessToken, itemId }));
};

module.exports = {
  generateItem
};
