import { createToken } from "chevrotain";
import { debug as debugFn } from "debug";
const debug = debugFn("naturally:tokens");

const flowDefinitionRegEx = /Define a flow named ([._a-zA-Z][.\-_a-zA-Z0-9]+) that has the following tasks:/;
const taskDefinitionRegEx = /A task named ([._a-zA-Z][.\-_a-zA-Z0-9]+)/;
const taskRequiresRegEx = /that requires the following inputs: (([._a-zA-Z][.\-_a-zA-Z]+,\s?)*[._a-zA-Z][.\-_a-zA-Z]+)/;
const taskProvidesRegEx = /that provides the following outputs: (([._a-zA-Z][.\-_a-zA-Z]+,\s?)*[._a-zA-Z][.\-_a-zA-Z]+)/;
const resolverDefinitionRegEx = /using a resolver named ([._a-zA-Z][.:\-_a-zA-Z0-9]+)/;
const resolverWithInputsRegEx = /with the following mapped inputs:/;
const resolverInputMappedRegEx = /param ([._a-zA-Z][.\-_a-zA-Z0-9]+) mapped from ([._a-zA-Z][.\-_a-zA-Z0-9]+)/;
const resolverInputTransformedWithStringRegEx = /param ([._a-zA-Z][.\-_a-zA-Z0-9]+) transformed with string (.+)/;
const resolverInputTransformedWithObjectRegEx = /param ([._a-zA-Z][.\-_a-zA-Z0-9]+) transformed with <<<OBJECT(.+)OBJECT;/s;
const resolverInputFixedBasicRegEx = /param ([._a-zA-Z][.\-_a-zA-Z0-9]+) with a fixed (numeric|boolean|string|array) value of (.+)/;
const resolverInputFixedNullRegEx = /param ([._a-zA-Z][.\-_a-zA-Z0-9]+) with a fixed null value/;
const resolverInputFixedObjectRegEx = /param ([._a-zA-Z][.\-_a-zA-Z0-9]+) with a fixed object value of <<<OBJECT(.+)OBJECT;/s;
const resolverWithOutputsRegEx = /with the following mapped outputs:/;
const resolverOutputMappedRegEx = /param ([._a-zA-Z][.\-_a-zA-Z0-9]+) mapped to ([._a-zA-Z][.\-_a-zA-Z0-9]+)/;

const regexTest = (
  regex: RegExp,
  startString: string,
  text: string,
  startOffset: number,
  lineEnding: string = "\n"
) => {
  const subtext = text.substr(
    startOffset,
    text.substr(startOffset).indexOf(lineEnding) + lineEnding.length
  );



  if (subtext.startsWith(startString)) {




    regex.lastIndex = startOffset;

    const result = regex.exec(subtext);


    if (result) {
      const debugObject = {
        text: subtext,
        regex,
        startOffset,
        startString
      };
      debug("Running regexTest on: %O", debugObject);
      debug('');
    }

    return result;
  }

  return null;
};

const flowDefinitionPattern = (text: string, startOffset: number) => {
  const execResult = regexTest(
    flowDefinitionRegEx,
    "Define a flow named",
    text,
    startOffset,
    "\n"
  );
  if (execResult !== null) {
    // @ts-ignore
    execResult.payload = {
      identifier: execResult[1]
    };
  }

  return execResult;
};

const taskDefinitionPattern = (text: string, startOffset: number) => {
  const execResult = regexTest(
    taskDefinitionRegEx,
    "A task named",
    text,
    startOffset,
      "\n"
  );
  if (execResult !== null) {
    // @ts-ignore
    execResult.payload = {
      identifier: execResult[1]
    };
  }

  return execResult;
};

const taskRequiresPattern = (text: string, startOffset: number) => {
  const execResult = regexTest(
    taskRequiresRegEx,
    "that requires the following inputs:",
    text,
    startOffset,
      "\n"
  );
  if (execResult !== null) {
    // @ts-ignore
    execResult.payload = {
      requireList: execResult[1].split(",").map(p => p.trim())
    };
  }

  return execResult;
};

