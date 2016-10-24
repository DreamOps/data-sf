var util = require('util');
var expect = require('chai').expect;
var namespaceServiceFactory = require('./../../src/services/namespace-service');

describe('namespace-service', function() {
  var namespaceService;
  before(function() {
    namespaceService = namespaceServiceFactory({
      nuObjectNamespace: 'FOO__',
      nuClassNamespace: 'FOO.',
      ncObjectNamespace: 'BAR__'
    });
  });

  it('Expect all occurances of NU__ namespace replaced', function() {
    var testJson = {
      "NU__Product__c": {
        "RecordTypeId": "${DonationRecordType.Id}",
        "Name": "Test Donation Product",
        "NU__Entity__c": "${Entity.Id}",
        "NU__DisplayOrder__c": 1,
        "NU__QuantityMax__c": 1,
        "NU__ListPrice__c": 10.00,
        "NU__RevenueGLAccount__c": "${GlAccount.Id}",
        "NU__ExternalId__c": "TestDonationProduct"
      }
    };
    var testReturnJson = namespaceService(testJson);
    expect(testReturnJson.FOO__Product__c).to.not.be.null;
    expect(testReturnJson.FOO__Product__c).to.not.be.undefined;
    expect(testReturnJson.FOO__Product__c.FOO__ListPrice__c)
      .to.be.equal(10.00);
    expect(testReturnJson.FOO__Product__c.FOO__QuantityMax__c)
      .to.be.equal(1);
    expect(testReturnJson.FOO__Product__c.FOO__DisplayOrder__c)
      .to.be.equal(1);
    expect(testReturnJson.FOO__Product__c.Name)
      .to.be.equal('Test Donation Product');
  });

  it('Expect all occurances of NU. namespace replaced', function() {
    //fake JSON to test the NU. removal
    var testJson = {
      "NU__Product__c": {
        "RecordTypeId": "${DonationRecordType.Id}",
        "Name": "Test Donation Product",
        "NU__Entity__c": "NU.EntityManager.Id",
        "NU.DisplayOrder__c": 1,
        "NU.QuantityMax__c": 1,
        "NU.ListPrice__c": 10.00,
        "NU__RevenueGLAccount__c": "${GlAccount.Id}",
        "NU__ExternalId__c": "TestDonationProduct"
      }
    };
    var testReturnJson = namespaceService(testJson);
    expect(testReturnJson.FOO__Product__c).to.not.be.null;
    expect(testReturnJson.FOO__Product__c).to.not.be.undefined;
    expect(testReturnJson.FOO__Product__c['FOO.ListPrice__c'])
      .to.be.equal(10.00);
    expect(testReturnJson.FOO__Product__c['FOO.QuantityMax__c'])
      .to.be.equal(1);
    expect(testReturnJson.FOO__Product__c['FOO.DisplayOrder__c'])
      .to.be.equal(1);
    expect(testReturnJson.FOO__Product__c.FOO__Entity__c)
      .to.be.equal('FOO.EntityManager.Id');
    expect(testReturnJson.FOO__Product__c.Name)
      .to.be.equal('Test Donation Product');
  });

  it('Expect all occurances of NC__ namespace replaced', function() {
    //fake data for NC__ removal tests
    var testJson = {
      "NC__Product__c": {
        "RecordTypeId": "${DonationRecordType.Id}",
        "Name": "Test Donation Product",
        "NC__Entity__c": "${Entity.Id}",
        "NC__DisplayOrder__c": 1,
        "NC__QuantityMax__c": 1,
        "NC__ListPrice__c": 10.00,
        "NC__RevenueGLAccount__c": "${GlAccount.Id}",
        "NC__ExternalId__c": "TestDonationProduct"
      }
    };
    var testReturnJson = namespaceService(testJson);
    expect(testReturnJson.BAR__Product__c).to.not.be.null;
    expect(testReturnJson.BAR__Product__c).to.not.be.undefined;
    expect(testReturnJson.BAR__Product__c.BAR__ListPrice__c)
      .to.be.equal(10.00);
    expect(testReturnJson.BAR__Product__c.BAR__QuantityMax__c)
      .to.be.equal(1);
    expect(testReturnJson.BAR__Product__c.BAR__DisplayOrder__c)
      .to.be.equal(1);
    expect(testReturnJson.BAR__Product__c.Name)
      .to.be.equal('Test Donation Product');
  });
});
