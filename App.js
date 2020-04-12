import React from 'react';
import Amplify from 'aws-amplify';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import AccountsOverview from './screens/accountsOverview';
import Transactions from './screens/transactions';
import Link from './screens/link';
import awsconfig from './aws-exports';

Amplify.Logger.LOG_LEVEL = 'DEBUG';
Amplify.configure(awsconfig);

const Stack = createStackNavigator();

export default () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Accounts">
      <Stack.Screen name="Accounts" component={AccountsOverview} />
      <Stack.Screen name="Transactions" component={Transactions} />
      <Stack.Screen name="Link" component={Link} />
    </Stack.Navigator>
  </NavigationContainer>
);
