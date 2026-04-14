

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

  request += "Routing hints for ambiguous language:\n";
  request += "- number line / dots on a line -> numberLine\n";
  request += "- graph / coordinate / y= -> coordinatePlane\n";
  request += "- equation stack -> equationStack\n";
  request += "- equation work / worked steps / solve step by step -> equationWork\n";
  request += "- balance / hanger -> balanceHanger\n";
  request += "- table / data table -> table\n\n";

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
    const topic = event.queryStringParameters.topic || 'make a number line';

    // Deterministic handling for direct equationWork requests.
    if (/\bomdequationwork\b|\bequation\s*work\b|\bworked\s*steps\b/i.test(topic)) {
      const inlineEquationMatch = topic.match(/([^=\n]+)=([^\n]+)/);
      const leftSide = inlineEquationMatch
        ? inlineEquationMatch[1].replace(/^.*?:\s*/, '').trim()
        : '';
      const rightSide = inlineEquationMatch ? inlineEquationMatch[2].trim() : '';
      const equationWorkResult = {
        omdType: 'equationWork',
        rows: inlineEquationMatch
          ? [
              {
                kind: 'equation',
                left: leftSide,
                right: rightSide
              }
            ]
          : []
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(equationWorkResult)
      };
    }

    // If the request looks like an equation, return the string form directly (math.js parsing happens client-side)
    const equationMatch = topic.match(/(?:omdEquation|equation)\s+(?:of|for|=)?\s*([^.\\n]+)=([^.\\n]+)/i);
    if (equationMatch) {
      const equationString = `${equationMatch[1].trim()}=${equationMatch[2].trim()}`;
      console.log("Detected equation string:", equationString);
      const result = { omdType: 'equation', equation: equationString };
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    var response = await openAIrequest( topic );
    console.log( "response: ", response );

    return {
      statusCode: 200,
      headers,
      body: response
    }
  } catch (error) {
    return { 
      statusCode: 500, 
      headers,
      body: error.toString() 
    }
  }
}

module.exports = { handler }


const fs = require('fs');
const path = require('path');
console.log(__dirname);

let jsonSample = '';
try {
  const p = path.resolve(process.cwd(), 'src/omd-json-samples.js');
  jsonSample = fs.readFileSync(p, 'utf8');
} catch (e) {
  jsonSample = '';
}

// Load schemas to guide the model to strict formats
let jsonSchemas = '';
try {
  const sp = path.resolve(process.cwd(), 'src/omd-schemas.json');
  jsonSchemas = fs.readFileSync(sp, 'utf8');
} catch (e) {
  jsonSchemas = '';
}
