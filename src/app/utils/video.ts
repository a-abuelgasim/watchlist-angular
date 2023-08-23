export enum ImageType {
  Backdrop,
  Poster,
}

export enum VideoType {
  Movie = 'movie',
  TV = 'tv',
}

export interface VideoSearchResult {
  posterPath: string | null;
  releaseDate: string | null;
  serverID: number | null;
  title: string | null;
  type: VideoType;
}

export interface Video extends VideoSearchResult {
  id: number,
  rating: number | null;
  runtime: number | null;
  status: string | null;
  updated?: Date;
  videoListIDs: number[];
}


export type NewVideo = Omit<Video, 'id'>

export interface VideoDetails extends Omit<Video, 'id' | 'updated' | 'videoListIDs'> {
  backdropPath: string | null;
  cast: string[];
  creators: string[];
  directors: string[];
  endDate: string | null;
  genres: string[];
  imdbID: string | null;
  overview: string | null;
  seasons: number | null;
}

export interface VideoSearchResponse {
  page?: number;
  results: VideoSearchResult[];
  totalPages?: number;
  totalResults?: number;
}

export interface VideoList {
  created: Date;
  id?: number;
  name: string;
  updated: Date;
  videoIDs: number[];
}

// Convert VideoDetails to VideoSearchResult
export const videoDetailsToVideoSearchResult = ({
  posterPath,
  releaseDate,
  serverID,
  title,
  type
}: VideoDetails): VideoSearchResult => ({posterPath, releaseDate, serverID, title, type});

// Convert VideoDetails to NewVideo
export const videoDetailsToNewVideo = ({
  posterPath,
  rating,
  releaseDate,
  runtime,
  serverID,
  status,
  title,
  type
}: VideoDetails): NewVideo => ({posterPath, rating, releaseDate, runtime, serverID, status, title, type, videoListIDs: []});
