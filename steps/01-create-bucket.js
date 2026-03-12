import { s3, REGION, BUCKET } from "../shared.js";
import { CreateBucketCommand } from "@aws-sdk/client-s3";

console.log("Creating S3 bucket...");

await s3.send(
    new CreateBucketCommand({
        Bucket: BUCKET,
        CreateBucketConfiguration: { LocationConstraint: REGION }
    })
);

console.log(`Bucket created: ${BUCKET}`);
