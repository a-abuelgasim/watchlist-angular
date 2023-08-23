import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { VideoSearchResponse, VideoType, videoDetailsToVideoSearchResult } from '../../utils/video';
import { fakeVideoDB } from '../../utils/fake-video-db';
import { ImageURLConfig, TMDBService } from './tmdb.service';
import { ImageSources, VideoDataService } from './video-data.service';

describe('VideoDataService', () => {
  const mockHttp = {} as HttpClient;
  let dataServerApiKeyGetSpy: jest.SpyInstance;
  let mockDataServerService: TMDBService;
  let service: VideoDataService;


  beforeEach(() => {
    mockDataServerService = new TMDBService(mockHttp);
    service = new VideoDataService(mockDataServerService);
    dataServerApiKeyGetSpy = jest.spyOn(mockDataServerService, 'apiKey', 'get');
  });


  describe(`getDetails`, () => {
    const mockID = 299536;
    let dataServerGetDetailsSpy: jest.SpyInstance;


    beforeEach(() => {
      dataServerGetDetailsSpy = jest
        .spyOn(mockDataServerService, 'getDetails')
        .mockReturnValue(of([null, []]));
    });


    it('should get details from fake server if API key not present', (done) => {
      dataServerApiKeyGetSpy.mockReturnValueOnce(null);

      service
        .getDetails(mockID, VideoType.Movie)
        .subscribe(([details, streamingProviders]) => {
          expect(details).toEqual(fakeVideoDB[299536]);
          expect(streamingProviders.length).toEqual(1);
          done();
        })

      expect(dataServerGetDetailsSpy).not.toBeCalled();
    });

    it('should return empty array for streaming providers', (done) => {
      dataServerApiKeyGetSpy.mockReturnValueOnce(null);

      service
        .getDetails(123, VideoType.Movie)
        .subscribe(([details, streamingProviders]) => {
          expect(details).toBeNull();
          expect(streamingProviders).toEqual([]);
          done();
        })

      expect(dataServerGetDetailsSpy).not.toBeCalled();
    });

    it('should return special case streaming providers', (done) => {
      dataServerApiKeyGetSpy.mockReturnValueOnce(null);

      service
        .getDetails(429617, VideoType.Movie)
        .subscribe(([_, streamingProviders]) => {
          expect(streamingProviders).toEqual(['Netflix']);

          service
            .getDetails(634649, VideoType.Movie)
            .subscribe(([_, streamingProviders]) => {
              expect(streamingProviders).toEqual(['Amazon Prime Video']);
              done();
            })
        })
    });

    it('should get details from video data server service if API key present', (done) => {
      dataServerApiKeyGetSpy.mockReturnValueOnce('some-apu-key');

      service
        .getDetails(mockID, VideoType.Movie)
        .subscribe(([details, watchProviders]) => {
          expect(details).toBeNull();
          expect(watchProviders).toEqual([]);
          done();
        })

      expect(dataServerGetDetailsSpy).toBeCalledWith(mockID, VideoType.Movie)
    });
  });


  describe(`Image sources`, () => {
    const mockImagePath = '/mockImagePath';
    let dataServerGetImageURLConfigSpy: jest.SpyInstance;


    beforeEach(() => dataServerGetImageURLConfigSpy =
      jest.spyOn(mockDataServerService, 'getImageURLConfig'));


    afterEach(() => expect(dataServerGetImageURLConfigSpy).toBeCalled());


    it(`should return image sources created from cached image URL config if not provided by data server`, (done) => {
      const cachedConfig = service['_cachedConfig'];
      const expectedImageSources: ImageSources = {
        backdrop: {
          src: `${cachedConfig.baseURL}${cachedConfig.backdropSizes.sm}${mockImagePath}`,
          srcSet: `${cachedConfig.baseURL}${cachedConfig.backdropSizes.sm}${mockImagePath} ${cachedConfig.backdropSizes.sm!.slice(1)}w, ${cachedConfig.baseURL}${cachedConfig.backdropSizes.md}${mockImagePath} ${cachedConfig.backdropSizes.md!.slice(1)}w, ${cachedConfig.baseURL}${cachedConfig.backdropSizes.lg}${mockImagePath} ${cachedConfig.backdropSizes.lg!.slice(1)}w`,
        },
        poster: {
          src: `${cachedConfig.baseURL}${cachedConfig.posterSizes.sm}${mockImagePath}`,
          srcSet: `${cachedConfig.baseURL}${cachedConfig.posterSizes.sm}${mockImagePath} ${cachedConfig.posterSizes.sm!.slice(1)}w, ${cachedConfig.baseURL}${cachedConfig.posterSizes.md}${mockImagePath} ${cachedConfig.posterSizes.md!.slice(1)}w, ${cachedConfig.baseURL}${cachedConfig.posterSizes.lg}${mockImagePath} ${cachedConfig.posterSizes.lg!.slice(1)}w`,
        },
      };

      dataServerGetImageURLConfigSpy.mockReturnValueOnce(of(null));

      service
        .getImgSources(mockImagePath)
        .subscribe(imageSources => {
          expect(imageSources).toEqual(expectedImageSources);
          done();
        });
    });

    it(`should return image sources created from image URL config provided by data server`, (done) => {
      const mockImageURLConfig: ImageURLConfig = {
        backdropSizes: {lg: 'w100', md: 'w200', sm: 'w300'},
        baseURL: 'mockBaseURL/',
        posterSizes: {lg: 'w400', md: 'w500', sm: 'w600'},
      };

      const expectedImageSources: ImageSources = {
        backdrop: {
          src: `${mockImageURLConfig.baseURL}${mockImageURLConfig.backdropSizes.sm}${mockImagePath}`,
          srcSet: `${mockImageURLConfig.baseURL}${mockImageURLConfig.backdropSizes.sm}${mockImagePath} ${mockImageURLConfig.backdropSizes.sm!.slice(1)}w, ${mockImageURLConfig.baseURL}${mockImageURLConfig.backdropSizes.md}${mockImagePath} ${mockImageURLConfig.backdropSizes.md!.slice(1)}w, ${mockImageURLConfig.baseURL}${mockImageURLConfig.backdropSizes.lg}${mockImagePath} ${mockImageURLConfig.backdropSizes.lg!.slice(1)}w`,
        },
        poster: {
          src: `${mockImageURLConfig.baseURL}${mockImageURLConfig.posterSizes.sm}${mockImagePath}`,
          srcSet: `${mockImageURLConfig.baseURL}${mockImageURLConfig.posterSizes.sm}${mockImagePath} ${mockImageURLConfig.posterSizes.sm!.slice(1)}w, ${mockImageURLConfig.baseURL}${mockImageURLConfig.posterSizes.md}${mockImagePath} ${mockImageURLConfig.posterSizes.md!.slice(1)}w, ${mockImageURLConfig.baseURL}${mockImageURLConfig.posterSizes.lg}${mockImagePath} ${mockImageURLConfig.posterSizes.lg!.slice(1)}w`,
        },
      };

      dataServerGetImageURLConfigSpy.mockReturnValueOnce(of(mockImageURLConfig));

      service
        .getImgSources(mockImagePath)
        .subscribe(imageSources => {
          expect(imageSources).toEqual(expectedImageSources);
          done();
        });
    });
  });


  describe(`search`, () => {
    const mockQuery = 'captai';
    let dataServerSearchSpy: jest.SpyInstance;


    beforeEach(() => dataServerSearchSpy = jest.spyOn(mockDataServerService, 'search'));


    it('should search fake server if API key not present', (done) => {
      const expectedResults = [
        fakeVideoDB[1771],
        fakeVideoDB[100402],
        fakeVideoDB[271110],
        fakeVideoDB[299537],
        fakeVideoDB[822119],
      ];

      const expectedSearchResponse = {
        page: 1,
        results: expectedResults.map(result => videoDetailsToVideoSearchResult(result)),
        totalPages: 1,
        totalResults: 5
      } as VideoSearchResponse;
      dataServerApiKeyGetSpy.mockReturnValueOnce(null);

      service
        .search(mockQuery)
        .subscribe((results) => {
          expect(results).toEqual(expectedSearchResponse);
          done();
        })

      expect(dataServerSearchSpy).not.toBeCalled();
    });

    it('should search using video data server service if API key present', (done) => {
      const mockResults = {
        page: 1,
        results: [],
        totalPages: 1,
        totalResults: 0
      } as VideoSearchResponse;

      dataServerApiKeyGetSpy.mockReturnValueOnce('some-apu-key');
      dataServerSearchSpy.mockReturnValueOnce(of(mockResults));

      service
        .search(mockQuery)
        .subscribe((results) => {
          expect(results).toEqual(mockResults);
          done();
        })

      expect(dataServerSearchSpy).toBeCalledWith(mockQuery, 1);
    });
  });
});
