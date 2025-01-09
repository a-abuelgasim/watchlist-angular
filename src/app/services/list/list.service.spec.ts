import 'fake-indexeddb/auto';
import { db } from '../../db/db';
import { Video, VideoSearchResult, VideoDetails, VideoList, VideoType, videoDetailsToVideoSearchResult, NewVideo } from '../../utils/video';
import { LIST_NAME_EXISTS_ERR_MSG, ListService } from './list.service';
import { firstValueFrom, of } from 'rxjs';
import { fakeVideoDB } from '../../utils/fake-video-db';
import { VideoDataService } from '../video/video-data.service';

const mockListName = 'mock list name';
const mockList2Name = 'mock list 2 name';

const mockVideoWithBasicsOnly: VideoSearchResult = {
  posterPath: null,
  releaseDate: null,
  serverID: 123456,
  title: 'string',
  type: VideoType.Movie,
}

const mockMovie: NewVideo = {
  posterPath: '/movie-poster-path',
  rating: 1.1,
  releaseDate: '1111-11-11',
  runtime: 111,
  status: 'Released',
  title: 'movie title',
  type: VideoType.Movie,
  serverID: 1111111,
  videoListIDs: []
}

const mockTVShow: NewVideo = {
  posterPath: '/tv-poster-path',
  rating: 2.2,
  releaseDate: '2222-22-2',
  runtime: 222,
  status: 'Returning Series',
  title: 'tv title',
  type: VideoType.TV,
  serverID: 2222222,
  videoListIDs: [220, 221, 222]
}

const mockSameIDTVShow: NewVideo = {
  posterPath: '/tv3-poster-path',
  rating: 3.3,
  releaseDate: '3333-33-3',
  runtime: 33,
  status: 'Returning Series 3',
  title: 'tv title 3',
  type: VideoType.TV,
  serverID: 1111111,
  videoListIDs: [331]
}

const mockMovieBasics = videoDetailsToVideoSearchResult(mockMovie as unknown as VideoDetails);
const mockTVShowBasics = videoDetailsToVideoSearchResult(mockTVShow as unknown as VideoDetails);
const mockSameIDTVShowBasics = videoDetailsToVideoSearchResult(mockSameIDTVShow as unknown as VideoDetails);


