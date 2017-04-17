var sinon = require('sinon');
var util = require('util');
var promise = require('promised-io/promise');
require('sinon-as-promised');
var expect = require('chai').expect;
var partnerServiceFactory = require('./../../src/services/jsforce-partner-service');

describe('jsforce-partner-service', function() {
  var partnerService;
  var loginMock;
  var SOAP;
  var resultMock;
  before(function() {
    var connectionMock = {
      instanceUrl: 'blahblah',
      version: '1.35'
    };
    loginMock = sinon.stub().resolves(connectionMock);

    SOAP = sinon.stub();
    SOAP.prototype.invoke = sinon.stub().resolves({result: 'fakeresult'});

    partnerService = partnerServiceFactory(SOAP, loginMock);
  });

  it('Expect loginMock called', function(done) {
    partnerService.describeSObjects(['Account', 'Contact']).then(function() {
      expect(loginMock.called).to.be.true;
      done();
    }, function(err) {
      done(err);
    });
  });

  it('Expect soapMock called', function(done) {
    partnerService.describeSObjects(['Account', 'Contact']).then(function() {
      expect(SOAP.called).to.be.true;
      done();
    }, function(err) {
      done(err);
    });
  });

  it('Expect correct result', function(done) {
    partnerService.describeSObjects(['Account', 'Contact']).then(function(res) {
      expect(res).to.be.eq('fakeresult');
      done();
    }, function(err) {
      done(err);
    });
  });
});