const taskProvidesPattern = (text: string, startOffset: number) => {
  const execResult = regexTest(
    taskProvidesRegEx,
    "that provides the following outputs:",
    text,
    startOffset,
      "\n"
  );
  if (execResult !== null) {
    // @ts-ignore
    execResult.payload = {
      provideList: execResult[1].split(",").map(p => p.trim())
    };
  }

  return execResult;
};

const resolverDefinitionPattern = (text: string, startOffset: number) => {
  const execResult = regexTest(
    resolverDefinitionRegEx,
    "using a resolver named",
    text,
    startOffset,
      "\n"
  );
  if (execResult !== null) {
    // @ts-ignore
    execResult.payload = {
      identifier: execResult[1]
    };
  }

  return execResult;
};

const resolverWithInputsPattern = (text: string, startOffset: number) => {
  const execResult = regexTest(
    resolverWithInputsRegEx,
    "with the following mapped inputs:",
    text,
    startOffset,
      "\n"
  );

  return execResult;
};

const resolverInputMappedPattern = (text: string, startOffset: number) => {
  const execResult = regexTest(
    resolverInputMappedRegEx,
    "param ",
    text,
    startOffset,
      "\n"
  );
  if (execResult !== null) {
    // @ts-ignore
    execResult.payload = {
      mapped: {
        from: execResult[2],
        to: execResult[1]
      }
    };
  }

  return execResult;
};

const resolverInputTransformedWithStringPattern = (
  text: string,
  startOffset: number
) => {
  const execResult = regexTest(
    resolverInputTransformedWithStringRegEx,
    "param ",
    text,
    startOffset,
      "\n"
  );
  if (execResult !== null) {
    // @ts-ignore
    execResult.payload = {
      transformed: {
        from: execResult[2],
        to: execResult[1]
      }
    };
  }

  return execResult;
};

const resolverInputTransformedWithObjectPattern = (
  text: string,
  startOffset: number
) => {
  const execResult = regexTest(
    resolverInputTransformedWithObjectRegEx,
    "param ",
    text,
    startOffset,
    "OBJECT;"
  );
  if (execResult !== null) {
    // @ts-ignore
    execResult.payload = {
      transformed: {
        from: execResult[2],
        to: execResult[1]
      }
    };
  }

  return execResult;
};

const resolverInputFixedBasicPattern = (text: string, startOffset: number) => {
  const execResult = regexTest(
    resolverInputFixedBasicRegEx,
    "param ",
    text,
    startOffset,
      "\n"
  );
  if (execResult !== null) {
    // @ts-ignore
    execResult.payload = {
      fixed: {
        from: execResult[3],
        to: execResult[1],
        type: execResult[2]
      }
    };
  }

  return execResult;
};

const resolverInputFixedNullPattern = (text: string, startOffset: number) => {
  const execResult = regexTest(
    resolverInputFixedNullRegEx,
    "param ",
    text,
    startOffset,
      "\n"
  );
  if (execResult !== null) {
    // @ts-ignore
    execResult.payload = {
      fixed: {
        to: execResult[1]
      }
    };
  }

  return execResult;
};

const resolverInputFixedObjectPattern = (text: string, startOffset: number) => {
  const execResult = regexTest(
    resolverInputFixedObjectRegEx,
    "param ",
    text,
    startOffset,
    "OBJECT;"
  );
  if (execResult !== null) {
    // @ts-ignore
    execResult.payload = {
      fixed: {
        to: execResult[1],
        from: execResult[2]
      }
    };
  }

  return execResult;
};

const resolverWithOutputsPattern = (text: string, startOffset: number) => {
  const execResult = regexTest(
    resolverWithOutputsRegEx,
    "with the following mapped outputs:",
    text,
    startOffset,
      "\n"
  );

  return execResult;
};

