import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_KEY_LOCAL_STORAGE_KEY, BASE_URL, ImageURLConfig, INVALID_API_KEY_ERROR_MSG, IP_API_URL, TMDBService } from './tmdb.service';
import { mock as mockTestData, expected as expectedTestData } from './tmdb.service.test-data';
import { LocalStorageMock } from '../../utils/mocks';
import { VideoType } from '../../utils/video';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

LocalStorageMock.init();


describe(`TMDBService`, () => {
  describe(`No TestBed`, () => {
    const mockHttp = {} as HttpClient;
    let service: TMDBService;


    describe(`API Key`, () => {
      const mockApiKey = 'm0ck-Api';
      const localStorageGetItemSpy = jest.spyOn(localStorage, 'getItem');
      const localStorageRemoveItemSpy = jest.spyOn(localStorage, 'removeItem');
      const localStorageSetItemSpy = jest.spyOn(localStorage, 'setItem')


      it(`should initialise API key as null if not in local storage`, () => {
        service = new TMDBService(mockHttp);

        expect(localStorageGetItemSpy).toBeCalledWith(API_KEY_LOCAL_STORAGE_KEY);
        expect(service.apiKey).toBeNull();
      });

      it(`should initialise API key to local storage value`, () => {
        localStorageGetItemSpy.mockReturnValue(mockApiKey);

        service = new TMDBService(mockHttp);

        expect(localStorageGetItemSpy).toBeCalledWith(API_KEY_LOCAL_STORAGE_KEY);
        expect(service.apiKey).toEqual(mockApiKey);
      });

      it(`should update API key in local storage`, () => {
        service = new TMDBService(mockHttp);

        service.apiKey = mockApiKey;

        expect(localStorageSetItemSpy).toBeCalledWith(API_KEY_LOCAL_STORAGE_KEY, mockApiKey);
        expect(service.apiKey).toEqual(mockApiKey);
      });

      it(`should remove API key if setter called with null value`, () => {
        service = new TMDBService(mockHttp);

        service.apiKey = null;

        expect(localStorageRemoveItemSpy).toBeCalledWith(API_KEY_LOCAL_STORAGE_KEY);
        expect(service.apiKey).toBeNull();
      });
    });


    describe(`Video formatting`, () => {
      describe(`_formatVideoSearchResult`, () => {
        it(`should deal with missing properties`, () => {
          const {expectedNullVideoSearchResult: expectedNullMovieBasics} = expectedTestData;
          const expectedNullTVShowBasics = {
            ...expectedNullMovieBasics,
            type: VideoType.TV,
          }

          const formattedMovieData = service['_formatVideoSearchResult']({}, VideoType.Movie);
          const formattedTVShowData = service['_formatVideoSearchResult']({}, VideoType.TV);

          expect(formattedMovieData).toEqual(expectedNullMovieBasics);
          expect(formattedTVShowData).toEqual(expectedNullTVShowBasics);
        });

        it(`should format movies and tv shows`, () => {
          const { mockMovieBasics } = mockTestData;
          const { mockTVShowBasics } = mockTestData;
          const { expectedMovieBasics } = expectedTestData;
          const { expectedTVShowBasics } = expectedTestData;

          const formattedMovieData = service['_formatVideoSearchResult'](mockMovieBasics, VideoType.Movie);
          const formattedTVShowData = service['_formatVideoSearchResult'](mockTVShowBasics, VideoType.TV);

          expect(formattedMovieData).toEqual(expectedMovieBasics);
          expect(formattedTVShowData).toEqual(expectedTVShowBasics);
        });
      });


      describe(`_formatVideoDetails`, () => {
        it(`should deal with missing properties`, () => {
          const {expectedNullVideoDetails: expectedNullMovieDetails} = expectedTestData;
          const expectedNullTVShowDetails = {
            ...expectedNullMovieDetails,
            type: VideoType.TV,
          }

          const formattedMovieData = service['_formatVideoDetails']({}, VideoType.Movie);
          const formattedTVShowData = service['_formatVideoDetails']({}, VideoType.TV);

          expect(formattedMovieData).toEqual(expectedNullMovieDetails);
          expect(formattedTVShowData).toEqual(expectedNullTVShowDetails);
        });

        it(`should format movies and tv shows`, () => {
          const { mockMovieDetails } = mockTestData;
          const { mockTVShowDetails } = mockTestData;
          const { expectedMovieDetails } = expectedTestData;
          const { expectedTVShowDetails } = expectedTestData;

          const formattedMovieData = service['_formatVideoDetails'](mockMovieDetails, VideoType.Movie);
          const formattedTVShowData = service['_formatVideoDetails'](mockTVShowDetails, VideoType.TV);

          expect(formattedMovieData).toEqual(expectedMovieDetails);
          expect(formattedTVShowData).toEqual(expectedTVShowDetails);
        });

        describe(`TV show end date`, () => {
          it(`should set tv show end date if show ended`, () => {
            const mockEndedTVShowDetails = Object.assign({}, mockTestData.mockTVShowDetails);
            mockEndedTVShowDetails.status = "Ended";

            const formattedTVShowData = service['_formatVideoDetails'](mockEndedTVShowDetails, VideoType.TV);
            expect(formattedTVShowData.endDate).toEqual(mockEndedTVShowDetails.last_air_date);
          });

          it(`should set tv show end date if show cancelled`, () => {
            const mockEndedTVShowDetails = Object.assign({}, mockTestData.mockTVShowDetails);
            mockEndedTVShowDetails.status = "Canceled";

            const formattedTVShowData = service['_formatVideoDetails'](mockEndedTVShowDetails, VideoType.TV);
            expect(formattedTVShowData.endDate).toEqual(mockEndedTVShowDetails.last_air_date);
          });
        });
      });
    });
  });


  describe(`TestBed`, () => {
    const mockApiKey = 'm0ck-Api';
    const nullImageURLConfig: ImageURLConfig = {
      backdropSizes: {lg: null, md: null, sm: null},
      baseURL: null,
      posterSizes: {lg: null, md: null, sm: null},
    }

    let httpTestingController: HttpTestingController;
    let service: TMDBService;
    let apiKeyGetSpy: jest.SpyInstance;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [TMDBService]
      });

      httpTestingController = TestBed.inject(HttpTestingController);
      service = TestBed.inject(TMDBService);

      apiKeyGetSpy = jest
        .spyOn(service, 'apiKey', 'get')
        .mockReturnValue(mockApiKey);
    });

    afterEach(() => httpTestingController.verify());


    describe(`getImageURLConfig`, () => {
      afterEach(() => expect(apiKeyGetSpy).toBeCalled());

      it(`should return null if API key not present`, (done) => {
        apiKeyGetSpy.mockReturnValueOnce(null);

        service
          .getImageURLConfig()
          .subscribe(imageURLConfig => {
        expect(imageURLConfig).toBeNull();
            done();
          });
      });

      it(`should return null if config API call fails`, (done) => {
        const statusText = 'Some error';
        const originalConsoleError = console.error;
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => null);

        service
          .getImageURLConfig()
          .subscribe(imageURLConfig => {
            expect(imageURLConfig).toBeNull();
            done();
          });

        httpTestingController
          .expectOne({
            method: 'GET',
            url: `${BASE_URL}/configuration?api_key=${mockApiKey}`,
          })
          .flush('Mock error', { status: 404, statusText });

        expect(consoleErrorSpy).toBeCalled();
        console.error = originalConsoleError;
      });

      it(`should return null if images config not present`, (done) => {
        service
          .getImageURLConfig()
          .subscribe(imageURLConfig => {
            expect(imageURLConfig).toBeNull();
            done();
          });

        httpTestingController
          .expectOne({
            method: 'GET',
            url: `${BASE_URL}/configuration?api_key=${mockApiKey}`,
          })
          .flush({});
      });

      it(`should set image config properties to null if absent`, (done) => {
        service
          .getImageURLConfig()
          .subscribe(imageURLConfig => {
            expect(imageURLConfig).toEqual(nullImageURLConfig);
            done();
          });

        httpTestingController
          .expectOne({
            method: 'GET',
            url: `${BASE_URL}/configuration?api_key=${mockApiKey}`,
          })
          .flush({"images": {}});
      });

      it(`should set image config sizes to null if absent`, (done) => {
        service
          .getImageURLConfig()
          .subscribe(imageURLConfig => {
            expect(imageURLConfig).toEqual(nullImageURLConfig);
            done();
          });

        httpTestingController
          .expectOne({
            method: 'GET',
            url: `${BASE_URL}/configuration?api_key=${mockApiKey}`,
          })
          .flush({"images": {"backdrop_sizes": [], "poster_sizes": []}});
      });

      it(`should return image URL config`, (done) => {
        service
          .getImageURLConfig()
          .subscribe(imagePaths => {
            expect(imagePaths).toEqual({
              backdropSizes: {
                lg: '30',
                md: '20',
                sm: '10',
              },
              baseURL: 'a',
              posterSizes: {
                lg: '5',
                md: '4',
                sm: '2',
              }
            });
            done();
          });

        httpTestingController
          .expectOne({
            method: 'GET',
            url: `${BASE_URL}/configuration?api_key=${mockApiKey}`,
          })
          .flush({
            "images": {
              "secure_base_url": "a",
              "poster_sizes": ["1", "2", "3", "4", "5", "6", "7", "8"],
              "backdrop_sizes": ["10", "20", "30", "40"]
            }
          });
      });


      it(`should make only one config API call for multiple subscriptions`, (done) => {
        service
          .getImageURLConfig()
          .subscribe(_ => {
            service
              .getImageURLConfig()
              .subscribe(_ => done());
          });

        httpTestingController
          .expectOne({
            method: 'GET',
            url: `${BASE_URL}/configuration?api_key=${mockApiKey}`,
          })
          .flush({});
      });
    });


    describe(`getLocalStreamingProviders`, () => {
      const mockProviderName = 'Mock provider';

      it(`should return empty array if country code API call fails`, (done) => {
        const statusText = 'Some error';
        const originalConsoleError = console.error;
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => null);

        service
          .getLocalStreamingProviders({})
          .subscribe(localStreamingProviders => {
            expect(localStreamingProviders).toEqual([]);
            done();
          });

        httpTestingController
          .expectOne({method: 'GET', url: IP_API_URL})
          .flush('Mock error', { status: 404, statusText });

        expect(consoleErrorSpy).toBeCalled();

        console.error = originalConsoleError;
      });

      it(`should return empty array if country code not in API call response`, (done) => {
        service
          .getLocalStreamingProviders({})
          .subscribe(localStreamingProviders => {
            expect(localStreamingProviders).toEqual([]);
            done();
          });

        httpTestingController
          .expectOne({method: 'GET', url: IP_API_URL})
          .flush({});
      });

      it(`should return empty array if no local watch providers`, (done) => {
        const mockWatchProviders = {"AB": {"flatrate": [{"provider_name": mockProviderName}]}};
        service
          .getLocalStreamingProviders(mockWatchProviders)
          .subscribe(localStreamingProviders => {
            expect(localStreamingProviders).toEqual([]);
            done();
          });

        httpTestingController
          .expectOne({method: 'GET', url: IP_API_URL})
          .flush({"countryCode": "MK"});
      });

      it(`should return empty array if no streaming providers`, (done) => {
        const mockWatchProviders = {"MK": {"buy": [{"provider_name": mockProviderName}]}};
        service
          .getLocalStreamingProviders(mockWatchProviders)
          .subscribe(localStreamingProviders => {
            expect(localStreamingProviders).toEqual([]);
            done();
          });

        httpTestingController
          .expectOne({method: 'GET', url: IP_API_URL})
          .flush({"countryCode": "MK"});
      });

      it(`should return local streaming providers`, (done) => {
        const mockProviderName2 = 'Mock provider 2';
        const mockWatchProviders = {"MK": {"flatrate": [
          {"provider_name": mockProviderName},
          {"provider_name": mockProviderName2}
        ]}};

        service
          .getLocalStreamingProviders(mockWatchProviders)
          .subscribe(localStreamingProviders => {
            expect(localStreamingProviders).toEqual([mockProviderName, mockProviderName2]);
            done();
          });

        httpTestingController
          .expectOne({method: 'GET', url: IP_API_URL})
          .flush({"countryCode": "MK"});
      });

      it(`should make only one country code API call for multiple subscriptions`, (done) => {
        const mockWatchProviders1 = {"MK": {"flatrate": [{"provider_name": mockProviderName}]}}
        const mockProviderName2 = 'Mock provider 2'
        const mockWatchProviders2 = {"MK": {"flatrate": [{"provider_name": mockProviderName2}]}}

        service
          .getLocalStreamingProviders(mockWatchProviders1)
          .subscribe((localStreamingProviders) => {
            expect(localStreamingProviders).toEqual([mockProviderName])
            service
              .getLocalStreamingProviders(mockWatchProviders2)
              .subscribe(localStreamingProviders => {
                expect(localStreamingProviders).toEqual([mockProviderName2])
                done()
              });
          });

        httpTestingController
          .expectOne({method: 'GET', url: IP_API_URL})
          .flush({"countryCode": "MK"});
      });
    });


    describe(`getDetails`, () => {
      const mockID = 456;
      const mockType = VideoType.Movie;
      const buildApiUrl = (apiKey: string, id: number, type: VideoType) =>
        `${BASE_URL}/${type}/${id}?api_key=${encodeURIComponent(apiKey)}&append_to_response=watch/providers,${type == VideoType.Movie ? 'credits' : 'aggregate_credits,external_ids'}`;

      afterEach(() => expect(apiKeyGetSpy).toBeCalled());

      it(`should return null and empty array if API key not present`, (done) => {
        apiKeyGetSpy.mockReturnValue(null);

        service
          .getDetails(1, VideoType.Movie)
          .subscribe(([details, watchProviders]) => {
            expect(details).toBeNull();
            expect(watchProviders).toEqual([]);
            done();
          });

      });

      it(`should return null and empty array if API call fails`, (done) => {
        const statusText = 'Some error';
        const originalConsoleError = console.error;
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => null);

        service
          .getDetails(mockID, mockType)
          .subscribe(([details, watchProviders]) => {
            expect(details).toBeNull();
            expect(watchProviders).toEqual([]);
            done();
          });

        httpTestingController
          .expectOne({
            method: 'GET',
            url: buildApiUrl(mockApiKey, mockID, mockType),
          })
          .flush('Mock error', { status: 404, statusText });

        expect(consoleErrorSpy).toBeCalled();
        console.error = originalConsoleError;
      });

      it(`should return empty array if no watch/providers in details`, (done) => {
        const getLocalStreamingProvidersSpy = jest.spyOn(service, 'getLocalStreamingProviders');

        service
          .getDetails(mockID, mockType)
          .subscribe(([_, watchProviders]) => {
            expect(watchProviders).toEqual([]);
            done();
          });

        httpTestingController
          .expectOne({
            method: 'GET',
            url: buildApiUrl(mockApiKey, mockID, mockType),
          })
          .flush({});
        expect(getLocalStreamingProvidersSpy).not.toBeCalled();
      });

      it(`should return empty array if watch/providers has no results property`, (done) => {
        const getLocalStreamingProvidersSpy = jest.spyOn(service, 'getLocalStreamingProviders');

        service
          .getDetails(mockID, mockType)
          .subscribe(([_, watchProviders]) => {
            expect(watchProviders).toEqual([]);
            done();
          });

        httpTestingController
          .expectOne({
            method: 'GET',
            url: buildApiUrl(mockApiKey, mockID, mockType),
          })
          .flush({"watch/providers": {}});

        expect(getLocalStreamingProvidersSpy).not.toBeCalled();
      });

      it(`should return empty array if watch/providers has no results`, (done) => {
        const getLocalStreamingProvidersSpy = jest.spyOn(service, 'getLocalStreamingProviders');

        service
          .getDetails(mockID, mockType)
          .subscribe(([_, watchProviders]) => {
            expect(watchProviders).toEqual([]);
            done();
          });

        httpTestingController
          .expectOne({
            method: 'GET',
            url: buildApiUrl(mockApiKey, mockID, mockType),
          })
          .flush({"watch/providers": {"results": {}}});

        expect(getLocalStreamingProvidersSpy).not.toBeCalled();
      });

      it(`should return local streaming providers`, (done) => {
        const mockProviderName = 'mock provider';
        const mockWatchProviders = {
          "watch/providers": {
            "results": {
              "MK": {
                "flatrate": [
                  {"provider_name": "mockProviderName"}
                ]
              }
            }
          }
        }
        const localStreamingProvidersSpy = jest.spyOn(service, 'getLocalStreamingProviders').mockReturnValue(of([mockProviderName]));

        service
          .getDetails(mockID, mockType)
          .subscribe(([_, watchProviders]) => {
            expect(watchProviders).toEqual([mockProviderName]);
            done();
          });

        httpTestingController
          .expectOne({
            method: 'GET',
            url: buildApiUrl(mockApiKey, mockID, mockType),
          })
          .flush(mockWatchProviders);

        expect(localStreamingProvidersSpy).toBeCalledWith(mockWatchProviders['watch/providers'].results);
      });

      it(`should return formatted details for movies`, (done) => {
        const { mockMovieDetails } = mockTestData;
        const { expectedMovieDetails } = expectedTestData;

        const formatVideoDetailsSpy = jest.spyOn((service as unknown) as
            {_formatVideoDetails: TMDBService['_formatVideoDetails']},
            '_formatVideoDetails'
          )
          .mockReturnValue(expectedMovieDetails)

        service
          .getDetails(mockID, mockType)
          .subscribe(([details, _]) => {
            expect(details).toEqual(expectedMovieDetails);
            done();
          });

        httpTestingController
          .expectOne({
            method: 'GET',
            url: buildApiUrl(mockApiKey, mockID, mockType),
          })
          .flush(mockMovieDetails);

        expect(formatVideoDetailsSpy).toBeCalledWith(mockMovieDetails, VideoType.Movie);
      });

      it(`should return formatted details for TV shows`, (done) => {
        const mockType = VideoType.TV;
        const { mockTVShowDetails } = mockTestData;
        const { expectedTVShowDetails } = expectedTestData;

        const formatVideoDetailsSpy = jest.spyOn((service as unknown) as
            {_formatVideoDetails: TMDBService['_formatVideoDetails']},
            '_formatVideoDetails'
          )
          .mockReturnValue(expectedTVShowDetails)

        service
          .getDetails(mockID, mockType)
          .subscribe(([details, _]) => {
            expect(details).toEqual(expectedTVShowDetails);
            done();
          });

        httpTestingController
          .expectOne({
            method: 'GET',
            url: buildApiUrl(mockApiKey, mockID, mockType),
          })
          .flush(mockTVShowDetails);

        expect(formatVideoDetailsSpy).toBeCalledWith(mockTVShowDetails, mockType);
      });
    });


    describe(`Search`, () => {
      const mockQuery = 'mock query';
      let formatVideoSearchResultSpy: jest.SpyInstance;


      function buildApiUrl(apiKey: string, query: string, page = 1) {
        return `${BASE_URL}/search/multi?api_key=${encodeURIComponent(apiKey)}&include_adult=false&page=${page}&query=${encodeURIComponent(query)}`;
      }


      beforeEach(() => {
        formatVideoSearchResultSpy = jest.spyOn((service as unknown) as
          {_formatVideoSearchResult: TMDBService['_formatVideoSearchResult']},
          '_formatVideoSearchResult'
        );
      })

      afterEach(() => expect(apiKeyGetSpy).toBeCalled());

      it(`should return null if API key not present`, (done) => {
        apiKeyGetSpy.mockReturnValue(null);

        service
          .search(mockQuery)
          .subscribe((response) => {
            expect(response).toBeNull();
            done();
          });
      });

      it(`should return null if API call fails`, (done) => {
        const statusText = 'Some error';
        const originalConsoleError = console.error;
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => null);

        service
          .search(mockQuery)
          .subscribe((response) => {
            expect(response).toBeNull();
            done();
          });

        httpTestingController
          .expectOne({
            method: 'GET',
            url: buildApiUrl(mockApiKey, mockQuery),
          })
          .flush('Mock error', { status: 404, statusText });

        expect(consoleErrorSpy).toBeCalled();
        console.error = originalConsoleError;
      });

      it(`should throw specific error if invalid API key used`, (done) => {
        const statusText = 'Some error';
        service
          .search(mockQuery)
          .subscribe(
						_ => done(),
						error => {
							expect(error).toEqual(INVALID_API_KEY_ERROR_MSG);
							done();
						}
					);

        httpTestingController
          .expectOne({
            method: 'GET',
            url: buildApiUrl(mockApiKey, mockQuery),
          })
          .flush('Mock error', { status: 401, statusText });
      });

      it(`should return empty array for results if no matching results`, (done) => {
        service
          .search(mockQuery)
          .subscribe((response) => {
            expect(response?.results).toEqual([]);
            done();
          });

        httpTestingController
          .expectOne({
            method: 'GET',
            url: buildApiUrl(mockApiKey, mockQuery),
          })
          .flush({"results": []});

        expect(formatVideoSearchResultSpy).not.toBeCalled();
      });

      it(`should remove people results from response`, (done) => {
        const { mockSearchResponse } = mockTestData;
        const { expectedSearchResponse } = expectedTestData;
        const mockSearchResponseResults = mockTestData.mockSearchResponse.results;

        formatVideoSearchResultSpy
          .mockReturnValueOnce(expectedSearchResponse.results[0])
          .mockReturnValueOnce(expectedSearchResponse.results[1]);


        service
          .search(mockQuery)
          .subscribe((response) => {
            expect(response).toEqual(expectedSearchResponse);
            done();
          });

        httpTestingController
          .expectOne({
            method: 'GET',
            url: buildApiUrl(mockApiKey, mockQuery),
          })
          .flush(mockSearchResponse);

        expect(formatVideoSearchResultSpy)
          .toHaveBeenNthCalledWith(1, mockSearchResponseResults[0], VideoType.Movie)
        expect(formatVideoSearchResultSpy)
          .toHaveBeenNthCalledWith(2, mockSearchResponseResults[1], VideoType.TV);
      });

      it(`should search and format results`, (done) => {
        const { mockSearchResponse } = mockTestData;
        const { expectedSearchResponse } = expectedTestData;

        formatVideoSearchResultSpy
          .mockReturnValueOnce(expectedSearchResponse.results[0])
          .mockReturnValueOnce(expectedSearchResponse.results[1]);


        service
          .search(mockQuery)
          .subscribe((response) => {
            expect(response).toEqual(expectedSearchResponse);
            done();
          });

        httpTestingController
          .expectOne({
            method: 'GET',
            url: buildApiUrl(mockApiKey, mockQuery),
          })
          .flush(mockSearchResponse);

        expect(formatVideoSearchResultSpy).toHaveBeenCalled();
      });

      it(`should search for video data from a specific results page`, () => {
        const query = 'some Query';
        const page = 6;

        service.search(query, page).subscribe();

        httpTestingController
          .expectOne({
            method: 'GET',
            url: buildApiUrl(mockApiKey, query, page),
          })
      });
    });
  });
});
