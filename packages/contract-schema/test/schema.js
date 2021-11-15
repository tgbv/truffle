var Schema = require("../index.js");
var assert = require("assert");

var MetaCoin = require("./MetaCoin.json");

describe("Schema", function() {
  it("validates correct input", function() {
    Schema.validate(MetaCoin);
  });

  it("throws exception on invalid input", function() {
    var invalid = {
      abi: -1
    };

    try {
      Schema.validate(invalid);
    } catch (err) {
      var abiErrors = err.errors.filter(function(error) {
        return error.dataPath === ".abi";
      });
      assert(abiErrors);
    }
  });

  it("normalizes a correct input", function () {
    Schema.normalize(MetaCoin);
  });

  it("throws exception when attempting to normalize an invalid schema", function () {
    var invalid = {
      abi: -1
    };

    try {
      Schema.normalize(invalid, {
        validate: true
      });
    } catch (err) {
      var abiErrors = err.errors.filter(function (error) {
        return error.dataPath === ".abi";
      });
      assert(abiErrors);
    }
  });
});
