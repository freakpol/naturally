import { createToken } from "chevrotain";
import { debug as debugFn } from "debug";
const debug = debugFn("naturally:tokens");

const flowDefinitionRegEx = /Define a flow named ([._a-zA-Z][.\-_a-zA-Z0-9]+) that has the following tasks:/i;
const taskDefinitionRegEx = /a task named ([._a-zA-Z][.\-_a-zA-Z0-9]+)/i;
const taskRequiresRegEx = /that requires the following inputs: (([._a-zA-Z][.\-_a-zA-Z]+,\s?)*[._a-zA-Z][.\-_a-zA-Z]+)/i;
const taskProvidesRegEx = /that provides the following outputs: (([._a-zA-Z][.\-_a-zA-Z]+,\s?)*[._a-zA-Z][.\-_a-zA-Z]+)/i;
const resolverDefinitionRegEx = /using a resolver named ([._a-zA-Z][.:\-_a-zA-Z0-9]+)/i;
const resolverWithInputsRegEx = /with the following mapped inputs:/i;
const resolverInputMappedRegEx = /param ([._a-zA-Z][.\-_a-zA-Z0-9]+) mapped from ([._a-zA-Z][.\-_a-zA-Z0-9]+)/i;
const resolverInputTransformedWithRegEx = /param ([._a-zA-Z][.\-_a-zA-Z0-9]+) transformed with ((?<object>\{(.+)\});|(?<array>\[(.*)\]);|(?<string>"(.+)");)/si;
const resolverInputFixedBasicRegEx = /param ([._a-zA-Z][.\-_a-zA-Z0-9]+) with value ((?<string>"(.*)")|(?<number>[\+\-]?\d*\.?\d+(?:[Ee][\+\-]?\d+)?))/i;
const resolverInputFixedNullOrBoolRegEx = /param ([._a-zA-Z][.\-_a-zA-Z0-9]+) with a (null|true|false) value/i;
const resolverInputFixedObjectRegEx = /param ([._a-zA-Z][.\-_a-zA-Z0-9]+) with value ((?<object>\{(.+)\});|(?<array>\[(.*)\]);)/si;
const resolverWithOutputsRegEx = /with the following mapped outputs:/i;
const resolverOutputMappedRegEx = /param ([._a-zA-Z][.\-_a-zA-Z0-9]+) mapped to ([._a-zA-Z][.\-_a-zA-Z0-9]+)/i;

const regexTest = (
  regex: RegExp,
  startString: string,
  text: string,
  startOffset: number,
  lineEndings: string | string[]
) => {
  let stringLength: number;
  if (typeof lineEndings === 'string') {
    stringLength = text.substr(startOffset).indexOf(lineEndings) + lineEndings.length;

  } else {
    let minLength = Infinity;

    for (let lineEnding of lineEndings) {
      if (text.substr(startOffset).indexOf(lineEnding) !== -1) {
        const l = text.substr(startOffset).indexOf(lineEnding) + lineEnding.length;
        if (l < minLength) {
          minLength = l;
        }
      }
    }

    stringLength = minLength;
  }

  const subtext = text.substr(
    startOffset,
    stringLength
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

const resolverInputTransformedWithPattern = (
  text: string,
  startOffset: number
) => {
  const execResult = regexTest(
    resolverInputTransformedWithRegEx,
    "param ",
    text,
    startOffset,
      ["];", "};", '";']
  );
  if (execResult !== null) {
     let from: any
    if (execResult.groups!['object']) {
      from = JSON.parse(execResult.groups!['object']);
    } else if (execResult.groups!['array']) {
      from = JSON.parse(execResult.groups!['array'])
    } else {
      from = execResult.groups!['string'].slice(1, -1);
    }

    // @ts-ignore
    execResult.payload = {
      transformed: {
        from: from,
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
    let from: any;
    if (execResult.groups!['number']) {
      from = parseFloat(execResult.groups!['number']);
    } else {
      from = execResult.groups!['string'].slice(1, -1)
    }


    // @ts-ignore
    execResult.payload = {
      fixed: {
        from: from,
        to: execResult[1]
      }
    };
  }

  return execResult;
};

const resolverInputFixedNullOrBoolPattern = (text: string, startOffset: number) => {
  const execResult = regexTest(
    resolverInputFixedNullOrBoolRegEx,
    "param ",
    text,
    startOffset,
      "\n"
  );
  if (execResult !== null) {
    // @ts-ignore
    execResult.payload = {
      fixed: {
        to: execResult[1],
        from: execResult[2].toLocaleLowerCase()
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
    ["};", "];"]
  );
  if (execResult !== null) {
    let from: any;

    if (execResult.groups!['object']) {
      from =  JSON.parse(execResult.groups!['object'])
    } else {
      from =  JSON.parse(execResult.groups!['array'])
    }


    // @ts-ignore
    execResult.payload = {
      fixed: {
        to: execResult[1],
        from: from
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

export const ResolverParamTransformedWith = createToken({
  name: "ResolverParamTransformedWith",
  pattern: resolverInputTransformedWithPattern,
  label: "param <resolverParamName> transformed with <transformObject|transformString|transformArray>",
  line_breaks: false
});

export const ResolverParamFixedBasic = createToken({
  name: "ResolverParamFixedBasic",
  pattern: resolverInputFixedBasicPattern,
  label: "param <resolverParamName> with value <string|number>",
  line_breaks: false
});

export const ResolverParamFixedNullOrBool = createToken({
  name: "ResolverParamFixedNullOrBool",
  pattern: resolverInputFixedNullOrBoolPattern,
  label: "param <resolverParamName> with a (null|true|false) value",
  line_breaks: false
});

export const ResolverParamFixedObject = createToken({
  name: "ResolverParamFixedObject",
  pattern: resolverInputFixedObjectPattern,
  label: "param <resolverParamName> with value <object|array>",
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
  ResolverParamTransformedWith,
  ResolverParamFixedBasic,
  ResolverParamFixedNullOrBool,
  ResolverResults,
  ResolverResultMapped,
  ResolverParamFixedObject
];
