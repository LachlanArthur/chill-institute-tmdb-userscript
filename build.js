require( 'esbuild' ).build( {
	entryPoints: [
		'src/index.tsx',
	],
	outfile: 'dist/index.js',
	bundle: true,
	format: 'iife',
	sourcemap: false,
	treeShaking: true,
	banner: [
		'// ==UserScript==',
		'// @name         TMDB Movie Search for Chill Institute',
		'// @version      1.0',
		'// @author       Cyykratahk',
		'// @match        https://chill.institute',
		'// @grant        none',
		'// ==/UserScript==',
		'',
	].join('\n'),
	inject: [
		'src/jsx-shim.ts',
	],
	loader: {
		'.css': 'text',
	},
} )
	.catch( () => {
		console.error( e );
		process.exit( 1 );
	} );
