import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VideoDetails, VideoType } from '../../utils/video';
import { VideoDataService } from '../../services/video/video-data.service';
import { Subscription } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { APP_NAME } from '../../app.component';

@Component({
  selector: 'app-video-page',
  templateUrl: './video-page.component.html',
  styleUrls: ['./video-page.component.scss']
})
export class VideoViewComponent implements OnInit, OnDestroy {
	loading = true;
  showAddToListDialog = false;
	streamers?: string[];
	video?: VideoDetails;
	videoDetailsSubscription?: Subscription;


  constructor(
    private route: ActivatedRoute,
    private ts: Title,
    public vds: VideoDataService
  ) {}


  ngOnInit(): void {
		// Get video serverID and type from the URL
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = parseInt(idParam || '0');
    if (!id) return;
    const videoTypeParam = this.route.snapshot.queryParamMap.get('type') as VideoType;

		// Get video details using serverID and type
		this.videoDetailsSubscription = this.vds
			.getDetails(id, videoTypeParam)
			.subscribe(([video, streamers]) => {
				this.loading = false;
				if (!video) return
				this.video = video;
				this.streamers = this.removeDuplicateStreamers(streamers);
				this.ts.setTitle(`${APP_NAME} | ${video.title}`);
			});
  }


	ngOnDestroy() {
		this.videoDetailsSubscription?.unsubscribe();
	}


	// Get a streaming service's logo name
	getStreamerLogoName(streamer: string): string | null {
		if (!streamer) return null;

		if (streamer.includes('CBS')) return 'cbs';
		else if (streamer.includes('Comedy Central')) return 'comedy-central';
		else if (streamer.includes('DIRECTV')) return 'direct-tv';
		else if (streamer.includes('Disney')) return 'disney';
		else if (streamer.includes('fuboTV')) return 'fubotv';
		else if (streamer.includes('FXNow')) return 'fxnow';
		else if (streamer.includes('Fox')) return 'fox';
		else if (streamer.includes('Hulu')) return 'hulu';
		else if (streamer.includes('NBC')) return 'nbc';
		else if (streamer.includes('Max')) return 'hbo-max';
		else if (streamer.includes('MGM Plus')) return 'mgm';
		else if (streamer.includes('Netflix')) return 'netflix';
		else if (streamer.includes('Paramount')) return 'paramount';
		else if (streamer.includes('Peacock')) return 'peacock';
		else if (streamer.includes('Showtime')) return 'showtime';
		else if (streamer.includes('Starz')) return 'starz';
		else if (streamer.includes('USA Network')) return 'usa-network';
		// These must be at the bottom because they have "channels" that include the other streaming services
		else if (streamer.includes('Prime Video')) return 'prime-video';
		else if (streamer.includes('Apple TV Plus')) return 'apple-tv';
		return 'streamer';
	}


	// A lot of streaming services are duplicated as channels in other streaming services, such as 'Starz Apple TV Channel'
	removeDuplicateStreamers(streamers: string[]): string[] {
		return streamers?.filter((streamer) => !streamer.includes(' Channel'));
	}
}
