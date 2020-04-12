const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-east-1' });

const docClient = new AWS.DynamoDB.DocumentClient();

const scanTable = async (options = {}) => {
  const params = {
    TableName: options.tableName
  };

  if (options.isConsistent) { params.ConsistentRead = true; }

  return docClient.scan(params).promise()
    .then(data => data.Items);
};

module.exports = {
  scanTable
};
