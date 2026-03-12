import { iam, ROLE_NAME } from "../shared.js";
import { CreateRoleCommand, AttachRolePolicyCommand } from "@aws-sdk/client-iam";

console.log("Creating IAM role...");

const role = await iam.send(
    new CreateRoleCommand({
        RoleName: ROLE_NAME,
        AssumeRolePolicyDocument: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Effect: "Allow",
                Principal: { Service: "lambda.amazonaws.com" },
                Action: "sts:AssumeRole"
            }]
        })
    })
);

await iam.send(
    new AttachRolePolicyCommand({
        RoleName: ROLE_NAME,
        PolicyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    })
);

console.log("Role created:", role.Role.Arn);
