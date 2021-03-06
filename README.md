# schema.js [![Build Status](https://travis-ci.org/freakycue/schema.js.svg?branch=master)](https://travis-ci.org/freakycue/schema.js)

A schema validation and filtering framework for node.js  
It's a fork of [conform.js](https://github.com/okv/conform.js) which
extends him with `$ref` option.

## Example
The core of `schema.js` is simple and succinct: `validator.validate(obj, schemaId)` or simply
`validator.validate(obj, schema)`: 
 
``` js
  var validator = require('schema.js').validator;

  var schema = {
    properties: {
      url: {
        description: 'the url the object should be stored at',
        type: 'string',
        pattern: '^/[^#%&*{}\\:<>?\/+]+$',
        required: true
      },
      challenge: {
        description: 'a means of protecting data (insufficient for production, used as example)',
        type: 'string',
        minLength: 5
      },
      body: {
        description: 'what to store at the url',
        type: 'any',
        default: null
      },
      address: {$ref: '#nested'}
    }
  };

  validator.add(schema, '#my_schema');

  validator.add({
    properties: {
      town: {type: 'string'},
      city: {type: 'string'},
      country: {type: 'string'}
    }
  }, '#nested');

  console.dir(validator.validate(someObject, '#my_schema'));
  console.dir(validator.validate(someObject, schema));
```

This will return with a value indicating if the `obj` conforms to the `schema`. If it does not, a descriptive object will be returned containing the errors encountered with validation.

``` js
  {
    valid: true // or false
    errors: [/* Array of errors if valid is false */]
  }
```

## Installation

### Installing schema.js
``` bash
  $ npm install schema.js
```

## Usage

`validator` takes json-schema as input to validate objects.

### validator.validate (obj, schema, options)

This will return with a value indicating if the `obj` conforms to the `schema`. If it does not, a descriptive object will be returned containing the errors encountered with validation.

``` js
{
  valid: true // or false
  errors: [/* Array of errors if valid is false */]
}
```

#### Available Options

* __validateFormats__: Enforce format constraints (_default true_)
* __validateFormatsStrict__: When `validateFormats` is _true_ treat unrecognized formats as validation errors (_default false_)
* __validateFormatExtensions__: When `validateFormats` is _true_ also validate formats defined in `validate.formatExtensions` (_default true_)
* __cast__: Enforce casting of some types (for integers/numbers are only supported) when it's possible, e.g. `"42" => 42`, but `"forty2" => "forty2"` for the `integer` type (_default false_)
* __castSource__: Apply casting (see `cast` option above) to source object (_default false_)
* __additionalProperties__: Default value for object `additionalProperties` attribute (_default true_)
* __applyDefaultValue__: Apply value  of `default` attribute to source object (_default false_)
* __validateDefaultValue__: If true value of `default` attribute will be checked to conforms schema (_default false_)
* __exitOnFirstError__: If true validation will be stopped after first error occurred, `valid` will be `false` and `errors` will contain single error (_default false_)
* __failOnFirstError__: Like `exitOnFirstError` option but error will be thrown, property `info` of error will contain regular validation error information (_default false_)

