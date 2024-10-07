const { Client } = require("@elastic/elasticsearch");

const client = new Client({
  node: process.env.ELASTIC_URL,
  auth: {
    username: process.env.ELASTIC_USER,
    password: process.env.ELASTIC_PASSWORD,
  },
});

// Function to search for a sentence and retrieve surrounding paragraphs
const searchParas = async (searchPhrase) => {
  try {
    // First, get the specified paragraphs based on the search phrase
    const result = await client.search({
      index: "roche",
      body: {
        query: {
          match_phrase: { "english-paragraph": searchPhrase },
        },
      },
      size: 10, // Adjust size as needed to accommodate multiple hits
    });

    if (result.hits.hits.length === 0) {
      return []; // Return an empty array if no paragraphs are found
    }

    const resultsWithSurrounding = await Promise.all(
      result.hits.hits.map(async (hit) => {
        const targetParagraph = hit._source;

        // Get the chapter and paragraph number from the hit
        const chapterNum = targetParagraph["chapter-number"];
        const paragraphNum = targetParagraph["paragraph-number"];

        // Calculate surrounding paragraph numbers
        const previousParagraphNum = paragraphNum - 1;
        const nextParagraphNum = paragraphNum + 1;

        // Get surrounding paragraphs
        const surroundingResults = await client.search({
          index: "roche",
          body: {
            query: {
              bool: {
                should: [
                  {
                    bool: {
                      must: [
                        { term: { "chapter-number": chapterNum } },
                        {
                          term: {
                            "paragraph-number": previousParagraphNum,
                          },
                        },
                      ],
                    },
                  },
                  {
                    bool: {
                      must: [
                        { term: { "chapter-number": chapterNum } },
                        {
                          term: {
                            "paragraph-number": nextParagraphNum,
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
          size: 2, // Only need the two surrounding paragraphs
        });

        // Get the surrounding paragraphs
        const surroundingParagraphs = surroundingResults.hits.hits.map(
          (hit) => hit._source
        );

        // Return an object linking the target paragraph with its surrounding paragraphs
        return {
          target: {
            ...targetParagraph,
            "context-paragraphs": {
              "previous-paragraph": surroundingParagraphs[0] || null, // Previous paragraph
              "next-aragraph": surroundingParagraphs[1] || null, // Next paragraph
            },
          },
        };
      })
    );

    return resultsWithSurrounding;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

// Example usage
(async () => {
  const searchPhrase = "“It goes on up to the top, I think,” he whispered."; // The phrase to search for
  const results = await searchParas(searchPhrase);
  console.log(JSON.stringify(results, null, 2));
})();
