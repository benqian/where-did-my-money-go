import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, ActivityIndicator, SafeAreaView, FlatList, Button
} from 'react-native';

import { ListItem } from 'react-native-elements';


import { getTransactions, updateTransactions } from '../../apiWrapper';

const TransactionItem = (props) => {
  console.log('props for item', props);
  const { transaction } = props;

  return (
    <ListItem
      style={styles.item}
      title={`${transaction.name}`}
      subtitle={(
        <View style={styles.subtitleView}>
          <Text>{`$${transaction.amount}`}</Text>
          <Text>{transaction.categories[0]}</Text>
          <Text>{transaction.date}</Text>
        </View>
)}
      leftIcon={{ name: 'money', type: 'font-awesome' }}
      bottomDivider
      onPress={() => console.log('pressed', transaction)}
    />
  );
};

const Footer = ({ transactions, setTransactions }) => (
  <Button
    title="Save transactions"
    onPress={async () => {
      console.log('acknowledged', transactions);
      const verifiedTransactions = transactions.map(transaction => ({ ...transaction, isVerified: true }));
      console.log('verifiedTransactions', verifiedTransactions);
      setTransactions(null);
      try {
        const data = await updateTransactions(verifiedTransactions, ['isVerified']);
        console.log(data);
        setTransactions([]);
      } catch (error) {
        console.log('API error', error);
        console.error(error.response);
        setTransactions(transactions);
        // throw error;
      }
    }
    }
  />
);

const TransactionList = ({ transactions, setTransactions }) => {
  console.log('transactions', transactions);
  let view;

  if (transactions && transactions.length > 0) {
    view = (
      <SafeAreaView style={styles.container}>
        <FlatList
          data={transactions}
          renderItem={({ item }) => <TransactionItem transaction={item} />}
          keyExtractor={transaction => transaction.transactionId}
          ListFooterComponent={<Footer transactions={transactions} setTransactions={setTransactions} />}
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


export default ({ route }) => {
  const [transactions, setTransactions] = useState(null);
  const { accountId } = route.params;
  console.log('looking for accountId', accountId);
  useEffect(() => {
    getTransactions(accountId)
      .then((data) => {
        console.log(data);
        setTransactions(data);
      });
  }, []);


  return (
    <SafeAreaView style={styles.container}>
      {transactions
        ? <TransactionList transactions={transactions} setTransactions={setTransactions} />
        : <ActivityIndicator size="large" color="#0000ff" />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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
    paddingTop: 5
  },
});
