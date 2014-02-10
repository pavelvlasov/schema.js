'use strict';

var expect = require('expect.js'),
	validator = require('../lib').validator,
	mixin = require('../lib').mixin;

function clone(object) {
	return Object.keys(object).reduce(function (obj, k) {
		obj[k] = object[k];
		return obj;
	}, {});
};


function assertInvalid(res) {
	expect(res.valid).to.equal(false);
}

function assertValid(res) {
	expect(res.valid).to.equal(true);
}

function assertHasError(res, attr, field) {
	expect(res.errors.length).to.be.ok();
	expect(res.errors.some(function (e) {
		return e.attribute === attr && (field ? e.property === field : true);
	})).to.be.ok();
}

function assertInvalidWithError(res) {
	assertInvalid(res);
	assertHasError.apply(null, arguments);
}

function assertHasErrorMsg(res, attr, msg) {
	expect(res.errors.length).to.be.ok();
	expect(res.errors.some(function (e) {
		return e.attribute === attr && e.message === msg;
	})).to.be.ok();
}

var _schemaId = 1;
function validate(obj, schema, options) {
	var schemaId = _schemaId++;
	validator.add(schema, schemaId);
	return validator.validate(obj, schemaId, options);
}

function assertValidates(passingValue, failingValue, attributes) {
	var schema = {
		name: 'Resource',
		properties: { field: {} }
	};

	var failing;

	if (!attributes) {
		attributes = failingValue;
		failing = false;
	} else {
		failing = true;
	}

	var attr = Object.keys(attributes)[0];
	mixin(schema.properties.field, attributes);

	it('when the object conforms', function() {
		assertValid(validate({field: passingValue}, schema));
	});

	if (failing) {
		it("when the object does not conform", function() {
			var res = validate({ field: failingValue }, schema);
			assertInvalid(res);
			assertHasError(res, Object.keys(attributes)[0], 'field');
		});
	}
}

