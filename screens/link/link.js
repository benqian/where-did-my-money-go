import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import PlaidAuthenticator from 'react-native-plaid-link';

import { onboardAccounts } from '../../apiWrapper';

import config from './plaid-config.json';

const Link = (props) => {
  const { navigation, route } = props;
  const { isLoginRequired, publicToken } = route.params;
  console.log('RECEIVED LOGIN REQUIRED', isLoginRequired, publicToken);
  const [apiData, setApiData] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(false);

  const onMessage = (data) => {
    console.log('on message', data);

    const { action } = data;

    const status = action.substr(action.lastIndexOf(':') + 1).toUpperCase();
    console.log('status', status);
    if (status === 'CONNECTED') {
      setApiData(data);
    }
  };

  async function getAccounts(token, userId) {
    onboardAccounts(token, userId).then((data) => {
      console.log(data);
      setIsOnboarded(true);
    }).catch((error) => {
      console.log('API error', error);
      console.error(error.response);
    });
  }

  useEffect(() => {
    console.log('got updated apiData', apiData);
    if (apiData !== null) {
      console.log('getting access token');
      getAccounts(apiData.metadata.public_token, config.environment);
      // getAccountData();
    }
  }, [apiData]);

  useEffect(() => {
    if (isOnboarded) {
      navigation.navigate('Accounts');
    }
  }, [isOnboarded]);


  if (apiData) {
    return (
      <View>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }


  if (isLoginRequired && !publicToken) {
    return null;
  }

  if (publicToken) {
    return (
      <PlaidAuthenticator
        onMessage={onMessage}
        publicKey={config.publicKey}
        env={config.environment}
        product="auth,transactions"
        clientName="This application"
        selectAccount={false}
        token={publicToken}
      />
    );
  }


  return (
  /*
       * FOR REFERENCE: if this fails due to user credential,
       * you need to get a new public token via item/public_token/create
       * and pass into PlaudAuthenticator as token={newly_generated_token}
       */
    <PlaidAuthenticator
      onMessage={onMessage}
      publicKey={config.publicKey}
      env={config.environment}
      product="auth,transactions"
      clientName="This application"
      selectAccount={false}
    />
  );
};

export default Link;
