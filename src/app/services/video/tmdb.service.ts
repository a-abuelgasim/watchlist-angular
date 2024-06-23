import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of, shareReplay, catchError, switchMap, combineLatest, tap } from 'rxjs';
import { Video, VideoSearchResult, VideoDetails, VideoSearchResponse, VideoType } from '../../utils/video';

export const INVALID_KEY_ERROR = `The TMDB API key provided is invalid.`;

interface ImageSizes {
  lg: string | null;
  md: string | null;
  sm: string | null;
}

export interface ImageURLConfig {
  backdropSizes: ImageSizes;
  baseURL: string | null;
  posterSizes: ImageSizes;
}

export const API_KEY_LOCAL_STORAGE_KEY = 'videoDataAPIKey';
export const BASE_URL = 'https://api.themoviedb.org/3';
export const INVALID_API_KEY_ERROR_MSG = 'Sorry, your API key is not valid.'
export const IP_API_URL = 'https://ipinfo.io/json';


@Injectable({
  providedIn: 'root'
})
export class TMDBService {
  private _apiKey: string | null;
  private _imagesConfig$: Observable<any> | null = null;
  private _countryCode$: Observable<any> | null = null;

  get apiKey() { return this._apiKey }


  constructor(private http: HttpClient) {
    this._apiKey = localStorage.getItem(API_KEY_LOCAL_STORAGE_KEY) || null;
  }


  private _formatVideoSearchResult(tmdbResult: any, type: VideoType): VideoSearchResult {
    return {
      posterPath: tmdbResult.poster_path || null,
      releaseDate: tmdbResult.release_date || tmdbResult.first_air_date || null,
      title: tmdbResult.title || tmdbResult.name || null,
      type,
      serverID: tmdbResult.id || null,
    }
  }


  private _formatVideoDetails(tmdbResult: any, type: VideoType): VideoDetails {
    const typeIsMovie = type == VideoType.Movie;

    const allCast =
      tmdbResult.aggregate_credits?.cast ||
      tmdbResult.credits?.cast ||
      null;
    const cast = allCast ?
      allCast.slice(0, 5).map((cast: any) => cast.name) :
      [];

    const allCreators = tmdbResult.created_by;
    const creators = allCreators ?
      allCreators.slice(0, 5).map((creator: any) => creator.name) :
      [];

    const allCrew = tmdbResult.credits?.crew || null;
    const directors = allCrew ?
      allCrew
        .filter((crewMember: any) => crewMember.job == 'Director')
        .slice(0, 5)
        .map((director: any) => director.name) :
      [];

    const endDate =
      !typeIsMovie &&
      tmdbResult.last_air_date &&
      (tmdbResult.status == 'Ended' || tmdbResult.status == 'Canceled') ?
        tmdbResult.last_air_date :
        null;

    const allGenres = tmdbResult.genres;
    const genres = allGenres ?
      allGenres.slice(0, 3).map((genre: any) => genre.name) :
      [];

    const videoDetails = this._formatVideoSearchResult(tmdbResult, type);

    return {
      ...videoDetails,
      backdropPath: tmdbResult.backdrop_path || null,
      cast: cast,
      creators: creators,
      directors: typeIsMovie ? directors : [],
      endDate: endDate,
      episodes: tmdbResult.number_of_episodes || null,
      genres: genres,
      imdbID: tmdbResult.imdb_id || tmdbResult.external_ids?.imdb_id || null,
      overview: tmdbResult.overview || null,
      rating: tmdbResult.vote_average || null,
      runtime: tmdbResult.runtime || null,
      seasons: tmdbResult.number_of_seasons || null,
      status: tmdbResult.status || null,
    };
  }


