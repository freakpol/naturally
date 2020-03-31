# Naturally

Naturally allows to write Flowed specs using natural language instead of JSON.

- [Naturally](#naturally)
  * [Example](#example)
  * [Grammar](#grammar)
    + [flowStatement](#flowstatement)
    + [taskStatement](#taskstatement)
    + [taskRequires](#taskrequires)
    + [taskProvides](#taskprovides)
    + [taskResolver](#taskresolver)
    + [resolverParams](#resolverparams)
      - [Mapped values](#mapped-values)
      - [Basic values](#basic-values)
      - [Object value](#object-value)
      - [Null value](#null-value)
      - [Transformed Values](#transformed-values)
    + [resolverResults](#resolverresults)
  * [Usage](#usage)
  * [Installation](#installation)


## Example

```
Define a flow testFlow that has the following tasks:
  A task named firstTask
    that requires the following inputs: someInput, someOtherInput
    that provides the following outputs: someOutput
    using a resolver named testResolver
      with the following mapped inputs:
        param p1 mapped from someInput
        param p2 mapped from someOtherInput
        param p3 transformed with string "{{someInput.property}}"
        param p4 transformed with object <<<OBJECT
          {
            "a1": "{{someInput.property}}",
            "a2": "{{someOtherInput.propertyB}}"
          }
        OBJECT;
        param p5 with a fixed null value,
        param p6 with a fixed string value of "test"
        param p7 with a fixed number value of 123
        param p8 with a fixed number value of 456.789
        param p9 with a fixed boolean value of true
        param p10 with a fixed boolean value of 1
        param p11 with a fixed boolean value of false
        param p12 with a fixed boolean value of 0
        param p13 with a fixed array value of ["a", "b", "c"]
        param p14 with a fixed object value of <<<OBJECT
          {
            "a1": "123",
            "a2": true
          }
        OBJECT;
      with the following mapped outputs:
        param taskResult mapped to someOutput
```

Once parsed will return the following javascript object:

```json5
{
  code: 'testFlow',
  tasks: {
    firstTask: {
      requires: [ 'someInput', 'someOtherInput' ],
      provides: [ 'someOutput' ],
      resolver: {
        name: 'testResolver',
        params: {
          p1: 'someInput',
          p2: 'someOtherInput',
          p3: { transform: '{{someInput.property}}' },
          p4: {
            transform: {
              a1: '{{someInput.property}}',
              a2: '{{someOtherInput.propertyB}}'
            }
          },
          p5: { value: [ 'a', 'b', 'c' ] },
          p6: { value: '"test"' },
          p7: { value: 123 },
          p8: { value: 456.789 },
          p9: { value: true },
          p10: { value: true },
          p11: { value: false },
          p12: { value: false },
          p13: { value: null },
          p14: { value: { a1: '123', a2: true } }
        },
        results: { taskResult: 'someOutput' }
      }
    }
  }
}
```

## Grammar

`naturally` follows the following grammar:

![Parallel Tasks](./docs/images/grammar.png)

Let's see each section in detail.

### flowStatement

The flow statement is a string that matches the following RegEx:

```jsregexp
/Define a flow named ([._a-zA-Z][.\-_a-zA-Z0-9]+) that has the following tasks:/
```

### taskStatement

The flow statement is a string that matches the following RegEx:

```jsregexp
/A task named ([._a-zA-Z][.\-_a-zA-Z0-9]+)/
```

### taskRequires

The task requires statement is a string that matches the following RegEx:

```jsregexp
/that requires the following inputs: (([._a-zA-Z][.\-_a-zA-Z]+,\s?)*[._a-zA-Z][.\-_a-zA-Z]+)/
```

### taskProvides

The task provides statement is a string that matches the following RegEx:

```jsregexp
/that provides the following outputs: (([._a-zA-Z][.\-_a-zA-Z]+,\s?)*[._a-zA-Z][.\-_a-zA-Z]+)/
```

### taskResolver

The task resolver statement is a string that matches the following RegEx:

```jsregexp
/using a resolver named ([._a-zA-Z][.:\-_a-zA-Z0-9]+)/
```

### resolverParams

Resolver params are basically two types of statements:

One statement that matches 

```jsregexp
/with the following mapped inputs:/
```

followed by one or more of the statements:

#### Mapped values

A string that matches the following RegEx:

```jsregexp
/param ([._a-zA-Z][.\-_a-zA-Z0-9]+) mapped from ([._a-zA-Z][.\-_a-zA-Z0-9]+)/
```


#### Basic values

Basic values includes: numeric, boolean, string and array and thus are strings that matches the following RegEx:

```jsregexp
/param ([._a-zA-Z][.\-_a-zA-Z0-9]+) with a fixed (numeric|boolean|string|array) value of (.+)/
```

#### Object value

Object value is a special construct that allows to define a JSON object as param value. It's a string that matches the following RegEx:

```jsregexp
/param ([._a-zA-Z][.\-_a-zA-Z0-9]+) with a fixed object value of <<<OBJECT(.+)OBJECT;/s
```

Note the `s` modifier, that allows to write the object in multiple lines.

#### Null value

Null value is a special value and thus it have its own statement: a string that matches the following RegEx:

```jsregexp
/param ([._a-zA-Z][.\-_a-zA-Z0-9]+) with a fixed null value/
```

#### Transformed Values

There are two types of transformations, based on a transformation string and based on an transformation object. Here are the corresponding RegExs for each one:


```jsregexp
/param ([._a-zA-Z][.\-_a-zA-Z0-9]+) transformed with string (.+)/
/param ([._a-zA-Z][.\-_a-zA-Z0-9]+) transformed with <<<OBJECT(.+)OBJECT;/s
 ```
Note the `s` modifier in the second RegEx, that allows to write the object in multiple lines.

### resolverResults

Resolver results are two types of statements.

One statement that matches the following RegEx:

```jsregexp
/with the following mapped outputs:/
```

followed by one or more statements matching the folloging RegEx:

```jsregexp
/param ([._a-zA-Z][.\-_a-zA-Z0-9]+) mapped to ([._a-zA-Z][.\-_a-zA-Z0-9]+)/
```

## Usage


```js
const { NaturallyParser } = require('naturally');

const naturallyFlowedExpression = `
Define a flow testFlow that has the following tasks:
  A task named firstTask
    that requires the following inputs: someInput, someOtherInput
    that provides the following outputs: someOutput
    using a resolver named testResolver
      with the following mapped inputs:
        param p1 mapped from someInput
        param p2 mapped from someOtherInput
        param p3 transformed with string "{{someInput.property}}"
        param p4 transformed with object <<<OBJECT
          {
            "a1": "{{someInput.property}}",
            "a2": "{{someOtherInput.propertyB}}"
          }
        OBJECT;
        param p5 with a fixed null value,
        param p6 with a fixed string value of "test"
        param p7 with a fixed number value of 123
        param p8 with a fixed number value of 456.789
        param p9 with a fixed boolean value of true
        param p10 with a fixed boolean value of 1
        param p11 with a fixed boolean value of false
        param p12 with a fixed boolean value of 0
        param p13 with a fixed array value of ["a", "b", "c"]
        param p14 with a fixed object value of <<<OBJECT
          {
            "a1": "123",
            "a2": true
          }
        OBJECT;
      with the following mapped outputs:
        param taskResult mapped to someOutput
`;

const parser = new NaturallyParser();
const jsonFlow = parser.parse(naturallyFlowedExpression);
console.log(jsonFlow);
```

## Installation

```shell script
npm install naturally
```