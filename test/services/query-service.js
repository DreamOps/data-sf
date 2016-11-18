var sinon = require('sinon');
var promise = require('promised-io/promise');
require('sinon-as-promised');
var expect = require('chai').expect;
var queryServiceFactory = require('./../../src/services/query-service');

describe('query-service', function() {
  var query;
  var loginMock;
  var queryMock;
  beforeEach(function() {
    queryMock = sinon.stub();
    var connectionMock = {
      query: queryMock
    };
    loginMock = sinon.stub().resolves(connectionMock);
    query = queryServiceFactory(loginMock, promise);
  });

  it('Expect loginMock called', function() {
    query('some fake query');
    expect(loginMock.called).to.be.true;
  });

  it('Expect queryMock called', function(done) {
    queryMock.callsArgWith(1, null, {records: [1,2,3]});
    query('some fake query').then(function(records) {
      expect(queryMock.called).to.be.true;
      expect(records).to.contain(1);
      expect(records).to.contain(2);
      expect(records).to.contain(3);
      done();
    });
  });

  it('Expect rejection when queryMock rejects', function(done) {
    queryMock.callsArgWith(1, 'An Error has Occured', null);
    query('some fake query').then(function(records) {
      expect(false);
      done();
    }, function(reason) {
      expect(queryMock.called).to.be.true;
      expect(reason).to.be.equal('An Error has Occured');
      done();
    });
  });
});

