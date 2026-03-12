import fs from "fs";
import archiver from "archiver";
import { lambda, ROLE_NAME } from "../shared.js";
import {
    CreateFunctionCommand
} from "@aws-sdk/client-lambda";

function zip(name) {
    return new Promise((resolve) => {
        const output = fs.createWriteStream(`${name}.zip`);
        const archive = archiver("zip");
        archive.pipe(output);
        archive.file(`${name}.js`, { name: "index.js" });
        archive.finalize();
        output.on("close", resolve);
    });
}

console.log("Creating Lambda 1 (hello)...");

await zip("lambda1");

const roleArn = `arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:role/${ROLE_NAME}`;

await lambda.send(
    new CreateFunctionCommand({
        FunctionName: "lambda1-demo",
        Handler: "index.handler",
        Runtime: "nodejs18.x",
        Role: roleArn,
        Code: { ZipFile: fs.readFileSync("lambda1.zip") },
    })
);

console.log("Lambda1 created.");
