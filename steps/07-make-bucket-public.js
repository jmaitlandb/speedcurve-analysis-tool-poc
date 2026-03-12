import { s3, readState } from "../shared.js";
import { PutBucketPolicyCommand, PutPublicAccessBlockCommand } from "@aws-sdk/client-s3";

const { name: bucketName } = readState("bucket");

console.log("Making bucket public:", bucketName);

// 1. Disable public access block
await s3.send(
    new PutPublicAccessBlockCommand({
        Bucket: bucketName,
        PublicAccessBlockConfiguration: {
            BlockPublicAcls: false,
            IgnorePublicAcls: false,
            BlockPublicPolicy: false,
            RestrictPublicBuckets: false
        }
    })
);

console.log("✔ Public access block disabled");

// 2. Add bucket policy
const policy = {
    Version: "2012-10-17",
    Statement: [
        {
            Sid: "PublicReadGetObject",
            Effect: "Allow",
            Principal: "*",
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucketName}/*`]
        }
    ]
};

await s3.send(
    new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify(policy)
    })
);

console.log("✔ Bucket policy added");
console.log("\nYour S3 website should now be accessible!");
