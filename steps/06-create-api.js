import { apigw } from "../shared.js";
import { CreateApiCommand } from "@aws-sdk/client-apigatewayv2";
import fs from "fs";

console.log("Creating API...");

const api = await apigw.send(
    new CreateApiCommand({
        Name: "demo-api",
        ProtocolType: "HTTP"
    })
);

console.log("API created:", api.ApiId);

fs.writeFileSync("api.json", JSON.stringify(api, null, 2));
