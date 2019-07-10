const mysql = require('mysql');
const express = require('express');
const app = express();
const morgan = require('morgan');
const url = require("url");
const bodyParser = require("body-parser");
const axios = require('axios');

// File containing the functions that we are testing
require('../index.js');

app.use(express.static('public'));

//Database ends defined is external file
var Database = require('../mdxdatabase');

//Test for getTotalPropertiesCount method in Database.
describe('Server', function () {
    describe('#getTotalPropertiesCount', function () {
        it('should return the total number of properties in the database ', function (done) {
            //Data and dummy objects for test
            var response = {};
            var numItems = 4;
            var offset = 0;

            //Use database code to create a database object for our testing.
            var db = new Database();

            //getAllProperties is the callback function in database object. 
            db.getAllProperties = function (response, totNumItems, numItems, offset) {
                assert.equal(totNumItems, 4); //Check that is the correct number of items!
                done();
            }

            //Call function that we are testing
            db.getTotalPropertiesCount(response, numItems, offset);
        });
    });

});

