const debug = require('debug')("naturally");

import { CstParser} from 'chevrotain';
import {allTokens,
  FlowDefinition,
  TaskIdentifier,
  TaskRequires,
  TaskProvides,
  ResolverIdentifier,
  ResolverParams,
  ResolverParamMapped,
  ResolverParamTransformedWithString,
  ResolverParamTransformedWithObject,
  ResolverParamFixedBasic,
  ResolverParamFixedNull,
  ResolverParamFixedObject,
  ResolverResults,
  ResolverResultMapped,
}  from '../tokens/flowed';

export class NaturallyFlowedParser extends CstParser {
  public flowStatement: any;
  public taskStatement: any;
  public taskRequires: any;
  public taskProvides: any;
  public taskResolver: any;
  public resolverParams: any;
  public resolverResults: any;

  constructor() {
    super(allTokens, {
      recoveryEnabled: true
    });

    const $ = this;

    this.flowStatement = $.RULE('flowStatement', () => {
      $.CONSUME(FlowDefinition);

      $.AT_LEAST_ONE({
        DEF: () => {
          $.SUBRULE($.taskStatement);
        }
      });
    });

    this.taskStatement = $.RULE('taskStatement', () => {
      $.CONSUME(TaskIdentifier);

      $.OPTION(() => {
        $.SUBRULE($.taskRequires);
      });

      $.OPTION1(() => {
        $.SUBRULE($.taskProvides);
      });

      $.SUBRULE($.taskResolver);
    });


    this.taskRequires = $.RULE('taskRequires', () => {
      $.CONSUME(TaskRequires);
    });

    this.taskProvides = $.RULE('taskProvides', () => {
      $.CONSUME(TaskProvides);
    });

    this.taskResolver = $.RULE('taskResolver', () => {
      $.CONSUME(ResolverIdentifier);

      $.OPTION1(() => {
        $.SUBRULE($.resolverParams)
      });

      $.OPTION2(() => {
        $.SUBRULE($.resolverResults)
      })
    });

    this.resolverParams = $.RULE('resolverParams', () => {
      $.CONSUME(ResolverParams);

      $.AT_LEAST_ONE({
        DEF: () => {
          $.OR([
            { ALT: () => $.CONSUME(ResolverParamMapped) },
            { ALT: () => $.CONSUME(ResolverParamTransformedWithString) },
            { ALT: () => $.CONSUME(ResolverParamTransformedWithObject) },
            { ALT: () => $.CONSUME(ResolverParamFixedBasic) },
            { ALT: () => $.CONSUME(ResolverParamFixedNull) },
            { ALT: () => $.CONSUME(ResolverParamFixedObject) }
          ]);
        }
      });
    });

    this.resolverResults = $.RULE('resolverResults', () => {
      $.CONSUME(ResolverResults);
      $.AT_LEAST_ONE({
        //SEP: Comma,
        DEF: () => {
          $.CONSUME(ResolverResultMapped)
        }
      });
    });

    this.performSelfAnalysis()
  }
}

const parser = new NaturallyFlowedParser();

const BaseNaturallyFlowedVisitor = parser.getBaseCstVisitorConstructor();

export class NaturallyFlowedVisitor extends BaseNaturallyFlowedVisitor {
  constructor() {
    super()
    // The "validateVisitor" method is a helper utility which performs static analysis
    // to detect missing or redundant visitor methods
    this.validateVisitor()
  }

  flowStatement(ctx: any) {

    let tasks = {};

    for (let task of ctx.children.taskStatement) {
      const visitedTask = this.visit(task);

      tasks = Object.assign({}, tasks, visitedTask);
    }

    return {
      code: ctx.children.FlowDefinition.pop().payload.identifier,
      tasks: tasks
    }

  }

  taskStatement(ctx: any) {



    let taskDefinition = {};

    if (ctx.taskRequires && ctx.taskRequires.length) {
      const requireVisitor = this.visit(ctx.taskRequires.pop())
      taskDefinition = Object.assign({}, taskDefinition, requireVisitor);
    }

    if (ctx.taskProvides && ctx.taskProvides.length) {
      const providerVisitor = this.visit(ctx.taskProvides.pop())
      taskDefinition = Object.assign({}, taskDefinition, providerVisitor);
    }

    if (ctx.taskResolver && ctx.taskResolver.length) {
      const resolverDefinition = this.visit(ctx.taskResolver.pop());
      taskDefinition = Object.assign({}, taskDefinition, resolverDefinition);
    }

    return {[ctx.TaskIdentifier.pop().payload.identifier]: taskDefinition};

  }

