import { Injectable } from '@angular/core';
import Dexie, { liveQuery } from 'dexie';
import { db } from '../../db/db';
import { Video, VideoSearchResult, VideoDetails, VideoList, videoDetailsToNewVideo } from '../../utils/video';
import { VideoDataService } from '../video/video-data.service';
import { firstValueFrom } from 'rxjs';


export const LIST_NAME_EXISTS_ERROR = `There's already a list with this name.`;


@Injectable({
  providedIn: 'root'
})
export class ListService {
  videoLists$ = liveQuery(() => db.videoLists.toArray());


  constructor(private vds: VideoDataService) {}


  private async _addVideoToDB(video: VideoSearchResult | VideoDetails): Promise<number | undefined> {
    if (!video.serverID) return;

    // Check if a video exists in DB with same serverID and type
    const existingVideoInDB = await this.getVideoUsingServerID(video);
    if (existingVideoInDB) return existingVideoInDB.id!;

    // If video not in DB
    // Check if video has details
    const videoHasDetails = video.hasOwnProperty('rating');

    // If video has no details
    let videoWithNewDetails = {} as VideoDetails;
    if (!videoHasDetails) {
      const [_videoWithDetails, _] = await firstValueFrom(
        this.vds.getDetails(video.serverID, video.type)
      );

      if (!_videoWithDetails) return;
      videoWithNewDetails = _videoWithDetails;
    }

    // Add to DB
    const videoWithDetails: VideoDetails = videoHasDetails ? (video as VideoDetails) : videoWithNewDetails;

    return db.videos.add({
      ...videoDetailsToNewVideo(videoWithDetails),
      updated: new Date(),
    } as Video);
  }


  // #region LIST METHODS
  // Add a list to DB with or without initial videos
  async addList(name: string, videoIDs?: number[]): Promise<number | undefined> {
    const updateVideoIDs = videoIDs && videoIDs.length > 0;
    const list: VideoList = {
      created: new Date(),
      name,
      updated: new Date(),
      videoIDs: updateVideoIDs ? videoIDs : [],
    }

    try {
      const newListID = await db.videoLists.add(list);
      if (updateVideoIDs) {
        const videos = await db.videos.bulkGet(videoIDs);

        videos.filter(video => video)
          .map(async (video) => {
            const videoListIDs = [...new Set([...video!.videoListIDs, newListID])];
            await db.videos.update(video!.id!, {videoListIDs});
          });
      }
      return newListID;
    } catch(err: any) {
      if (err.name === Dexie.errnames.Constraint) {
        throw(LIST_NAME_EXISTS_ERROR);
      }

      throw(err);
    }
  }


  // Update list name or videoIDs
  // Returns 1 if successful, 0 if no records changed, null if no changes provided.
  async updateList(id: number, changes: {name?: string, videoIDs?: number[]}): Promise<number | undefined> {
    if (!changes.name && !changes.videoIDs) return;
    (changes as any).updated = new Date();

    try {
      return await db.videoLists.update(id, changes);
    } catch(err: any) {
      if (err.message.includes(Dexie.errnames.Constraint)) {
        throw(LIST_NAME_EXISTS_ERROR);
      }
      throw(err);
    }
  }


  // Delete a video list and remove it's ID from all its videos' videoListIDs arrays.
  async deleteList(list: VideoList): Promise<void> {
    if (!list.id) return;
    const listID = list.id;
    await db.videoLists.delete(listID);
    if (list.videoIDs.length == 0) return;

    // Get all videos in deleted list
    const deletedListVideos = await db.videos.bulkGet(list.videoIDs);

    // Remove deleted list id from the videos' videoListIDs array
    const promises = [];
    for (const video of deletedListVideos) {
      if (!video || !video.id || !video.videoListIDs) continue;

      const videoListIDs = new Set(video.videoListIDs);
      videoListIDs.delete(listID);

      // Remove video if videoListIDs empty (not in any other lists)
      if (videoListIDs.size == 0) {
        // Add delete video promise to promises list to run in parallel later
        promises.push(db.videos.delete(video.id!));
      } else {
        // Add update promise to promises list to run in parallel later
        promises.push(db.videos.update(video.id!, {videoListIDs: [...videoListIDs]}) as any);
      }
    }

    // Run all promises in parallel
    await Promise.all(promises);
  }
  // #endregion


