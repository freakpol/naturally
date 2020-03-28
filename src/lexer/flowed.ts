'use strict'

import { Lexer } from "chevrotain";
import {allTokens}  from './../tokens/flowed';

export class NatuallyFlowedLexer {

  private static instance: NatuallyFlowedLexer;
  private lexer: Lexer;


  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  private constructor() {
    this.lexer = new Lexer(allTokens);
  }

  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the Singleton class while keeping
   * just one instance of each subclass around.
   */
  public static getInstance(): NatuallyFlowedLexer {
    if (!NatuallyFlowedLexer.instance) {
      NatuallyFlowedLexer.instance = new NatuallyFlowedLexer();
    }

    return NatuallyFlowedLexer.instance
  }

  /**
   * Finally, any singleton should define some business logic, which can be
   * executed on its instance.
   */
  public static tokenize(input: string) {
    return NatuallyFlowedLexer.getInstance().lexer.tokenize(input)
  }
}
