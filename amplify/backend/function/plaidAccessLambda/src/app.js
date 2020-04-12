const express = require('express');
const bodyParser = require('body-parser');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');

const { plaidSingleton } = require('./plaid');
const { putAccount, refreshAccountBalances } = require('./accounts');
const { getTransactions, updateTransaction, putTransaction } = require('./transactions');
const { scanTable } = require('./db');
const { generateItem } = require('./items');
const { loginWrapper, itemLoginHandler } = require('./handlers');

const plaidClient = plaidSingleton.get();
const app = express();

app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// event -> req.apiGateway.event
// body -> req.body
app.get('/plaid/access/transactions', (req, res, next) => {
  const { accountId } = req.query;
  return getTransactions(accountId)
    .then(transactions => Promise.all(transactions.map(transaction => putTransaction(transaction))))
    .then(() => scanTable({ tableName: 'transactions', isConsistent: true }))
    .then((data) => {
      const verifiedTransactions = data.filter(transaction => transaction.isVerified === false);
      const transactions = verifiedTransactions.filter(transaction => transaction.accountId === accountId);

      const descendingDate = (a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        if (dateA < dateB) {
          return 1;
        } if (dateA > dateB) {
          return -1;
        }
        return 0;
      };

      transactions.sort(descendingDate);
      res.json({ url: req.url, transactions });
    })
    .catch(next);
});

app.post('/plaid/access/transactions', (req, res, next) => {
  const { transactions, attributes } = req.body;
  return Promise.all(transactions.map(transaction => updateTransaction(transaction, attributes)))
    .then((data) => {
      res.json({ url: req.url, transactions: data });
    })
    .catch(next);
});

app.get('/plaid/access/accounts', (req, res, next) => scanTable({ tableName: 'accounts' })
  .then(accounts => refreshAccountBalances(accounts))
  .then((data) => {
    res.json({ url: req.url, accounts: data });
  })
  .catch(next));

app.post('/plaid/access/accounts', (req, res, next) => {
  const { publicToken, userId } = req.body;

  let accessToken;
  let itemId;

  const lastAccessDate = new Date();
  lastAccessDate.setDate(lastAccessDate.getDate() - 7);

  return generateItem(publicToken, userId)
    .then((data) => {
      ({ accessToken, itemId } = data);
      return loginWrapper(plaidClient.getAccounts(accessToken), accessToken);
    })
    .then((data) => {
      const { accounts } = data;
      return Promise.all(accounts.map(account => putAccount(account, itemId, lastAccessDate)));
    })
    .then(() => res.json({ url: req.url, body: req.body }))
    .catch(next);
});

app.put('/plaid/access', (req, res) => {
  // Add your code here
  res.json({ success: 'put call succeed!', url: req.url, body: req.body });
});

app.delete('/plaid/access', (req, res) => {
  // Add your code here
  res.json({ success: 'delete call succeed!', url: req.url });
});


app.use(itemLoginHandler);

app.listen(3000, () => {
  console.log('App started');
});

module.exports = app;
