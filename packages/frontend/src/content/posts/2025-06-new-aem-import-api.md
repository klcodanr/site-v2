---
title: "New in AEM Assets: Asset Import API"
description: "Learn about the new Asset Import API in AEM Assets that enables programmatic import of assets from external URLs"
pubDate: 2025-06-12
tags: ["Adobe Experience Manager", "AEM Assets", "OpenAPI", "Migration"]
display: post
published: true
image: "/images/posts/2025-06/Firefly_a conveyor belt emerging from a factory with boxes  172338.jpg"
hideInNav: false
---

Adobe Experience Manager (AEM) Assets has just launched a new API endpoint to import assets directly from any publicly accessible URL, making it easier than ever to automate asset ingestion workflows. The new endpoint is part of the [AEM Assets Author API](https://developer.adobe.com/experience-cloud/experience-manager-apis/api/stable/assets/author/) and was introduced in release 2025.04.

## Key Features

The AEM Assets Import API supports the following features:

- **URL-based Import**: Import assets directly from any publicly accessible URL
- **Batch Processing**: Import multiple assets in a single API call
- **Metadata Support**: Include custom metadata during import
- **Progress Tracking**: Monitor import status and progress

## How to Use the API

To use the API, you first need to [get a token and Client ID](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/generating-access-tokens-for-server-side-apis) to call the API.

Once you have the Client ID and access token, you can call the fromUrl endpoint to start the import:

```bash
curl -i -X POST \
  'https://<BUCKET>.adobeaemcloud.com/adobe/assets/import/fromUrl' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -H 'X-Api-Key: <CLIENT_ID>' \
  -d '{
    "assetMetadata": {
      "dc:title": "My Asset",
      "xmp:Rating": 5,
      "prism:expirationDate": "2019-01-01T00:00:00.000Z"
    },
    "folder": "/content/dam/myfolder",
    "files": [
      {
        "fileName": "My-Asset.jpeg",
        "mimeType": "image/jpeg",
        "fileSize": 123456,
        "url": "https://example.com/my-asset.jpg"
      }
    ]
  }'
```

Assuming the import is accepted, you should receive a 202 response with a body like:

```JSON
{
  "id": "c82f6f05-07e3-5d13-b6bf-be0ac408fddf",
  "operation": "aem.assets.import.fromurl",
  "data": {
    "id": "c82f6f05-07e3-5d13-b6bf-be0ac408fddf",
    "config": {
      "assetMetadata": {
        "dc:title": "My Asset",
        "xmp:Rating": 5,
        "prism:expirationDate": "2019-01-01T00:00:00.000Z"
      },
      "folder": "urn:aaid:aem:8964ca64-b302-5abe-88db-e1729385287b",
      "items": [
        "https://example.com/my-asset.jpg"
      ]
    },
    "processedFiles": [],
    "progress": {
      "imported": 0,
      "failed": 0,
      "skipped": 0,
      "started": "2025-03-24T18:23:15.885Z",
      "total": 2,
      "lastUpdated": "2025-03-24T18:23:15.885Z",
      "size": 0,
      "transferred": 0,
      "step": "QUEUED"
    }
  },
  "errors": [],
  "warnings": [],
  "state": "PROCESSING"
}
```

To track your import job, you can then poll the Import Job Status endpoint:

```bash
curl -i -X GET 'https://<bucket>.adobeaemcloud.com/adobe/assets/import/jobs/<importJobId>/status' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'If-None-Match: string' \
  -H 'X-Api-Key: <CLIENT_ID>'
```

This will return a similar result as the initial request. You can get detailed progress data using the `data.progress` object or wait for the `state` to be `COMPLETED`.

## Considerations

A few things to consider when using this API:

### Public URLs

The URLs must be publicly accessible without authentication. This could mean importing assets from generally available URLs, for example from a website. To make assets available for import that aren't generally available, most cloud providers support creating signed URLs:

 - S3: https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html
 - Azure Blob Storage: https://learn.microsoft.com/en-us/rest/api/storageservices/delegate-access-with-shared-access-signature
 - Google Cloud Storage: http://cloud.google.com/storage/docs/access-control/signed-urls

### Number of files

The API can support up to 300 files per request. Within this limit, it's better to import multiple files in a request rather than multiple requests as there's some overhead required in creating and managing the job.

### Metadata Collisions

When specifying metadata with the upload, you have to consider that metadata extracted from the [file XMP metadata](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/admin/xmp-metadata) will override metadata values provided with the update. Therefore it's generally better to stick with custom properties and namespaces to avoid collisions.

## Conclusion

The new AEM Assets Import API is a tremendous accelerator for customers wanting to automate asset import processes or migrating to AEM Assets.

For more information about the Asset Import API, including detailed API documentation and examples, visit the [AEM Assets documentation](https://developer.adobe.com/experience-cloud/experience-manager-apis/api/stable/assets/author/#operation/importFromUrl).
