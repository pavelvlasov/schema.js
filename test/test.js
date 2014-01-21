'use strict';

var validator = require('../lib').validator,
	expect = require('expect.js');

describe('base validator functions', function() {
	it('add schemas', function() {
		validator.add('article', {
			properties: {
				title: {type: 'string', required: true},
				body: {type: 'string', required: true},
				comments: {
					type: 'array',
					items: {'$ref': 'article#comment'}
				}
			}
		});

		validator.add('article#comment', {
			properties: {
				author: {type: 'string', required: true},
				body: {type: 'string', required: true}
			}
		});
	});

	it('validate object with ref', function() {
		var res = validator.validate({
			title: 'some title',
			body: 'some body',
			comments: [{
				author: 'Holden Caulfield',
				body: 'first comment'
			}]
		}, 'article');
		expect(res.valid).to.be.ok();

		res = validator.validate({
			author: 'Holden Caulfield',
			body: 'single comment'
		}, 'article#comment');
		expect(res.valid).to.be.ok();

		res = validator.validate({
			title: 'some title',
			body: 'some body',
			comments: [{
				author: 'Holden Caulfield',
				body: 'first comment'
			}, {
				badcomment: 'some string'
			}]
		}, 'article');
		expect(res.valid).not.to.be.ok();
	});

	it('remove schemas', function() {
		validator.remove('article');
	});
});
