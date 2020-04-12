const AWS = require('aws-sdk');

const { getAccessTokens } = require('./tokens');
const { loginWrapper } = require('./handlers');
const { scanTable } = require('./db');
const { plaidSingleton } = require('./plaid');

const plaidClient = plaidSingleton.get();
AWS.config.update({ region: 'us-east-1' });

const docClient = new AWS.DynamoDB.DocumentClient();

const putTransaction = async (transaction) => {
  const transactionItem = {
    transactionId: transaction.transaction_id,
    accountId: transaction.account_id,
    name: transaction.name,
    amount: transaction.amount,
    categories: transaction.category,
    date: transaction.date,
    isPending: transaction.pending,
    isVerified: false
  };

  const params = {
    TableName: 'transactions',
    Item: transactionItem,
    ConditionExpression: 'attribute_not_exists(transactionId)'
  };

  return docClient.put(params).promise()
    .then(data => data)
    .catch((error) => {
      if (error.message.includes('The conditional request failed')) {
        return {};
      }
      throw error;
    });
};

const updateTransaction = async (transaction, attributes) => {
  let updateExpression = '';
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};
  attributes.forEach((attribute, index) => {
    const updatePrefix = updateExpression === '' ? 'set' : ',';
    const attributeValue = `#${attribute}`;
    const attributeStub = `:${attribute.charAt(0)}${index}`;
    updateExpression += `${updatePrefix} ${attributeValue} = ${attributeStub}`;
    expressionAttributeNames[attributeValue] = attribute;
    expressionAttributeValues[attributeStub] = transaction[attribute];
  });

  const params = {
    TableName: 'transactions',
    Key: {
      transactionId: transaction.transactionId
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues
  };

  return docClient.update(params).promise();
};

const getTransactions = async (accountId) => {
  let account;
  let now = new Date();
  now = now.toISOString().substring(0, 10);
  let lastAccess;
  return scanTable({ tableName: 'accounts', isConsistent: true })
    .then((accounts) => {
      [account] = accounts.filter(accountItem => accountItem.accountId === accountId);
      // lastAccess = account.lastAccessDate.substring(0, 10);
      lastAccess = '2017-01-01';
      return getAccessTokens([account.itemId]);
    }).then((accessTokens) => {
      const accessToken = accessTokens[0];
      return loginWrapper(plaidClient.getTransactions(accessToken, lastAccess, now), accessToken);
    }).then((data) => {
      const transactions = data.transactions.filter(transaction => transaction.account_id === accountId);
      return transactions;
    });
};

module.exports = {
  updateTransaction,
  putTransaction,
  getTransactions
};
