import { VideoType, VideoSearchResult, VideoDetails, VideoSearchResponse } from "../../utils/video"

const mockMovieBasics = {
  "id": 11111,
  "poster_path": "/movie-poster-path",
  "release_date": "2022-01-11",
  "title": "movie title",
};

const mockMovieDetails = {
  ...mockMovieBasics,
  "backdrop_path": "/movie-backdrop-path",
  "credits": {
    "cast": [
      {"name": "movie cast member 1"},
      {"name": "movie cast member 2"},
      {"name": "movie cast member 3"},
      {"name": "movie cast member 4"},
      {"name": "movie cast member 5"},
      {"name": "movie cast member 6"},
    ],
    "crew": [
      {"name": "movie crew member 1", "job": "some job"},
      {"name": "movie crew member 2", "job": "Director"},
      {"name": "movie crew member 3", "job": "another job"},
      {"name": "movie crew member 4", "job": "Director"},
      {"name": "movie crew member 5", "job": "Director"},
      {"name": "movie crew member 6", "job": "Director"},
      {"name": "movie crew member 7", "job": "Director"},
      {"name": "movie crew member 8", "job": "Director"},
      {"name": "movie crew member 9", "job": "not director"},
    ],
  },
  "genres": [
    {"name": "movie genre 1"},
    {"name": "movie genre 2"},
    {"name": "movie genre 3"},
    {"name": "movie genre 4"},
  ],
  "imdb_id": "tt11111",
	"number_of_episodes": null,
	"number_of_seasons": null,
  "overview": "movie overview",
  "runtime": 111,
  "status": "movie status",
  "vote_average": 1.1,
}

const mockTVShowBasics = {
  "first_air_date": "2022-02-22",
  "id": 2222,
  "name": "tv show title",
  "poster_path": "/tv-show-poster-path",
};

const mockTVShowDetails = {
  ...mockTVShowBasics,
  "aggregate_credits": {
    "cast": [
      {"name": "tv show aggregate cast member 1"},
      {"name": "tv show aggregate cast member 2"},
      {"name": "tv show aggregate cast member 3"},
      {"name": "tv show aggregate cast member 4"},
      {"name": "tv show aggregate cast member 5"},
      {"name": "tv show aggregate cast member 6"},
    ],
  },
  "backdrop_path": "/tv-show-backdrop-path",
  "credits": {"cast": [{"name": "tv show cast member 1"}]},
  "created_by": [
    {"name": "tv show creator 1"},
    {"name": "tv show creator 2"},
    {"name": "tv show creator 3"},
    {"name": "tv show creator 4"},
    {"name": "tv show creator 5"},
    {"name": "tv show creator 6"},
  ],
  "external_ids": {"imdb_id": "tt22222"},
  "genres": [
    {"name": "tv show genre 1"},
    {"name": "tv show genre 2"},
    {"name": "tv show genre 3"},
    {"name": "tv show genre 4"},
  ],
  "last_air_date": "2022-03-03",
	"number_of_episodes": 22,
	"number_of_seasons": 2,
  "overview": "tv show overview",
  "status": "Returning series",
  "name": "tv show title",
  "vote_average": 2.2,
}

const mockSearchResponse = {
  "page": 1,
  "results": [
    {
      "id": 1111,
      "media_type": "movie",
      "poster_path": "/movie-poster-path",
      "release_date": "1111-01-01",
      "title": "Movie title",
      "vote_average": 1.1,
    },
    {
      "first_air_date": "2222-02-02",
      "id": 2222,
      "media_type": "tv",
      "name": "Tv show name",
      "poster_path": "/tv-show-poster-path",
      "vote_average": 2.2
    },
    {
      "id": 154689,
      "media_type": "person",
      "profile_path": "/4XAtJsz67pmpIsCQ9SBKfqayk2d.jpg",
    }
  ],
  "total_pages": 1,
  "total_results": 3,
}


const expectedNullVideoSearchResult = {
  posterPath: null,
  releaseDate: null,
  serverID: null,
  title: null,
  type: VideoType.Movie,
} as VideoSearchResult;

