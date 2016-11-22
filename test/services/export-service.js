var sinon = require('sinon');
var promise = require('promised-io/promise');
require('sinon-as-promised');
var expect = require('chai').expect;
var exportServiceFactory = require('./../../src/services/export-service');

describe('export-service', function() {
  describe('export', function() {
    var loginMock;
    var records;
    var queryMock;
    var bulkQueryMock;
    var mockDataFileService;
    var destinationDir = 'test/directory';
    var queryObjects = [{
      'name': 'Batch Export Config',
      'useBulk': true,
      'query': 'SELECT Id FROM NU__BatchExportConfiguration__c',
      'type': 'NU__BatchExportConfiguration__c',
      'id': 'NU__ExternalID__c',
      'mappings': [
        {
          'sourceColumn': 'Id',
          'destColumn': 'NU__ExternalID__c'
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
        }
      ]
    }];
    beforeEach(function() {
      records = [{Id: 1}, {Id: 2}];
      mockDataFileService = {
        writeDataFile: sinon.stub().resolves(),
        writeManifestFile: sinon.stub().resolves()
      };
      queryMock = sinon.stub().resolves(records);
      bulkQueryMock = sinon.stub().resolves(records);
      loginMock = sinon.stub().resolves();
      exportService = exportServiceFactory(
        loginMock,
        queryMock,
        bulkQueryMock,
        mockDataFileService,
        promise
      );
    });

    it('Expects loginMock called', function(done) {
      exportService.export(queryObjects, destinationDir)
      .then(function() {
        expect(loginMock.calledOnce).to.be.true;
        done();
      });
    });

    it('calls query for one queryObject and both record types', function(done) {
      exportService.export(queryObjects, destinationDir)
      .then(function() {
        //once for the Committee Position and once for each record type
        expect(queryMock.calledThrice).to.be.true;
        done();
      });
    });

    it('calls bulkQuery for one queryObject', function(done) {
      exportService.export(queryObjects, destinationDir)
      .then(function() {
        //once for the useBulk property
        expect(bulkQueryMock.calledOnce).to.be.true;
        done();
      });
    });

    it('calls writeDataFile for both data files', function(done) {
      exportService.export(queryObjects, destinationDir)
      .then(function() {
        expect(mockDataFileService.writeDataFile.calledTwice).to.be.true;
        done();
      });
    });

    it('calls writeManifestFile for the operation', function(done) {
      exportService.export(queryObjects, destinationDir)
      .then(function() {
        expect(mockDataFileService.writeManifestFile.calledOnce).to.be.true;
        done();
      });
    });

    it('expects promise rejects for query reject', function(done) {
      queryMock.reset().rejects('error');
      exportService.export(queryObjects, destinationDir)
      .then(function() {
        expect(false).to.be.true;
        done();
      }, function(err) {
        expect(err.message).to.be.eq('error');
        done();
      });
    });

    it('expects promise rejects for bulkQuery reject', function(done) {
      bulkQueryMock.reset().rejects('error');
      exportService.export(queryObjects, destinationDir)
      .then(function() {
        expect(false).to.be.true;
        done();
      }, function(err) {
        expect(err.message).to.be.eq('error');
        done();
      });
    });

    it('expects promise rejects for writeDataFile reject', function(done) {
      mockDataFileService.writeDataFile.reset().rejects('error');
      exportService.export(queryObjects, destinationDir)
      .then(function() {
        expect(false).to.be.true;
        done();
      }, function(err) {
        expect(err.message).to.be.eq('error');
        done();
      });
    });

    it('expects promise rejects for writeManifestFile reject', function(done) {
      mockDataFileService.writeManifestFile.reset().rejects('error');
      exportService.export(queryObjects, destinationDir)
      .then(function() {
        expect(false).to.be.true;
        done();
      }, function(err) {
        expect(err.message).to.be.eq('error');
        done();
      });
    });
  });

  describe('mapFields', function() {
    var record = {
      attributes: [{}, 'stuff in here'],
      'Id': '1'
    };
    var mappings = [
      {
        'sourceColumn': 'Id',
        'destColumn': 'NU__ExternalID__c'
      }
    ];

    it('deletes the attributes property', function() {
      exportService = exportServiceFactory(
        null,
        null,
        null,
        null,
        null
      );
      var newRecord = exportService.mapFields(record, mappings);
      expect(newRecord.attributes).to.be.undefined;
    });

    it('maps the sourceColumn to the destColumn', function() {
      exportService = exportServiceFactory(
        null,
        null,
        null,
        null,
        null
      );
      var value = record[mappings[0].sourceColumn];
      var newRecord = exportService.mapFields(record, mappings);
      expect(newRecord[mappings[0].destColumn]).to.be.eq(value);
    });

    it('deletes the sourceColumn property', function() {
      exportService = exportServiceFactory(
        null,
        null,
        null,
        null,
        null
      );
      var newRecord = exportService.mapFields(record, mappings);
      expect(newRecord[mappings[0].sourceColumn]).to.be.undefined;
    });
  });

  describe('exportRecordTypes', function() {
    var qMock;
    var records;
    var exportService;
    beforeEach(function() {
      records = [
        {Id: 1, Name: 'Individual', DeveloperName: 'Individual'},
        {Id: 2, Name: 'Organization', DeveloperName: 'Organization'}
      ];
      qMock = sinon.stub().resolves(records);
      exportService = exportServiceFactory(
        null,
        qMock,
        null,
        null,
        promise
      );
    });

    it('Expects query called', function(done) {
      var recordTypeQuery = 'SELECT Id, Name, DeveloperName FROM RecordType' +
                          ' WHERE SObjectType = \'Account\' AND IsActive = true';
      exportService.exportRecordTypes('Account')
      .then(function() {
        expect(qMock.calledOnce).to.be.true;
        expect(qMock.calledWith(recordTypeQuery)).to.be.true;
        done();
      });
    });

    it('Expects results for each record type', function(done) {
      exportService.exportRecordTypes('Account')
      .then(function(results) {
        expect(results).to.be.instanceOf(Object);
        expect(results[1].variable).to.be.eq('IndividualRT');
        expect(results[2].variable).to.be.eq('OrganizationRT');
        done();
      });
    });
  });
});
