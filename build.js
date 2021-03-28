require( 'esbuild' ).build( {
	entryPoints: [
		'src/index.tsx',
	],
	outfile: 'dist/index.js',
	bundle: true,
	format: 'iife',
	sourcemap: false,
	treeShaking: true,
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
