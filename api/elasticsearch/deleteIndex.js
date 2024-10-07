const { connect } = require("./connect");

const client = connect();

const index = "roche";

async function deleteIndex() {
  try {
    const response = await client.indices.delete({ index: index });
    console.log("Index deleted successfully:", response);
  } catch (error) {
    console.error("Error deleting index:", error.message);
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

deleteIndex();
