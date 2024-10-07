const { connect } = require("./connect");

const client = connect();

const index = "roche";

async function createIndex() {
  try {
    const response = await client.indices.create({
      index: index,
    });
    console.log("Index created successfully:", response);
  } catch (error) {
    console.error("Error creating index:", error.message);
    if (error.meta && error.meta.body) {
      console.error(
        "Elasticsearch error details:",
        JSON.stringify(error.meta.body, null, 2)
      );
    }
  } finally {
    await client.close();
  }
}

createIndex().catch(console.error);
