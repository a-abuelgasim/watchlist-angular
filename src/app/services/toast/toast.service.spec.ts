import { Toast, ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
	const MOCK_TOAST_MSG = 'Some toast message';
	const mockToast: Toast = {
		id: 0,
		message: MOCK_TOAST_MSG
	};

	it(`should get toasts`, async () => {
		service = new ToastService();

		service['_toasts'].push(mockToast);
		const toasts = service.getToasts();

		expect(toasts).toEqual([mockToast]);
	});


	it(`should add toasts`, async () => {
		const MOCK_TOAST_MSG_2 = 'Some other toast message';
		const mockToast2: Toast = {
			id: 1,
			message: MOCK_TOAST_MSG_2
		};

		service = new ToastService();

		service.addToast(MOCK_TOAST_MSG);
		service.addToast(MOCK_TOAST_MSG_2);

		expect(service['_toasts']).toEqual([mockToast, mockToast2]);
	});

	it(`should remove toasts automatically after delay`, async () => {
		const MOCK_TOAST_MSG_2 = 'Some other toast message';

		service = new ToastService();

		await service.addToast(MOCK_TOAST_MSG, 5);
		await service.addToast(MOCK_TOAST_MSG_2, 5);

		expect(service['_toasts']).toEqual([]);
	});

	it(`should remove toasts immediately using removeToast`, () => {
		service = new ToastService();

		service.addToast(MOCK_TOAST_MSG);
		service.removeToast(0);

		expect(service['_toasts']).toEqual([]);
	});
});