const expectedNullVideoDetails: VideoDetails = {
  ...expectedNullVideoSearchResult,
  backdropPath: null,
  cast: [],
  creators: [],
  directors: [],
  endDate: null,
	episodes: null,
  genres: [],
  imdbID: null,
  overview: null,
  rating: null,
  runtime: null,
  seasons: null,
  status: null,
};

const expectedMovieBasics = {
  posterPath: mockMovieBasics.poster_path,
  releaseDate: mockMovieBasics.release_date,
  title: mockMovieBasics.title,
  type: VideoType.Movie,
  serverID: mockMovieBasics.id,
} as VideoSearchResult;

const expectedMovieDetails = {
  ...expectedMovieBasics,
  backdropPath: mockMovieDetails.backdrop_path,
  cast: mockMovieDetails.credits.cast
    .slice(0, 5)
    .map(castMember => castMember.name),
  creators: [],
  directors: mockMovieDetails.credits.crew
    .filter(crewMember => crewMember.job == 'Director')
    .slice(0, 5)
    .map(crewMember => crewMember.name),
  endDate: null,
	episodes: null,
  genres: mockMovieDetails.genres
    .slice(0,3)
    .map(genre => genre.name),
  imdbID: mockMovieDetails.imdb_id,
  overview: mockMovieDetails.overview,
  rating: mockMovieDetails.vote_average,
  runtime: mockMovieDetails.runtime,
  seasons: null,
  status: mockMovieDetails.status,
} as VideoDetails;


const expectedTVShowBasics = {
  posterPath: mockTVShowBasics.poster_path,
  releaseDate: mockTVShowBasics.first_air_date,
  title: mockTVShowBasics.name,
  type: VideoType.TV,
  serverID: mockTVShowBasics.id,
} as VideoSearchResult;

const expectedTVShowDetails = {
  ...expectedTVShowBasics,
  backdropPath: mockTVShowDetails.backdrop_path,
  cast: mockTVShowDetails.aggregate_credits.cast
    .slice(0, 5)
    .map(castMember => castMember.name),
  creators: mockTVShowDetails.created_by
    .slice(0, 5)
    .map(creator => creator.name),
  directors: [],
  endDate: null,
	episodes: 22,
  genres: mockTVShowDetails.genres
    .slice(0, 3)
    .map(genre => genre.name),
  serverID: mockTVShowDetails.id,
  imdbID: mockTVShowDetails.external_ids.imdb_id,
  overview: mockTVShowDetails.overview,
  posterPath: mockTVShowDetails.poster_path,
  rating: mockTVShowDetails.vote_average,
  releaseDate: mockTVShowDetails.first_air_date,
  runtime: null,
  seasons: mockTVShowDetails.number_of_seasons,
  status: mockTVShowDetails.status,
} as VideoDetails;

const expectedSearchResponse = {
  page: mockSearchResponse.page,
  totalPages: 1,
  totalResults: mockSearchResponse.total_results,
  results: [
    {
      posterPath: mockSearchResponse.results[0].poster_path,
      releaseDate: mockSearchResponse.results[0].release_date,
      title: mockSearchResponse.results[0].title,
      type: VideoType.Movie,
      serverID: mockSearchResponse.results[0].id,
    },
    {
      posterPath: mockSearchResponse.results[1].poster_path,
      releaseDate: mockSearchResponse.results[1].first_air_date,
      title: mockSearchResponse.results[1].name,
      type: VideoType.TV,
      serverID: mockSearchResponse.results[1].id,
    },
  ] as VideoSearchResult[],
} as VideoSearchResponse;


export const mock = {
  mockMovieBasics,
  mockMovieDetails,
  mockTVShowBasics,
  mockTVShowDetails,
  mockSearchResponse,
}

export const expected = {
  expectedNullVideoSearchResult,
  expectedNullVideoDetails,
  expectedMovieBasics,
  expectedMovieDetails,
  expectedTVShowBasics,
  expectedTVShowDetails,
  expectedSearchResponse,
}
