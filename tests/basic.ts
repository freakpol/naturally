import { expect } from 'chai';
import { NaturallyParser } from '../src';

describe('Basic Tests', () => {
  it('Generate Grammar HTML', async () => {
    const parser = new NaturallyParser();
    const htmlGrammar = parser.getHtmlGrammar();

    expect(htmlGrammar).to.be.an('string');
  });

  it('parse invalid spec', async () => {
      const parser = new NaturallyParser();
      const naturallyExpressionKO = `
        Define a flow named testFlow that has the following tasks:
      `;

      expect(() => parser.parse(naturallyExpressionKO)).to.throw();
  });

  it('parse basic spec', async () => {
    const parser = new NaturallyParser();

    const expectedJson = {
      code: 'testFlow',
      tasks: {
        firstTask: {
          requires: ['someInput', 'someOtherInput'],
          provides: ['someOutput'],
          resolver: {
            name: 'testResolver',
            params: {
              p1: 'someInput',
              p2: 'someOtherInput',
              p3: { transform: '{{someInput.property}}' },
              p4: {
                transform: {
                  a1: '{{someInput.property}}',
                  a2: '{{someOtherInput.propertyB}}',
                },
              },
              p5: {
                transform: ['{{someInput.propertyA}}', '{{someInput.propertyB}}'],
              },
              p6: { value: 123 },
              p7: { value: 456.789 },
              p8: { value: 'sample string' },
              p9: { value: null },
              p10: { value: true },
              p11: { value: false },
              p12: { value: ['a', 'b', 'c'] },
              p13: { value: { a1: '123', a2: true } },
            },
            results: { taskResult: 'someOutput' },
          },
        },
      },
    };

    const naturallyExpressionOK = `
            Define a flow named testFlow that has the following tasks:
              A task named firstTask
                that requires the following inputs: someInput, someOtherInput
                that provides the following outputs: someOutput
                using a resolver named testResolver
                  with the following mapped inputs:
                    param p1 mapped from someInput
                    param p2 mapped from someOtherInput
                    param p3 transformed with "{{someInput.property}}";
                    param p4 transformed with {
                      "a1": "{{someInput.property}}",
                      "a2": "{{someOtherInput.propertyB}}"
                    };
                    param p5 transformed with [
                      "{{someInput.propertyA}}", 
                      "{{someInput.propertyB}}"
                    ];
                    param p6 with value 123
                    param p7 with value 456.789
                    param p8 with value "sample string"
                    param p9 with a null value,
                    param p10 with a true value
                    param p11 with a false value
                    param p12 with value [
                      "a", 
                      "b", 
                      "c"
                    ];
                    param p13 with value {
                        "a1": "123",
                        "a2": true
                      };
                  with the following mapped outputs:
                    param taskResult mapped to someOutput
            `;

    const jsonFlow = parser.parse(naturallyExpressionOK);

    expect(jsonFlow).to.be.eql(expectedJson);
  });
});