  getImageURLConfig(): Observable<ImageURLConfig | null> {
    if (!this.apiKey) return of(null);

    if (!this._imagesConfig$) {
      const url = `${BASE_URL}/configuration`;
      const params = {params: new HttpParams().set('api_key', this.apiKey)};

      this._imagesConfig$ = this.http
        .get<any>(url,params)
        .pipe(
          map(config => config.images),
          catchError((error) => {
            console.error(error);
            return of(null);
          }),
          shareReplay(1),
        )
    }

    return this._imagesConfig$.pipe(
      map(imageConfig => {
        if (!imageConfig) return null;

        const posterSizes: ImageSizes = {
          sm: imageConfig.poster_sizes ?
            imageConfig.poster_sizes[1] || null :
            null,
          md: imageConfig.poster_sizes ?
            imageConfig.poster_sizes[3] || null :
            null,
          lg: imageConfig.poster_sizes ?
            imageConfig.poster_sizes[4] || null :
            null,
        }

        const backdropSizes: ImageSizes = {
          sm: imageConfig.backdrop_sizes ?
            imageConfig.backdrop_sizes[0] || null :
            null,
          md: imageConfig.backdrop_sizes ?
            imageConfig.backdrop_sizes[1] || null :
            null,
          lg: imageConfig.backdrop_sizes ?
            imageConfig.backdrop_sizes[2] || null :
            null,
        }

        const imageURLConfig: ImageURLConfig = {
          backdropSizes: backdropSizes,
          baseURL: imageConfig.secure_base_url || null,
          posterSizes: posterSizes,
        };

        return imageURLConfig;
      })
    );
  }


  getLocalStreamingProviders(watchProviders: any): Observable<string[] > {
    if (!this._countryCode$) {
      this._countryCode$ = this.http
        .get<any>(IP_API_URL)
        .pipe(
          map(response => response.country || null),
          catchError((error) => {
            console.error(error);
            return of(null);
          }),
          shareReplay(1),
        )
    }

    return this._countryCode$.pipe(
      map(countryCode => {
        if (!countryCode) return [];

        // Get providers available in user's country
        const localProviders = watchProviders[countryCode];
        if (!localProviders) return [];

        // Get streaming providers available in user's country
        const localStreamingProviders = localProviders.flatrate;
        if (!localStreamingProviders) return [];

        return localStreamingProviders.map((provider: any) => provider.provider_name);
      })
    );
  }


  getDetails(id: number, type: VideoType): Observable<[VideoDetails | null, string[]]> {
    if (!this.apiKey || !Object.values(VideoType).includes(type)) return of([null, []]);

    const url = `${BASE_URL}/${type}/${id}`;
    const params = { params: new HttpParams()
      .set('api_key', this.apiKey)
      .set(
        'append_to_response',
        `watch/providers,${type == VideoType.Movie ?
          'credits' :
          'aggregate_credits,external_ids'
        }`
      )
    }

    return this.http
      .get<any>(url, params)
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        }),
        switchMap((response: any): Observable<[VideoDetails | null, string[]]> => {
          if (!response) return of([null, []]);

          const watchProviders = response['watch/providers']?.results;
          const localStreamingProviders$ = watchProviders && Object.keys(watchProviders).length > 0?
            this.getLocalStreamingProviders(watchProviders) :
            of([])

          return combineLatest(
            of(this._formatVideoDetails(response, type)),
            localStreamingProviders$.pipe(
							// Sort alphabetically
							map(streamingProviders => streamingProviders.sort())
						)
          );
        })
      )
  }


  search(query: string, page = 1): Observable<VideoSearchResponse | null> {
    if (!this.apiKey) return of(null);

    const url = `${BASE_URL}/search/multi`;
    const params = { params: new HttpParams()
      .set('api_key', this.apiKey)
      .set('include_adult', false)
      .set('page', page)
      .set('query', query)
    };

    return this.http
      .get<any>(url, params)
      .pipe(
        map((response) => {
          // Filter out people results
          const results = response.results
            .filter((result: any) => result.media_type != 'person');

          // Format results
          const formattedResults: Video[] = results.map((searchResult: any) => this._formatVideoSearchResult(
            searchResult,
            searchResult.media_type == 'movie' ? VideoType.Movie : VideoType.TV)
          );

          // Format response
          return {
            page,
            results: formattedResults,
            totalResults: response.total_results,
            totalPages: response.total_pages,
          }
        }),
        catchError((error) => {
					if (error.status == 401) throw(INVALID_API_KEY_ERROR_MSG);
					else console.error(error)
          return of(null);
        })
      )
  }


	updateAPIKey(key: string | null): Observable<any> {
		if (key) {
      const params = {params: new HttpParams().set('api_key', key)};

			return this.http
				.get<any>(`${BASE_URL}/authentication`, params)
				.pipe(
					tap(_ => {
						this._apiKey = key;
						localStorage.setItem(API_KEY_LOCAL_STORAGE_KEY, key);
					}),
					catchError((err) => {
						if (err.status == 401) {
							throw(INVALID_KEY_ERROR);
						}
						throw(err);
					})
				);
    }

		this._apiKey = key;
    localStorage.removeItem(API_KEY_LOCAL_STORAGE_KEY);
		return of(null);
	}
}