**Notice**: all options (such as *castSource*, *additionalProperties*) as well as
attributes (such as [filter](#filter)) which modifies source object
do that directly and immediately. That means that if some property (e.g. `property1`)
was modified but later, on other property (e.g. `property2`), validation or
filtering fails source object will be with modified `property1` despite on `valid`
equals to `false` at result.


### Schema
For a property an `value` is that which is given as input for validation where as an `expected value` is the value of the below fields

#### required
If true, the value should not be empty

```js
{ required: true }
```

#### type
The `type of value` should be equal to the expected value

```js
{ type: 'string' }
{ type: 'number' }
{ type: 'integer' }
{ type: 'array' }
{ type: 'boolean' }
{ type: 'object' }
{ type: 'null' }
{ type: 'any' }
{ type: ['boolean', 'string'] }
```

#### pattern
The expected value regex needs to be satisfied by the value

```js
{ pattern: /^[a-z]+$/ }
```

#### maxLength
The length of value must be greater than or equal to expected value

```js
{ maxLength: 8 }
```

#### minLength
The length of value must be lesser than or equal to expected value

```js
{ minLength: 8 }
```

#### minimum
Value must be greater than or equal to the expected value

```js
{ minimum: 10 }
```

#### maximum
Value must be lesser than or equal to the expected value

```js
{ maximum: 10 }
```

#### exclusiveMinimum
Value must be greater than expected value

```js
{ exclusiveMinimum: 9 }
```

### exclusiveMaximum
Value must be lesser than expected value

```js
{ exclusiveMaximum: 11 }
```

#### divisibleBy
Value must be divisible by expected value

```js
{ divisibleBy: 5 }
{ divisibleBy: 0.5 }
```

#### minItems
Value must contain more then expected value number of items

```js
{ minItems: 2 }
```

#### maxItems
Value must contains less then expected value number of items

```js
{ maxItems: 5 }
```

#### uniqueItems
Value must hold a unique set of values

```js
{ uniqueItems: true }
```

#### enum
Value must be present in the array of expected value

```js
{ enum: ['month', 'year'] }
```

#### format
Value must be a valid format

```js
{ format: 'url' }
{ format: 'email' }
{ format: 'ip-address' }
{ format: 'ipv6' }
{ format: 'date-time' }
{ format: 'date' }
{ format: 'time' }
{ format: 'color' }
{ format: 'host-name' }
{ format: 'utc-millisec' }
{ format: 'regex' }
```

#### conform
Value must conform to constraint denoted by expected value

```js
{ conform: function (v, o) {
    // `o` is current object at validation
    if (v%3==1) return true;
    return false;
  }
}
```

#### dependencies
Value is valid only if the dependent value is valid

```js
{
  town: { required: true, dependencies: 'country' },
  country: { maxLength: 3, required: true }
}
```

#### filter
Apply filter on `value`

```js
{
  filter: function (v) {
    return v.toLowerCase();
  }
}
```

`filter` attribute can be array of filters.  
Filter applies only after successful validation of `value`.  
Filter errors as validation errors sets `valid` to *false* and provides error
description at `errors` array.  
Complex types (array, object) can't be filtered directly, use filter for
array items or object properties instead.

### $ref
You can add links to nested schemas, already loaded in validator,
or use links to schema itself `$ref: '#'`.
```js
{
  properties: {
    nested: {$ref: '#nested'},
    itself: {$ref: '#'}
  }
}
```

### Nested Schema
We also allow nested schema

```js
{
  properties: {
    title: {
      type: 'string',
      maxLength: 140,
      required: true
    },
    author: {
      type: 'object',
      required: true,
      properties: {
        name: {
          type: 'string',
          required: true
        },
        email: {
          type: 'string',
          format: 'email'
        }
      }
    }
  }
}
```

### Custom Messages
We also allow custom message for different constraints

```js
{
  type: 'string',
  format: 'url'
  messages: {
    type: 'Not a string type',
    format: 'Expected format is a url'
  }
```

```js
{
  conform: function () { ... },
  message: 'This can be used as a global message'
}
```

## Tests
Clone repository from github, `cd` into cloned dir and install dev dependencies

``` bash
  $ npm install
```

run tests

``` bash
  $ npm test
```

#### conform.js author: [Oleg Korobenko](https://github.com/okv)
#### revalidator authors: [Charlie Robbins](http://nodejitsu.com), [Alexis Sellier](http://cloudhead.io)
#### revalidator contributors: [Fedor Indutny](http://github.com/indutny), [Bradley Meck](http://github.com/bmeck), [Laurie Harper](http://laurie.holoweb.net/)
#### License: Apache 2.0
