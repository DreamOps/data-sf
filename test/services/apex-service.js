var sinon = require('sinon');
var util = require('util');
var promise = require('promised-io/promise');
require('sinon-as-promised');
var expect = require('chai').expect;
var apexServiceFactory = require('./../../src/services/apex-service');
var testLogger = function(s) {};

describe('apex-service', function() {
  var apexService;
  var loginMock;
  var executeMock;
  before(function() {
    executeMock = sinon.stub();
    var connectionMock = {
      tooling: {
        executeAnonymous: executeMock
      }
    };
    loginMock = sinon.stub().resolves(connectionMock);
    apexService = apexServiceFactory(loginMock, promise, util, testLogger);
  });

  it('Expect loginMock called', function() {
    apexService('some fake apex');
    expect(loginMock.called).to.be.true;
  });

  it('Expect jsforce execution mock called', function(done) {
    executeMock.callsArgWith(1, null, {compiled: true, success: true});
    apexService('some fake apex').then(function(result) {
      expect(executeMock.called).to.be.true;
      done();
    });
  });

  it('Expect promise rejection when there is a syntax issue', function(done) {
    executeMock.callsArgWith(1, null, {
      compiled: false,
      success: false,
      compileProblem: 'it didn\'t compile'
    });
    var returnedPromise = apexService('some fake apex');
    expect(executeMock.called).to.be.true;
    returnedPromise.then(function() {
      expect(false).to.be.true;
      done();
    }, function(reason) {
      expect(reason).to.equal('it didn\'t compile');
      done();
    });
  });

  it('Expect promise rejection when there is an error on execution', function(done) {
    executeMock.callsArgWith(1, 'test error', null);
    var returnedPromise = apexService('some fake apex');
    expect(executeMock.called).to.be.true;
    returnedPromise.then(function() {
      expect(false).to.be.true;
      done();
    }, function(reason) {
      expect(reason).to.equal('test error');
      done();
    });
  });
});
