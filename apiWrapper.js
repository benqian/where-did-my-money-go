/* eslint-disable import/prefer-default-export */
import { API } from 'aws-amplify';

export const withLoginHandler = async (asyncFn, navigation) => {
  try {
    const data = await asyncFn;
    console.log('DATA FROM HANDLER', data);
    return data;
  } catch (err) {
    console.log('error', err.response.data.error);
    console.log('token', err.response.data.publicToken);


    console.log('API error', err);
    if (err.response.data.error === 'ITEM_LOGIN_REQUIRED') {
      console.log('REDIRECTING TO LINK FROM HANDLER');
      navigation.navigate('Link', { isLoginRequired: true, publicToken: err.response.data.publicToken });
    } else {
      console.error('HANDLER ERROR', err);
    }
  }
};

// creates new access token for item id associated with the public token provided
// uses access token to pull new accounts into table with latest balances
export const onboardAccounts = async (publicToken, userId) => {
  const params = {
    body: { publicToken, userId }
  };
  try {
    const data = await API.post('plaidAccess', '/plaid/access/accounts', params);
    console.log(data);
    return data;
  } catch (error) {
    console.log('API error', error);
    console.error(error.response);
    throw error;
  }
};


// return name, balances, item id, and last access date of each account (if params are empty return all accounts)
// should update latest balances
export const getAccounts = async (accountIds) => {
  const params = {
    queryStringParameters: {
      accountIds
    }
  };
  try {
    const data = await API.get('plaidAccess', '/plaid/access/accounts', params);
    console.log(data);
    return data.accounts;
  } catch (error) {
    console.log('API error', error);
    console.log(error.response.data.error);
    console.error(error.response);
    throw error;

    // throw error;
  }
};

// return transactions for each account (if empty return all transactions)
// return only transactions that fall between the last access date on their associated account and NOW and are not already in the db
export const getTransactions = async (accountId) => {
  const params = {
    queryStringParameters: {
      accountId
    }
  };
  try {
    const data = await API.get('plaidAccess', '/plaid/access/transactions', params);
    console.log(data);
    return data.transactions;
  } catch (error) {
    console.log('API error', error);
    console.error(error.response);
    throw error;
  }
};


// expects list of attributes to be updated, e.g. ['isVerified']
export const updateTransactions = async (transactions, attributes) => {
  const params = {
    body: {
      transactions,
      attributes
    }
  };
  try {
    const data = await API.post('plaidAccess', '/plaid/access/transactions', params);
    console.log(data);
    return data;
  } catch (error) {
    console.log('API error', error);
    console.error(error.response);
    throw error;
  }
};
