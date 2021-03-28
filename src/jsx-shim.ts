export function jsx( tagName: string | ( ( attributes?: { [ key: string ]: any }, ...children: Array<HTMLElement | string> ) => HTMLElement | DocumentFragment ),
	attributes?: { [ key: string ]: any },
	...children: Array<HTMLElement | string>
): HTMLElement | DocumentFragment {
	if ( typeof tagName === 'function' ) return tagName( attributes, ...children );

	if ( !tagName || typeof tagName !== 'string' ) {
		throw new Error( 'Invalid tag name' );
	}

	if ( typeof attributes === 'undefined' || attributes === null ) {
		attributes = {};
	}

	let element = document.createElement( tagName );

	for ( const [ key, value ] of Object.entries( attributes ) ) {
		switch ( key ) {

			// Attributes
			default:
				element.setAttribute( key, value );
				break;

			// Object Properties
			case 'style':
			case 'dataset':
				Object.assign( element[ key ], value );
				break;

			// Scalar properties
			case 'className':
				element[ key ] = value;
				break;

			case 'classList':
				element.classList.add( ...value.filter( String ) );
				break;

		}
	}

	for ( let child of children ) {
		if ( child instanceof HTMLElement ) {
			element.appendChild( child );
		} else switch ( typeof child ) {

			default:
				console.error( 'Failed to inject child element', child );
				break;

			case 'undefined':
				break;

			case 'string':
			case 'number':
			case 'bigint':
				element.appendChild( document.createTextNode( child ) );
				break;

			case 'boolean':
				element.appendChild( document.createTextNode( child ? 'true' : 'false' ) );
				break;

		}
	}

	return element;
}
