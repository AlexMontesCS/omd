

//import OpenAI from "openai";
const {OpenAI} = require('openai');
const openai = new OpenAI();


async function openAIrequest( topic )
{

  console.log("==== openAIrequest ====");


  let request = "Return ONE valid JSON object with top-level 'omdType'. NO markdown or extra text just pure valid json. DO NOT WRAP IN BACKTICKS LIKE MARKDOWN\n";
  request += "CRITICAL: Always include ALL required fields for each type. Missing fields cause rendering failures.\n";
  request += "IMPORTANT: Choose the RIGHT visualization type based on keywords:\n";
  request += "- 'number line' with 'dot' or 'point' = numberLine (1D)\n";
  request += "- 'graph' or 'coordinate' or 'y=' = coordinatePlane (2D)\n";
  request += "- 'balance' or 'hanger' = balanceHanger\n";
  request += "- 'table' or 'data' = table\n";
  request += "- 'equation stack' = equationStack\n\n";
  request += "coordinatePlane: Use for 2D graphs with x-y axes and functions. MUST include xMin, xMax, yMin, yMax, tickInterval, and graphEquations array.\n";
  request += "\tUse when: 'graph', 'coordinate plane', 'function graph', 'plot', '2D', 'x-y plane', equations like 'y='\n";
  request += "\tdefaults: if no domain specified, xMin=-10,xMax=10,yMin=-10,yMax=10, tickInterval=1.\n";
  request += "\tgraphEquations array MUST contain objects with: equation, color, strokeWidth\n";
  request += "\tcolor should be 'black' if no color specified, strokeWidth should be 2 if not specified\n";
  request += "\tExample: {\"omdType\":\"coordinatePlane\",\"xMin\":-10,\"xMax\":10,\"yMin\":-10,\"yMax\":10,\"tickInterval\":1,\"graphEquations\":[{\"equation\":\"2*x + 3\",\"color\":\"black\",\"strokeWidth\":2}]}\n\n";
  request += "balanceHanger: MUST include leftValues and rightValues arrays.\n";
  request += "\tExample: {\"omdType\":\"balanceHanger\",\"leftValues\":[3,\"x\",5],\"rightValues\":[2,\"y\",8]}\n\n";
  request += "table: MUST include headers and data arrays OR equation for function tables.\n";
  request += "\tExample: {\"omdType\":\"table\",\"headers\":[\"x\",\"y\"],\"equation\":\"y = 2x + 3\"}\n\n";
  request += "tapeDiagram: MUST include values array and labelSet array.\n";
  request += "\tExample: {\"omdType\":\"tapeDiagram\",\"values\":[2,3],\"labelSet\":[{\"omdType\":\"omdTapeLabel\",\"startIndex\":0,\"endIndex\":2,\"label\":\"5\",\"showBelow\":true}]}\n\n";
  request += "numberLine: Use for 1D number lines with dots/points. MUST include min, max, and dotValues array.\n";
  request += "\tUse when: 'number line', '1D line', 'dots on a line', 'points on number line'\n";
  request += "\tExample: {\"omdType\":\"numberLine\",\"min\":0,\"max\":10,\"dotValues\":[3,7],\"label\":\"Number Line\"}\n\n";
  request += "numberTile: MUST include value.\n";
  request += "\tExample: {\"omdType\":\"numberTile\",\"value\":8}\n\n";
  request += "ratioChart: MUST include numerator and denominator.\n";
  request += "\tExample: {\"omdType\":\"ratioChart\",\"numerator\":3,\"denominator\":5}\n\n";
  request += "tileEquation: MUST include left and right arrays OR equation string.\n";
  request += "\tExample: {\"omdType\":\"tileEquation\",\"equation\":\"2x + 3 = 11\"}\n\n";
  request += "spinner: MUST include divisions and arrowPosition.\n";
  request += "\tExample: {\"omdType\":\"spinner\",\"divisions\":8,\"arrowPosition\":3}\n\n";
  request += "equationStack: MUST include equations array.\n";
  request += "\tExample: {\"omdType\":\"equationStack\",\"equations\":[\"2x + 3 = 5\",\"x = 1\"]}\n\n";
  request += "equation: MUST include leftExpression and rightExpression objects. For complex expressions, use 'expression' type with termsAndOpers array.\n";
  request += "\tSimple equation: {\"omdType\":\"equation\",\"leftExpression\":{\"omdType\":\"term\",\"coefficient\":2,\"variable\":\"x\"},\"rightExpression\":{\"omdType\":\"number\",\"value\":6}}\n";
  request += "\tComplex equation: {\"omdType\":\"equation\",\"leftExpression\":{\"omdType\":\"expression\",\"termsAndOpers\":[{\"omdType\":\"term\",\"coefficient\":3,\"variable\":\"x\"},{\"omdType\":\"operator\",\"symbol\":\"+\"},{\"omdType\":\"number\",\"value\":2}]},\"rightExpression\":{\"omdType\":\"number\",\"value\":3}}\n\n";
  request += "expression: MUST include termsAndOpers array with alternating terms and operators.\n";
  request += "\tExample: {\"omdType\":\"expression\",\"termsAndOpers\":[{\"omdType\":\"term\",\"coefficient\":2,\"variable\":\"x\"},{\"omdType\":\"operator\",\"symbol\":\"+\"},{\"omdType\":\"number\",\"value\":3}]}\n";
  request += "\tComplex example: {\"omdType\":\"expression\",\"termsAndOpers\":[{\"omdType\":\"term\",\"coefficient\":3,\"variable\":\"x\"},{\"omdType\":\"operator\",\"symbol\":\"+\"},{\"omdType\":\"number\",\"value\":2},{\"omdType\":\"operator\",\"symbol\":\"*\"},{\"omdType\":\"term\",\"coefficient\":1,\"variable\":\"y\"}]}\n\n";
  request += "term: MUST include coefficient, variable, exponent.\n";
  request += "\tExample: {\"omdType\":\"term\",\"coefficient\":2,\"variable\":\"x\",\"exponent\":1}\n\n";
  request += "number: MUST include value.\n";
  request += "\tExample: {\"omdType\":\"number\",\"value\":5}\n\n";
  request += "variable: MUST include name.\n";
  request += "\tExample: {\"omdType\":\"variable\",\"name\":\"x\"}\n\n";
  request += "rightTriangle: MUST include side1 and side2.\n";
  request += "\tExample: {\"omdType\":\"rightTriangle\",\"side1\":3,\"side2\":4}\n\n";
  request += "rectangle: MUST include width and height.\n";
  request += "\tExample: {\"omdType\":\"rectangle\",\"width\":4,\"height\":6}\n\n";
  request += "circle: MUST include radius.\n";
  request += "\tExample: {\"omdType\":\"circle\",\"radius\":5}\n\n";
  request += "scatter: output dotValues only (each dot [x,y] or [x,y,color]); no graphEquations/lineSegments\n";
  request += "curves: choose an exact-fit function and verify by testing x-values; function must be continuous on its domain.\n";
  request += "IMPORTANT: When parsing equation strings like '3x+2=3':\n";
  request += "- Split by '=' to get left and right sides\n";
  request += "- Parse each side as an expression with termsAndOpers\n";
  request += "- For '3x+2': termsAndOpers = [{\"omdType\":\"term\",\"coefficient\":3,\"variable\":\"x\"}, {\"omdType\":\"operator\",\"symbol\":\"+\"}, {\"omdType\":\"number\",\"value\":2}]\n";
  request += "- For '3': termsAndOpers = [{\"omdType\":\"number\",\"value\":3}]\n";
  request += "SPECIFIC EXAMPLE for '3x+2=3': {\"omdType\":\"equation\",\"leftExpression\":{\"omdType\":\"expression\",\"termsAndOpers\":[{\"omdType\":\"term\",\"coefficient\":3,\"variable\":\"x\"},{\"omdType\":\"operator\",\"symbol\":\"+\"},{\"omdType\":\"number\",\"value\":2}]},\"rightExpression\":{\"omdType\":\"expression\",\"termsAndOpers\":[{\"omdType\":\"number\",\"value\":3}]}}\n\n";

  request += "Request: " + decodeURIComponent(topic) + "\n";
  request += "Schemas (STRICT - adhere to these fields only):\n" + jsonSchemas + "\n";
  request += "Reference samples (use EXACT property names and structure):\n" + jsonSample + "\n";

  console.log( "request: " , request );

  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: request  } ],
    model: "gpt-4o",
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

    // Check if this is a simple equation request that we can parse locally
    const equationMatch = topic.match(/omdEquation\s+of\s+([^.]+)\.?/i);
    if (equationMatch) {
      const equationString = equationMatch[1].trim();
      console.log("Detected equation string:", equationString);
      
      // Try to parse it locally first
      try {
        const fs = require('fs');
        const path = require('path');
        
        // Load the parsing utilities
        const utilsPath = path.resolve(process.cwd(), 'src/omdUtils.js');
        const utilsCode = fs.readFileSync(utilsPath, 'utf8');
        
        // Extract the parseEquationString function
        const parseEquationString = new Function('str', `
          ${utilsCode}
          return parseEquationString(str);
        `);
        
        const parsed = parseEquationString(equationString);
        if (parsed) {
          const result = {
            omdType: 'equation',
            leftExpression: parsed.leftExpression,
            rightExpression: parsed.rightExpression
          };
          console.log("Parsed equation locally:", JSON.stringify(result, null, 2));
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
          };
        }
      } catch (parseError) {
        console.log("Local parsing failed, falling back to AI:", parseError.message);
      }
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
  const sp = path.resolve(process.cwd(), 'src/json-schemas.md');
  jsonSchemas = fs.readFileSync(sp, 'utf8');
} catch (e) {
  jsonSchemas = '';
}

