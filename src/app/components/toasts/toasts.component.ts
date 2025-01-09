import { Component } from '@angular/core';
import { Toast, ToastService } from '../../services/toast/toast.service';

@Component({
  selector: 'app-toasts',
  templateUrl: './toasts.component.html',
  styleUrls: ['./toasts.component.scss']
})
export class ToastsComponent {
	constructor(public toastService: ToastService) {}

	get toasts(): Toast[] {
    return this.toastService.getToasts();
  }
}
