import { fakeVideoDB } from "./fake-video-db";
import { videoDetailsToNewVideo, videoDetailsToVideoSearchResult } from "./video";

const mockMovie = fakeVideoDB[1726];
const mockTVShow = fakeVideoDB[85271];

describe('video utils', () => {
  describe(`videoDetailsToVideoSearchResult`, () => {
    it(`should convert movie with video details to video basics`, () => {
      const expectedConvertedMovie = {
        posterPath: mockMovie.posterPath,
        releaseDate: mockMovie.releaseDate,
        title: mockMovie.title,
        type: mockMovie.type,
        serverID: mockMovie.serverID,
      }

      const convertedMovie = videoDetailsToVideoSearchResult(mockMovie);
      expect(convertedMovie).toEqual(expectedConvertedMovie);
    });

    it(`should convert TV Show with video details to video basics`, () => {
      const expectedConvertedTVShow = {
        posterPath: mockTVShow.posterPath,
        releaseDate: mockTVShow.releaseDate,
        title: mockTVShow.title,
        type: mockTVShow.type,
        serverID: mockTVShow.serverID,
      }

      const convertedMovie = videoDetailsToVideoSearchResult(mockTVShow);
      expect(convertedMovie).toEqual(expectedConvertedTVShow);
    });
  });


  describe(`videoDetailsToNewVideo`, () => {
    it(`should convert movie with video details to video`, () => {
      const expectedConvertedMovie = {
        posterPath: mockMovie.posterPath,
        rating: mockMovie.rating,
        releaseDate: mockMovie.releaseDate,
        runtime: mockMovie.runtime,
        serverID: mockMovie.serverID,
        status: mockMovie.status,
        title: mockMovie.title,
        type: mockMovie.type,
        videoListIDs: [],
      }

      const convertedMovie = videoDetailsToNewVideo(mockMovie);
      expect(convertedMovie).toEqual(expectedConvertedMovie);
    });

    it(`should convert TV Show with video details to video`, () => {
      const expectedConvertedTVShow = {
        posterPath: mockTVShow.posterPath,
        rating: mockTVShow.rating,
        releaseDate: mockTVShow.releaseDate,
        runtime: mockTVShow.runtime,
        serverID: mockTVShow.serverID,
        status: mockTVShow.status,
        title: mockTVShow.title,
        type: mockTVShow.type,
        videoListIDs: [],
      }

      const convertedMovie = videoDetailsToNewVideo(mockTVShow);
      expect(convertedMovie).toEqual(expectedConvertedTVShow);
    });
  });
});
