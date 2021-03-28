export abstract class GenericAPI {

	protected abstract base: string;

	async get( endpoint: string, params?: Record<string, string> ) {
		if ( params ) {
			const searchParams = new URLSearchParams();

			const [ path, oldParams ] = endpoint.split( '?' );

			if ( oldParams ) {
				for ( const [ key, value ] of new URLSearchParams( oldParams ).entries() ) {
					searchParams.set( key, value );
				}
			}

			for ( const [ key, value ] of new URLSearchParams( params ).entries() ) {
				searchParams.set( key, value );
			}

			endpoint = `${path}?${searchParams.toString()}`;

		}

		return this.request( 'get', endpoint );
	}

	async request( method: string, endpoint: string, body?: BodyInit ) {

		let [ path, query ] = endpoint.split( '?' );
		let searchParams = new URLSearchParams( query );
		searchParams = this.filterGetParams( searchParams );
		query = searchParams.toString();
		if ( query ) {
			query = `?${query}`;
		}
		endpoint = `${path}${query}`;

		const url = new URL( endpoint, this.base );
		const response = await fetch( url.toString(), {
			method,
			body,
		} );

		if ( !response.ok ) {
			throw new Error( response.statusText );
		}

		const [ contentType, encoding ] = response.headers.get( 'Content-Type' )!.split( ';' );

		switch ( contentType ) {

			default:
				throw new Error( `Unsupported content type in response: ${contentType}` );

			case 'application/json':
				return response.json();

		}
	}

	filterGetParams( params: URLSearchParams ): URLSearchParams {
		return params;
	}

}
