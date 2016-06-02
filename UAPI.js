// load UJS.
require('./UJS-NODE.js');

RUN(function() {
	'use strict';
	
	var
	//IMPORT: Esprima
	Esprima = require('esprima'),
	
	//IMPORT: Path
	Path = require('path'),
	
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

			// LIB module
			name !== 'LIB' &&
			
			// BROWSER-FIX module
			name !== 'BROWSER-FIX' &&

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
						if (fileName[0] !== '_' && Path.extname(fileName) === '.js') {
							func(path + '/' + fileName);
						}
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
		syntax = Esprima.parse(source, {
			attachComment : true
		}).body[0],
		
		// left
		left,
		
		// right
		right,
		
		// static block
		staticBlock,
		
		// body block
		bodyBlock,
		
		// name
		name,
		
		// type
		type,
		
		// mom name
		momName,
		
		// description
		description,
		
		// params
		params = [],
		
		// static member name
		staticMemberName,
		
		// static func infos
		staticFuncInfos = [],
		
		// public func infos
		publicFuncInfos = [],
		
		// markdown
		markdown = '',
		
		// parse params.
		parseParams = function(params, body) {
			
			if (body.body === undefined) {
				body = body.arguments[0].body.body[0];
			} else {
				body = body.body.body[0];
			}
			
			if (body !== undefined) {
				
				EACH(body.leadingComments !== undefined ? body.leadingComments : body.trailingComments, function(commentInfo) {
					
					var
					// comment
					comment = commentInfo.value,
					
					// is required
					isRequired,
					
					// index
					index;
					
					if (comment.substring(0, 9) === 'REQUIRED:' || comment.substring(0, 9) === 'OPTIONAL:') {
						
						isRequired = comment.substring(0, 9) === 'REQUIRED:';
						
						comment = comment.substring(9).trim();
						index = comment.indexOf(' ');
						
						params.push({
							name : index === -1 ? comment : comment.substring(0, index),
							isRequired : isRequired,
							description : index === -1 ? undefined : comment.substring(index).trim()
						});
					}
				});
			}
		},
		
		// parse block.
		parseBlock = function(memberName, block, funcInfos) {
			
			EACH(block, function(body) {
				
				var
				// left
				left,
				
				// name
				name,
				
				// description
				description,
				
				// params
				params = [];
				
				if (body.type === 'ExpressionStatement' && body.expression.type == 'AssignmentExpression') {
					
					left = body.expression.left;
					
					if (left.object !== undefined && left.object.name === memberName) {
						
						name = left.property.name;
						
						EACH(block, function(body) {
							
							if (body.type === 'VariableDeclaration') {
								
								EACH(body.declarations, function(declaration) {
									if (declaration.id.name === name && declaration.leadingComments !== undefined) {
										description = declaration.leadingComments[0].value.trim();
										return false;
									}
								});
								
								if (description !== undefined) {
									return false;
								}
							}
						});
						
						if (body.expression.right.right !== undefined) {
							
							parseParams(params, body.expression.right.right);
							
							funcInfos.push({
								name : name,
								description : description,
								params : params
							});
						}
					}
				}
			});
		};
		
		left = syntax.expression.left;
		right = syntax.expression.right;
		
		name = source.substring(left.range[0], left.range[1]);
		description = syntax.leadingComments === undefined ? undefined : syntax.leadingComments[0].value;
		
		// make description.
		if (description !== undefined) {
			if (description[0] === '*') {
				description = description.substring(1);
			}
			description = description.replace(/\n \* /g, '\n').replace(/\n \*/g, '\n').trim();
		}
		
		// if function
		if (right.type === 'FunctionExpression') {
			
			type = 'function';
			
			bodyBlock = right.value;
			
			parseParams(params, right);
		}
		
		else if (right.type === 'ObjectExpression' || right.type === 'Literal') {
			type = 'data';
		}
		
		else {
			
			type = right.callee.name;
		
			// make params.
			NEXT([
			function(next) {
				
				var
				// arg
				arg = right.arguments[0];
				
				if (arg.properties !== undefined && arg.properties[0] !== undefined) {
					next(arg.properties);
				}
				
				// static
				else if (arg.body !== undefined) {
					
					if (arg.params[0] !== undefined) {
						staticMemberName = arg.params[0].name;
					}
					
					staticBlock = arg.body.body;
					
					next(arg.body.body[arg.body.body.length - 1].argument.properties);
				}
			},
			
			function() {
				return function(properties) {
					
					EACH(properties, function(property) {
						
						var
						// body
						body;
						
						if ((type === 'METHOD' && property.key.name === 'run') || ((type === 'CLASS' || type === 'OBJECT') && property.key.name === 'init')) {
							
							bodyBlock = property.value.body.body;
							
							parseParams(params, property.value);
						}
						
						if ((type === 'CLASS' || type === 'OBJECT') && property.key.name === 'preset') {
							
							body = property.value.body.body;
							body = body[body.length - 1];
							
							if (body.argument !== undefined) {
								momName = source.substring(body.argument.range[0], body.argument.range[1]);
							}
						}
					});
				};
			}]);
		}
		
		markdown += '# `' + type + '` ' + name + '\n';
		
		if (description !== undefined) {
			markdown += description + '\n';
		}
		
		if (type !== 'data') {
			
			parseBlock(staticMemberName, staticBlock, staticFuncInfos);
			parseBlock('self', bodyBlock, publicFuncInfos);
			
			if (momName !== undefined) {
				markdown += '\n## Mom' + '\n';
				markdown += momName + '\n';
			}
			
			markdown += '\n## Parameters' + '\n';
			if (params.length === 0) {
				markdown += 'No parameters.\n';
			} else {
				EACH(params, function(param) {
					markdown += '* ' + (param.isRequired === true ? '`REQUIRED` ' : '`OPTIONAL` ') + param.name + ' ' + (param.description === undefined ? '' : ' ' + param.description) + '\n';
				});
			}
			
			markdown += '\n## Static Members' + '\n';
			if (staticFuncInfos.length === 0) {
				markdown += 'No static members.\n';
			} else {
				EACH(staticFuncInfos, function(staticFuncInfo) {
					markdown += '\n### ' + staticFuncInfo.name + '\n';
					
					if (staticFuncInfo.description !== undefined) {
						markdown += staticFuncInfo.description + '\n';
					}
					
					markdown += '###### Parameters' + '\n';
					if (staticFuncInfo.params.length === 0) {
						markdown += 'No parameters.\n';
					} else {
						EACH(staticFuncInfo.params, function(param) {
							markdown += '* ' + (param.isRequired === true ? '`REQUIRED` ' : '`OPTIONAL` ') + param.name + ' ' + (param.description === undefined ? '' : ' ' + param.description) + '\n';
						});
					}
				});
			}
			
			markdown += '\n## Public Members' + '\n';
			if (publicFuncInfos.length === 0) {
				markdown += 'No public members.\n';
			} else {
				EACH(publicFuncInfos, function(publicFuncInfo) {
					markdown += '\n### ' + publicFuncInfo.name + '\n';
					
					if (publicFuncInfo.description !== undefined) {
						markdown += publicFuncInfo.description + '\n';
					}
					
					markdown += '###### Parameters' + '\n';
					if (publicFuncInfo.params.length === 0) {
						markdown += 'No parameters.\n';
					} else {
						EACH(publicFuncInfo.params, function(param) {
							markdown += '* ' + (param.isRequired === true ? '`REQUIRED` ' : '`OPTIONAL` ') + param.name + (param.description === undefined ? '' : ' ' + param.description) + '\n';
						});
					}
				});
			}
		}
		
		WRITE_FILE({
			path : apiPath + path.substring(sourcePath.length, path.length - Path.extname(path).length) + '.md',
			content : markdown,
			isSync : true
		});
	});
});
