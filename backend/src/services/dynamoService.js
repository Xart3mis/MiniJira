import { dynamoDB } from '../config/aws.js';

export async function putItem(tableName, item) {
    const params = {
        TableName: tableName,
        Item: item
    };

    return dynamoDB.put(params).promise();
}

export async function getItem(tableName, key) {
    const params = {
        TableName: tableName,
        Key: key
    };

    const result = await dynamoDB.get(params).promise();
    return result.Item;
}

export async function deleteItem(tableName, key) {
    const params = {
        TableName: tableName,
        Key: key
    };

    return dynamoDB.delete(params).promise();
}

export async function scanTable(tableName) {
    const params = { TableName: tableName };
    const items = [];
    let lastKey;
    do {
        if (lastKey) params.ExclusiveStartKey = lastKey;
        const result = await dynamoDB.scan(params).promise();
        items.push(...(result.Items || []));
        lastKey = result.LastEvaluatedKey;
    } while (lastKey);
    return items;
}

export async function queryByIndex(tableName, indexName, keyName, keyValue) {
    const params = {
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: '#key = :value',
        ExpressionAttributeNames: { '#key': keyName },
        ExpressionAttributeValues: { ':value': keyValue }
    };
    const items = [];
    let lastKey;
    do {
        if (lastKey) params.ExclusiveStartKey = lastKey;
        const result = await dynamoDB.query(params).promise();
        items.push(...(result.Items || []));
        lastKey = result.LastEvaluatedKey;
    } while (lastKey);
    return items;
}

export async function queryByPk(tableName, pkName, pkValue) {
    const params = {
        TableName: tableName,
        KeyConditionExpression: '#pk = :pkVal',
        ExpressionAttributeNames: { '#pk': pkName },
        ExpressionAttributeValues: { ':pkVal': pkValue }
    };
    const result = await dynamoDB.query(params).promise();
    return result.Items || [];
}

export async function updateItem(tableName, key, updateExpression, expressionValues, expressionNames = {}) {
    const params = {
        TableName: tableName,
        Key: key,
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionValues,
        ReturnValues: 'ALL_NEW'
    };

    if (Object.keys(expressionNames).length > 0) {
        params.ExpressionAttributeNames = expressionNames;
    }

    const result = await dynamoDB.update(params).promise();
    return result.Attributes;
}