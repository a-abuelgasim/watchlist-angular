import { Component } from '@angular/core';
import { Toast, ToastService } from '../../services/toast/toast.service';

@Component({
  selector: 'app-toasts',
  templateUrl: './toasts.component.html',
  styleUrls: ['./toasts.component.scss']
})
export class ToastsComponent {
	constructor(public ts: ToastService) {}

	get toasts(): Toast[] {
    return this.ts.getToasts();
  }
}