describe('validating', function() {
	it("with <type>:'string'", function() {assertValidates('hello', 42, {type: "string"})});
	it("with <type>:'number'", function() {assertValidates(42, 'hello', {type: "number"})});
	it("with <type>:'integer'", function() {assertValidates(42, 42.5, {type: "integer"})});
	it("with <type>:'array'", function() {assertValidates([4, 2], 'hi', {type: "array"})});
	it("with <type>:'object'", function() {assertValidates({}, [], {type: "object"})});
	it("with <type>:'boolean'", function() {assertValidates(false, 42, {type: "boolean"})})
	it("with <types>:bool,num", function() {assertValidates(false, 'hello', {type: ["boolean", "number"]})});
	it("with <types>:bool,num", function() {assertValidates(544, null, {type: ["boolean", "number"]})});
	it("with <type>:'null'", function() {assertValidates(null, false, {type: "null"})});
	it("with <type>:'any'", function() {assertValidates(9, {type: "any"})});
	it("with <pattern>", function() {assertValidates("kaboom", "42", {pattern: /^[a-z]+$/})});
	it("with <maxLength>", function() {assertValidates("boom", "kaboom", {maxLength: 4})});
	it("with <minLength>", function() {assertValidates("kaboom", "boom", {minLength: 6})});
	it("with <minimum>", function() {assertValidates(512, 43, {minimum: 473})})
	it("with <maximum>", function() {assertValidates(512, 1949, {maximum: 678})});
	it("with <divisibleBy>", function() {assertValidates(10, 9, {divisibleBy: 5})});
	it("with <divisibleBy> decimal", function() {assertValidates(0.2, 0.009, {divisibleBy: 0.01})});
	it("with <enum>", function() {assertValidates("orange", "cigar", {enum: ["orange", "apple", "pear"]})});
	it("with <format>:'url'", function() {assertValidates('http://test.com/', 'hello', {format: 'url'})});

	describe("with <dependencies>", function() {
		var schema = {
			properties: {
				town: {dependencies: "country"},
				country: {}
			}
		};
		it("when the object conforms", function() {
			assertValid(validate({town: "luna", country: "moon"}, schema));
		});
		it("when the object does not conform", function() {
			assertInvalidWithError(validate({town: "luna"}, schema), 'dependencies');
		});
	});

	describe("with <dependencies> as array", function() {
		var schema = {
			properties: {
				town:    { dependencies: ["country", "planet"] },
				country: { },
				planet: { }
			}
		};
		it("when the object conforms", function() {
			assertValid(validate({town: "luna", country: "moon", planet: "mars"}, schema));
		});
		it("when the object does not conform", function() {
			assertInvalidWithError(
				validate({town: "luna", planet: "mars"}, schema),
				'dependencies');
		});
	});

	describe("with <dependencies> as schema", function() {
		var schema = {
			properties: {
				town:    {
					type: 'string',
					dependencies: {
						properties: { x: { type: "number" } }
					}
				},
				country: { }
			}
		};
		it("when the object conforms", function() {
			assertValid(validate({town: "luna", x: 1}, schema));
		});
		it("when the object does not conform", function() {
			assertInvalid(validate({town: "luna", x: 'no'}, schema));
		});
	});

	describe("with <type>:'integer' and", function() {
		it("<minimum> constraints", function() {assertValidates (512, 43, {minimum: 473, type: 'integer'})});
		it("<maximum> constraints", function() {assertValidates (512, 1949, {maximum: 678, type: 'integer'})});
		it("<divisibleBy> constraints", function() {assertValidates (10, 9, {divisibleBy: 5, type: 'integer'})});
	});

	describe("with <additionalProperties>:false", function() {
		var schema = {
			properties: {
				town: { type: 'string' }
			},
			additionalProperties: false
		};
		it("when the object conforms", function() {
			assertValid(validate({town: "luna"}, schema));
		});
		it("when the object does not conform", function() {
			assertInvalid(validate({town: "luna", area: 'park'}, schema));
		});
	});

	describe("with option <additionalProperties>:false", function() {
		var schema = {
			properties: {
				town: {type: 'string'}
			}
		};
		it("when the object conforms", function() {
			assertValid(validate({town: "luna"}, schema, {additionalProperties: false}));
		});
		it("when the object does not conform", function() {
			assertInvalid(validate(
				{town: "luna", area: 'park'},
				schema,
				{additionalProperties: false}));
		});
		it("but overridden to true at schema", function() {
			schema = {
				properties: {
					town: {type: 'string'}
				},
				additionalProperties: true
			};
		});
		it("when the object does not conform", function() {
			assertValid(validate(
				{town: "luna", area: 'park'},
				schema,
				{additionalProperties: false}));
		});
	});

	describe("Article schema validation", function() {
		var schemaId = 'article';
		var schema = {
			name: 'Article',
			properties: {
				title: {
					type: 'string',
					maxLength: 140,
					conditions: {
						optional: function () {
							return !this.published;
						}
					}
				},
				date: {
					type: 'string',
					format: 'date',
					messages: {format: "must be a valid %{expected} and nothing else" }
				},
				body: {type: 'string'},
				tags: {
					type: 'array',
					uniqueItems: true,
					minItems: 2,
					items: {
						type: 'string',
						pattern: /[a-z ]+/
					}
				},
				tuple: {
					type: 'array',
					minItems: 2,
					maxItems: 2,
					items: {
						type: ['string', 'number']
					}
				},
				author:    {
					type: 'string',
					pattern: /^[\w ]+$/i,
					required: true,
					messages: {required: "is essential for survival" }
				},
				published: {type: 'boolean', 'default': false},
				category:  {type: 'string'},
				palindrome: {
					type: 'string',
					conform: function(val) {
						return val == val.split("").reverse().join("");
					}
				}
			},
			patternProperties: {
				'^_': {
					type: 'boolean', default: false
				}
			}
		};
		validator.add(schema, schemaId);

		var rawObject = {
			title: 'Gimme some Gurus',
			date: '2012-02-04',
			body: "And I will pwn your codex.",
			tags: ['energy drinks', 'code'],
			tuple: ['string0', 103],
			author: 'cloudhead',
			published: true,
			category: 'misc',
			palindrome: 'dennis sinned',
			_flag: true
		}, object;

		it('validate valid object', function() {
			var res = validator.validate(rawObject, schemaId);
			assertValid(res);
			expect(res.errors.length).not.to.be.ok();
		});

		it('validate object with missing required property', function() {
			object = clone(rawObject);
			delete object.author;
			var res = validator.validate(object, schemaId);
			assertHasError(res, 'required', 'author');
			assertHasErrorMsg(res, 'required', "is essential for survival");
		});

		it('validate object if it has a missing non-required property', function() {
			object = clone(rawObject);
			delete object.category;
			assertValid(validator.validate(object, schemaId));
		});

		it('validate object and if it has a incorrect pattern property', function() {
			object = clone(rawObject);
			object._additionalFlag = 'text';
			assertInvalid(validate(object, schema));
		});

		it('validate object if it has a incorrect unique array property', function() {
			object = clone(rawObject);
      object.tags = ['a', 'a'];
      assertInvalid(validate(object, schema));
		});

		it('validate object if it has a incorrect array property (wrong values)', function() {
			object = clone(rawObject);
      object.tags = ['a', '____'];
      assertInvalid(validate(object, schema));
		});

		it('validate object if it has a incorrect array property (< minItems)', function() {
			object = clone(rawObject);
      object.tags = ['x'];
      assertInvalid(validate(object, schema));
		});

		it('validate object if it has a incorrect format (date)', function() {
			object = clone(rawObject);
      object.date = 'bad date';
      var res = validate(object, schema);
      assertInvalid(res);
      assertHasErrorMsg(res, 'format', 'must be a valid date and nothing else');
		});

		it('validate object if it is not a palindrome (conform function)', function() {
			object = clone(rawObject);
      object.palindrome = 'bad palindrome';
      assertInvalid(validate(object, schema));
		});

		it('validate object if it didn\'t validate a pattern', function() {
			object = clone(object);
      object.author = 'email@address.com';
      assertHasError(validate(object, schema), 'pattern', 'author');
		});
	});

	describe('using schema with cast option validate object', function() {
		var schemaId = 'cast';
		var schema = {
			properties: {
        answer: {type: "integer"}
      }
		};
		validator.add(schema, schemaId);
		it('with integer field', function() {
			assertValid(validator.validate({answer: '42'}, schemaId, {cast: true}));
			assertInvalid(validator.validate({answer: "forty2"}, schemaId, {cast: true}));
		});

		var schemaId = 'cast source';
		var schema = {
			properties: {
        answer: { type: "integer" },
        answer2: { type: "number" },
        answer3: {type: "array", items: {type: "string"}},
        answer4: {type: "array", items: {type: "integer"}},
        is_ready1: { type: "boolean" },
        is_ready2: { type: "boolean" },
        is_ready3: { type: "boolean" },
        is_ready4: { type: "boolean" },
        is_ready5: { type: "boolean" },
        is_ready6: { type: "boolean" }
      }
		};
		validator.add(schema, schemaId);
		var options = {cast: true, castSource: true};
		var source = {
			answer: "42",
      answer2: "42.2",
      answer3: ["yep"],
      answer4: [1, "2", 3, "4"],
      is_ready1: "true",
      is_ready2: "1",
      is_ready3: 1,
      is_ready4: "false",
      is_ready5: "0",
      is_ready6: 0
		};
		it('with options <castSource>:true', function() {
			var res = validator.validate(source, schemaId, options);

			assertValid(res);
			expect(source.answer).to.equal(42);
			expect(source.answer2).to.equal(42.2);
			expect(source.answer3).to.eql(["yep"]);
			expect(source.answer4).to.eql([1, 2, 3, 4]);
			expect(source.is_ready1).to.equal(true);
			expect(source.is_ready2).to.equal(true);
			expect(source.is_ready3).to.equal(true);
			expect(source.is_ready4).to.equal(false);
			expect(source.is_ready5).to.equal(false);
			expect(source.is_ready6).to.equal(false);
		});
	});
});
