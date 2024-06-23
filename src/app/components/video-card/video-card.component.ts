import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Video, VideoSearchResult } from '../../utils/video';
import { VideoDataService } from '../../services/video/video-data.service';


@Component({
  selector: 'app-video-card',
  templateUrl: './video-card.component.html',
  styleUrls: ['./video-card.component.scss']
})
export class VideoCardComponent {
	status?: string | null;


  @Input() isFirst?: boolean;
  @Input() isLast?: boolean;
  @Input() video?: VideoSearchResult | Video;

  @Output() add = new EventEmitter();
  @Output() remove = new EventEmitter();
	@Output() moveUp = new EventEmitter();
	@Output() moveDown = new EventEmitter();


  constructor(public vds: VideoDataService) {}


	// Determine if the video card is on the list page or the search result page
	get onListPage() { return this.video ? 'id' in this.video : false }
}
