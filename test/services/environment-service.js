var sinon = require('sinon');
var promise = require('promised-io/promise');
require('sinon-as-promised');
var expect = require('chai').expect;
var environmentServiceFactory = require('./../../src/services/environment-service');

describe('environment-service', function() {
  describe('buildEnvironment', function() {
    it('Expect queryObject to be called', function(done) {
      var results = [{Id: 1}];
      var queryObjectsMock = [{
        doQuery: sinon.stub().resolves(),
        getName: sinon.stub().returns('someVariable'),
        formatRecords: sinon.stub().returns(results)
      }, {
        doQuery: sinon.stub().resolves(),
        getName: sinon.stub().returns('someOtherVariable'),
        formatRecords: sinon.stub().returns(results)
      }];
      var queryMock = sinon.stub().returns(queryObjectsMock);
      var environment = environmentServiceFactory(queryMock, promise);
      environment.buildEnvironment([{
        variable: 'someVariable',
        query: 'SELECT Id FROM SomeVariable__c'
      },{
        variable: 'someOtherVariable',
        query: 'SELECT Id FROM SomeVariable__c'
      }]).then(function(actualResult) {
        expect(queryMock.called).to.be.true;
        expect(queryObjectsMock[0].doQuery.called).to.be.true;
        expect(queryObjectsMock[0].getName.called).to.be.true;
        expect(queryObjectsMock[0].formatRecords.called).to.be.true;
        expect(queryObjectsMock[1].doQuery.called).to.be.true;
        expect(queryObjectsMock[1].getName.called).to.be.true;
        expect(queryObjectsMock[1].formatRecords.called).to.be.true;
        expect(actualResult).to.be.an.instanceof(Object);
        expect(actualResult).to.have.property('someVariable');
        expect(actualResult).to.have.property('someOtherVariable');
        done();
      });
    });

    it('Expect single result formatted', function(done) {
      var results = [{Id: 1}];
      var queryObjectsMock = [{
        doQuery: sinon.stub().resolves(),
        getName: sinon.stub().returns('someVariable'),
        formatRecords: function(formatter) {
          return formatter(results);
        }
      }, {
        doQuery: sinon.stub().resolves(),
        getName: sinon.stub().returns('someOtherVariable'),
        formatRecords: function(formatter) {
          return formatter(results);
        }
      }];
      var queryMock = sinon.stub().returns(queryObjectsMock);
      var environment = environmentServiceFactory(queryMock, promise);
      environment.buildEnvironment([{
        variable: 'someVariable',
        query: 'SELECT Id FROM SomeVariable__c'
      },{
        variable: 'someOtherVariable',
        query: 'SELECT Id FROM SomeVariable__c'
      }]).then(function(actualResult) {
        expect(queryMock.called).to.be.true;
        expect(queryObjectsMock[0].doQuery.called).to.be.true;
        expect(queryObjectsMock[0].getName.called).to.be.true;
        expect(queryObjectsMock[1].doQuery.called).to.be.true;
        expect(queryObjectsMock[1].getName.called).to.be.true;
        expect(actualResult).to.be.an.instanceof(Object);
        expect(actualResult).to.have.property('someVariable');
        expect(actualResult.someVariable).to.be.an.instanceof(Object);
        expect(actualResult).to.have.property('someOtherVariable');
        expect(actualResult.someOtherVariable).to.be.an.instanceof(Object);
        done();
      });
    });

    it('Expect multiple results not formatted', function(done) {
      var results = [{Id: 1}, {Id: 2}];
      var queryObjectsMock = [{
        doQuery: sinon.stub().resolves(),
        getName: sinon.stub().returns('someVariable'),
        formatRecords: function(formatter) {
          return formatter(results);
        }
      }, {
        doQuery: sinon.stub().resolves(),
        getName: sinon.stub().returns('someOtherVariable'),
        formatRecords: function(formatter) {
          return formatter(results);
        }
      }];
      var queryMock = sinon.stub().returns(queryObjectsMock);
      var environment = environmentServiceFactory(queryMock, promise);
      environment.buildEnvironment([{
        variable: 'someVariable',
        query: 'SELECT Id FROM SomeVariable__c'
      },{
        variable: 'someOtherVariable',
        query: 'SELECT Id FROM SomeVariable__c'
      }]).then(function(actualResult) {
        expect(queryMock.called).to.be.true;
        expect(queryObjectsMock[0].doQuery.called).to.be.true;
        expect(queryObjectsMock[0].getName.called).to.be.true;
        expect(queryObjectsMock[1].doQuery.called).to.be.true;
        expect(queryObjectsMock[1].getName.called).to.be.true;
        expect(actualResult).to.be.an.instanceof(Object);
        expect(actualResult).to.have.property('someVariable');
        expect(actualResult.someVariable).to.be.an.instanceof(Array);
        expect(actualResult).to.have.property('someOtherVariable');
        expect(actualResult.someOtherVariable).to.be.an.instanceof(Array);
        done();
      });
    });

    it('Expect promise rejection when queryMock rejects', function(done) {
      var reason = 'An error has occured.';
      var queryObjMock = [{
        doQuery: sinon.stub().rejects(reason)
      }];
      var queryMock = sinon.stub().returns(queryObjMock);
      var environment = environmentServiceFactory(queryMock, promise);
      environment.buildEnvironment([{
        variable: 'someVariable',
        query: 'SELECT Id FROM SomeVariable__c'
      },{
        variable: 'someOtherVariable',
        query: 'SELECT Id FROM SomeVariable__c'
      }]).then(function(actualResult) {
        expect(false).to.be.true;
        done();
      }, function(actualReason) {
        expect(queryMock.called).to.be.true;
        expect(actualReason.message).to.be.equal(reason);
        done();
      });
    });
  });

  describe('replaceVariables', function() {
    it('Expect replacement of ${variale.property} expressions', function() {
      var env = {
        someVariable: {Id: 1},
        someOtherVariable: {differentFieldName: 'string'}
      };
      var records = [
        {
          field1: '${someVariable.Id}'
        },
        {
          field1: '${someOtherVariable.differentFieldName}'
        }
      ];
      var environment = environmentServiceFactory(null, null);
      var newRecords = environment.replaceVariables(records, env);
      expect(newRecords).to.be.instanceof(Array);
      expect(newRecords.length).to.be.equal(2);
      expect(newRecords[0].field1).to.be.equal('1');
      expect(newRecords[1].field1).to.be.equal('string');
    });

    it('Expect missing variables not replaced', function() {
      var env = {someVariable: {Id: 1}};
      var records = [
        {
          field1: '${someOtherVariable.Id}'
        }
      ];
      var environment = environmentServiceFactory(null, null);
      var newRecords = environment.replaceVariables(records, env);
      expect(newRecords).to.be.instanceof(Array);
      expect(newRecords.length).to.be.equal(1);
      expect(newRecords[0].field1).to.be.equal('${someOtherVariable.Id}');
    });
  });
});

