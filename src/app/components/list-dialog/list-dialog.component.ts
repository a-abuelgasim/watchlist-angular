import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { LIST_NAME_EXISTS_ERR_MSG, ListService } from '../../services/list/list.service';
import { ToastService } from '../../services/toast/toast.service';
import { ERROR_MSG_PREFIX, RETRY_MSG } from '../../utils/constants';


export interface FormList {
  id?: number | null,
  name: string,
}


const ADD_LIST_ERR_MSG = `${ERROR_MSG_PREFIX}. ${RETRY_MSG}.`;


@Component({
  selector: 'app-list-dialog',
  templateUrl: './list-dialog.component.html',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule],
})
export class ListFormComponent  {
  error?: string;
  formGroup = new FormGroup({name: new FormControl('', [
    Validators.required,
    this.nameChangedValidator(),
  ])});
  list: FormList = {name: ''}
  submitting = false;
  submitted = false;


  // If editing list with existing name set input value to list name
  @Input()
  set formList(formList: FormList) {
    this.list = formList;
    this.resetForm();
  }
  @Input()
  set show(show: boolean) {
    if (!show) return;
    this.resetForm();
    this.dialog?.nativeElement.showModal();
    this.dialog?.nativeElement.focus();
  }


  @Output() hidden = new EventEmitter<boolean>();


  @ViewChild('listFormDialog') dialog!: ElementRef<HTMLDialogElement>;


  constructor(private ls: ListService, private ts: ToastService) {}


  get dialogElement() { return this.dialog.nativeElement }
  get name() { return this.formGroup.get('name') }


  // Validate that name has been changed
  nameChangedValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null =>
      control.value === this.list?.name ? {unchanged: true} : null;
  }


  resetForm() {
    this.error = '';
    this.name?.setValue(this.list.name || '');
    this.submitted = false;
  }


  async submitHandler(): Promise<void> {
    if (!this.name) return;
    this.submitting = true;
    const name = this.name.value!;

    try {
      // If list has no ID, create new list
      if (!this.list.id && this.list.id !== 0) {
        await this.ls.addList(name);
      } else { // If list has ID, edit list
        await this.ls.updateList(this.list.id, {name});
      }
      this.submitted = true;
      this.dialogElement.close();
    } catch(err) {
      if (err === LIST_NAME_EXISTS_ERR_MSG) {
        this.error = err;
        return;
      }

      console.error(err);
			this.ts.addToast(ADD_LIST_ERR_MSG);
      this.dialogElement.close();
    } finally {
      this.submitting = false;
    }
  }
}
