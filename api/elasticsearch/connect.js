const { Client } = require("@elastic/elasticsearch");

require("dotenv").config();
const isDevelopment = process.env.NODE_ENV === "development";

const connect = () => {
  const client = new Client({
    node: process.env.ELASTIC_URL,
    auth: {
      username: process.env.ELASTIC_USER,
      password: process.env.ELASTIC_PASSWORD,
    },
    tls: {
      rejectUnauthorized: !isDevelopment,
    },
  });
  return client;
};

module.exports = { connect };
