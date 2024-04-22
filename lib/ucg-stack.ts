// Adjusting imports for CDK v2
import {
  Stack,
  StackProps,
  aws_lambda as lambda,
  aws_apigateway as apigateway,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export class UcgStack extends Stack {
  public readonly ordersTable: dynamodb.Table;
  public readonly productsTable: dynamodb.Table;
  public readonly inventoryTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.ordersTable = new dynamodb.Table(this, "OrdersTable", {
      partitionKey: { name: "orderId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: "Orders",
    });

    this.inventoryTable = new dynamodb.Table(this, "InventoryTable", {
      partitionKey: { name: "productId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: "Inventory",
    });

    const inventoryLambda = new lambda.Function(this, "InventoryHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("lambdas/inventoryLambda"),
      handler: "index.handler",
      environment: {
        INVENTORY_TABLE_NAME: this.inventoryTable.tableName,
      },
    });

    const UCGLambda = new lambda.Function(this, "UCGLambda", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("lambdas/UCGLambda"),
      handler: "index.handler",
      environment: {
        ORDERS_TABLE_NAME: this.ordersTable.tableName,
        INVENTORY_LAMBDA_NAME: inventoryLambda.functionName,
      },
    });

    const orderLambda = new lambda.Function(this, "OrderHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("lambdas/orderLambda"),
      handler: "index.handler",
      environment: {
        ORDERS_TABLE_NAME: this.ordersTable.tableName,
        UCG_LAMBDA_NAME: UCGLambda.functionName,
      },
    });

    // permission to access DB
    this.ordersTable.grantReadWriteData(orderLambda);
    this.inventoryTable.grantReadWriteData(inventoryLambda);

    UCGLambda.grantInvoke(orderLambda);
    inventoryLambda.grantInvoke(UCGLambda);

    const api = new apigateway.RestApi(this, "OrderApi", {
      restApiName: "ecommerce-api",
    });

    const orders = api.root.addResource("orders");
    orders.addMethod("POST", new apigateway.LambdaIntegration(orderLambda));
    orders.addMethod("GET", new apigateway.LambdaIntegration(orderLambda));

    // const inventory = api.root.addResource("inventory");
    // inventory.addMethod(
    //   "GET",
    //   new apigateway.LambdaIntegration(inventoryLambda)
    // );
  }
}
