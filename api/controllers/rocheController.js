const { connect } = require("../elasticsearch/connect");
const client = connect();

const rocheSearch = async (req, res) => {
  const searchPhrase = req.query.q;
  try {
    const result = await client.search({
      index: "roche",
      body: {
        query: {
          multi_match: {
            query: searchPhrase,
            fields: ["en", "es", "de", "fr", "it"],
            type: "phrase",
          },
        },
        highlight: {
          fields: {
            en: {},
            es: {},
            de: {},
            fr: {},
            it: {},
          },
          pre_tags: ["<b>"],
          post_tags: ["</b>"],
          number_of_fragments: 0,
        },
      },
      size: 30,
    });

    if (!result.hits || !result.hits.hits || result.hits.hits.length === 0) {
      return res.status(404).json({ message: "No paragraphs found." });
    }

    const resultsWithSurrounding = await Promise.all(
      result.hits.hits.map(async (hit) => {
        const targetParagraph = hit._source;
        const highlightedParagraph = hit.highlight;

        const documentNumber = targetParagraph["document-number"];
        const paragraphCount = targetParagraph["paragraph-count"];

        const previousParagraphCount = paragraphCount - 1;
        const nextParagraphCount = paragraphCount + 1;

        const surroundingResults = await client.search({
          index: "roche",
          body: {
            query: {
              bool: {
                should: [
                  {
                    bool: {
                      must: [
                        { term: { "document-number": documentNumber } },
                        { term: { "paragraph-count": previousParagraphCount } },
                      ],
                    },
                  },
                  {
                    bool: {
                      must: [
                        { term: { "document-number": documentNumber } },
                        { term: { "paragraph-count": nextParagraphCount } },
                      ],
                    },
                  },
                ],
              },
            },
          },
          size: 2,
        });

        const surroundingParagraphs = surroundingResults.hits.hits.map(
          (hit) => hit._source
        );

        return {
          hit: {
            "previous-paragraph":
              surroundingParagraphs.find(
                (p) => p["paragraph-count"] === previousParagraphCount
              ) || null,
            "main-paragraph": {
              ...targetParagraph,
              en: highlightedParagraph.en
                ? highlightedParagraph.en[0]
                : targetParagraph.en,
              es: highlightedParagraph.es
                ? highlightedParagraph.es[0]
                : targetParagraph.es,
              de: highlightedParagraph.de
                ? highlightedParagraph.de[0]
                : targetParagraph.de,
              fr: highlightedParagraph.fr
                ? highlightedParagraph.fr[0]
                : targetParagraph.fr,
              it: highlightedParagraph.it
                ? highlightedParagraph.it[0]
                : targetParagraph.it,
            },
            "next-paragraph":
              surroundingParagraphs.find(
                (p) => p["paragraph-count"] === nextParagraphCount
              ) || null,
          },
        };
      })
    );

    return res.status(200).json(resultsWithSurrounding);
  } catch (error) {
    console.error("Search error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error.", error: error.toString() });
  }
};

module.exports = { rocheSearch };
