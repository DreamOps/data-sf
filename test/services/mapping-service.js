var sinon = require('sinon');
var util = require('util');
var promise = require('promised-io/promise');
var lodash = require('lodash');
require('sinon-as-promised');
var expect = require('chai').expect;
var mappingServiceFactory = require('./../../src/services/mapping-service');
var describeMock = require('./describeResult.json');
var globalDescribeMock = require('./globalDescribeResult.json');

describe('mapping-service', function() {
  var partnerServiceMock;
  var resultMock;
  var loginMock;
  var mappingService;
  var fsMock;
  before(function() {
    var connectionMock = {
      instanceUrl: 'blahblah',
      version: '1.35',
      describeGlobal: sinon.stub().resolves(globalDescribeMock)
    };
    loginMock = sinon.stub().resolves(connectionMock);
    fsMock = {
      writeFile: sinon.stub()
    };
    partnerServiceMock = {
      describeSObjects: sinon.stub().resolves(describeMock)
    };
    mappingService = mappingServiceFactory({}, loginMock, partnerServiceMock, lodash, fsMock);
  });

  it('Expect loginMock called', function(done) {
    mappingService.map('/path/to/the/file.json').then(function() {
      expect(loginMock.called).to.be.true;
      done();
    }, function(err) {
      done(err);
    });
  });

  it('Expect partnerServiceMock called', function(done) {
    mappingService.map('/path/to/the/file.json').then(function() {
      expect(partnerServiceMock.describeSObjects.called).to.be.true;
      done();
    }, function(err) {
      done(err);
    });
  });

  it('Expect fsMock called result', function(done) {
    mappingService.map('/path/to/the/file.json').then(function(res) {
      expect(fsMock.writeFile.called).to.be.true;
      done();
    }, function(err) {
      done(err);
    });
  });
});
