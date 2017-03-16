#!/usr/bin/env node

require('uppercase-core');

RUN(() => {
	
	let Program = require('commander');
	let UAPI = require('./index.js');
	
	let rootPath = process.cwd();
	
	Program
		.version('1.0.0')
		.arguments('<sourcePath> <apiPath> [exceptFileNames...]')
		.action(UAPI);
	
	Program.parse(process.argv);
});