describe('ListService', () => {
  let service: ListService;
  let existingList: any;
  let existingListID: number;
  let existingList2: any;
  let existingList2ID: number;
  let existingMovie: any;
  let existingMovieID: number;
  let existingTVShow: any;
  let existingTVShowID: number;
  let existingSameIDTVShow: any;
  let existingSameIDTVShowID: number;

  beforeEach(async () => {
    jest.clearAllMocks();

    await Promise.all([
      db.videos.clear(),
      db.videoLists.clear(),
    ]);

    const now = new Date();

    [existingListID, existingList2ID, existingMovieID, existingTVShowID, existingSameIDTVShowID] = await Promise.all([
      db.videoLists.add({
        created: now,
        name: mockListName,
        updated: now,
        videoIDs: [],
      }),
      db.videoLists.add({
        created: now,
        name: mockList2Name,
        updated: now,
        videoIDs: [],
      }),
      db.videos.add({
        ...mockMovie,
        updated: now,
      } as Video),
      db.videos.add({
        ...mockTVShow,
        updated: now,
      } as Video),
      db.videos.add({
        ...mockSameIDTVShow,
        updated: now,
      } as Video)
    ]);

    [existingList, existingList2, [existingMovie, existingTVShow, existingSameIDTVShow]] = await Promise.all([
      db.videoLists.get(existingListID),
      db.videoLists.get(existingList2ID),
      db.videos.bulkGet([existingMovieID, existingTVShowID, existingSameIDTVShowID])
    ]);

    service = new ListService({} as VideoDataService);
  });


  describe(`Lists`, () => {
    it(`should retrieve video lists from indexedDb`, async () => {
      const response: VideoList[] = await firstValueFrom(service.videoLists$ as any);
      const list = response[0];

      expect(response).toHaveLength(2);
      expect(list.created).toBeDefined();
      expect(list.id).toEqual(existingListID);
      expect(list.name).toEqual(mockListName);
      expect(list.updated).toEqual(list.created);
    });

    describe(`addList`, () => {
      const mockListName = 'list name';

      let dbAddSpy: jest.SpyInstance;

      beforeEach(()=> dbAddSpy = jest.spyOn(db.videoLists, 'add'));


      it(`should add a list`, async () => {
        const newListID = await service.addList(mockListName);

        const list = await db.videoLists.get(newListID!);

        expect(dbAddSpy).toBeCalled();
        expect(list?.created).toBeDefined();
        expect(list?.name).toEqual(mockListName);
        expect(list?.updated).toBeDefined();
        expect(list?.videoIDs).toEqual([]);
      });

      it(`should throw specific error if list with same name exists`, async () => {
        let error, listID;
        const existingName = existingList!.name;

        try {
          listID = await service.addList(existingName);
        } catch(err) {
          error = err;
        } finally {
          expect(error).toEqual(LIST_NAME_EXISTS_ERR_MSG);
          expect(dbAddSpy).toBeCalled();
          expect(listID).toBeUndefined();
        }
      });

      it(`should rethrow error if not related to existing list name error`, async () => {
        const errorMessage = 'Some error';
        let error, listID;

        dbAddSpy.mockImplementationOnce(() => {throw Error(errorMessage)});

        try {
          listID = await service.addList(mockListName);
        } catch(err: any) {
          error = err;
        } finally {
          expect(dbAddSpy).toBeCalled();
          expect(listID).toBeUndefined();
          expect(error.message).toEqual(errorMessage);
        }
      });

      it(`should add a list without videoIDs if videoIDs array empty`, async () => {
        const newListID = await service.addList(mockListName, []);
        const list = await db.videoLists.get(newListID!);

        expect(dbAddSpy).toBeCalled();
        expect(list?.name).toEqual(mockListName);
        expect(list?.videoIDs).toEqual([]);
      });

      it(`should add a list & add its ID to videoListIDs of all its videos`, async () => {
        const videoListIDs = [existingMovieID, existingTVShowID];
        const newListID = await service.addList(mockListName, videoListIDs);

        const list = await db.videoLists.get(newListID!);
        const [movie, tvShow] = await db.videos.bulkGet(videoListIDs);

        expect(dbAddSpy).toBeCalled();
        expect(list?.id).toEqual(newListID);
        expect(list?.name).toEqual(mockListName);
        expect(list?.videoIDs).toEqual(videoListIDs);

        expect(movie!.videoListIDs).toEqual([...existingMovie?.videoListIDs!, newListID]);
        expect(tvShow!.videoListIDs).toEqual([...existingTVShow?.videoListIDs!, newListID]);
      });
    });


    describe(`updateList`, () => {
      let dbUpdateSpy: jest.SpyInstance;

      beforeEach(()=> dbUpdateSpy = jest.spyOn(db.videoLists, 'update'));

      it(`should return undefined if no changes given`, async () => {
        const response = await service.updateList(existingListID, {});

        expect(dbUpdateSpy).not.toBeCalled();
        expect(response).toBeUndefined();
      });

      it(`should return undefined if no name and no videoIDs given`, async () => {
        const response = await service.updateList(existingListID, {name: null, videoIDs: null} as any);

        expect(dbUpdateSpy).not.toBeCalled();
        expect(response).toBeUndefined();
      });

      it(`should return 0 if list is not in DB`, async () => {
        const mockID = 100000;
        const response = await service.updateList(mockID, {name: 'name'});

        expect(dbUpdateSpy).toBeCalled();
        expect(response).toBe(0);
      });

      it(`should update list name`, async () => {
        const name = `new name`;
        const response = await service.updateList(existingListID, {name});

        const list = await db.videoLists.get(existingListID);

        expect(dbUpdateSpy).toBeCalled();
        expect(response).toEqual(1);
        expect(list?.created).toEqual(existingList!.created);
        expect(list?.name).toEqual(name);
        expect(list?.updated).not.toEqual(existingList!.updated);
      });

      it(`should update list videoIDs and updated props`, async () => {
        const videoIDs = [3, 2, 1];
        const response = await service.updateList(existingListID, {videoIDs});

        const list = await db.videoLists.get(existingListID);

        expect(dbUpdateSpy).toBeCalled();
        expect(response).toEqual(1);
        expect(list?.created).toEqual(existingList.created);
        expect(list?.updated).not.toEqual(existingList.updated);
        expect(list?.videoIDs).toEqual(videoIDs);
      });

      it(`should clear list videoIDs and update updated props`, async () => {
        const response = await service.updateList(existingListID, {videoIDs: []});

        const list = await db.videoLists.get(existingListID);

        expect(dbUpdateSpy).toBeCalled();
        expect(response).toEqual(1);
        expect(list?.created).toEqual(existingList.created);
        expect(list?.updated).not.toEqual(existingList.updated);
        expect(list?.videoIDs).toEqual([]);
      });

      it(`should throw specific error if list with same name exists`, async () => {
        let error, response;
        const anotherListName = 'anotherListName';

        // Add second list
        await db.videoLists.add({
          name: anotherListName,
          created: new Date(),
          updated: new Date(),
          videoIDs: [],
        });

        try {
          response = await service.updateList(
            existingListID,
            {name: anotherListName}
          );
        } catch(err) {
          error = err;
        } finally {
          expect(dbUpdateSpy).toBeCalled();
          expect(response).toBeUndefined();
          expect(error).toEqual(LIST_NAME_EXISTS_ERR_MSG);
        }
      });

      it(`should rethrow error if not related to existing list name error`, async () => {
        const errorMessage = 'Some error';
        let error, response;

        dbUpdateSpy.mockImplementationOnce(() => {throw Error(errorMessage)});

        try {
          response = await service.updateList(existingListID, {name: 'new name'});
        } catch(err: any) {
          error = err;
        } finally {
          expect(dbUpdateSpy).toBeCalled();
          expect(response).toBeUndefined();
          expect(error.message).toEqual(errorMessage);
        }
      });
    });


    describe(`deleteList`, () => {
      let dbListDeleteSpy: jest.SpyInstance;
      let dbVideoDeleteSpy: jest.SpyInstance;
      let dbVideoUpdateSpy: jest.SpyInstance;

      beforeEach(()=> {
        dbListDeleteSpy = jest.spyOn(db.videoLists, 'delete');
        dbVideoDeleteSpy = jest.spyOn(db.videos, 'delete');
        dbVideoUpdateSpy = jest.spyOn(db.videos, 'update');
      });


      it(`should not error when deleting a list without an ID`, async () => {
        dbListDeleteSpy.mockImplementationOnce(() => Promise.resolve(undefined))

        await service.deleteList({} as VideoList);

        expect(dbListDeleteSpy).not.toBeCalled();
        expect(dbVideoDeleteSpy).not.toBeCalled();
        expect(dbVideoUpdateSpy).not.toBeCalled();
      });


      it(`should delete a list without videos`, async () => {
        const mockListID = 78;
        const mockList = {
          id: mockListID,
          videoIDs: [],
        } as unknown as VideoList;

        dbListDeleteSpy.mockImplementationOnce(() => Promise.resolve(undefined))

        await service.deleteList(mockList);

        expect(dbListDeleteSpy).toBeCalledWith(mockListID);
        expect(dbVideoDeleteSpy).not.toBeCalled();
        expect(dbVideoUpdateSpy).not.toBeCalled();
      });


      it(`should delete a list with videos in other lists`, async () => {
        const mockVideoID = 65;
        const mockVideo2ID = 56;
        const mockListID = 78;
        const mockOtherListID = 235;
        const mockList = {
          id: mockListID,
          videoIDs: [mockVideoID, mockVideo2ID],
        } as unknown as VideoList;

        const dbVideoBulkGetSpy = jest
          .spyOn(db.videos, 'bulkGet')
          .mockImplementationOnce(
            () => Promise.resolve([
              {
                id: mockVideoID,
                ...mockMovie,
                videoListIDs: [mockListID, mockOtherListID]
              },
              {
                id: mockVideo2ID,
                ...mockTVShow,
                videoListIDs: [mockListID, mockOtherListID]
              },
              {},
              null
            ]) as any
          );

        dbListDeleteSpy.mockImplementationOnce(() => Promise.resolve(undefined));
        dbVideoUpdateSpy.mockImplementationOnce(() => Promise.resolve(1));

        await service.deleteList(mockList);

        expect(dbListDeleteSpy).toBeCalledWith(mockListID);
        expect(dbVideoBulkGetSpy).toBeCalledWith([mockVideoID, mockVideo2ID]);
        expect(dbVideoUpdateSpy).toBeCalledTimes(2);
        expect(dbVideoUpdateSpy.mock.calls[0]).toEqual([mockVideoID, {videoListIDs: [mockOtherListID]}]);
        expect(dbVideoUpdateSpy.mock.calls[1]).toEqual([mockVideo2ID, {videoListIDs: [mockOtherListID]}]);
        expect(dbVideoDeleteSpy).not.toBeCalled();
      });

      it(`should delete a list with a video not in other lists and delete that video`, async () => {
        const mockVideoID = 65;
        const mockVideo2ID = 56;
        const mockListID = 78;
        const mockOtherListID = 235;
        const mockList = {
          id: mockListID,
          videoIDs: [mockVideoID, mockVideo2ID],
        } as unknown as VideoList;

        const dbVideoBulkGetSpy = jest
          .spyOn(db.videos, 'bulkGet')
          .mockImplementationOnce(
            () => Promise.resolve([
              {
                id: mockVideoID,
                ...mockMovie,
                videoListIDs: [mockListID, mockOtherListID]
              },
              {
                id: mockVideo2ID,
                ...mockTVShow,
                videoListIDs: [mockListID]
              },
              {},
              null
            ]) as any
          );

        dbListDeleteSpy.mockImplementationOnce(() => Promise.resolve(undefined));
        dbVideoUpdateSpy.mockImplementationOnce(() => Promise.resolve(1));

        await service.deleteList(mockList);

        expect(dbListDeleteSpy).toBeCalledWith(mockListID);
        expect(dbVideoBulkGetSpy).toBeCalledWith([mockVideoID, mockVideo2ID]);
        expect(dbVideoUpdateSpy).toBeCalledTimes(1);
        expect(dbVideoUpdateSpy.mock.calls[0]).toEqual([mockVideoID, {videoListIDs: [mockOtherListID]}]);
        expect(dbVideoDeleteSpy).toBeCalledWith(mockVideo2ID);
      });
    });
  });


  describe(`Videos`, () => {
    describe(`_addVideoToDB`, () => {
      let dbAddVideoSpy: jest.SpyInstance;


      beforeEach(() => {
        jest.clearAllMocks();
        dbAddVideoSpy = jest.spyOn(db.videos, 'add');
      });


      it(`should return undefined if video has no server ID`, async () => {
        const videoID = await service['_addVideoToDB']({} as VideoSearchResult);

        expect(videoID).toBeUndefined();
        expect(dbAddVideoSpy).not.toHaveBeenCalled();
      });


      it(`should get video from DB with same serverID and type`, async () => {
        const videoID = await service['_addVideoToDB'](mockMovie);

        expect(videoID).toEqual(existingMovieID);
        expect(dbAddVideoSpy).not.toHaveBeenCalled();
      });


      it(`should get details if video has none and return undefined if no video received from getDetails`, async () => {
        const getDetails = jest.fn(_ => of([null, []]));
        const mockVideoDataService = {
          getDetails
        } as unknown as VideoDataService;
        service = new ListService(mockVideoDataService);

        const videoID = await service['_addVideoToDB'](mockVideoWithBasicsOnly);

        expect(getDetails.mock.calls).toHaveLength(1);
        expect(getDetails.mock.calls[0]).toEqual([mockVideoWithBasicsOnly.serverID, mockVideoWithBasicsOnly.type]);
        expect(videoID).toBeUndefined();
        expect(dbAddVideoSpy).not.toHaveBeenCalled();
      });


      it(`should add video with details to DB without getting details`, async () => {
        const mockVideoWithDetails = fakeVideoDB[118340];
        const getDetails = jest.fn();
        const mockVideoDataService = {
          getDetails
        } as unknown as VideoDataService;
        service = new ListService(mockVideoDataService);

        const videoID = await service['_addVideoToDB'](mockVideoWithDetails);

        expect(getDetails).not.toBeCalled();
        expect(videoID).toBeDefined();
        expect(dbAddVideoSpy).toHaveBeenCalled();
      });


      it(`should add video with basics to DB`, async () => {
        const mockVideoWithDetails = fakeVideoDB[118340];
        const getDetails = jest.fn(_ => of([mockVideoWithDetails, []]));
        const mockVideoDataService = {
          getDetails
        } as unknown as VideoDataService;
        service = new ListService(mockVideoDataService);

        const videoID = await service['_addVideoToDB'](mockVideoWithBasicsOnly);

        expect(getDetails.mock.calls).toHaveLength(1);
        expect(getDetails.mock.calls[0]).toEqual([mockVideoWithBasicsOnly.serverID, mockVideoWithBasicsOnly.type]);
        expect(videoID).toBeDefined();
        expect(dbAddVideoSpy).toHaveBeenCalled();
      });
    });


    describe(`addVideoToLists`, () => {
      let updateListSpy: jest.SpyInstance;
      let dbUpdateVideoSpy: jest.SpyInstance;
      let addVideoToDBSpy: jest.SpyInstance;

      beforeEach(() => {
        updateListSpy = jest
          .spyOn(service, 'updateList')
          .mockImplementation(() => Promise.resolve(1))

        addVideoToDBSpy = jest.spyOn((service as unknown) as {
          _addVideoToDB: ListService['_addVideoToDB']
        }, '_addVideoToDB');

        dbUpdateVideoSpy = jest.spyOn(db.videos, 'update');
      });


      it(`should not error if lists array is empty`, async () => {
        const response = await service.addVideoToLists(mockVideoWithBasicsOnly, []);

        expect(response).toBeUndefined();
        expect(addVideoToDBSpy).not.toBeCalled();
        expect(updateListSpy).not.toBeCalled();
        expect(dbUpdateVideoSpy).not.toBeCalled();
      });

      it(`should add video to DB if video has no ID and not error if addVideoToDB returns undefined`, async () => {
        addVideoToDBSpy.mockImplementationOnce(() => Promise.resolve(undefined))

        await service.addVideoToLists(mockVideoWithBasicsOnly, [{} as VideoList]);

        expect(addVideoToDBSpy).toBeCalledWith(mockVideoWithBasicsOnly);
        expect(updateListSpy).not.toBeCalled();
        expect(dbUpdateVideoSpy).not.toBeCalled();
      });

      it(`should not error if get video returns undefined`, async () => {
        addVideoToDBSpy.mockImplementationOnce(() => Promise.resolve(1))

        const getVideoSpy = jest
          .spyOn(service, 'getVideo')
          .mockImplementationOnce(() => Promise.resolve(undefined));

        await service.addVideoToLists(mockVideoWithBasicsOnly, [{} as VideoList]);

        expect(addVideoToDBSpy).toBeCalledWith(mockVideoWithBasicsOnly);
        expect(updateListSpy).not.toBeCalled();
        expect(dbUpdateVideoSpy).not.toBeCalled();
      });

      it(`should add video with basics only to lists`, async () => {
        const mockAddVideoToDBVideoID = 215;
        const mockListIDs = [20, 10, 30, 40];
        const mockVideoIDs = [[111, 11], [2, 22]];

        const mockVideoLists = [
          {id: mockListIDs[0], videoIDs: mockVideoIDs[0]} as any,
          {id: mockListIDs[1], videoIDs: mockVideoIDs[1]} as any,
          {id: mockListIDs[2], videoIDs: []} as any,
          {id: mockListIDs[3], videoIDs: [333, mockAddVideoToDBVideoID]} as any,
          {} as any,
          null,
        ];

        addVideoToDBSpy.mockImplementationOnce(() => Promise.resolve(mockAddVideoToDBVideoID));

        const getVideoSpy = jest
          .spyOn(service, 'getVideo')
          .mockImplementationOnce(() => Promise.resolve({...mockMovie, id: mockAddVideoToDBVideoID, videoListIDs: [mockListIDs[3]]}));

        const video = await service.addVideoToLists(mockVideoWithBasicsOnly, mockVideoLists);

        expect(video).toEqual({...mockMovie, id: mockAddVideoToDBVideoID, videoListIDs: [mockListIDs[3], mockListIDs[0], mockListIDs[1], mockListIDs[2]]});
        expect(addVideoToDBSpy).toBeCalledWith(mockVideoWithBasicsOnly);
        expect(getVideoSpy).toBeCalledWith(mockAddVideoToDBVideoID);
        expect(updateListSpy).toBeCalledTimes(3);
        expect(updateListSpy.mock.calls[0]).toEqual([
          mockListIDs[0],
          {videoIDs: [...mockVideoIDs[0], mockAddVideoToDBVideoID]}
        ]);
        expect(updateListSpy.mock.calls[1]).toEqual([
          mockListIDs[1],
          {videoIDs: [...mockVideoIDs[1], mockAddVideoToDBVideoID]}
        ]);
        expect(updateListSpy.mock.calls[2]).toEqual([
          mockListIDs[2],
          {videoIDs: [mockAddVideoToDBVideoID]}
        ]);

        expect(dbUpdateVideoSpy).toBeCalledWith(
          mockAddVideoToDBVideoID,
          {videoListIDs: [mockListIDs[3], mockListIDs[0], mockListIDs[1], mockListIDs[2]]}
        );
      });

      it(`should add video with details to lists`, async () => {
        const mockAddVideoToDBVideoID = 215;
        const mockListIDs = [20, 10, 30, 40];
        const mockVideoIDs = [[111, 11], [2, 22]];

        const mockVideoLists = [
          {id: mockListIDs[0], videoIDs: mockVideoIDs[0]} as any,
          {id: mockListIDs[1], videoIDs: mockVideoIDs[1]} as any,
          {id: mockListIDs[2], videoIDs: []} as any,
          {id: mockListIDs[3], videoIDs: [333, mockAddVideoToDBVideoID]} as any,
          {} as any,
          null,
        ];

        addVideoToDBSpy.mockImplementationOnce(() => Promise.resolve(mockAddVideoToDBVideoID));

        const getVideoSpy = jest
          .spyOn(service, 'getVideo')
          .mockImplementationOnce(() => Promise.resolve({...mockMovie, id: mockAddVideoToDBVideoID, videoListIDs: [mockListIDs[3]]}));

        const video = await service.addVideoToLists(mockMovie, mockVideoLists);

        expect(video).toEqual({...mockMovie, id: mockAddVideoToDBVideoID, videoListIDs: [mockListIDs[3], mockListIDs[0], mockListIDs[1], mockListIDs[2]]});
        expect(addVideoToDBSpy).toBeCalledWith(mockMovie);
        expect(getVideoSpy).toBeCalledWith(mockAddVideoToDBVideoID);
        expect(updateListSpy).toBeCalledTimes(3);
        expect(updateListSpy.mock.calls[0]).toEqual([
          mockListIDs[0],
          {videoIDs: [...mockVideoIDs[0], mockAddVideoToDBVideoID]}
        ]);
        expect(updateListSpy.mock.calls[1]).toEqual([
          mockListIDs[1],
          {videoIDs: [...mockVideoIDs[1], mockAddVideoToDBVideoID]}
        ]);
        expect(updateListSpy.mock.calls[2]).toEqual([
          mockListIDs[2],
          {videoIDs: [mockAddVideoToDBVideoID]}
        ]);

        expect(dbUpdateVideoSpy).toBeCalledWith(
          mockAddVideoToDBVideoID,
          {videoListIDs: [mockListIDs[3], mockListIDs[0], mockListIDs[1], mockListIDs[2]]}
        );
      });

      it(`should add video with id to lists`, async () => {
        const mockAddVideoToDBVideoID = 215;
        const mockListIDs = [20, 10, 30, 40];
        const mockVideoIDs = [[111, 11], [2, 22]];

        const mockVideoLists = [
          {id: mockListIDs[0], videoIDs: mockVideoIDs[0]} as any,
          {id: mockListIDs[1], videoIDs: mockVideoIDs[1]} as any,
          {id: mockListIDs[2], videoIDs: []} as any,
          {id: mockListIDs[3], videoIDs: [333, mockAddVideoToDBVideoID]} as any,
          {} as any,
          null,
        ];

        const videoWithID = {...mockTVShow, id: mockAddVideoToDBVideoID, videoListIDs: [mockListIDs[3]]};
        const getVideoSpy = jest.spyOn(service, 'getVideo');

        const video = await service.addVideoToLists(videoWithID, mockVideoLists);

        expect(video).toEqual({
          ...videoWithID,
          videoListIDs: [
            mockListIDs[3],
            mockListIDs[0],
            mockListIDs[1],
            mockListIDs[2]
          ]
        });
        expect(addVideoToDBSpy).not.toBeCalled();
        expect(getVideoSpy).not.toBeCalled();
        expect(updateListSpy).toBeCalledTimes(3);
        expect(updateListSpy.mock.calls[0]).toEqual([
          mockListIDs[0],
          {videoIDs: [...mockVideoIDs[0], mockAddVideoToDBVideoID]}
        ]);
        expect(updateListSpy.mock.calls[1]).toEqual([
          mockListIDs[1],
          {videoIDs: [...mockVideoIDs[1], mockAddVideoToDBVideoID]}
        ]);
        expect(updateListSpy.mock.calls[2]).toEqual([
          mockListIDs[2],
          {videoIDs: [mockAddVideoToDBVideoID]}
        ]);

        expect(dbUpdateVideoSpy).toBeCalledWith(
          mockAddVideoToDBVideoID,
          {
            videoListIDs: [
              mockListIDs[3],
              mockListIDs[0],
              mockListIDs[1],
              mockListIDs[2]
            ]
          }
        );
      });
    });


    describe(`getVideo`, () => {
      let dbGetSpy: jest.SpyInstance;

      beforeEach(()=> dbGetSpy = jest.spyOn(db.videos, 'get'));

      it(`should return null if video not in DB`, async () => {
        const mockID = 10000;
        const list = await service.getVideo(mockID);

        expect(dbGetSpy).toBeCalledWith(mockID);
        expect(list).toBeUndefined();
      });

      it(`should get videos`, async () => {
        const videoFromDb = await service.getVideo(existingMovieID);

        expect(dbGetSpy).toBeCalledWith(existingMovieID);
        expect(videoFromDb).toEqual(existingMovie);
      });
    });


    describe(`getVideos`, () => {
      let dbBulkGetSpy: jest.SpyInstance;

      beforeEach(()=> dbBulkGetSpy = jest.spyOn(db.videos, 'bulkGet'));

      it(`should return undefined if a video not in DB`, async () => {
        const mockIDs = [10000];
        const list = await service.getVideos(mockIDs);

        expect(dbBulkGetSpy).toBeCalledWith(mockIDs);
        expect(list).toEqual([undefined]);
      });

      it(`should get videos`, async () => {
        const serverIDs = [existingMovieID, existingTVShowID];
        const videos = await service.getVideos(serverIDs);

        expect(dbBulkGetSpy).toBeCalledWith(serverIDs);
        expect(videos).toEqual([existingMovie, existingTVShow]);
      });
    });


    describe(`getVideoUsingServerID`, () => {
      it(`should return null if video not in DB or incorrectly formatted`, async () => {
        const [
          noVideoResult,
          noTypeVideoResult,
          noServerIDVideoResult,
          notInDBVideoResult
        ] = await Promise.all([
          service.getVideoUsingServerID({} as VideoSearchResult),
          service.getVideoUsingServerID({serverID: existingMovie.serverID} as VideoSearchResult),
          service.getVideoUsingServerID({type: existingMovie.type} as VideoSearchResult),
          service.getVideoUsingServerID({serverID: existingMovie.serverID + 1, type: existingMovie.type} as VideoSearchResult),
        ])

        expect(noVideoResult).toBeNull();
        expect(noTypeVideoResult).toBeNull();
        expect(noServerIDVideoResult).toBeNull();
        expect(notInDBVideoResult).toBeNull();
      });

      it(`should return videoID if video in DB`, async () => {
        const [movieID, tvShowID, sameIDTVShowID] = await Promise.all([
          service.getVideoUsingServerID(mockMovieBasics),
          service.getVideoUsingServerID(mockTVShowBasics),
          service.getVideoUsingServerID(mockSameIDTVShowBasics),
        ]);

        expect(movieID).toEqual(existingMovie);
        expect(tvShowID).toEqual(existingTVShow);
        expect(sameIDTVShowID).toEqual(existingSameIDTVShow);
      });
    });


    describe(`removeVideoFromLists`, () => {
      let updateListSpy: jest.SpyInstance;
      let dbUpdateVideoSpy: jest.SpyInstance;
      let dbDeleteVideoSpy: jest.SpyInstance;

      beforeEach(() => {
        updateListSpy = jest
          .spyOn(service, 'updateList')
          .mockImplementation(() => Promise.resolve(1))

        dbUpdateVideoSpy = jest.spyOn(db.videos, 'update');
        dbDeleteVideoSpy = jest.spyOn(db.videos, 'delete');
      });


      it(`should return undefined if lists array is empty`, async () => {
        const response = await service.removeVideoFromLists({} as Video, []);

        expect(response).toBeUndefined();
        expect(updateListSpy).not.toBeCalled();
        expect(dbUpdateVideoSpy).not.toBeCalled();
        expect(dbDeleteVideoSpy).not.toBeCalled();
      });


      it(`should remove video from lists`, async () => {
        const mockVideoID = 598;
        const mockOtherListID = 465;
        const mockListIDs = [10, 20, 30];
        const mockVideoIDs = [[1, 11], [2, 22, 222]];

        const mockVideoLists = [
          {
            id: mockListIDs[0],
            videoIDs: [mockVideoID]
          } as any,
          {
            id: mockListIDs[1],
            videoIDs: [mockVideoID, ...mockVideoIDs[0]]
          } as any,
          {
            id: mockListIDs[2],
            videoIDs: [...mockVideoIDs[1], mockVideoID]
          } as any,
          {
            id: 40,
            videoIDs: [333]
          } as any,
          {} as any,
          null,
        ];

        await service.removeVideoFromLists(
          {
            ...mockMovie,
            id: mockVideoID,
            videoListIDs: [...mockListIDs, mockOtherListID]
          },
          mockVideoLists
        );

        expect(updateListSpy).toBeCalledTimes(3);
        expect(updateListSpy.mock.calls[0]).toEqual([
          mockListIDs[0],
          {videoIDs: []}
        ]);
        expect(updateListSpy.mock.calls[1]).toEqual([
          mockListIDs[1],
          {videoIDs: mockVideoIDs[0]}
        ]);
        expect(updateListSpy.mock.calls[2]).toEqual([
          mockListIDs[2],
          {videoIDs: mockVideoIDs[1]}
        ]);
        expect(dbUpdateVideoSpy).toBeCalledWith(mockVideoID, {videoListIDs: [mockOtherListID]});
        expect(dbDeleteVideoSpy).not.toBeCalled();
      });


      it(`should remove video from lists and delete video from DB if in not in other lists`, async () => {
        const mockVideoID = 65;
        const mockListIDs = [11, 22, 33];
        const mockVideoIDs = [[3, 33], [4, 44, 444]];

        const mockVideoLists = [
          {
            id: mockListIDs[0],
            videoIDs: [mockVideoID]
          } as any,
          {
            id: mockListIDs[1],
            videoIDs: [mockVideoID, ...mockVideoIDs[0]]
          } as any,
          {
            id: mockListIDs[2],
            videoIDs: [...mockVideoIDs[1], mockVideoID]
          } as any,
          {
            id: 40,
            videoIDs: [333]
          } as any,
          {} as any,
          null,
        ];

        await service.removeVideoFromLists(
          {
            ...mockMovie,
            id: mockVideoID,
            videoListIDs: [...mockListIDs]
          },
          mockVideoLists
        );

        expect(updateListSpy).toBeCalledTimes(3);
        expect(updateListSpy.mock.calls[0]).toEqual([
          mockListIDs[0],
          {videoIDs: []}
        ]);
        expect(updateListSpy.mock.calls[1]).toEqual([
          mockListIDs[1],
          {videoIDs: mockVideoIDs[0]}
        ]);
        expect(updateListSpy.mock.calls[2]).toEqual([
          mockListIDs[2],
          {videoIDs: mockVideoIDs[1]}
        ]);
        expect(dbUpdateVideoSpy).not.toBeCalled();
        expect(dbDeleteVideoSpy).toBeCalledWith(mockVideoID);
      });


      it(`should add video to 1 list and remove from 2`, async () => {
        const mockVideoID = 65;
        const mockListIDs = [11, 22, 33];
        const mockVideoIDs = [[3, 33], [4, 44, 444]];

        const mockVideoLists = [
          {
            id: mockListIDs[0],
            videoIDs: [mockVideoID]
          } as any,
          {
            id: mockListIDs[1],
            videoIDs: [mockVideoID, ...mockVideoIDs[0]]
          } as any,
          {
            id: mockListIDs[2],
            videoIDs: []
          } as any,
          {
            id: 40,
            videoIDs: [333]
          } as any,
          {} as any,
          null,
        ];

        const addVideoToDBSpy = jest
          .spyOn((service as unknown) as {
            _addVideoToDB: ListService['_addVideoToDB']
          }, '_addVideoToDB');
        const getVideoSpy = jest.spyOn(service, 'getVideo');

        const videoWithID = {...mockMovie, id: mockVideoID, videoListIDs: [mockListIDs[0], mockListIDs[1]]};

        const video = await service.addVideoToLists(videoWithID, [mockVideoLists[2]]);
        await service.removeVideoFromLists(video!, [mockVideoLists[0], mockVideoLists[1]]);

        expect(video).toEqual(videoWithID);

        expect(addVideoToDBSpy).not.toBeCalled()
        expect(getVideoSpy).not.toBeCalled()
        expect(updateListSpy).toBeCalledTimes(3);
        expect(updateListSpy.mock.calls[0]).toEqual([
          mockListIDs[2],
          {videoIDs: [mockVideoID]}
        ]);
        expect(updateListSpy.mock.calls[1]).toEqual([
          mockListIDs[0],
          {videoIDs: []}
        ]);
        expect(updateListSpy.mock.calls[2]).toEqual([
          mockListIDs[1],
          {videoIDs: mockVideoIDs[0]}
        ]);
        expect(dbUpdateVideoSpy).toBeCalledTimes(2);

        expect(dbUpdateVideoSpy.mock.calls[0]).toEqual([mockVideoID, {videoListIDs: mockListIDs}]);
        expect(dbUpdateVideoSpy.mock.calls[1]).toEqual([mockVideoID, {videoListIDs: [mockListIDs[2]]}]);
        expect(dbDeleteVideoSpy).not.toBeCalled();
      });


      it(`should add video to 2 lists and remove from 1`, async () => {
        const mockVideoID = 65;
        const mockListIDs = [11, 22, 33];
        const mockVideoIDs = [[3, 33], [4, 44, 444]];

        const mockVideoLists = [
          {
            id: mockListIDs[0],
            videoIDs: [mockVideoID]
          } as any,
          {
            id: mockListIDs[1],
            videoIDs: [mockVideoID, mockVideoIDs[0]]
          } as any,
          {
            id: mockListIDs[2],
            videoIDs: []
          } as any,
          {
            id: 40,
            videoIDs: [333]
          } as any,
          {} as any,
          null,
        ];

        const addVideoToDBSpy = jest
          .spyOn((service as unknown) as {
            _addVideoToDB: ListService['_addVideoToDB']
          }, '_addVideoToDB');
        const getVideoSpy = jest.spyOn(service, 'getVideo');

        const videoWithID = {...mockMovie, id: mockVideoID, videoListIDs: [mockListIDs[0], mockListIDs[1]]};

        const video = await service.addVideoToLists(videoWithID, [mockVideoLists[0], mockVideoLists[2]]);
        await service.removeVideoFromLists(video!, [mockVideoLists[1]]);

        expect(video).toEqual(videoWithID);

        expect(addVideoToDBSpy).not.toBeCalled()
        expect(getVideoSpy).not.toBeCalled()
        expect(updateListSpy).toBeCalledTimes(2);
        expect(updateListSpy.mock.calls[0]).toEqual([
          mockListIDs[2],
          {videoIDs: [mockVideoID]}
        ]);
        expect(updateListSpy.mock.calls[1]).toEqual([
          mockListIDs[1],
          {videoIDs: [mockVideoIDs[0]]}
        ]);
        expect(dbUpdateVideoSpy).toBeCalledTimes(2);

        expect(dbUpdateVideoSpy.mock.calls[0]).toEqual([mockVideoID, {videoListIDs: mockListIDs}]);
        expect(dbUpdateVideoSpy.mock.calls[1]).toEqual([mockVideoID, {videoListIDs: [mockListIDs[0], mockListIDs[2]]}]);
        expect(dbDeleteVideoSpy).not.toBeCalled();
      });
    });


    describe(`updateVideo`, () => {
      let dbUpdateSpy: jest.SpyInstance;

      beforeEach(()=> dbUpdateSpy = jest.spyOn(db.videos, 'update'));

      it(`should return null if no changes given`, async () => {
        const response = await service.updateVideo({});

        expect(dbUpdateSpy).not.toBeCalled();
        expect(response).toBeNull();
      });

      it(`should return null if no ID given`, async () => {
        const response = await service.updateVideo({name: 'new name'});

        expect(dbUpdateSpy).not.toBeCalled();
        expect(response).toBeNull();
      });

      it(`should return 0 if video is not in DB`, async () => {
        const mockID = 100000;
        const response = await service.updateVideo({id: mockID, name: 'name'});

        expect(dbUpdateSpy).toBeCalled();
        expect(response).toBe(0);
      });

      it(`should update videos`, async () => {
        const title = `new title`;
        const response = await service.updateVideo({id: existingMovieID, title});

        const movie = await db.videos.get(existingMovieID);

        expect(dbUpdateSpy).toBeCalled();
        expect(response).toEqual(1);
        expect(movie?.title).toEqual(title);
        expect(movie?.updated).not.toEqual(mockMovie.updated);
      });
    });
  });
});
