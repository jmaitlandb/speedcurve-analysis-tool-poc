import fs from "fs";
import archiver from "archiver";
import {
    LambdaClient,
    CreateFunctionCommand,
    AddPermissionCommand,
    GetFunctionCommand
} from "@aws-sdk/client-lambda";

import {
    ApiGatewayV2Client,
    CreateApiCommand,
    CreateIntegrationCommand,
    CreateRouteCommand,
    CreateStageCommand
} from "@aws-sdk/client-apigatewayv2";

const REGION = "eu-north-1";
const ACCOUNT_ID = "749144762306";
const BUCKET = "inno-bucket-brownj58-1773317244122";
const FUNCTION_NAME = "s3-proxy-demo";
const ROLE_ARN = `arn:aws:iam::${ACCOUNT_ID}:role/YOUR_LAMBDA_EXEC_ROLE`;

const lambda = new LambdaClient({ region: REGION });
const apigw = new ApiGatewayV2Client({ region: REGION });

/** ZIP HELPER */
async function zipLambda() {
    return new Promise((resolve) => {
        const output = fs.createWriteStream("lambda.zip");
        const archive = archiver("zip");
        archive.pipe(output);

        archive.file("lambdaS3.js", { name: "index.js" });

        archive.finalize();
        output.on("close", resolve);
    });
}

(async () => {
    console.log("=== Zipping Lambda ===");
    await zipLambda();

    console.log("=== Creating Lambda Function ===");

    let lambdaArn;

    try {
        const fn = await lambda.send(
            new CreateFunctionCommand({
                FunctionName: FUNCTION_NAME,
                Handler: "index.handler",
                Role: ROLE_ARN,
                Runtime: "nodejs18.x",
                Code: { ZipFile: fs.readFileSync("lambda.zip") }
            })
        );
        lambdaArn = fn.FunctionArn;
    } catch (err) {
        if (err.name === "ResourceConflictException") {
            console.log("Lambda already exists — fetching ARN");
            const fn = await lambda.send(
                new GetFunctionCommand({ FunctionName: FUNCTION_NAME })
            );
            lambdaArn = fn.Configuration.FunctionArn;
        } else {
            throw err;
        }
    }

    console.log("Lambda ARN:", lambdaArn);

    console.log("=== Creating API Gateway HTTP API ===");

    const api = await apigw.send(
        new CreateApiCommand({
            Name: "s3-private-proxy-api",
            ProtocolType: "HTTP"
        })
    );

    const apiId = api.ApiId;
    console.log("API ID:", apiId);

    console.log("=== Creating Integration ===");

    const integration = await apigw.send(
        new CreateIntegrationCommand({
            ApiId: apiId,
            IntegrationType: "AWS_PROXY",
            IntegrationUri: lambdaArn,
            PayloadFormatVersion: "2.0"
        })
    );

    console.log("Integration ID:", integration.IntegrationId);

    console.log("=== Creating Route GET / ===");

    await apigw.send(
        new CreateRouteCommand({
            ApiId: apiId,
            RouteKey: "GET /",
            Target: `integrations/${integration.IntegrationId}`
        })
    );

    console.log("=== Creating Stage (prod) ===");

    const stage = await apigw.send(
        new CreateStageCommand({
            ApiId: apiId,
            StageName: "prod",
            AutoDeploy: true
        })
    );

    console.log("=== Adding Lambda Invoke Permission ===");

    const sourceArn = `arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${apiId}/*/GET/`;

    try {
        await lambda.send(
            new AddPermissionCommand({
                FunctionName: FUNCTION_NAME,
                Action: "lambda:InvokeFunction",
                Principal: "apigateway.amazonaws.com",
                SourceArn: sourceArn,
                StatementId: `apigw-${Date.now()}`
            })
        );
    } catch (err) {
        if (err.message.includes("exists")) {
            console.log("Permission already exists");
        } else {
            throw err;
        }
    }

    const url = `https://${apiId}.execute-api.${REGION}.amazonaws.com/prod/`;
    console.log("===============================================");
    console.log("🎉 Your private S3 website is LIVE at:");
    console.log(url);
    console.log("===============================================");
})();