const resolverOutputMappedPattern = (text: string, startOffset: number) => {
  const execResult = regexTest(
    resolverOutputMappedRegEx,
    "param ",
    text,
    startOffset,
      "\n"
  );
  if (execResult !== null) {
    // @ts-ignore
    execResult.payload = {
      mapped: {
        from: execResult[2],
        to: execResult[1]
      }
    };
  }

  return execResult;
};

export const FlowDefinition = createToken({
  name: "FlowDefinition",
  pattern: flowDefinitionPattern,
  label: "Define a flow named <flowIdentifier> that has the following tasks:",
  line_breaks: false
});

export const TaskIdentifier = createToken({
  name: "TaskIdentifier",
  pattern: taskDefinitionPattern,
  label: "A task named <taskIdentifier>",
  line_breaks: false
});

export const TaskRequires = createToken({
  name: "TaskRequires",
  pattern: taskRequiresPattern, // that requires the following inputs:/,
  label: "that requires the following inputs: <comma separated identifiers>",
  line_breaks: false
});

export const TaskProvides = createToken({
  name: "TaskProvides",
  pattern: taskProvidesPattern,
  label: "that provides the following outputs: <comma separated identifiers>",
  line_breaks: false
});

export const ResolverIdentifier = createToken({
  name: "ResolverIdentifier",
  pattern: resolverDefinitionPattern,
  label: "using a resolver named <resolverName>",
  line_breaks: false
});

export const ResolverParams = createToken({
  name: "ResolverParams",
  pattern: resolverWithInputsPattern,
  label: "with the following mapped inputs:",
  line_breaks: false
});

export const ResolverParamMapped = createToken({
  name: "ResolverParamMapped",
  pattern: resolverInputMappedPattern,
  label: "param <resolverParamName> mapped from <flowInputParamName>",
  line_breaks: false
});

export const ResolverParamTransformedWithString = createToken({
  name: "ResolverParamTransformedWithString",
  pattern: resolverInputTransformedWithStringPattern,
  label: "param <resolverParamName> transformed with string <transformString>",
  line_breaks: false
});

export const ResolverParamTransformedWithObject = createToken({
  name: "ResolverParamTransformedWithObject",
  pattern: resolverInputTransformedWithObjectPattern,
  label: "param <resolverParamName> transformed with <<<OBJECT<transformObject>OBJECT;",
  line_breaks: true
});

export const ResolverParamFixedBasic = createToken({
  name: "ResolverParamFixedBasic",
  pattern: resolverInputFixedBasicPattern,
  label: "param <resolverParamName> with a fixed (numeric|boolean|string|array) value of <resolverParamValue>",
  line_breaks: false
});

export const ResolverParamFixedNull = createToken({
  name: "ResolverParamFixedNull",
  pattern: resolverInputFixedNullPattern,
  label: "param <resolverParamName> with a fixed null value",
  line_breaks: false
});

export const ResolverParamFixedObject = createToken({
  name: "ResolverParamFixedObject",
  pattern: resolverInputFixedObjectPattern,
  label: "param <resolverParamName> with a fixed object value of <<<OBJECT<objectValue>OBJECT;",
  line_breaks: true
});

export const ResolverResults = createToken({
  name: "ResolverResults",
  pattern: resolverWithOutputsPattern,
  label: "with the following mapped outputs:",
  line_breaks: false
});

export const ResolverResultMapped = createToken({
  name: "ResolverResultMapped",
  pattern: resolverOutputMappedPattern,
  label: "param <resolverResultName> mapped to <flowOutputParamName>",
  line_breaks: false
});

export const allTokens = [
  TaskIdentifier,
  TaskRequires,
  FlowDefinition,
  TaskProvides,
  ResolverIdentifier,
  ResolverParams,
  ResolverParamMapped,
  ResolverParamTransformedWithString,
  ResolverParamFixedBasic,
  ResolverParamFixedNull,
  ResolverResults,
  ResolverResultMapped,
  ResolverParamFixedObject,
  ResolverParamTransformedWithObject
];
