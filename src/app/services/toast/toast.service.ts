import { Injectable } from '@angular/core';

export interface Toast {
	id: number,
	message: string
}

const defaultShowTime = 4000;

@Injectable({
  providedIn: 'root'
})
export class ToastService {
	private _toasts: Toast[] = [];

	async addToast(message: string, showTime = defaultShowTime) {
		const toastId = this._toasts.length;
		const newToast: Toast = {id: toastId, message: message};
		this._toasts.push(newToast);
		await new Promise(_ => setTimeout(_, showTime));
		this.removeToast(toastId);
	}

	getToasts(): Toast[] {
    return this._toasts;
  }

	removeToast(id: number) {
		this._toasts = this._toasts.filter(toast => toast.id != id);
	}
}
