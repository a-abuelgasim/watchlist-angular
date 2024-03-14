import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { videoDetailsToVideoSearchResult, ImageType, VideoDetails, VideoSearchResponse, VideoType } from '../../utils/video';
import { fakeVideoDB } from '../../utils/fake-video-db';
import { ImageURLConfig, TMDBService } from './tmdb.service';
import Fuse from 'fuse.js';


interface ImageTypeSources {
  src: string,
  srcSet: string,
}

export interface ImageSources {
  [key: string]: ImageTypeSources,
}


const FUSE_OPTIONS = {
	keys: [
		'title',
		'cast',
		'directors',
		'creators',
	],
	threshold: 0.4
};


@Injectable({
  providedIn: 'root'
})
export class VideoDataService {
  private _cachedConfig: ImageURLConfig = {
    backdropSizes: {
      lg: 'w1280',
      md: 'w780',
      sm: 'w300',
    },
    baseURL: 'https://image.tmdb.org/t/p/',
    posterSizes: {
      lg: 'w500',
      md: 'w342',
      sm: 'w154',
    },
  };
	apiKey?: string | null;
	fuse?: Fuse<VideoDetails>;
	lastSearch$? = new BehaviorSubject<any>(null);


  constructor(private TMDBService: TMDBService) {
		this.apiKey = this.TMDBService.apiKey;
		this.fuse = new Fuse(Object.values(fakeVideoDB), FUSE_OPTIONS);
	}


  private _getImgSrc(path: string, imageURLConfig: ImageURLConfig, type: ImageType): ImageTypeSources {
    const baseURL = imageURLConfig.baseURL;
    const sizes = type == ImageType.Backdrop ?
      imageURLConfig.backdropSizes :
      imageURLConfig.posterSizes;

    return {
      src: `${baseURL}${sizes.sm}${path}`,
      srcSet:
        `${baseURL}${sizes.sm}${path} ${sizes.sm!.slice(1)}w, ` +
        `${baseURL}${sizes.md}${path} ${sizes.md!.slice(1)}w, ` +
        `${baseURL}${sizes.lg}${path} ${sizes.lg!.slice(1)}w`
    }
  }


  // Get video details from video data server if API key available, otherwise get details from fakeVideoDetailsServerVideos
  getDetails(serverID: number, type: VideoType): Observable<[VideoDetails | null, string[]]> {
    if (this.TMDBService.apiKey) return this.TMDBService.getDetails(serverID, type);

    const videoDetails = fakeVideoDB[serverID] as VideoDetails || null;
    const streamingProviders = videoDetails ?
      [serverID == 429617 ? 'Netflix' : (serverID == 634649 ? 'Amazon Prime Video' : 'Disney Plus')] :
      [];
    return of([videoDetails, streamingProviders]);
  }


  // Get an image src and srcset for given path using imageURLConfig
  getImgSources(path: string): Observable<ImageSources> {
    return this.TMDBService
      .getImageURLConfig()
      .pipe(
        map(serverImageConfig => serverImageConfig || this._cachedConfig),
        map(imageURLConfig => ({
          backdrop: this._getImgSrc(path, imageURLConfig, ImageType.Backdrop),
          poster: this._getImgSrc(path, imageURLConfig, ImageType.Poster),
        }))
      )
  }


  // Search video data server if API key available, otherwise search fakeVideoDetailsServerVideos
  search(query: string, page = 1): Observable<VideoSearchResponse | null> {
    if (this.TMDBService.apiKey) return this.TMDBService.search(query, page);

		const results = this.fuse?.
			search(query)?.
			map(fuseResult => videoDetailsToVideoSearchResult(fuseResult.item)) || [];

    return of(
      {
        page: page,
        results,
        totalPages: 1,
        totalResults: results.length,
      } as VideoSearchResponse
    );
  }
}
