// Import AWS SDK
const AWS = require("aws-sdk");

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const handler: any = async (event: any) => {
  try {
    console.log("Inventory event:", event);

    const data = await dynamoDb
      .scan({
        TableName: process.env.INVENTORY_TABLE_NAME,
      })
      .promise();

    console.log("data", data);

    if (data.Items.length) {
      // product stock is available
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Product is available, Good to go",
          data: { status: "available" },
        }),
      };
    } else {
      // product is out of stock
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Product is Out of Stock",
          data: { status: "outOfStock" },
        }),
      };
    }
  } catch (error) {
    console.log("ERR : ", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create order" }),
    };
  }
};
