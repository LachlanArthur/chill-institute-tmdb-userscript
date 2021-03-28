export = TMDB;
export default TMDB;

declare global {
	declare namespace TMDB {

		export type BackdropSize =
			"w300" |
			"w780" |
			"w1280" |
			"original";

		export type LogoSize =
			"w45" |
			"w92" |
			"w154" |
			"w185" |
			"w300" |
			"w500" |
			"original";

		export type PosterSize =
			"w92" |
			"w154" |
			"w185" |
			"w342" |
			"w500" |
			"w780" |
			"original";

		export type ProfileSize =
			"w45" |
			"w185" |
			"h632" |
			"original";

		export type StillSize =
			"w92" |
			"w185" |
			"w300" |
			"original";

		interface Movie {
			adult: boolean
			backdrop_path: string | null
			genre_ids: number[]
			id: number
			original_language: string
			original_title: string
			overview: string
			popularity: number
			poster_path: string | null
			release_date: string
			title: string
			video: boolean
			vote_average: number
			vote_count: number
		}
		
		interface PagedResults<T> {
			page: number
			results: T[]
			total_pages: number
			total_results: number
		}

		interface Genre {
			id: number,
			name: string,
		}

	}
}
