import { createSyntaxDiagramsCode } from 'chevrotain';
import { NaturallyFlowedLexer } from '../lexer/flowed';
import { debug as debugFn } from 'debug';
const debug = debugFn('naturally:tokens');

import { CstParser } from 'chevrotain';
import {
  allTokens,
  FlowDefinition,
  TaskIdentifier,
  TaskRequires,
  TaskProvides,
  ResolverIdentifier,
  ResolverParams,
  ResolverParamMapped,
  ResolverParamTransformedWith,
  ResolverParamFixedBasic,
  ResolverParamFixedNullOrBool,
  ResolverResults,
  ResolverResultMapped,
  ResolverParamFixedObject,
} from '../tokens/flowed';

class FlowedNaturalLanguageParser extends CstParser {
  public flowStatement: any;
  public taskStatement: any;
  public taskRequires: any;
  public taskProvides: any;
  public taskResolver: any;
  public resolverParams: any;
  public resolverResults: any;

  constructor() {
    super(allTokens, {
      recoveryEnabled: false,
    });

    const _this = this;

    this.flowStatement = _this.RULE('flowStatement', () => {
      _this.CONSUME(FlowDefinition);

      _this.AT_LEAST_ONE({
        DEF: () => {
          _this.SUBRULE(_this.taskStatement);
        },
      });
    });

    this.taskStatement = _this.RULE('taskStatement', () => {
      _this.CONSUME(TaskIdentifier);

      _this.OPTION(() => {
        _this.SUBRULE(_this.taskRequires);
      });

      _this.OPTION1(() => {
        _this.SUBRULE(_this.taskProvides);
      });

      _this.SUBRULE(_this.taskResolver);
    });

    this.taskRequires = _this.RULE('taskRequires', () => {
      _this.CONSUME(TaskRequires);
    });

    this.taskProvides = _this.RULE('taskProvides', () => {
      _this.CONSUME(TaskProvides);
    });

    this.taskResolver = _this.RULE('taskResolver', () => {
      _this.CONSUME(ResolverIdentifier);

      _this.OPTION(() => {
        _this.SUBRULE(_this.resolverParams);
      });

      _this.OPTION1(() => {
        _this.SUBRULE(_this.resolverResults);
      });
    });

    this.resolverParams = _this.RULE('resolverParams', () => {
      _this.CONSUME(ResolverParams);

      _this.AT_LEAST_ONE({
        DEF: () => {
          _this.OR([
            { ALT: () => _this.CONSUME(ResolverParamMapped) },
            { ALT: () => _this.CONSUME(ResolverParamTransformedWith) },
            { ALT: () => _this.CONSUME(ResolverParamFixedBasic) },
            { ALT: () => _this.CONSUME(ResolverParamFixedNullOrBool) },
            { ALT: () => _this.CONSUME(ResolverParamFixedObject) },
          ]);
        },
      });
    });

    this.resolverResults = _this.RULE('resolverResults', () => {
      _this.CONSUME(ResolverResults);
      _this.AT_LEAST_ONE({
        // SEP: Comma,
        DEF: () => {
          _this.OR([{ ALT: () => _this.CONSUME(ResolverResultMapped) }]);
        },
      });
    });

    this.performSelfAnalysis();
  }
}

const parser = new FlowedNaturalLanguageParser();
const FlowedNatualLanguageVisitorBase = parser.getBaseCstVisitorConstructor();

class FlowedNatualLanguageVisitor extends FlowedNatualLanguageVisitorBase {
  constructor() {
    super();
    this.validateVisitor();
  }

  flowStatement(ctx: any) {
    let tasks = {};

    for (const task of ctx.children.taskStatement) {
      tasks = Object.assign(tasks, this.visit(task));
    }

    return {
      code: ctx.children.FlowDefinition.pop().payload.identifier,
      tasks,
    };
  }

  taskStatement(ctx: any) {
    let taskDefinition = {};

    /* istanbul ignore else */
    if (ctx.taskRequires && ctx.taskRequires.length) {
      taskDefinition = Object.assign(taskDefinition, this.visit(ctx.taskRequires.pop()));
    }

    /* istanbul ignore else */
    if (ctx.taskProvides && ctx.taskProvides.length) {
      taskDefinition = Object.assign(taskDefinition, this.visit(ctx.taskProvides.pop()));
    }

    /* istanbul ignore else */
    if (ctx.taskResolver && ctx.taskResolver.length) {
      taskDefinition = Object.assign(taskDefinition, this.visit(ctx.taskResolver.pop()));
    }

    return { [ctx.TaskIdentifier.pop().payload.identifier]: taskDefinition };
  }

