// lambda/orderLambda.ts

export const handler: any = async (event: any) => {
  console.log("Order received:", event);

  // Simulate order processing logic
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Order processed successfully" }),
  };
};
