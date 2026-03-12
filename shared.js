import {
    S3Client,
} from "@aws-sdk/client-s3";

import {
    IAMClient,
} from "@aws-sdk/client-iam";

import {
    LambdaClient,
} from "@aws-sdk/client-lambda";

import {
    ApiGatewayV2Client,
} from "@aws-sdk/client-apigatewayv2";

export const REGION = "eu-north-1";

export const BUCKET = "inno-bucket-brownj58-1773317244122";

export const ROLE_NAME = "DemoLambdaExecutionRole";

export const s3 = new S3Client({ region: REGION });
export const iam = new IAMClient({ region: REGION });
export const lambda = new LambdaClient({ region: REGION });
export const apigw = new ApiGatewayV2Client({ region: REGION });
