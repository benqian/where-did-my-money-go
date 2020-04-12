const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-east-1' });

const docClient = new AWS.DynamoDB.DocumentClient();
const { plaidSingleton } = require('./plaid');
const { getAccessTokens } = require('./tokens');
const { loginWrapper } = require('./handlers');
const { scanTable } = require('./db');

const plaidClient = plaidSingleton.get();


const updateAccountBalances = async (account) => {
  let updateExpression = '';
  const expressionAttributeValues = {};
  const expressionAttributeNames = {};

  const currentBalance = account.balances.current || 0;
  expressionAttributeValues[':cb'] = currentBalance;
  updateExpression += (updateExpression === '')
    ? 'set currentBalance = :cb'
    : ', currentBalance = :cb';

  const availableBalance = account.balances.available || 0;
  expressionAttributeValues[':ab'] = availableBalance;
  updateExpression += (updateExpression === '')
    ? 'set availableBalance = :ab'
    : ', availableBalance = :ab';

  const limit = account.balances.limit || 0;
  expressionAttributeValues[':l'] = limit;
  expressionAttributeNames['#limit'] = 'limit';
  updateExpression += (updateExpression === '')
    ? 'set #limit = :l'
    : ', #limit = :l';

  const params = {
    TableName: 'accounts',
    Key: {
      accountId: account.account_id
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'UPDATED_NEW'
  };

  if (Object.keys(expressionAttributeNames).length !== 0) {
    params.ExpressionAttributeNames = expressionAttributeNames;
  }

  return docClient.update(params).promise();
};

const putAccount = async (account, itemId, lastAccessDate) => {
  const accountItem = {
    accountId: account.account_id,
    name: account.name,
    itemId,
    lastAccessDate: lastAccessDate.toISOString()
  };

  if (account.balances.available) { accountItem.availableBalance = account.balances.available; }
  if (account.balances.current) { accountItem.currentBalance = account.balances.current; }
  if (account.balances.limit) { accountItem.limit = account.balances.limit; }

  const params = {
    TableName: 'accounts',
    Item: accountItem
  };

  return docClient.put(params).promise();
};

const refreshAccountBalances = async (accounts) => {
  if (accounts.length === 0) { return []; }
  let latestAccounts;
  const itemIdsMap = new Map();
  accounts.forEach((account) => {
    itemIdsMap.set(account.itemId, null); // used to get unique item ids
  });

  const itemIds = Array.from(itemIdsMap.keys());
  return getAccessTokens(itemIds)
    .then(accessTokens => Promise.all(accessTokens.map(accessToken => loginWrapper(plaidClient.getAccounts(accessToken), accessToken))))
    .then((data) => {
      const accountsArr = data.map(accountData => accountData.accounts);
      latestAccounts = [].concat(...accountsArr); // flatten
      return Promise.all(latestAccounts.map(account => updateAccountBalances(account)));
    })
    .then(() => scanTable({ tableName: 'accounts', isConsistent: true }));
};

module.exports = {
  putAccount,
  updateAccountBalances,
  refreshAccountBalances
};