  // #region VIDEO METHODS
  // Add video to a list and link the list to the video, return video with updated videoListIDs
  async addVideoToLists(video: Video | VideoSearchResult | VideoDetails, lists: VideoList[]): Promise<Video | undefined> {
    if (lists.length == 0) return;

    // If video not in DB or ID unknown
    const videoInDB = 'id' in video;
    if (!videoInDB) {
      // Add video to DB then retrieve it
      const videoID = await this._addVideoToDB(video);
      if (!videoID) return;
      // Retrieve video from DB
      video = await this.getVideo(videoID) as Video;
      if (!video) return;
    }

    const _video = (video as Video);
    const videoID = _video.id!;

    // Filter out all undefined lists, those without ID and those that already have the video
    const filteredLists = lists.filter(
      list => list && list.id && !list.videoIDs.includes(videoID)
    );

    // Store all updateList promises to run in parallel later
    const promises = filteredLists.map(
      list => this.updateList(list.id!, {videoIDs: [...list.videoIDs, videoID]})
    );

    // Get list of video list IDs
    const filteredListIDs = filteredLists.map((list) => list.id as number);
    // Combine video's exising videoListIDs and new list IDs in Set to prevent duplicates
    const videoListIDsSet = new Set([...(_video.videoListIDs), ...filteredListIDs]);
    const videoListIDs = [...videoListIDsSet];


    // Add update promise to promises list to run in parallel later
    // Not using updateVideo because 'updated' property should only change when data changes
    promises.push(db.videos.update(videoID, {videoListIDs}));
    _video.videoListIDs = videoListIDs;

    // Run all promises in parallel
    await Promise.all(promises);
    return _video;
  }


  // Get video info based on its ID
  // Returns the video or null if it was not in DB.
  async getVideo(id: number): Promise<Video | undefined> {
    return db.videos.get(id);
  }


  // Get video infos based on IDs
  // Returns an array of Videos or null if it was not in DB.
  async getVideos(ids: number[]): Promise<(Video | undefined)[]> {
    return db.videos.bulkGet(ids);
  }


  // Get a video from the DB using it's serverID and type
  async getVideoUsingServerID(video: VideoSearchResult): Promise<Video | null> {
    const {serverID, type} = video;
    if (!serverID || !type) return null;

    const videoFromDb = await db.videos
      .where('serverID')
      .equals(serverID)
      .filter(video => video.type == type)
      .first();

    return videoFromDb || null;
  }


   // Remove video from a list and unlink the list from the video, then remove video from DB if not in any other list
  async removeVideoFromLists(video: Video, lists: VideoList[]): Promise<void> {
    if (lists.length == 0) return;

    const videoID = video.id!;

    // Filter out all undefined lists, those without ID and those that don't have the video in them
    const filteredLists = lists.filter(
      list => list && list.id && list.videoIDs.includes(video.id!)
    );

    // Store all updateList promises to run in parallel later
    const promises = filteredLists.map(list => {
      const videoIDs = new Set(list.videoIDs);
      videoIDs.delete(videoID);
      return this.updateList(list.id!, {videoIDs: [...videoIDs]});
    });

    const filteredListIDs = filteredLists.map(list => list.id);
    const videoListIDs = video.videoListIDs
      .filter(id => !filteredListIDs.includes(id));

    // If video is in no lists
    if (videoListIDs.length == 0) {
      // Add delete video promise to promises list to run in parallel later
      promises.push(db.videos.delete(videoID) as any);
    } else {
      // Add update promise to promises list to run in parallel later
      // Not using updateVideo because 'updated' property should only change when data changes
      promises.push(db.videos.update(videoID, {videoListIDs: videoListIDs}));
    }

    // Run all promises in parallel
    await Promise.all(promises);
  }


  // Update video info in DB
  // Returns 1 if successful, 0 if no records changed, null if no changes provided
  async updateVideo(video: any): Promise<number | null> {
    if (!video || !video.id) return null;

    const updatedVideo = {
      ...video,
      updated: new Date(),
    };

    return db.videos.update(video.id, updatedVideo);
  }
  // #endregion
}
