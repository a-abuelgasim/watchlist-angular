import Dexie, { Table } from 'dexie';
import { Video, VideoList } from '../utils/video';
import { APP_NAME } from '../app.component';

export const DB_NAME = APP_NAME.toLowerCase();
export const DEXIE_EXPORT_IMPORT_FORMAT_VERSION = 1;
export const LIBRARY_EXPORTED_FILE_NAME = `${DB_NAME}.library.json`;

export class AppDB extends Dexie {
  videoLists!: Table<VideoList, number>;
  videos!: Table<Video, number>;

  constructor() {
    super(DB_NAME);

    this
      .version(1)
      .stores({
        videoLists: '++id, &name',
        videos: '++id, serverID, *videoListIDs',
      });
  }

	async reset() {
		await db.delete();
		await db.open();
	}
}

export const db = new AppDB();
