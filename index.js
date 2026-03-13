const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({ region: "eu-north-1" });

exports.handler = async (event) => {
    try {
        const res = await s3.send(
            new GetObjectCommand({
                Bucket: "inno-bucket-brownj58-1773317244122",
                Key: "index.html"
            })
        );

        const body = await res.Body.transformToString();

        return {
            statusCode: 200,
            headers: { "Content-Type": "text/html" },
            body: body
        };
    } catch (err) {
        console.error("S3 read error:", err);

        return {
            statusCode: 500,
            headers: { "Content-Type": "text/plain" },
            body: "Error loading file"
        };
    }
};