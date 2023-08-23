import Dexie, { Table } from 'dexie';
import { Video, VideoList } from '../utils/video';


const DB_NAME = 'watchy';

export class AppDB extends Dexie {
  videos!: Table<Video, number>;
  videoLists!: Table<VideoList, number>;


  constructor() {
    super(DB_NAME);

    this
      .version(1)
      .stores({
        videoLists: '++id, &name',
        videos: '++id, serverID, *videoListIDs',
      });
  }
}

export const db = new AppDB();
