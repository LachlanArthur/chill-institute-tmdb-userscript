import { on } from 'll';
import extraCss from './style.css';
import { TheMovieDatabaseAPI } from './the-movie-database';

const posterSize: TMDB.PosterSize = 'w92';
const backdropSize: TMDB.BackdropSize = 'w1280';

const app = document.getElementById( 'root' )!;

const observer = new MutationObserver( () => addButtons() );
observer.observe( app, { childList: true, subtree: true } );

addButtons();

addStyles();

let tmdbApiKey = localStorage.getItem( 'tmdb|key' );
let tmdbApi = new TheMovieDatabaseAPI( tmdbApiKey || '' );

on( app, 'click', 'button.get-info' )( async function ( e ) {
	e.preventDefault();

	if ( !tmdbApiKey ) {
		tmdbApiKey = prompt( 'API Key for The Movie DB' );

		if ( !tmdbApiKey ) {
			return;
		} else {
			tmdbApi.apiKey = tmdbApiKey;
			localStorage.setItem( 'tmdb|key', tmdbApiKey );
		}
	}

	if ( this.matches( '.-loading' ) ) return;

	this.classList.add( '-loading' );

	const title = this.dataset.title!;
	const year = this.dataset.year;

	const originalTitle = this.parentElement!.querySelector( 'button[title]' )!.getAttribute( 'title' );

	const movie = await getMovie( title, year );

	if ( movie ) {
		this.parentElement!.insertAdjacentElement( 'afterbegin', <div className="movie-info">
			{movie.poster_url && <img src={movie.poster_url} width={100} className="poster" />}
			<div className="movie-meta">
				<p className="movie-title-year"><span className="movie-title">{movie.title}</span> <span className="movie-year">({movie.year})</span></p>
				<p className="movie-overview">{movie.overview}</p>
				<p className="movie-genres">{formatList( await getGenres( movie.genre_ids ) )}</p>
				<p className="movie-rating">Rated {movie.vote_average} by {movie.vote_count} users on TMDB</p>
				<p className="movie-language">Original Language: {getLanguageName(movie.original_language)}</p>
				<p className="movie-filename">Filename: {originalTitle}</p>
			</div>
		</div> );

		const row = this.parentElement!.closest( 'tr' )!;
		row.style.backgroundImage = `linear-gradient(to bottom, var(--overlay-color) 0%, var(--overlay-color) 100%), url(${movie.backdrop_url})`;
		row.style.backgroundSize = 'cover';
		row.style.backgroundPosition = 'center 20%';

		this.parentElement!.classList.add( '-hasinfo' );
	} else {
		this.parentElement!.insertAdjacentElement( 'afterbegin', <div className="movie-info">
			<span title="Could not find movie">❌</span>
		</div> );
	}

	this.remove();

} );

function addButtons() {
	app.querySelectorAll( '.SearchResult-Title' ).forEach( cell => {

		if ( cell.matches( '.-processed' ) ) return;
		cell.classList.add( '-processed' );

		const downloadButton = cell.querySelector<HTMLElement>( 'button[title]:not(.get-info)' )!;

		// Fix button content
		downloadButton.textContent = downloadButton.title;

		const { title, year } = parseFilename( downloadButton.title );
		if ( !title ) {
			cell.insertAdjacentElement( 'afterbegin', <span title="Could not detect title">❌</span> );
			return;
		}

		const titleYear = title + ( year ? ` (${year})` : '' );
		const tooltip = `Get info for "${titleYear}"`;

		const data: Record<string, string> = {
			title,
		};

		if ( year ) {
			data.year = year;
		}

		const yearNotice = year ? '' : <span title="Could not detect year">❓</span>;

		cell.insertAdjacentElement( 'afterbegin', <button className="get-info" dataset={data}><span title={tooltip}>🔍</span>{yearNotice}</button> );

	} );
}

let genres = ( cachedEntries => {
	if ( cachedEntries ) {
		return new Map<number, string>( JSON.parse( cachedEntries ) );
	}
} )( localStorage.getItem( 'tmdb|genres' ) );

async function getGenres( ids: number[] ): Promise<Array<string>> {
	if ( !genres ) {

		genres = new Map();

		for ( const { id, name } of ( await tmdbApi.getGenres() ).genres ) {
			genres.set( id, name );
		}

		localStorage.setItem( 'tmdb|genres', JSON.stringify( Array.from( genres.entries() ) ) );
	}

	return ids.map( id => genres!.get( id ) || '' ).filter( String );
}

interface Movie extends TMDB.Movie {
	poster_url?: string,
	backdrop_url?: string,
	year?: string,
}

async function getMovie( title: string, year?: string ): Promise<Movie | undefined> {

	const cacheKey = `tmdb|movie|${title}|${year || '-'}`;
	const cachedMovie = localStorage.getItem( cacheKey );

	let movie: TMDB.Movie | undefined;

	if ( cachedMovie ) {
		movie = JSON.parse( cachedMovie );

	} else try {
		movie = await tmdbApi.searchMovie( title, year, { language: 'en-AU' } );

		localStorage.setItem( cacheKey, JSON.stringify( movie ) );

	} catch ( e ) {
		console.error( e );
	}

	if ( !movie ) {
		console.warn( 'Zero results for %s (%s)', title, year );
		return;
	}

	return {
		...movie,
		poster_url: tmdbApi.getMoviePoster( movie, posterSize ),
		backdrop_url: tmdbApi.getMovieBackdrop( movie, backdropSize ),
		year: movie.release_date.split( '-' )[ 0 ],
	};

}

function parseFilename( filename: string ): { title?: string, year?: string } {

	// console.log( filename );

	filename = filename
		// Remove all brackets
		.replace( /[\[\]\(\)\{\}]/g, ' ' )
		// Remove sizes (720p, 1080p, 2160p ...)
		.replace( /\b\d{3,4}p\b/ig, '' )
		// Remove lots of keywords
		.replace( /\b(web-?dl|b[rd]-?rip|blu-?ray|[hx]\.?26[45]|hevc|avc|aac|dolby|atmos|dts)\b/ig, '' )
		// Remove extension
		.replace( /\.?\b(mkv|mp4|m4v|avi)$/gi, '' )
		// Remove URLs
		.replace( /(^| )((www)?[a-z0-9\-]+?\.(org|net|live))\b/ig, '' )
		// Remove some punctuation
		.replace( /[\.\-\:\(\)]/g, ' ' )
		// Normalise whitespace
		.replace( /\s+/g, ' ' )
		.trim()
		.toLowerCase();

	// console.log( '> ' + filename );

	// Only match years starting with 19 or 20
	let matches = filename.match( /^(?<title>.+?)\s+(?<year>(?:19|20)\d\d)/ );

	let title: string | undefined;
	let year: string | undefined;

	if ( matches && matches.groups ) {
		title = matches.groups.title.trim();
		year = matches.groups.year;
	} else if ( filename ) {
		title = filename;
	}

	return { title, year };
}

function addStyles() {
	const style = document.createElement( 'style' );
	style.innerHTML = extraCss;
	document.head.insertAdjacentElement( 'beforeend', style );
}

const languageDisplay = new Intl.DisplayNames( navigator.languages, { type: 'language' } );

function getLanguageName( code: string ) {
	return languageDisplay.of( code );
}

const listFormatter = new Intl.ListFormat( navigator.languages, { type: 'conjunction', style: 'long' } );

function formatList( items: string[] ): string {
	return listFormatter.format( items );
}
