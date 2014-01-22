#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs= require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

// Restler Code
var util = require('util');
var rest = require('restler');


var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1);
	   // put these double slash type comments on separate line! Otherwise REPL gets screwed up!
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    // console.log(Object.prototype.toString.call(htmlfile));     //String!

    var myreadfilesync = fs.readFileSync(htmlfile);               // Object (buffer)
    // console.log(Object.prototype.toString.call(myreadfilesync));

    var mycheerio = cheerio.load(myreadfilesync);                 // Function!
    // console.log(Object.prototype.toString.call(mycheerio));

    return(mycheerio);
}

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};


var buildfn = function(checksFile) {
    var response2console = function(result, response) {
        if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
        } else {
            // KLUDGE!!!: console.error("Create Temp Build File zoobahtemp.");
            fs.writeFileSync('zoobahtemp', result);
	    var checkJson = checkHtmlFile('zoobahtemp', checksFile);

	    var outJson = JSON.stringify(checkJson, null, 4);
	    console.log(outJson);

            // csv2console(csvfile, headers);
        }
    };
    return response2console;
};



// USAGE: ./grader.js --checks checks.json --url http://cryptic-peak-9067.herokuapp.com

if(require.main == module) {
    program
	.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
	.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
	.option('-u, --url <url_file>', 'Url to index.html')
	.parse(process.argv);
    if (program.url)
    {
	var response2console = buildfn(program.checks);
	rest.get(program.url).on('complete', response2console);
    }
    else
    {
	var checkJson = checkHtmlFile(program.file, program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
