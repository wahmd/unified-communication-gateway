// Import AWS SDK
const AWS = require("aws-sdk");
const lambda = new AWS.Lambda();

// Create a new DynamoDB instance
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const handler: any = async (event: any) => {
  try {
    console.log("Order received:", event);

    if (event.httpMethod === "POST") {
      const params = {
        FunctionName: process.env.UCG_LAMBDA_NAME,
        InvocationType: "RequestResponse",
        Payload: JSON.stringify({
          action: "INVENTORY_CHECK",
          ToServiceName: "inventoryLambda",
          FromServiceName: "ordersLambda",
        }),
      };

      try {
        const data = await lambda.invoke(params).promise();
        console.log("111 Invoke succeeded:", data);

        console.log("returning data: ", JSON.stringify(data));

        let payload = JSON.parse(data.Payload);
        const value = JSON.parse(
          JSON.parse(JSON.parse(payload.body)["Payload"]).body
        );
        console.log("status:", value.data.status);
        const status = value.data.status;

        if (status === "available") {
          // create order
          const requestBody = JSON.parse(event.body);
          const id = AWS.util.uuid.v4();

          const params: any = {
            TableName: process.env.ORDERS_TABLE_NAME,
            Item: {
              orderId: id,
              productDetails: requestBody.productDetails,
              quantity: requestBody.quantity,
              date: new Date().toISOString(),
            },
          };

          try {
            // Inserting the order into DynamoDB table
            await dynamoDb.put(params).promise();
            return {
              statusCode: 200,
              headers: {
                "Access-Control-Allow-Origin": "*", // Required for CORS support to work
                "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
              },
              body: JSON.stringify({
                message: "Order successfully created",
                orderId: id,
              }),
            };
          } catch (error) {
            console.error("Error inserting order into DynamoDB:", error);
            return {
              statusCode: 500,
              headers: {
                "Access-Control-Allow-Origin": "*", // Required for CORS support to work
                "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
              },
              body: JSON.stringify({ error: "Failed to create order" }),
            };
          }
        }

        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
          },
          body: JSON.stringify({
            result: "failed",
            message: "Inventory service indicated product is out of stock",
          }),
        };
      } catch (err) {
        console.error("Invoke error:", err);
        return {
          statusCode: 500,
          headers: {
            "Access-Control-Allow-Origin": "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
          },
          body: JSON.stringify(err),
        };
      }
    }

    // GET CASE
    if (event.httpMethod === "GET") {
      const data = await dynamoDb
        .scan({
          TableName: process.env.ORDERS_TABLE_NAME,
        })
        .promise();

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*", // Required for CORS support to work
          "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify({
          message: "All records retrieved successfully",
          data: data.Items,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({ error: "health check fine" }),
    };
  } catch (error) {
    console.log("ERR : ", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({ error: "Failed to create order" }),
    };
  }
};
