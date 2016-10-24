var sinon = require('sinon');
var promise = require('promised-io/promise');
require('sinon-as-promised');
var expect = require('chai').expect;
var queryServiceFactory = require('./../../src/services/query-service');

describe('query-service', function() {
  var query, loginMock, queryMock;
  before(function() {
    queryMock = sinon.stub();
    var connectionMock = {
      query: queryMock
    };
    loginMock = sinon.stub().resolves(connectionMock);
    query = queryServiceFactory(loginMock, promise);
  });

  afterEach(function() {
    queryMock.reset();
  });

  it('Expect loginMock called', function() {
    query('some fake query');
    expect(loginMock.called).to.be.true;
  });

  it('Expect queryMock called', function() {
    queryMock.callsArgWith(1, null, {records: [1,2,3]});
    query('some fake query').then(function(records) {
      expect(queryMock.called).to.be.true;
      expect(records).to.be.equal([1,2,3]);
    });
  });

  it('Expect rejection when queryMock rejects', function() {
    queryMock.callsArgWith(1, 'An Error has Occured', null);
    query('some fake query').then(function(records) {
      expect(false);
    }, function(reason) {
      expect(queryMock.called).to.be.true;
      expect(reason).to.be.equal('An Error has Occured');
    });
  });
});

