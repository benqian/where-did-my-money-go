import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Button, Text, View, ActivityIndicator, SafeAreaView, FlatList
} from 'react-native';

import { ListItem } from 'react-native-elements';
import Constants from 'expo-constants';

import { withLoginHandler, getAccounts } from '../../apiWrapper';

const AccountItem = (props) => {
  console.log('props for item', props);
  const { account, navigation } = props;

  return (
    <ListItem
      style={styles.item}
      title={`${account.name}`}
      subtitle={(
        <View style={styles.subtitleView}>
          <Text>{`Balance: $${account.currentBalance}`}</Text>
        </View>
)}
      leftIcon={{ name: 'bank', type: 'font-awesome' }}
      bottomDivider
      onPress={() => navigation.navigate('Transactions', { accountId: account.accountId })}
    />
  );
};

const AccountsList = (props) => {
  console.log('props', props);
  const { accounts, navigation } = props;
  let view;

  if (accounts && accounts.length > 0) {
    view = (
      <SafeAreaView>
        <FlatList
          data={accounts}
          renderItem={({ item }) => <AccountItem account={item} navigation={navigation} />}
          keyExtractor={account => account.accountId}
        />
      </SafeAreaView>
    );
  } else {
    view = (
      <View style={styles.center}>
        <Text>No transactions to display</Text>
      </View>
    );
  }

  return view;
};


export default (props) => {
  const { navigation } = props;
  const [accounts, setAccounts] = useState(null);

  useEffect(() => {
    const getAccountsWrapper = async () => {
      const data = await withLoginHandler(getAccounts(), navigation);
      setAccounts(data);
    };

    getAccountsWrapper();
  }, []);


  return (
    <View style={styles.container}>
      <View style={styles.statusBar} />
      <Button
        title="Add new accounts"
        onPress={() => navigation.navigate('Link', { isLoginRequired: false, publicToken: null })}
      />
      {accounts
        ? <AccountsList accounts={accounts} navigation={navigation} />
        : <ActivityIndicator size="large" color="#0000ff" />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Constants.statusBarHeight,
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
  },
  item: {
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  subtitleView: {
    flexDirection: 'column',
    paddingTop: 5,
  },
  statusBar: {
    paddingTop: Constants.statusBarHeight,
  },
});
