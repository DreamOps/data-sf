var sinon = require('sinon');
var promise = require('promised-io/promise');
require('sinon-as-promised');
var expect = require('chai').expect;
var queryObjectFactoryFunction = require('./../../src/factories/query-object');

describe('query-object-factory', function() {
  var queryObjectdata = [{
    'name': 'Batch Export Config',
    'useBulk': true,
    'query': 'SELECT Id FROM NU__BatchExportConfiguration__c',
    'type': 'NU__BatchExportConfiguration__c',
    'id': 'NU__ExternalID__c',
    'mappings': [
      {
        'sourceColumn': 'Id',
        'destColumn': 'NU__ExternalID__c'
      },
      {
        'value': 'bar',
        'destColumn': 'foo'
      }
    ]
  },
  {
    'name': 'Committee Position',
    'query': 'SELECT Id FROM NU__CommitteePosition__c',
    'type': 'NU__CommitteePosition__c',
    'id': 'NU__ExternalID__c',
    'mappings': [
      {
        'sourceColumn': 'Id',
        'destColumn': 'NU__ExternalID__c'
      },
      {
        'value': 'bar',
        'destColumn': 'foo'
      }
    ]
  }];
  describe('factory function', function() {
    beforeEach(function() {
      queryObjectFactory = queryObjectFactoryFunction(
        null,
        null,
        null
      );
    });

    it('Expects QueryObjects constructed', function() {
      var qObjects = queryObjectFactory(queryObjectdata);
      expect(qObjects.length).to.be.eq(queryObjectdata.length);
      expect(qObjects[0]).to.be.an.instanceof(Object);
    });
  });

  describe('QueryObject', function() {
    var queryMock;
    var bulkQueryMock;
    var records;
    var qObjects;
    beforeEach(function() {
      records = [
        {
          attributes: [{}, 'stuff in here'],
          'Id': 'abc123',
          'Name': 'Test Event',
          'NU__ShortName__c': 'TE',
          'NU__Status__c': 'Active',
          'NU__Entity__c': '${Entity.Id}',
          'NU__StartDate__c': '2016-04-22T08:00:00Z',
          'NU__EndDate__c': '2016-04-25T08:00:00Z',
          'NU__ExternalID__c': 'TestEvent'
        }
      ];
      queryMock = sinon.stub().resolves(records);
      bulkQueryMock = sinon.stub().resolves(records);
      queryObjectFactory = queryObjectFactoryFunction(
        queryMock,
        bulkQueryMock,
        promise
      );
      qObjects = queryObjectFactory(queryObjectdata);
    });

    describe('doQuery', function() {
      var recordTypeRecords = [{
        attributes: [{}, 'stuff in here'],
        'Id': '1',
        Name: 'SampleRecordType'
      }];

      it('calls bulkQuery when isBulk true', function(done) {
        qObjects[0].doQuery().then(function() {
          expect(bulkQueryMock.calledOnce).to.be.true;
          //for the record types
          expect(queryMock.called).to.be.true;
          done();
        });
      });

      it('calls query when isBulk false or undefined', function(done) {
        qObjects[1].doQuery().then(function() {
          //once for the record types
          expect(queryMock.calledTwice).to.be.true;
          expect(bulkQueryMock.called).to.be.false;
          done();
        });
      });

      it('rejects when query rejects', function(done) {
        queryMock.reset().rejects('error');
        qObjects[1].doQuery().then(function() {
          expect(false).to.be.true;
          done();
        }, function(err) {
          expect(queryMock.called).to.be.true;
          expect(bulkQueryMock.called).to.be.false;
          expect(err).to.be.instanceof(Error);
          expect(err.message).to.be.eq('error');
          done();
        });
      });

      it('rejects when bulkQuery rejects', function(done) {
        bulkQueryMock.reset().rejects('error');
        qObjects[0].doQuery().then(function() {
          expect(false).to.be.true;
          done();
        }, function(err) {
          expect(bulkQueryMock.calledOnce).to.be.true;
          expect(err).to.be.instanceof(Error);
          expect(err.message).to.be.eq('error');
          done();
        });
      });

      describe('mapping fields', function() {
        beforeEach(function() {
          queryMock.reset().resolves(recordTypeRecords);
        });

        it('deletes the attributes property', function(done) {
          var newRecord = qObjects[0].doQuery().then(function() {
            var mappedRecord = qObjects[0].records[0];
            expect(mappedRecord.attributes).to.be.undefined;
            done();
          }, function(err) {
            expect(err).to.be.undefined;
            done(err);
          });
        });

        it('maps the sourceColumn to the destColumn', function(done) {
          var value = records[0].Id;
          var newRecord = qObjects[0].doQuery().then(function() {
            var mappedRecord = qObjects[0].records[0];
            expect(mappedRecord.NU__ExternalID__c).to.be.eq(value);
            done();
          }, function(err) {
            expect(err).to.be.undefined;
            done(err);
          });
        });

        it('deletes the sourceColumn property', function(done) {
          var newRecord = qObjects[0].doQuery().then(function() {
            var mappedRecord = qObjects[0].records[0];
            expect(mappedRecord.Id).to.be.undefined;
            done();
          }, function(err) {
            expect(err).to.be.undefined;
            done(err);
          });
        });

        it('maps the value to the destColumn', function(done) {
          var value = 'bar';
          var newRecord = qObjects[0].doQuery().then(function() {
            var mappedRecord = qObjects[0].records[0];
            expect(mappedRecord.foo).to.be.eq(value);
            done();
          }, function(err) {
            expect(err).to.be.undefined;
            done(err);
          });
        });
      });

      describe('mapping record types', function() {
        beforeEach(function() {
          records[0].RecordTypeId = '1';
          queryMock.reset().resolves(recordTypeRecords);
        });

        it('Maps RecordTypeId to an expression', function(done) {
          var newRecord = qObjects[0].doQuery().then(function() {
            var mappedRecord = qObjects[0].records[0];
            expect(mappedRecord.RecordTypeId).to.be.eq(
              '${' + recordTypeRecords[0].Name + 'RT.Id}'
            );
            done();
          }, function(err) {
            expect(err).to.be.undefined;
            done(err);
          });
        });
      });
    });

    describe('exportRecordTypes', function() {
      beforeEach(function() {
        records = [
          {Id: 1, Name: 'Individual'},
          {Id: 2, Name: 'Organization'}
        ];
        queryMock = sinon.stub().resolves(records);
        queryObjectFactory = queryObjectFactoryFunction(
          queryMock,
          bulkQueryMock,
          promise
        );
        qObjects = queryObjectFactory(queryObjectdata);
      });

      it('Expects query called', function(done) {
        var recordTypeQuery = 'SELECT Id, Name FROM RecordType' +
            ' WHERE SObjectType = \'NU__BatchExportConfiguration__c\' AND IsActive = true';
        qObjects[0].exportRecordTypes()
        .then(function() {
          expect(queryMock.calledOnce).to.be.true;
          expect(queryMock.calledWith(recordTypeQuery)).to.be.true;
          done();
        }, function(err) {
          expect(err).to.be.undefined;
          done(err);
        });
      });

      it('Expects results for each record type', function(done) {
        qObjects[0].exportRecordTypes()
        .then(function(results) {
          expect(results).to.be.instanceOf(Object);
          expect(results[1].variable).to.be.eq('IndividualRT');
          expect(results[2].variable).to.be.eq('OrganizationRT');
          done();
        }, function(err) {
          expect(err).to.be.undefined;
          done(err);
        });
      });
    });
  });
});