  taskRequires(ctx: any) {
    return {
      requires: ctx.TaskRequires.pop().payload.requireList
    }

  }

  taskProvides(ctx: any) {
    return {
      provides: ctx.TaskProvides.pop().payload.provideList
    }
  }


  taskResolver(ctx: any) {
    let resolverParts = {};

    if (ctx.resolverParams && ctx.resolverParams.length) {
      const resolverParamsVisitor = this.visit(ctx.resolverParams.pop());
      resolverParts = Object.assign({}, resolverParts, resolverParamsVisitor);
    }

    if (ctx.resolverResults && ctx.resolverResults.length) {
      const resolverResultsVisitor = this.visit(ctx.resolverResults.pop());
      resolverParts = Object.assign({}, resolverParts, resolverResultsVisitor);
    }

    return {
      resolver: Object.assign(
          {},
          {name: ctx.ResolverIdentifier.pop().payload.identifier},
          resolverParts
      )
    };
  }

  resolverParams(ctx: any) {
    let params = {};

    if (ctx.ResolverParamMapped && ctx.ResolverParamMapped.length) {
      for (const mappedParam of ctx.ResolverParamMapped) {
        params = Object.assign({}, params, {
          [mappedParam.payload.mapped.to]: mappedParam.payload.mapped.from
        });
      }
    }

    if (ctx.ResolverParamTransformedWithString && ctx.ResolverParamTransformedWithString.length) {
      for (const transformedParam of ctx.ResolverParamTransformedWithString) {
        params = Object.assign({}, params, {
          [transformedParam.payload.transformed.to]: {
            transform: transformedParam.payload.transformed.from
          }
        });
      }
    }

    if (ctx.ResolverParamTransformedWithObject && ctx.ResolverParamTransformedWithObject.length) {
      for (const transformedParam of ctx.ResolverParamTransformedWithObject) {
        params = Object.assign({}, params, {
          [transformedParam.payload.transformed.to]: {
            transform: JSON.parse(transformedParam.payload.transformed.from)
          }
        });
      }
    }

    if (ctx.ResolverParamFixedBasic && ctx.ResolverParamFixedBasic.length) {
      for (const fixedParam of ctx.ResolverParamFixedBasic) {

        let value: any;
        switch (fixedParam.payload.fixed.type) {
          case 'numeric':
            value = parseFloat(fixedParam.payload.fixed.from);
            break;

          case 'boolean':
            value = (fixedParam.payload.fixed.from.toLocaleLowerCase() === 'true' || fixedParam.payload.fixed.from === '1');
            break;

            case 'array':
              value = JSON.parse(fixedParam.payload.fixed.from.replace(/'/g, '"'));
            break;

          case 'string':
          default:
            value = fixedParam.payload.fixed.from
            break;
        }

        params = Object.assign({}, params, {
          [fixedParam.payload.fixed.to]: {
            value: value
          }
        });
      }
    }

    if (ctx.ResolverParamFixedNull && ctx.ResolverParamFixedNull.length) {
      for (const fixedParam of ctx.ResolverParamFixedNull) {
        params = Object.assign({}, params, {
          [fixedParam.payload.fixed.to]: {
            value: null
          }
        });
      }
    }

    if (ctx.ResolverParamFixedObject && ctx.ResolverParamFixedObject.length) {
      for (const fixedParam of ctx.ResolverParamFixedObject) {
        params = Object.assign({}, params, {
          [fixedParam.payload.fixed.to]: {
            value: JSON.parse(fixedParam.payload.fixed.from.trim())
          }
        });
      }
    }

    return {params: params};

  }
  resolverResults(ctx: any) {
    let params = {};

    if (ctx.ResolverResultMapped && ctx.ResolverResultMapped.length) {
      for (const mappedParam of ctx.ResolverResultMapped) {
        params = Object.assign({}, params, {
          [mappedParam.payload.mapped.to]: mappedParam.payload.mapped.from
        });
      }
    }


    return {results: params};
  }


}
