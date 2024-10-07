const fs = require("fs");
const { connect } = require("./connect");

const client = connect();

async function bulkIndex() {
  try {
    const jsonData = JSON.parse(
      fs.readFileSync("roche-saga_combined.json", "utf8")
    );

    const body = jsonData.flatMap((doc) => [
      { index: { _index: "roche" } },
      doc,
    ]);

    fs.writeFileSync(
      "bulk_data_to_upload.json",
      JSON.stringify(body, null, 2),
      "utf8"
    );

    const bulkResponse = await client.bulk({ refresh: true, body });

    console.log("Bulk response:", JSON.stringify(bulkResponse, null, 2));

    if (bulkResponse.body && bulkResponse.body.errors) {
      const erroredDocuments = [];
      bulkResponse.body.items.forEach((action, i) => {
        const operation = Object.keys(action)[0];
        if (action[operation].error) {
          erroredDocuments.push({
            status: action[operation].status,
            error: action[operation].error,
            operation: body[i * 2],
            document: body[i * 2 + 1],
          });
        }
      });

      console.log("Errored documents:", erroredDocuments);
      fs.writeFileSync(
        "errored_documents.json",
        JSON.stringify(erroredDocuments, null, 2),
        "utf8"
      );
    } else if (bulkResponse.errors) {
      console.log(
        "Bulk operation reported errors, but details are not available."
      );
    } else {
      console.log("Bulk operation completed successfully.");
    }

    const count = await client.count({ index: "roche" });
    console.log("Document count:", count);

    fs.writeFileSync(
      "bulk_response.json",
      JSON.stringify(bulkResponse, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("An error occurred during bulk indexing:", error);
  }
}

async function createIndexWithMapping() {
  try {
    await client.indices.create({
      index: "roche",
      body: {
        mappings: {
          properties: {
            "book-number": { type: "integer" },
            "chapter-number": { type: "integer" },
            "paragraph-number": { type: "integer" },
            "english-paragraph": { type: "text" },
            "spanish-paragraph": { type: "text" },
            "english-book-title": { type: "keyword" },
            "spanish-book-title": { type: "keyword" },
            "english-chapter-title": { type: "text" },
            "spanish-chapter-title": { type: "text" },
          },
        },
      },
    });
    console.log("Index created with mapping");
  } catch (error) {
    console.error("Error creating index:", error);
  }
}

async function main() {
  await client.indices.delete({ index: "roche", ignore_unavailable: true });
  await createIndexWithMapping();
  await bulkIndex();
}

main().catch(console.error);
