import fs from "fs";
import { apigw, REGION, BUCKET, lambda } from "../shared.js";
import {
    CreateApiCommand,
    CreateIntegrationCommand,
    CreateRouteCommand,
    CreateStageCommand
} from "@aws-sdk/client-apigatewayv2";
import {
    GetFunctionCommand,
    AddPermissionCommand
} from "@aws-sdk/client-lambda";

console.log("Creating HTTP API (inno-bucket-brownj58) with routes...");

// -------------------------
// 1. Create HTTP API
// -------------------------
const api = await apigw.send(
    new CreateApiCommand({
        Name: "inno-bucket-brownj58",
        ProtocolType: "HTTP"
    })
);
console.log("API created:", api.ApiId);

// -------------------------
// 2. Get Lambda ARNs
// -------------------------
const lambda1 = await lambda.send(
    new GetFunctionCommand({ FunctionName: "lambda1-demo" })
);
const lambda1Arn = lambda1.Configuration.FunctionArn;

const lambda2 = await lambda.send(
    new GetFunctionCommand({ FunctionName: "lambda2-demo" })
);
const lambda2Arn = lambda2.Configuration.FunctionArn;

// -------------------------
// 3. Integrations
// -------------------------

// 3A. S3 STATIC WEBSITE — HTTP_PROXY
const s3WebsiteUrl = `http://${BUCKET}.s3-website-${REGION}.amazonaws.com/index.html`;

const s3Integration = await apigw.send(
    new CreateIntegrationCommand({
        ApiId: api.ApiId,
        IntegrationType: "HTTP_PROXY",
        IntegrationUri: s3WebsiteUrl,
        IntegrationMethod: "GET",
        PayloadFormatVersion: "1.0"
    })
);

// 3B. Lambda1 — AWS_PROXY
const lambda1Integration = await apigw.send(
    new CreateIntegrationCommand({
        ApiId: api.ApiId,
        IntegrationType: "AWS_PROXY",
        IntegrationUri: lambda1Arn,
        IntegrationMethod: "POST",            // REQUIRED for AWS_PROXY in HTTP APIs
        PayloadFormatVersion: "2.0"
    })
);

// 3C. Lambda2 — AWS_PROXY
const lambda2Integration = await apigw.send(
    new CreateIntegrationCommand({
        ApiId: api.ApiId,
        IntegrationType: "AWS_PROXY",
        IntegrationUri: lambda2Arn,
        IntegrationMethod: "POST",            // REQUIRED
        PayloadFormatVersion: "2.0"
    })
);

// -------------------------
// 4. Routes
// -------------------------
await apigw.send(
    new CreateRouteCommand({
        ApiId: api.ApiId,
        RouteKey: "GET /",
        Target: `integrations/${s3Integration.IntegrationId}`
    })
);

await apigw.send(
    new CreateRouteCommand({
        ApiId: api.ApiId,
        RouteKey: "GET /lambda1",
        Target: `integrations/${lambda1Integration.IntegrationId}`
    })
);

await apigw.send(
    new CreateRouteCommand({
        ApiId: api.ApiId,
        RouteKey: "POST /lambda2",
        Target: `integrations/${lambda2Integration.IntegrationId}`
    })
);

// -------------------------
// 5. Lambda Invoke Permissions
// -------------------------
const accountId = process.env.AWS_ACCOUNT_ID;
const apiArnBase = `arn:aws:execute-api:${REGION}:${accountId}:${api.ApiId}`;

await lambda.send(
    new AddPermissionCommand({
        FunctionName: "lambda1-demo",
        Action: "lambda:InvokeFunction",
        Principal: "apigateway.amazonaws.com",
        StatementId: `apigw-l1-${Date.now()}`,
        SourceArn: `${apiArnBase}/*/GET/lambda1`
    })
);

await lambda.send(
    new AddPermissionCommand({
        FunctionName: "lambda2-demo",
        Action: "lambda:InvokeFunction",
        Principal: "apigateway.amazonaws.com",
        StatementId: `apigw-l2-${Date.now()}`,
        SourceArn: `${apiArnBase}/*/POST/lambda2`
    })
);

// -------------------------
// 6. Stage
// -------------------------
const stage = await apigw.send(
    new CreateStageCommand({
        ApiId: api.ApiId,
        StageName: "prod",
        AutoDeploy: true
    })
);

// -------------------------
fs.writeFileSync("api.json", JSON.stringify({ api, stage }, null, 2));

const baseUrl = `https://${api.ApiId}.execute-api.${REGION}.amazonaws.com/${stage.StageName}`;

console.log("Routes ready:");
console.log(`GET   ${baseUrl}/            -> S3 index.html`);
console.log(`GET   ${baseUrl}/lambda1     -> lambda1-demo`);
console.log(`POST  ${baseUrl}/lambda2     -> lambda2-demo`);
