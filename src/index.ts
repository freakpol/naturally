import { NatuallyFlowedLexer} from "./lexer/flowed";
import { NaturallyFlowedParser, NaturallyFlowedVisitor} from "./parser/flowed";
import {createSyntaxDiagramsCode} from "chevrotain";

const debug = require('debug')("naturally");

import fs from 'fs';
import path from 'path';

const naturallyFlowedExpression = `
Define a flow named import__full-customer that has the following tasks:
   A task named decideCompanyCustomerOrClientCustomer
      that requires the following inputs: entityData
      that provides the following outputs: onCompanyCustomer, onClientCustomer
      using a resolver named flowed::Conditional
         with the following mapped inputs:
            param condition transformed with {{!!entityData.addresses && entityData.addresses.length > 0}}
         with the following mapped outputs:
            param onTrue mapped to onCompanyCustomer
            param onFalse mapped to onClientCustomer

   A task named importCompanyFromAddresses
      that requires the following inputs: entityData, onCompanyCustomer
      that provides the following outputs: companyData
      using a resolver named run-flow-by-code
         with the following mapped inputs:
            param flowCode with a fixed value of import__company-from-addresses
            param flowParams transformed with { entityData: '{{entityData.addresses}}' }
            param flowResults with a fixed value of ['importResult']
            param test mapped from entityData
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
