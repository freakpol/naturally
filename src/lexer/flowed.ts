import { Lexer } from "chevrotain";
import { allTokens } from "./../tokens/flowed";

export class NatuallyFlowedLexer {
  private static instance: NatuallyFlowedLexer;
  private lexer: Lexer;

  private constructor() {
    this.lexer = new Lexer(allTokens);
  }

  public static getInstance(): NatuallyFlowedLexer {
    if (!NatuallyFlowedLexer.instance) {
      NatuallyFlowedLexer.instance = new NatuallyFlowedLexer();
    }

    return NatuallyFlowedLexer.instance;
  }

  public static tokenize(input: string) {
    return NatuallyFlowedLexer.getInstance().lexer.tokenize(input);
  }
}
