

//import OpenAI from "openai";
const {OpenAI} = require('openai');
let openai = null;

function getOpenAIClient() {
  if (!openai) {
    openai = new OpenAI();
  }
  return openai;
}


async function openAIrequest( topic )
{

  console.log("==== openAIrequest ====");

  const client = getOpenAIClient();


  let request = "You are an OMD JSON generator.\n";
  request += "Return exactly ONE valid JSON object with top-level 'omdType'.\n";
  request += "Output raw JSON only: no markdown, no comments, no backticks, no explanation.\n\n";

  request += "### Schema-first rules (highest priority):\n";
  request += "1) Use ONLY keys and structures that appear in the provided Schemas.\n";
  request += "2) Include all required fields for the selected omdType.\n";
  request += "3) Do not invent aliases or legacy fields if they are not in schema.\n";
  request += "4) If the request is ambiguous, choose the simplest valid object that best matches intent.\n\n";

  request += "### Schema selection rules:\n";
  request += "1) Consider every schema equally; do not favor any omdType by default.\n";
  request += "2) Choose the schema whose notes, required fields, and sample structure best match the request.\n";
  request += "3) A literal equation shown as part of a shape or diagram is not equationWork unless the user asks for worked steps, solving, or row-by-row transformations.\n";
  request += "4) Use equationWork only when the request clearly asks for solution steps or equation manipulation.\n";
  request += "5) If the user describes a diagram or object and also includes text inside or below it, prefer the diagram/object schema unless the request is explicitly about solving the equation.\n\n";

  request += "Intent hints for common requests:\n";
  request += "- number line / dots on a line -> numberLine\n";
  request += "- graph / coordinate / y= -> coordinatePlane\n";
  request += "- equation stack -> equationStack\n";
  request += "- equation work / worked steps / solve step by step -> equationWork\n";
  request += "- balance / hanger -> balanceHanger\n";
  request += "- table / data table -> table\n\n";
  request += "- shape-only language (e.g. triangle, rectangle) -> matching shape schema\n";
  request += "- if multiple schemas seem possible, pick the one with the fewest required fields that still fully matches the request.\n";
  request += "- none of these? REFER TO THE SCHEMA TO FIND BEST FIT BASED ON REQUEST.\n\n";

  request += "Formatting preferences:\n";
  request += "- For omdType='equation', prefer string equation form when schema supports it.\n";
  request += "- For equationWork rows, use row kinds from schema; use operation rows for aligned operations.\n";
  request += "- Avoid optional styling keys unless user asks for styling or they clarify intent.\n\n";

  request += "Request: " + topic + "\n";
  request += "### Schemas \n (STRICT - adhere to these fields only):\n" + jsonSchemas + "\n";
  request += "Reference samples (use EXACT property names and structure):\n" + jsonSample + "\n";

  console.log( "request: " , request );

  const completion = await client.chat.completions.create({
    messages: [{ role: "system", content: request  } ],
    model: "gpt-5.4-nano",
    temperature: 0.3
  });

  console.log( "--------------" );
  console.log( completion.choices[0].message.content  );
  return completion.choices[0].message.content;
}


// ====================== NETLIFY FUNCTION CODE ======================== //


const handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const topic = event.queryStringParameters?.topic || 'make a number line';

    const response = await openAIrequest(topic);
    console.log('response: ', response);

    return {
      statusCode: 200,
      headers,
      body: response
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: error.toString()
    };
  }
}

module.exports = { handler }


const fs = require('fs');
const path = require('path');
console.log(__dirname);

function readFirstExistingFile(candidatePaths) {
  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        const contents = fs.readFileSync(candidate, 'utf8');
        if (contents && contents.trim()) {
          return { path: candidate, contents };
        }
      }
    } catch (_error) {
      // Continue trying next path.
    }
  }

  return { path: null, contents: '' };
}

function loadPromptAssets() {
  const schemaCandidates = [
    path.resolve(process.cwd(), 'src/omd-schemas.json'),
    path.resolve(__dirname, '../../src/omd-schemas.json'),
    path.resolve(__dirname, '../src/omd-schemas.json')
  ];

  const sampleCandidates = [
    path.resolve(process.cwd(), 'src/omd-json-samples.js'),
    path.resolve(__dirname, '../../src/omd-json-samples.js'),
    path.resolve(__dirname, '../src/omd-json-samples.js')
  ];

  const schemaResult = readFirstExistingFile(schemaCandidates);
  const sampleResult = readFirstExistingFile(sampleCandidates);

  console.log('ai-omd-lookup prompt assets', {
    cwd: process.cwd(),
    schemaPath: schemaResult.path,
    schemaBytes: schemaResult.contents.length,
    samplePath: sampleResult.path,
    sampleBytes: sampleResult.contents.length
  });

  return {
    jsonSchemas: schemaResult.contents,
    jsonSample: sampleResult.contents
  };
}

const { jsonSchemas, jsonSample } = loadPromptAssets();
