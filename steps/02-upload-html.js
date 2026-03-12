import fs from "fs";
import { s3, BUCKET } from "../shared.js";
import { PutObjectCommand, PutBucketWebsiteCommand } from "@aws-sdk/client-s3";

console.log("Uploading index.html...");

await s3.send(
    new PutObjectCommand({
        Bucket: BUCKET,
        Key: "index.html",
        Body: fs.readFileSync("./index.html"),
        ContentType: "text/html"
    })
);

await s3.send(
    new PutBucketWebsiteCommand({
        Bucket: BUCKET,
        WebsiteConfiguration: {
            IndexDocument: { Suffix: "index.html" }
        }
    })
);

console.log("HTML uploaded and website hosting enabled.");
