"use strict";

const { GATSBY_SAMPLES_BUCKET } = process.env;
const fetchSheet = require(`./fetch-sheet.js`).default;
const uuidv5 = require("uuid/v5");
const _ = require("lodash");
const crypto = require("crypto");
const seedConstant = "2972963f-2fcf-4567-9237-c09a2b436541";
const { createRemoteFileNode } = require(`gatsby-source-filesystem`);

const createImageNode = async (image, {
  store,
  cache,
  createNode,
  createNodeId
}) => {
  if (!image) {
    return;
  }

  const url = `${GATSBY_SAMPLES_BUCKET}/${image}`;
  try {
    const result = await createRemoteFileNode({
      url,
      store,
      cache,
      createNode,
      createNodeId
    });
    return result;
  } catch (e) {
    console.log('Error creating filenode\n', e);
  }
};

const buildNode = async (row, {
  store,
  cache,
  createNode,
  createNodeId
}, {
  spreadsheetId,
  worksheetTitle,
  credentials
}) => {

  let node = {
    id: uuidv5(row.id, uuidv5("gsheet", seedConstant)),
    parent: "__SOURCE__",
    children: [],
    internal: {
      type: _.camelCase(`googleSheet ${worksheetTitle} row`),
      contentDigest: crypto.createHash("md5").update(JSON.stringify(row)).digest("hex")
    }
  };

  if (Boolean(row.image)) {
    const localFile = await createImageNode(row.image, {
      store,
      cache,
      createNode,
      createNodeId
    });
    node.localFiles___NODE = [localFile.id];
  }

  createNode(Object.assign(row, node));
};

exports.sourceNodes = async ({ boundActionCreators, createNodeId, store, cache }, { spreadsheetId, worksheetTitle, credentials }) => {
  const { createNode } = boundActionCreators;
  let rows = await fetchSheet(spreadsheetId, worksheetTitle, credentials);
  rows.forEach(row => buildNode(row, { store, cache, createNode, createNodeId }, { spreadsheetId, worksheetTitle, credentials }));
};