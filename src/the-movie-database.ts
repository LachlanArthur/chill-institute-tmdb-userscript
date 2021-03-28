import { GenericAPI } from "./generic-api";

export class TheMovieDatabaseAPI extends GenericAPI {

	base = 'https://api.themoviedb.org/3/';

	constructor( public apiKey: string ) {
		super();
	}

	filterGetParams( params: URLSearchParams ) {
		params.set( 'api_key', this.apiKey );
		return params;
	}

	async getGenres() {
		return this.get( 'genre/movie/list' ) as Promise<{ genres: TMDB.Genre[] }>;
	}

	async searchMovie( query: string, year?: string, args: Record<string, string> = {} ) {
		const search: Record<string, string> = { query };

		if ( year ) search.year = year;

		if ( args ) Object.assign( search, args );

		const response = await this.get( 'search/movie', search ) as TMDB.PagedResults<TMDB.Movie>;

		if ( !response.total_results ) return;

		return response.results[ 0 ];
	}

	getMoviePoster( movie: TMDB.Movie, size: TMDB.PosterSize = 'w92' ): string | undefined {

		if ( !movie.poster_path ) {
			return;
		}

		return `https://image.tmdb.org/t/p/${size}${movie.poster_path}`;

	}

	getMovieBackdrop( movie: TMDB.Movie, size: TMDB.BackdropSize = 'w300' ): string | undefined {

		if ( !movie.backdrop_path ) {
			return;
		}

		return `https://image.tmdb.org/t/p/${size}${movie.backdrop_path}`;

	}

}
