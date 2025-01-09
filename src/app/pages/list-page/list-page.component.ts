import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ListService } from '../../services/list/list.service';
import { Video, VideoList } from '../../utils/video';
import { Subscription } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { FormList } from '../../components/list-dialog/list-dialog.component';
import { APP_NAME } from '../../app.component';
import { SEARCH_MSG } from '../search-page/search-page.component';
import { ToastService } from '../../services/toast/toast.service';
import { ERROR_MSG_PREFIX, RETRY_MSG } from '../../utils/constants';


const DELETE_LIST_ERR_MSG = `${ERROR_MSG_PREFIX} deleting this list. ${RETRY_MSG}.`;
const REMOVE_VIDEO_ERR_MSG = `${ERROR_MSG_PREFIX} removing this video. ${RETRY_MSG}.`;

@Component({
  selector: 'app-list-page',
  templateUrl: './list-page.component.html'
})
export class ListViewComponent implements OnInit, OnDestroy {
  aboutToDeleteList = false;
  deletingList = false;
  formList?: FormList;
  formVisible = false;
  id?: number;
  list?: VideoList;
  listSubscription?: Subscription;
	loading = true;
  removingVideo = false;
  showAddToListDialog = false;
	searchMsg = SEARCH_MSG;
  video?: Video;
  videos?: Video[];


  @ViewChild('deleteDialog') dialog!: ElementRef<HTMLDialogElement>;


  constructor(
    public ls: ListService,
    private route: ActivatedRoute,
    private router: Router,
    private title: Title,
		private ts: ToastService
  ) {}


  get dialogEl() { return this.dialog.nativeElement }


  ngOnInit() {
    // Get list ID from URL
    const idString = this.route.snapshot.paramMap.get('id');
    this.id = parseInt(idString as string);
    if (!this.id) return;

    this.listSubscription = this.ls.videoLists$.subscribe(async (lists) => {
			// Find this list in live list
      this.list = lists.filter((list) => list.id == this.id)[0];
			this.loading = false;
      if (!this.list) return;

      // Set page title
      this.title.setTitle(`${APP_NAME} | ${this.list.name!}`);

      // Add the list details to the edit list form
      this.formList = {name: this.list.name, id: this.id};

      // Get list's videos
      const videos = await this.ls.getVideos(this.list.videoIDs || [])
      this.videos = videos.filter(video => video) as Video[];
			if (this.videos?.length === 0) return;
    }) as Subscription;
  }


  ngOnDestroy() {
    this.listSubscription?.unsubscribe();
  }


  addVideoToList(video: Video) {
    if (!video) return;
    this.video = video;
    this.showAddToListDialog = true;
  }


  async deleteList() {
    this.deletingList = true;
    try {
      await this.ls.deleteList(this.list!);
      this.router.navigate(['/lists']);
    } catch(err) {
      console.error(err);
			this.dialogEl.close();
			this.ts.addToast(DELETE_LIST_ERR_MSG);
    }

		this.deletingList = false;
  }


	// Move a video up or down in the list
	async moveVideo(index: number, direction: -1 | 1): Promise<void> {
		if (!this.videos || this.videos.length == 0 || !this.list?.id) return;

    const videoToMove = this.videos[index];
    this.videos.splice(index, 1);
    this.videos.splice(index + direction, 0, videoToMove);
		const newOrderVideoIDs = this.videos.map(video => video.id);

		try {
			await this.ls.updateList(this.list?.id, {videoIDs: newOrderVideoIDs});
		} catch(err) {
			console.log(err);
		}
	}


  prepareVideoForRemoval(video: Video) {
    this.video = video;
    this.showDeleteDialog(false);
  }


  async removeVideo() {
    if (!this.video || !this.list) return;

    this.removingVideo = true;
    try {
      await this.ls.removeVideoFromLists(this.video, [this.list]);
    } catch(err) {
      console.error(err);
			this.ts.addToast(REMOVE_VIDEO_ERR_MSG);
    }

		this.dialogEl.close();
		this.removingVideo = false;
  }


  showDeleteDialog(deleteList: boolean) {
    this.aboutToDeleteList = deleteList;
    this.dialogEl.showModal();
    this.dialogEl.focus();
  }
}
