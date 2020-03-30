import { NatuallyFlowedLexer} from "./lexer/flowed";
import { NaturallyFlowedParser, NaturallyFlowedVisitor} from "./parser/flowed";
import {createSyntaxDiagramsCode} from "chevrotain";

const debug = require('debug')("naturally");

import fs from 'fs';
import path from 'path';

const naturallyFlowedExpression = `
Define a flow named import__full-customer that has the following tasks:
   A task named importCompanyFromAddresses
      that requires the following inputs: entityData, onCompanyCustomer
      that provides the following outputs: companyData
      using a resolver named run-flow-by-code
         with the following mapped inputs:
            param condition transformed with <<<OBJECT
              {
                "entityData":{
                  "attributes":"{{entityData.customer.attributes}}",
                  "tier":{"type":"client","id":"{{entityData.client}}"},
                  "user":"{{entityData.customer.user}}"
                }
              }
            OBJECT;
         with the following mapped outputs:
            param importResult mapped to companyData

`;

const parser = new NaturallyFlowedParser();
const visitor = new NaturallyFlowedVisitor();

function parseInput(text: string) {
  const lexingResult = NatuallyFlowedLexer.tokenize(text);
  parser.input = lexingResult.tokens;
  const parsedInput = parser.flowStatement();
  const jsonFlow = visitor.flowStatement(parsedInput);

  if (parser.errors.length > 0) {
    console.log(parser.errors);
    throw new Error("Errors were detected")
  }

  debug(jsonFlow);
  console.log(jsonFlow);
  console.log(JSON.stringify(jsonFlow));
}

parseInput(naturallyFlowedExpression);


// create the HTML Text
const serializedGrammar = parser.getSerializedGastProductions();
const htmlText = createSyntaxDiagramsCode(serializedGrammar);

// Write the HTML file to disk
const outPath = path.resolve(__dirname, "./")
fs.writeFileSync(outPath + "/generated_diagrams.html", htmlText);
