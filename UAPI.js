// load UJS.
require('./UJS-NODE.js');

RUN(function() {
	'use strict';
	
	var
	//IMPORT: esprima
	esprima = require('esprima'),
	
	// source path
	sourcePath = process.argv[2],
	
	// api path
	apiPath = process.argv[3],
	
	// check is allowed folder name.
	checkIsAllowedFolderName = function(name) {
		//REQUIRED: name

		return (
			// hide folder
			name[0] !== '.' &&

			// node.js module
			name !== 'node_modules' &&

			// not_load
			name !== 'not_load' &&

			// deprecated
			name !== 'deprecated' &&

			// _ folder
			name[0] !== '_'
		);
	},
	
	// scan folder.
	scanFolder = function(path, func) {
		//REQUIRED: path
		//REQUIRED: func

		if (CHECK_IS_EXISTS_FILE({
			path : path,
			isSync : true
		}) === true) {

			FIND_FILE_NAMES({
				path : path,
				isSync : true
			}, {

				error : function() {
					// ignore.
				},

				success : function(fileNames) {
					EACH(fileNames, function(fileName) {
						func(path + '/' + fileName);
					});
				}
			});

			FIND_FOLDER_NAMES({
				path : path,
				isSync : true
			}, {

				error : function() {
					// ignore.
				},

				success : function(folderNames) {
					EACH(folderNames, function(folderName) {
						if (checkIsAllowedFolderName(folderName) === true) {
							scanFolder(path + '/' + folderName, func);
						}
					});
				}
			});
		}
	};
	
	scanFolder(sourcePath, function(path) {
		
		var
		// source
		source = READ_FILE({
			path : path,
			isSync : true
		}).toString(),
		
		// syntax
		syntax = esprima.parse(source, {
			attachComment : true
		}).body[0],
		
		// name
		name = source.substring(syntax.expression.left.range[0], syntax.expression.left.range[1]),
		
		// description
		description = syntax.leadingComments === undefined ? undefined : syntax.leadingComments[0].value,
		
		// type
		type = syntax.expression.right.callee.name;
		
		//console.log(JSON.stringify(syntax, null, 2));
		
		console.log(type);
		//console.log(syntax.expression.right.arguments[0].properties[0].value.body.body[0].trailingComments);
		
		if (description[0] === '*') {
			description = description.substring(1);
		}
		description = description.replace(/\n \*/, '\n').trim();
	});
});
