// Import AWS SDK
const AWS = require("aws-sdk");

const lambda = new AWS.Lambda();

export const handler: any = async (event: any) => {
  try {
    console.log("UCG event:", event);

    try {
      if (event.action === "INVENTORY_CHECK") {
        const params = {
          FunctionName: process.env.INVENTORY_LAMBDA_NAME,
          InvocationType: "RequestResponse",
          Payload: JSON.stringify(event),
        };

        const data = await lambda.invoke(params).promise();
        console.log("Invoke succeeded:", data);

        return { statusCode: 200, body: JSON.stringify(data) };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ error: "health check fine" }),
      };
    } catch (err) {
      console.error("Invoke error:", err);
      return { statusCode: 500, body: JSON.stringify(err) };
    }
  } catch (error) {
    console.log("ERR : ", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create order" }),
    };
  }
};