  taskRequires(ctx: any) {
    return {
      requires: ctx.TaskRequires.pop().payload.requireList,
    };
  }

  taskProvides(ctx: any) {
    return {
      provides: ctx.TaskProvides.pop().payload.provideList,
    };
  }

  taskResolver(ctx: any) {
    let resolverParts = {};

    /* istanbul ignore else */
    if (ctx.resolverParams && ctx.resolverParams.length) {
      resolverParts = Object.assign(resolverParts, this.visit(ctx.resolverParams.pop()));
    }

    /* istanbul ignore else */
    if (ctx.resolverResults && ctx.resolverResults.length) {
      resolverParts = Object.assign(resolverParts, this.visit(ctx.resolverResults.pop()));
    }

    return {
      resolver: Object.assign({ name: ctx.ResolverIdentifier.pop().payload.identifier }, resolverParts),
    };
  }

  resolverParams(ctx: any) {
    let params = {};

    /* istanbul ignore else */
    if (ctx.ResolverParamMapped && ctx.ResolverParamMapped.length) {
      for (const mappedParam of ctx.ResolverParamMapped) {
        params = Object.assign(params, {
          [mappedParam.payload.mapped.to]: mappedParam.payload.mapped.from,
        });
      }
    }

    /* istanbul ignore else */
    if (ctx.ResolverParamTransformedWith && ctx.ResolverParamTransformedWith.length) {
      for (const transformedParam of ctx.ResolverParamTransformedWith) {
        params = Object.assign(params, {
          [transformedParam.payload.transformed.to]: {
            transform: transformedParam.payload.transformed.from,
          },
        });
      }
    }

    /* istanbul ignore else */
    if (ctx.ResolverParamFixedBasic && ctx.ResolverParamFixedBasic.length) {
      for (const fixedParam of ctx.ResolverParamFixedBasic) {
        params = Object.assign(params, {
          [fixedParam.payload.fixed.to]: {
            value: fixedParam.payload.fixed.from,
          },
        });
      }
    }

    /* istanbul ignore else */
    if (ctx.ResolverParamFixedNullOrBool && ctx.ResolverParamFixedNullOrBool.length) {
      for (const fixedParam of ctx.ResolverParamFixedNullOrBool) {
        if (fixedParam.payload.fixed.from === 'null') {
          params = Object.assign(params, {
            [fixedParam.payload.fixed.to]: {
              value: null,
            },
          });
        } else if (fixedParam.payload.fixed.from === 'true') {
          params = Object.assign(params, {
            [fixedParam.payload.fixed.to]: {
              value: true,
            },
          });
        } else {
          params = Object.assign(params, {
            [fixedParam.payload.fixed.to]: {
              value: false,
            },
          });
        }
      }
    }

    /* istanbul ignore else */
    if (ctx.ResolverParamFixedObject && ctx.ResolverParamFixedObject.length) {
      for (const fixedParam of ctx.ResolverParamFixedObject) {
        params = Object.assign(params, {
          [fixedParam.payload.fixed.to]: {
            value: fixedParam.payload.fixed.from,
          },
        });
      }
    }

    return { params };
  }
  resolverResults(ctx: any) {
    let params = {};

    /* istanbul ignore else */
    if (ctx.ResolverResultMapped && ctx.ResolverResultMapped.length) {
      for (const mappedParam of ctx.ResolverResultMapped) {
        params = Object.assign(params, {
          [mappedParam.payload.mapped.to]: mappedParam.payload.mapped.from,
        });
      }
    }

    return { results: params };
  }
}

export class NaturallyParser {
  protected parser: FlowedNaturalLanguageParser;
  protected visitor: FlowedNatualLanguageVisitor;

  constructor() {
    this.parser = new FlowedNaturalLanguageParser();
    this.visitor = new FlowedNatualLanguageVisitor();
  }

  public parse(text: string) {
    const lexingResult = NaturallyFlowedLexer.tokenize(text);
    parser.input = lexingResult.tokens;
    const parsedInput = parser.flowStatement();

    if (parser.errors.length > 0) {
      debug('Parser errors: %O', parser.errors);
      throw new Error('Errors were detected');
    } else {
      parser.input = [];
      return this.visitor.flowStatement(parsedInput);
    }


  }

  public getHtmlGrammar() {
    // create the HTML Text
    const serializedGrammar = this.parser.getSerializedGastProductions();
    return createSyntaxDiagramsCode(serializedGrammar);
  }
}
