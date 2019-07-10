const mysql = require('mysql');
const express = require('express');
const app = express();
const morgan = require('morgan');
const url = require("url");
const axios = require('axios');

//Import file system functionality
var fs = require('fs');

app.use(morgan('short'));

app.use(express.static('public'));

//Status codes defined in external file
require('./http_status.js');


//Create a connection object with the user details
const connectionPool = mysql.createPool({
    connectionLimit: 1,
    host: "localhost",
    user: "root",
    password: "mdx123",
    database: "mdxdatabase",
    multipleStatements: true,
    debug: false
});

//Set up the application to handle GET requests sent to the user path
app.get('/property*', handleGetRequest);//Subfolders
app.get('/property', handleGetRequest);

//Start the app listening on port 8080
app.listen(8080, () => console.log('Express server is runnig at port on 8080'));


/* Handles GET requests sent to web service.
   Processes path and query string and calls appropriate functions to
   return the data. */
function handleGetRequest(request, response) {
    //Parse the URL
    const urlObj = url.parse(request.url, true);

    //Extract object containing queries from URL object.
    const queries = urlObj.query;

    //Get the pagination properties if they have been set. Will be  undefined if not set.
    const numItems = queries['numItems'];
    const offset = queries['offset'];
    const search = queries['search'];
    //Split the path of the request into its components
    const pathArray = urlObj.pathname.split("/");

    //Get the last part of the path
    const pathEnd = pathArray[pathArray.length - 1];

    //If path ends with 'property' we return all properties
    if (pathEnd === 'property') {
        getTotalPropertyCount(response, numItems, offset, search);//This function calls the getAllProperties function in its callback
        return;
    }

    //If path ends with property/, we return all properties
    if (pathEnd === '' && pathArray[pathArray.length - 2] === 'property') {
        getTotalPropertyCount(response, numItems, offset, search);//This function calls the getAllProperties function in its callback
        return;
    }

    //If the last part of the path is a valid user id, return data about that user
    var regEx = new RegExp('^[0-9]+$');//RegEx returns true if string is all digits.
    if (regEx.test(pathEnd)) {
        getProperty(response, pathEnd);
        return;
    }

    //The path is not recognized. Return an error message
    response.status(HTTP_STATUS.NOT_FOUND);
    response.send("{error: 'Path not recognized', url: " + request.url + "}");
}


/** Returns all of the properties, possibly with a limit on the total number of items returned and the offset (to
 *  enable pagination). This function should be called in the callback of getTotalPropertiesCount  */
function getAllProperties(response, totNumItems, numItems, offset, search) {
    //Select the properties data using JOIN to convert foreign keys into useful data.
    var sql = "SELECT property.id, property.img_link, property.agent_id, agent.agent_name, agent.agent_phone, property.description, property.location, property.longitude, property.latitude, property.price, property.view_link FROM (property INNER JOIN agent ON property.agent_id=agent.id)";

    //Limit the number of results returned, if this has been specified in the query string
    if (numItems !== undefined && offset !== undefined) {
        sql += "ORDER BY property.price LIMIT" + numItems + " OFFSET " + offset;
    }
    if (search !== undefined) {
        sql += " where property.location like " + "'%" + search + "%'";
    }
    //Execute the query
    connectionPool.query(sql, function (err, result) {

        //Check for errors
        if (err) {
            //Not an ideal error code, but we don't know what has gone wrong.
            response.status(HTTP_STATUS.INTERNAL_SERVER_ERROR);
            response.json({ 'error': true, 'message': + err });
            return;
        }

        //Create JavaScript object that combines total number of items with data
        var returnObj = { totNumItems: totNumItems };
        returnObj.data = result; //Array of data from database

        //Return results in JSON format
        response.json(returnObj);
    });
}


/** When retrieving all properties we start by retrieving the total number of properties
    The database callback function will then call the function to get the property data
    with pagination */
function getTotalPropertyCount(response, numItems, offset, search) {
    var sql = "SELECT COUNT(*) FROM property ";

    //Execute the query and call the anonymous callback function.
    connectionPool.query(sql, function (err, result) {

        //Check for errors
        if (err) {
            //Not an ideal error code, but we don't know what has gone wrong.
            response.status(HTTP_STATUS.INTERNAL_SERVER_ERROR);
            response.json({ 'error': true, 'message': + err });
            return;
        }

        //Get the total number of items from the result
        var totNumItems = result[0]['COUNT(*)'];

        //Call the function that retrieves all properties
        getAllProperties(response, totNumItems, numItems, offset, search);
    });
}


/** Returns the property with the specified ID */
function getProperties(response, id) {
    //Build SQL query to select property with specified id.
    var sql = "SELECT property.id, property.img_link, property.agent_id, agent.agent_name, agent.agent_phone, property.description, property.location, property.longitude, property.latitude, property.price, property.view_link FROM (property INNER JOIN agent ON property.agent_id=agent.id)";

    //Execute the query
    connectionPool.query(sql, function (err, result) {

        //Check for errors
        if (err) {
            //Not an ideal error code, but we don't know what has gone wrong.
            response.status(HTTP_STATUS.INTERNAL_SERVER_ERROR);
            response.json({ 'error': true, 'message': + err });
            return;
        }

        //Output results in JSON format
        response.json(result);
    });
    module.exports = Database;
}
