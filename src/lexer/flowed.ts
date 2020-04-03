import { Lexer } from 'chevrotain';
import { allTokens } from './../tokens/flowed';

export class NaturallyFlowedLexer {
  private static instance: NaturallyFlowedLexer;
  private lexer: Lexer;

  private constructor() {
    this.lexer = new Lexer(allTokens);
  }

  public static getInstance(): NaturallyFlowedLexer {
    return NaturallyFlowedLexer.instance || new NaturallyFlowedLexer();
  }

  public static tokenize(input: string) {
    return NaturallyFlowedLexer.getInstance().lexer.tokenize(input);
  }
}
