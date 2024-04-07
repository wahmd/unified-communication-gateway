// Adjusting imports for CDK v2
import {
  Stack,
  StackProps,
  aws_lambda as lambda,
  aws_apigateway as apigateway,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export class UcgStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Define the Lambda function
    const orderLambda = new lambda.Function(this, "OrderHandler", {
      runtime: lambda.Runtime.NODEJS_20_X, // Define the runtime
      code: lambda.Code.fromAsset("lambda"), // Path to the directory with your Lambda code
      handler: "orderLambda.handler", // File and method name
    });

    // Set up the API Gateway
    const api = new apigateway.RestApi(this, "OrderApi", {
      restApiName: "Order Service",
    });

    const orders = api.root.addResource("orders");
    orders.addMethod("POST", new apigateway.LambdaIntegration(orderLambda));
    orders.addMethod("GET", new apigateway.LambdaIntegration(orderLambda));
  }
}
