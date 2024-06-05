import {
    BaseHandler,
    BaseAbbreviatedEventHandler,
    BaseDefaultEventHandler,
    BaseDocumentReadyHandler,
    BaseFormEventHandler,
    BaseDLTEventHandler,
    BaseGETEventHandler,
    BaseAbbreviatedDLTEventHandler,
    BasePATCHEventHandler,
    BaseAbbreviatedPATCHEventHandler,
    BasePOSTEventHandler,
    BaseAbbreviatedPOSTEventHandler,
    BaseAbbreviatedGETEventHandler,
} from './BaseHandlers.js';


export class DocumentReadyContentLoader extends BaseDocumentReadyHandler {
    eventHandler() {
        var jsonContext = this.parseJsonContext();
        var projectId = jsonContext.project.id;
        if (!projectId) {
            $.ajax({
                url: '/api/v1/projects/',
                type: 'GET',
                dataType: 'JSON',
                success: (data) => {
                    const modalId = data.count > 0 ? '#modal-project-list' : '#modal-create-project';
                    $(modalId).modal({
                        backdrop: 'static',
                        keyboard: false,
                        show: true
                    });
                },
                error: (data) => {
                    console.error(data);
                }
            });
        }
        else {
            $.ajax({
                url: `/api/v1/projects/${projectId}/`,
                type: 'GET',
                dataType: 'JSON',
                success: (data) => {
                    var abbreviatedProjectLoader = new AbbreviatedProjectLoader(jsonContext.project.id);
                    abbreviatedProjectLoader.eventHandler(data);
                },
                error: (data) => {
                    console.error(data);
                }
            });
        }
    }
}

export class SyncScrollableEventHandler extends BaseDefaultEventHandler {
    constructor() {
        var selector = '.js-sync-scrollable'
        super(selector, 'scroll');
        this.scrollElements = $(selector);
        this.scrollElements.off(this.e);
    }

    eventHandler(event) {
        $(this.scrollElements).not(event.target).each(function() {
            $(this).scrollTop($(event.target).scrollTop()).scrollLeft($(event.target).scrollLeft());
        });
    }
}

export class ModalBackgroundEventHandler extends BaseDefaultEventHandler {
    constructor(eventType) {
        super('.js-modal-blur', eventType);
    }

    static addBlurHandler() {
        return new ModalBackgroundEventHandler('show.bs.modal');
    }

    static removeBlurHandler() {
        return new ModalBackgroundEventHandler('hide.bs.modal');
    }


    eventHandler = function(event) {
    const action = event.type === 'show.bs.modal' ? 'addClass' : 'removeClass';
    $('.js-main-container')[action]('blur-background');
};
}

export class CreateProjectModalShowUpHandler extends BaseDefaultEventHandler {
    constructor() {
        super('#js-modal-btn-create-project', 'click');
    }

    eventHandler() {
        $('#modal-create-project').modal('hide');
        $('#modal-create-project').modal({
            backdrop: true,
            keyboard: true
        });
    }
}

export class ProjectListModalShowUpHandler extends BaseDefaultEventHandler {
    constructor() {
        super('#js-modal-btn-project-list', 'click');
    }

    eventHandler() {
        $('#modal-project-list').modal('hide');
        $('#modal-project-list').modal({
            backdrop: true,
            keyboard: true
        });
    }
}

export class AddTaskModalShowUpEventHandler extends BaseDefaultEventHandler {
    constructor() {
        super('.js-add-task', 'click');
    }

    // Event handler method
    eventHandler(_event) {
        $('#modal-create-task').modal();
    }
}

export class AddMilestoneShowUpEventHandler extends BaseDefaultEventHandler {
    constructor() {
        super('.js-add-milestone', 'click');
    }

    eventHandler(_event) {
        $('#modal-create-milestone').modal();
    }
}

export class CreateProjectEventHandler extends BaseFormEventHandler {
    constructor() {
        var selector = '.js-form-project';
        let endpoint = `/api/v1/projects/`;
        super(selector, endpoint);
    }

    eventHandler(res, event) {
        const abbreviatedProjectLoader = new AbbreviatedProjectLoader(res.id);
        abbreviatedProjectLoader.eventHandler(res);
        $('#modal-create-project').modal('hide');
    }
}

export class AddTaskEventHandler extends BaseFormEventHandler {
    constructor() {
        var selector = '.js-form-task';
        super(selector);
    }

    getEndpoint(event) {
        const jsonContext = this.parseJsonContext();
        const projectId = jsonContext.project.id;
        const endpoint = `/api/v1/projects/${projectId}/tasks/`;
        return endpoint;
    }

    getColor() {
        const randomColorValue = () => Math.floor(127 + Math.random() * 128).toString(16).padStart(2, '0');
        return `#${randomColorValue()}${randomColorValue()}${randomColorValue()}`;
    }
    getContextData(event) {
        var context = super.getContextData(event);
        context.append('color', this.getColor());
        return context;
    }

    serializeData(context) {
        var formData = context;
        let isEmpty = true;
        for (let _pair of formData.entries()) {
            isEmpty = false;
            break;
        }
        if (isEmpty) {
            throw new Error('FormData is empty.');
        }

        if (formData.get('type') == 'milestone') {
            formData.append('end_datetime', formData.get('start_datetime'));
        }

        return formData;
    }

    eventHandler(data) {
        var gridLayoutTaskLoader = new GridLayoutTaskLoader();
        var editableEventHandler = new EditableEventHandler();
        var dropdownEditableEventHandler = new DropdownEditableEventHandler();
        var assigneesEventHandler = new TaskAssigneesEventHandler();
        var datetimeEventHandler = new TaskDatetimeEventHandler();
        var removeTaskEventHandler = new RemoveTaskEventHandler();
        gridLayoutTaskLoader.eventHandler().then(() => {
            removeTaskEventHandler.setupEventHandler();
            editableEventHandler.setupEventHandler();
            dropdownEditableEventHandler.setupEventHandler();
            assigneesEventHandler.setupEventHandler();
            datetimeEventHandler.setupEventHandler();
            const draggableGridEventHandler = new DraggableGridEventHandler('.js-snap-draggable', $('.task-row__item').outerWidth());
        });
        $('#modal-create-task').modal('hide');
    }
}

export class AddMemberEventHandler extends BaseFormEventHandler {
    constructor() {
        var selector = '.js-form-member';
        super(selector);
    }

    getEndpoint(event) {
        const jsonContext = this.parseJsonContext();
        const projectId = jsonContext.project.id;
        return `/api/v1/projects/${projectId}/members/`;
    }

    eventHandler(data) {
        var abbreviatedNewMemberLoader = new AbbreviatedNewMemberLoader(data);
        abbreviatedNewMemberLoader.eventHandler();
    }
}

export class AbbreviatedContextDataUpdater extends BaseAbbreviatedPOSTEventHandler {
    constructor() {
        super();
    }

    serializeData(context) {
        return JSON.stringify(context);
    }

    __getArgs() {
        return {
            contentType: "application/json; charset=UTF-8",
            dataType: "JSON",
            processData: false,
        }
    }

    getEndpoint() {
        var endpoint = '/api/v1/context/';
        return endpoint;
    }

    success(res) {
        console.log('Context response', new Date().getTime(), res);
        this.setJsonContext(res);
    }
}
/// TODO Add RemoveTaskEventHandler
export class RemoveMemberEventHandler extends BaseDLTEventHandler {
    constructor(element) {
        super('', 'click');
        this.element = element;
    }

    _getElement() {
        return; 
    }
    assignEvent(event) {
        return event;
    }

    getEndpoint(event) {
        var target = event.target.closest('.js-member');
        var memeberId = $(target).attr('data-member-id');
        let jsonContext = this.parseJsonContext();
        var projectId = jsonContext.project.id;
        var endpoint = `/api/v1/projects/${projectId}/members/${memeberId}/`;
        return endpoint;
    }

    
    eventHandler() {
        var membersLoader = new MembersLoader();
        membersLoader.eventHandler();
    }

}

export class RemoveTaskEventHandler extends BaseDLTEventHandler {
    constructor() {
        let selector = '.js-task-col-remove';
        super(selector, 'click');
    }

    getEndpoint(event) {
        var taskId = $(event.target).attr('data-task-id');
        let jsonContext = this.parseJsonContext();
        var projectId = jsonContext.project.id;
        var endpoint = `/api/v1/projects/${projectId}/tasks/${taskId}/`;
        return endpoint;
    }

    eventHandler() {
        var gridLayoutTaskLoader = new GridLayoutTaskLoader();
        var editableEventHandler = new EditableEventHandler();
        var dropdownEditableEventHandler = new DropdownEditableEventHandler();
        var assigneesEventHandler = new TaskAssigneesEventHandler();
        var datetimeEventHandler = new TaskDatetimeEventHandler();
        var removeTaskEventHandler = new RemoveTaskEventHandler();
        gridLayoutTaskLoader.eventHandler().then(() => {
            removeTaskEventHandler.setupEventHandler();
            editableEventHandler.setupEventHandler();
            dropdownEditableEventHandler.setupEventHandler();
            assigneesEventHandler.setupEventHandler();
            datetimeEventHandler.setupEventHandler();
            const draggableGridEventHandler = new DraggableGridEventHandler('.js-snap-draggable', $('.task-row__item').outerWidth());
        });
    }

}

export class DocumentClickHandler {
    constructor() {
        this.documentClickHandlerOn = false;
        this.currentEditingElement = null;
    }

    setupDocumentClickEventHandler(callback) {
        if (!this.documentClickHandlerOn) {
            this.documentClickHandlerOn = true;
            $(document).on('click', event => {
                if (this.currentEditingElement && !$.contains(this.currentEditingElement[0], event.target)) {
                    callback(this.currentEditingElement);
                    this.currentEditingElement = null;
                }
            });
        }
    }

    setCurrentEditingElement(element) {
        this.currentEditingElement = element;
    }

    getCurrentEditingElement() {
        return this.currentEditingElement;
    }
}
export class EditablePATCHEventHandler extends BaseAbbreviatedPATCHEventHandler {
    constructor(endpoint = undefined) {
        super(endpoint);
        this.dataFieldName = 'data-field';
    }

    eventHandler(element) {
        element.attr('contenteditable', 'false').removeClass('editing');
        this.endpoint = this.getEndpoint(element);
        const data = this.serializeData(element);
        var args = this._getArgs(data);
        this.request(args).then((res) => this.success(res, element));
    }

    getEndpoint(element) {
        const jsonContext = this.parseJsonContext();
        const projectId = jsonContext.project.id;
        let endpoint;
        const entity = $(element).attr('data-entity');
        if (entity === 'project') {
            endpoint = `api/v1/projects/${projectId}/`;
        } else if (entity === 'task') {
            const taskId = $(element).attr('data-entity-id');
            endpoint = `api/v1/projects/${projectId}/tasks/${taskId}/`;
        } else {
            throw new Error('Unexpected entity name');
        }
        return endpoint;
    }

    serializeData(element) {
        const data = {};
        const formData = new FormData();
        data[$(element).attr(this.dataFieldName)] = $(element).text();
        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                formData.append(key, data[key]);
            }
        }
        for (let pair of formData.entries()) {
            console.log(pair);
        }
        return formData;
    }
    
    success(data, element) {
        if ($(element).attr('data-entity') === 'project') {
            var abbreviatedProjectNameLoader = new AbbreviatedProjectNameLoader();
            abbreviatedProjectNameLoader.eventHandler(data);
        }
        else {
            var gridLayoutTaskLoader = new GridLayoutTaskLoader();
            var editableEventHandler = new EditableEventHandler();
            var dropdownEditableEventHandler = new DropdownEditableEventHandler();
            var assigneesEventHandler = new TaskAssigneesEventHandler();
            var datetimeEventHandler = new TaskDatetimeEventHandler();
            var removeTaskEventHandler = new RemoveTaskEventHandler();
            gridLayoutTaskLoader.eventHandler().then(() => {
                removeTaskEventHandler.setupEventHandler();
                editableEventHandler.setupEventHandler();
                dropdownEditableEventHandler.setupEventHandler();
                assigneesEventHandler.setupEventHandler();
                datetimeEventHandler.setupEventHandler();
                const draggableGridEventHandler = new DraggableGridEventHandler('.js-snap-draggable', $('.task-row__item').outerWidth());
            });
        }
    }
}


export class EditableEventHandler extends BaseAbbreviatedEventHandler {
    constructor() {
        super();
        this.dataFieldName = 'data-field';
        this.documentClickHandler = new DocumentClickHandler();
        this.editablePATCHEventHandler = new EditablePATCHEventHandler();
    }

    setupEventHandler() {
        this.documentClickHandler.setupDocumentClickEventHandler(element => {
            this.editablePATCHEventHandler.eventHandler(element);
        });

        const editableElement = $('.js-editable');
        $(editableElement).off('click');
        $(editableElement).on('click', event => {
            const target = event.target;
            event.stopPropagation();

            if (this.documentClickHandler.getCurrentEditingElement() && 
                this.documentClickHandler.getCurrentEditingElement()[0] !== target) {
                this.editablePATCHEventHandler.saveAndDisableEditing(this.documentClickHandler.getCurrentEditingElement());
            }

            $(target).attr('contenteditable', 'true').addClass('editing');
            this.documentClickHandler.setCurrentEditingElement($(target));

            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(target);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        });
    }
}


class AbbreviatedNewTaskLoader extends BaseAbbreviatedEventHandler {
    constructor(data, task, dateObject) {
        super();
        this.task = task;
        this.dateObject = dateObject;
        this.data = data;
        this.chartLayoutContainer = $('.gantt-chart-container');
        this.gridLayoutContainer = $('.js-grid-layout-container');
        this.gridTableContainer = $('.js-grid-layout-table-container');

        if (!this.task || !this.dateObject || !data) {
            throw new Error('Invalid input: Task, DateObject, or Data is undefined');
        }

        if (!this.chartLayoutContainer.length || !this.gridLayoutContainer.length || !this.gridTableContainer.length) {
            throw new Error('Required DOM elements are unavailable');
        }

        const jsonContext = this.parseJsonContext();
        this.statuses = jsonContext.content.task_statuses || {};
    }


    calculateItemPosition(startDate, endDate, itemWidth) {
        const startOffset = this.calculateOffset(startDate);
        const endOffset = this.calculateOffset(endDate);

        const totalDays = endOffset - startOffset + 1;
        const width = totalDays * itemWidth;
        const leftPosition = startOffset * itemWidth;

        return [width, leftPosition];
    }

    calculateOffset(date) {
        let offset = 0;
        for (const monthObj of this.dateObject) {
            if (monthObj.month === (date.getMonth() + 1) && monthObj.year === date.getFullYear()) {
                offset += date.getDate() - 1;
                break;
            }
            offset += monthObj.days;
        }
        return offset;
    }

    renderTaskRow() {
        this.renderTableTaskRow();
        this.renderChartTaskRow();
    }

    eventHandler() {
        this.renderTaskRow();
        this.renderTask();
    }

    createElement(tag, classNames = [], attributes = {}, textContent = '') {
        const element = $(`<${tag}>`);
        if (classNames.length) element.addClass(classNames.join(' '));
        Object.keys(attributes).forEach(attr => element.attr(attr, attributes[attr]));
        if (textContent) element.text(textContent);
        return element;
    }

    renderTableTaskRow() {
        const task = this.task;
        const tableRow = this.createElement('div', ['chart-table__task-row', 'task-row'], { 'data-task-id': task.id });
        const tableRemoveCol = this.createElement('div', ['col-md-1', 'js-task-col-remove'], { 'data-task-id': task.id, 'data-entity': 'task' });
        const tableTaskCol = this.createElement('div', ['table-row__item', 'col-md-3', 'js-task-col-name', 'js-editable'], { 'data-entity-id': task.id, 'data-field': 'name', 'data-entity': 'task' }, undefined);
        const tableAssigneeCol = this.createElement('div', ['table-row__item', 'col-md-3', 'js-task-col-assignee']);
        const tableStatusCol = this.createElement('div', ['table-row__item', 'col', 'js-task-col-status', 'js-dropdown-field']);
        const tableStartDateCol = this.createElement('div', ['table-row__item', 'col', 'js-task-col-start-datetime']);
        const tableEndDateCol = this.createElement('div', ['table-row__item', 'col', 'js-task-col-end-datetime']);

        this.renderRemoveColumn(tableRemoveCol, task);
        this.renderNameColumn(tableTaskCol, task);
        this.renderAssigneeColumn(tableAssigneeCol, task);
        this.renderStatusColumn(tableStatusCol, task);
        this.renderStartDatetimeColumn(tableStartDateCol, task);
        if (task.type === 'task') {
            this.renderEndDatetimeColumn(tableEndDateCol, task);
        } else if (task.type === 'milestone') {
        }

        tableRow.append(tableRemoveCol, tableTaskCol, tableAssigneeCol, tableStatusCol, tableStartDateCol, tableEndDateCol);
        this.gridTableContainer.append(tableRow);
    }

    renderRemoveColumn(column, task) {
        const tableRemoveIcon = this.createElement('i', ['fa', 'fa-times']);
        column.append(tableRemoveIcon);
    }

    renderNameColumn(column, task) {
        const tableName = this.createElement('div', ['task-row__text-container'], {}, task.name);
        column.append(tableName);
    }
    renderAssigneeColumn(column, task) {
        const tableAssigneeDropdownContainer = this.createElement('div', ['dropdown']);
        const tableAssigneeContainer = this.createElement('div', ['table-assignees-container'], { 'data-toggle': 'dropdown' });
        const assigneeDropdown = this.createElement('div', ['dropdown-menu', 'js-editable-dropdown', 'dropdown-menu-assignee']);
        const tableAssigneeHeader = this.createElement('dt', [], [], 'Участники проекта');
        const tableHr = this.createElement('hr');
        const confirmButton = this.createElement('input', ['btn', 'btn-primary', 'btn-sm'], {type: 'submit', value: 'Выбрать'});

        const assigneePills = [];
        task.assignees.forEach(item => {
            assigneePills.push(this.createElement('span', ['badge', 'badge-secondary', 'badge-pill'], {}, `${item.first_name} ${item.last_name}`));
        });

        const createAssigneePills = (assignees) => {
            return new Promise((resolve, reject) => {
                try {
                    const res = assignees.map(item => {
                        return this.createElement('span', ['badge', 'badge-secondary', 'badge-pill'], {}, `${item.first_name} ${item.last_name}`);
                    });
                    resolve(res);
                } catch (error) {
                    reject(error);
                }
            });
        };

        const teamMembersElements = this.data.members.map(item => {
            const formGroup = this.createElement('div', ['form-group']);
            const input = this.createElement('input', [], { 'type': 'checkbox', 'name': 'id', 'value': item.person.id, 'id': `task-member-${task.id}-${item.person.id}`,}).prop('checked', this.task.assignees.some(assignee => assignee.id === item.person.id));
            const label = this.createElement('label', [], { 'for': `task-member-${task.id}-${item.person.id}` }, `${item.person.first_name} ${item.person.last_name}`);
            formGroup.append(input, label);
            return formGroup;
        });

        const assigneeFormWrapper = this.createElement('div', ['assignee-form-container']);
        const assigneesForm = this.createElement('form', ['js-assignee-form', 'assignee-form', 'd-flex', 'flex-column'], {'data-task-id': task.id});
        assigneeFormWrapper.append(teamMembersElements);
        assigneesForm.append(assigneeFormWrapper, confirmButton);
        assigneeDropdown.append(tableAssigneeHeader, tableHr, assigneesForm);
        createAssigneePills(task.assignees).then(assigneePills => {
            tableAssigneeContainer.append(...assigneePills);
            if (task.assignees.length === 0) {
                tableAssigneeContainer.text('Не назначен');
            }
        }).catch(error => {
            console.error('Ошибка при создании Assignee Pills:', error);
        });
        tableAssigneeDropdownContainer.append(tableAssigneeContainer, assigneeDropdown);
        column.append(tableAssigneeDropdownContainer);
    }

    renderStatusColumn(column, task) {
        const statusDropdownMenu = this.createElement('div', ['dropdown-menu', 'js-editable-dropdown', 'dropdown-menu-task-status']);
        const tableBadgeStatus = this.createElement('div', ['badge', 'p-1', 'js-task-badge', this.statuses[task.status]?.['class']], { 'data-toggle': 'dropdown', 'data-task-id': task.id }, task.status);

        const statusOptions = [
            { status: 'in progress', className: 'badge-warning' },
            { status: 'open', className: 'badge-primary' },
            { status: 'closed', className: 'badge-dark' },
            { status: 'done', className: 'badge-success' }
        ];

        statusOptions.forEach(option => {
            const statusItem = this.createElement('span', ['badge', option.className, 'js-dropdown-field-item'], {
                'data-field': 'status',
                'data-entity': 'task',
                'data-value': option.status,
                'data-entity-id': task.id
            }, option.status);
            statusDropdownMenu.append(statusItem);
        });

        const dropdown = this.createElement('div', ['dropdown']).append(tableBadgeStatus, statusDropdownMenu);
        column.append(dropdown);
    }

    formatDateToInputValue(date) {
        const pad = (num) => String(num).padStart(2, '0');
    
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1); // Months are zero-based
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
    
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    renderStartDatetimeColumn(column, task) {
        const tableDropdownContainer = this.createElement('div', ['dropdown']);
        const value = this.formatDateToInputValue(new Date(task.start_datetime));
        const tableStartDatetime = this.createElement('div', [],  {'data-toggle': 'dropdown' }, value.split('T')[0]);
        const datetimeDropdown = this.createElement('div', ['dropdown-menu', 'js-editable-dropdown', 'dropdown-menu-datetime']);

        const datetimeForm = this.createElement('form', ['js-datetime-form', 'd-flex'], { 'data-task-id': task.id});
        const datetimeInputDatetime = this.createElement('input', ['form-control'], {'type':'datetime-local', 'value': value, 'name': 'start_datetime'});
        const confirmButton = this.createElement('input', ['btn', 'btn-primary', 'btn-sm'], {type: 'submit', value: 'Выбрать'});

        datetimeForm.append(datetimeInputDatetime, confirmButton);
        datetimeDropdown.append(datetimeForm);
        tableDropdownContainer.append(tableStartDatetime, datetimeDropdown);
        column.append(tableDropdownContainer);
    }

    renderEndDatetimeColumn(column, task) {
        const tableDropdownContainer = this.createElement('div', ['dropdown']);
        const value = this.formatDateToInputValue(new Date(task.end_datetime));
        const tableEndDatetime = this.createElement('div', [], { 'data-toggle': 'dropdown' }, value.split('T')[0]);

        const datetimeDropdown = this.createElement('div', ['dropdown-menu', 'dropdown-menu-datetime']);

        const datetimeForm = this.createElement('form', ['js-datetime-form', 'd-flex'], { 'data-task-id': task.id});
        const datetimeInputDatetime = this.createElement('input', ['form-control'], {'type':'datetime-local', 'value': value, 'name':'end_datetime'});
        const confirmButton = this.createElement('input', ['btn', 'btn-primary', 'btn-sm'], {type: 'submit', value: 'Выбрать'});

        datetimeForm.append(datetimeInputDatetime, confirmButton);
        datetimeDropdown.append(datetimeForm);
        tableDropdownContainer.append(tableEndDatetime, datetimeDropdown);
        column.append(tableDropdownContainer);
    }

    renderChartTaskRow() {
        const taskRowContainer = this.createElement('div', ['row', 'gantt-chart__task-row', 'task-row'], { 'data-task-id': this.task.id });

        this.dateObject.forEach(monthObj => {
            const taskColumn = this.createElement('div', ['col', 'task-row__month-col']);
            const taskRow = this.createElement('div', ['row', 'h-100']);
            for (let i = 1; i <= monthObj.days; i++) {
                taskRow.append(this.createElement('div', ['task-row__item', 'col']));
            }
            taskColumn.append(taskRow);
            taskRowContainer.append(taskColumn);
        });

        this.gridLayoutContainer.append(taskRowContainer);
    }

    renderTask() {
        const tableItemWidth = $('.task-row__item').outerWidth();
        const [width, leftPosition] = this.calculateItemPosition(new Date(this.task.start_datetime), new Date(this.task.end_datetime), tableItemWidth);
        const taskElement = this.createElement('div', ['badge', 'js-snap-draggable'], {
            'data-field-start-datetime': new Date(this.task.start_datetime).toISOString(),
            'data-field-end-datetime': new Date(this.task.end_datetime).toISOString(),
            'data-task-id': this.task.id,
        }, this.task.name);
        if (this.task.type === 'milestone') {
            this.renderMilestoneTask(taskElement, width, leftPosition);
        } else if (this.task.type === 'task') {
            this.renderRegularTask(taskElement, width, leftPosition, this.task.color);
        }
        $(`.gantt-chart__task-row[data-task-id="${this.task.id}"]`).append(taskElement);
    }

    renderMilestoneTask(element, width, leftPosition) {
        width = 30;
        element.addClass('rounded').css({
            position: 'absolute',
            left: `${leftPosition}px`,
            width: `${width}px`,
            height: `${width}px`,
            backgroundColor: '#D33DAF',
            boxSizing: 'border-box',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        }).text(this.task.name);
    }

    renderRegularTask(element, width, leftPosition, color) {
        element.addClass('rounded').css({
            position: 'absolute',
            marginTop: '5px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            left: `${leftPosition}px`,
            width: `${width}px`,
            backgroundColor: color
        });
    }
}


export class TaskAssigneesEventHandler extends BasePATCHEventHandler {
    constructor() {
        var selector = '.js-assignee-form';
        super(selector, 'submit');
    }

    getEndpoint(event) {
        const jsonContext = this.parseJsonContext();
        const projectId = jsonContext.project.id;
        const taskId = $(event.target).attr('data-task-id');
        const endpoint = `/api/v1/projects/${projectId}/tasks/${taskId}/`;
        return endpoint;
    }

    getContextData(event) {
        const target = event.target;
        const formData = new FormData(target);
        return formData;
    }

    serializeData(context) {
        let data = { assignees: [] };
        let assignees = [];
        for (let pair of context.entries()) {
            assignees.push(Number(pair[1]));
        }
        data.assignees = assignees;
        return JSON.stringify(data);

    }

    eventHandler(res, event) {
        var target = event.target.closest('.dropdown-menu');
        $(target).dropdown('toggle');
        var gridLayoutTaskLoader = new GridLayoutTaskLoader();
        var editableEventHandler = new EditableEventHandler();
        var dropdownEditableEventHandler = new DropdownEditableEventHandler();
        var assigneesEventHandler = new TaskAssigneesEventHandler();
        var datetimeEventHandler = new TaskDatetimeEventHandler();
        var removeTaskEventHandler = new RemoveTaskEventHandler();
        gridLayoutTaskLoader.eventHandler().then(() => {
            removeTaskEventHandler.setupEventHandler();
            editableEventHandler.setupEventHandler();
            dropdownEditableEventHandler.setupEventHandler();
            assigneesEventHandler.setupEventHandler();
            datetimeEventHandler.setupEventHandler();
            const draggableGridEventHandler = new DraggableGridEventHandler('.js-snap-draggable', $('.task-row__item').outerWidth());
        });
    }
}


export class TaskDatetimeEventHandler extends BasePATCHEventHandler {
    constructor() {
        var selector = '.js-datetime-form';
        super(selector, 'submit');
    }

    getEndpoint(event) {
        const jsonContext = this.parseJsonContext();
        const projectId = jsonContext.project.id;
        const taskId = $(event.target).attr('data-task-id');
        const endpoint = `/api/v1/projects/${projectId}/tasks/${taskId}/`;
        return endpoint;
    }

    getContextData(event) {
        const target = event.target;
        const formData = new FormData(target);
        return formData;
    }

    serializeData(context) {
        let data = {};
        for (let pair of context.entries()) {
            data[pair[0]]= new Date(pair[1]);
        }
        return JSON.stringify(data);
    }

    eventHandler(res, event) {
        var target = event.target.closest('.dropdown-menu');
        $(target).dropdown('toggle');
        var gridLayoutTaskLoader = new GridLayoutTaskLoader();
        var editableEventHandler = new EditableEventHandler();
        var dropdownEditableEventHandler = new DropdownEditableEventHandler();
        var assigneesEventHandler = new TaskAssigneesEventHandler();
        var datetimeEventHandler = new TaskDatetimeEventHandler();
        var removeTaskEventHandler = new RemoveTaskEventHandler();
        gridLayoutTaskLoader.eventHandler().then(() => {
            removeTaskEventHandler.setupEventHandler();
            editableEventHandler.setupEventHandler();
            dropdownEditableEventHandler.setupEventHandler();
            assigneesEventHandler.setupEventHandler();
            datetimeEventHandler.setupEventHandler();
            const draggableGridEventHandler = new DraggableGridEventHandler('.js-snap-draggable', $('.task-row__item').outerWidth());
        });
    }
}


export class AbbreviatedNewMemberLoader extends BaseAbbreviatedEventHandler {
    constructor(member) {
        super();
        this.member = member;
        this.membersList = $('.js-members-list');
    }

    eventHandler() {
        var member = this.member;
        var listGroupItem = $('<li>').addClass('list-group-item js-member').attr('data-member-id', member.person.id);
        var listItemRow = $('<div>').addClass('row');
        var memberFullName = $('<div>').addClass('col members-list__item js-member-full-name').text(`${member.person.first_name} ${member.person.last_name}`);
        var memberRole = $('<div>').addClass('col members-list__item js-mebmer-full-name').text(`${member.role}`)
        var memberEmail = $('<div>').addClass('col members-list__item js-member-email').text(`${member.person.email}`);
        var memberRemove = $('<div>').addClass('col-md-1 text-center members-list__item member-remove-item js-remove-member');
        var removeIcon = $('<i>').addClass('fas fa-trash');
        var removeMemberEventHandler = new RemoveMemberEventHandler(memberRemove);
        removeMemberEventHandler.setupEventHandler();
        memberRemove.append(removeIcon);
        listItemRow.append([memberFullName, memberRole, memberEmail, memberRemove]);
        
        listGroupItem.append(listItemRow);
        $(this.membersList).append(listGroupItem);
    }
}

export class AbbreviatedProjectNameLoader extends BaseAbbreviatedEventHandler {
    constructor() {
        super();
        this.element = $('.js-project-name');
        if (this.element.length === 0) {
            throw new Error('Element is unavailable.');
        }
    }

    eventHandler(data) {
        if (!data?.name) {
            throw new Error('Project name is undefined.');
        }
        this.element.text(data.name);
    }
}

export class AbbreviatedProjectStatusLoader extends BaseAbbreviatedEventHandler {
    constructor() {
        super();
        var jsonContext = this.parseJsonContext();
        this.statuses = jsonContext.content.statuses;
        this.element = $('.js-project-status');
        if (this.element.length === 0) {
            throw new Error('Element is unavailable.');
        }
    }

    eventHandler(data, target) {
        if (!data?.status) {
            throw new Error('Project status is undefined.');
        }

        if (!target) {
            this.updateStatusElement(data.status);
        }
    }

    updateStatusElement(status) {
        this.element.removeClass(Object.values(this.statuses).map(s => s.class).join(' '));
        const newStatus = this.statuses[status];
        if (newStatus) {
            this.element.addClass(newStatus.class).text(newStatus.text);
        } else {
            throw new Error(`Status "${status}" not found.`);
        }
    }
}

export class AbbreviatedProjectRoleLoader extends BaseAbbreviatedEventHandler {
    constructor() {
        super();
        this.element = $('.js-project-role');
        var jsonContext = this.parseJsonContext();
        this.roles = jsonContext.content.roles;
        this.userId = jsonContext.user.id;
        if (this.element.length === 0) {
            throw new Error('Element is unavailable.');
        }
    }

    eventHandler(data) {
        if (!data?.members) {
            throw new Error('Project members are undefined.');
        }

        const member = data.members.find(member => member.person.id === this.userId);
        if (!member) {
            throw new Error('Member was not found.');
        }

        this.element.text(this.roles[member.role].text);
    }
}

//! AJAX Request spotted
class GridLayoutTaskLoader extends BaseAbbreviatedEventHandler {
    constructor() {
        super();
        this.noTasks = false;
        var jsonContext = this.parseJsonContext();
        this.months = jsonContext.content.months;
        this.chartLayoutContainer = $('.gantt-chart-container');
        this.gridLayoutContainer = $('.js-grid-layout-container');
        this.gridTableContainer = $('.js-grid-layout-table-container');
        this.gridLayoutMonthsElement = $('.js-grid-layout-months');
        this.gridLayoutDaysElement = $('.js-grid-layout-days');

        if (!this.gridLayoutMonthsElement.length || !this.gridLayoutDaysElement.length) {
            throw new Error('Elements are unavailable.');
        }
    }

    emptyAll() {
        this.gridLayoutMonthsElement.empty();
        this.gridLayoutDaysElement.empty();
        this.gridLayoutContainer.empty();
        this.gridTableContainer.empty();
    }

    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    getMonthYearArray(startDate, endDate) {
        let result = [];
        let start = new Date(startDate);
        let end = new Date(endDate);

        // Корректируем даты, чтобы начальная дата была раньше или равна конечной
        if (start > end) {
            [start, end] = [end, start];
        }

        // Проходим по всем месяцам между начальной и конечной датой включительно
        while (start.getFullYear() < end.getFullYear() || (start.getFullYear() === end.getFullYear() && start.getMonth() <= end.getMonth())) {
            result.push([start.getMonth() + 1, start.getFullYear()]); // Добавляем месяц и год в массив
            start.setMonth(start.getMonth() + 1); // Переходим к следующему месяцу
        }

        return result;
    }
    

    getDateObjects(gridMonths) {
        return gridMonths.map(([month, year]) => ({
            month,
            year,
            days: this.getDaysInMonth(year, month - 1)
        }));
    }

    setCalendarGrid(dateObject) {
        for (let monthObj of dateObject) {
            let monthHeader = $('<div>').addClass('header-container__item col').text(`${this.months[monthObj.month-1]} ${monthObj.year}`);
            $(this.gridLayoutMonthsElement).append(monthHeader);
            let daysHeader = $('<div>').addClass('header-container__item col');
            let daysRow = $('<div>').addClass('row');
            for (let i=1; i <= monthObj.days; i++) {
                let daysItem = $('<div>').addClass('header-container__item col').text(i);
                $(daysRow).append(daysItem);
                $(daysHeader).append(daysRow);
            }
            $(this.gridLayoutDaysElement).append(daysHeader);
        }
    }

    calculateItemPosition(dateObject, startDate, endDate, itemWidth) {
        const startMonthIndex = dateObject.findIndex(obj => obj.month === startDate.getMonth() + 1 && obj.year === startDate.getFullYear());
        const endMonthIndex = dateObject.findIndex(obj => obj.month === endDate.getMonth() + 1 && obj.year === endDate.getFullYear());

        const startOffset = this.calculateDateOffset(dateObject, startMonthIndex, startDate.getDate() - 1);
        const endOffset = this.calculateDateOffset(dateObject, endMonthIndex, endDate.getDate() - 1);

        const totalDays = endOffset - startOffset + 1;
        const width = totalDays * itemWidth;
        const leftPosition = startOffset * itemWidth;

        return [width, leftPosition];
    }

    calculateDateOffset(dateObject, monthIndex, dayOffset) {
        return dateObject.slice(0, monthIndex).reduce((sum, obj) => sum + obj.days, 0) + dayOffset;
    }

    setProjectBorders(tasks, dateObject) {
        if (!this.noTasks) {
            const tableItemWidth = $('.task-row__item').outerWidth();
            let key = 'start_datetime';
            const firstTaskDatetime = new Date(tasks.reduce((min, obj) => {
                return obj[key] < min[key] ? obj : min;
              }, tasks[0])[key]);
            key = 'end_datetime';
            const lastTaskDatetime = new Date(tasks.reduce((max, obj) => {
                return obj[key] > max[key] ? obj : max;
              }, tasks[0])[key]);
            const [width, leftPosition] = this.calculateItemPosition(dateObject, firstTaskDatetime, lastTaskDatetime, tableItemWidth);

            const projectPeriodElement = $('<div>').css({
                position: 'absolute',
                left: `${leftPosition}px`,
                width: `${width}px`,
                border: 'solid 2px rgba(33,37,41,1)',
                borderRadius: '5px',
                height: '20px',
                boxSizing: 'border-box'
            });

            $(this.gridLayoutDaysElement).append(projectPeriodElement);
        }
    }

    setGridLayout(data, tasks, dateObject) {
        this.emptyAll();
        this.chartLayoutContainer.css({ width: `${dateObject.length * 30 * 30}px` });
        this.setCalendarGrid(dateObject);

        tasks.forEach((task) => {
            const abbreviatedNewTaskLoader = new AbbreviatedNewTaskLoader(data, task, dateObject);
            abbreviatedNewTaskLoader.eventHandler();
        });

        this.setProjectBorders(tasks, dateObject);
    }

    eventHandler() {
        const jsonContext = this.parseJsonContext();
        const projectId = jsonContext.project.id;
        console.log('Layout loader', new Date().getTime(), projectId);

        if (!projectId) {
            throw new Error("Context data doesn't contain project id");
        }

        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'GET',
                url: `/api/v1/projects/${projectId}/`,
                dataType: 'JSON',
                success: (data) => {
                    try {
                        this.success(data);
                        resolve(data);
                    } catch (error) {
                        reject(error);
                    }
                },
                error: (error) => {
                    console.error(error);
                    reject(error);
                }
            });
        });
    }

    success(data) {
        if (!data.hasOwnProperty('tasks')) {
            throw new Error('Server response doesn\'t contain tasks field.');
        }

        const tasks = data.tasks;
        if (!tasks.length) {
            this.noTasks = true;
        }

        let firstTaskDatetime, lastTaskDatetime;
        if (!this.noTasks) {
            firstTaskDatetime = new Date(tasks[0].start_datetime);
            lastTaskDatetime = new Date(tasks[tasks.length - 1].end_datetime);
        } else {
            firstTaskDatetime = new Date(data.start_date);
            lastTaskDatetime = new Date(firstTaskDatetime.getFullYear(), firstTaskDatetime.getMonth() + 2, firstTaskDatetime.getDate());
        }

        const gridMonths = this.getMonthYearArray(firstTaskDatetime, lastTaskDatetime);
        const dateObject = this.getDateObjects(gridMonths);
        this.setGridLayout(data, tasks, dateObject);
    }
}

class DropdownEditableEventHandler extends BaseAbbreviatedEventHandler {
    constructor() {
        super();
        this.dataFieldName = 'data-field';
        this.dataValueName = 'data-value';
        this.documentClickHandlerOn = false;
        this.currentEditingElement = undefined;
        this.endpoint = undefined;
    }

    setupDocumentClickEventHandler() {
        if (!this.documentClickHandlerOn) {
            this.documentClickHandlerOn = true;
            $(document).on('click', event => {
                if (this.currentEditingElement && !$.contains(this.currentEditingElement[0], event.target)) {
                    this.hideDropdown();
                }
            });
        }
    }

    hideDropdown() {
        $('.js-editable-dropdown').removeClass('show');
        this.currentEditingElement = null;
    }

    serializeData(element) {
        const data = {};
        data[$(element).attr(this.dataFieldName)] = $(element).attr(this.dataValueName);
        return Object.entries(data);
    }

    setupEventHandler() {
        this.setupDocumentClickEventHandler();
        const dropdownItem = $('.js-dropdown-field-item');
        $(dropdownItem).off('click');
        this.setupDocumentClickEventHandler();
        $(dropdownItem).on('click', event => {
            const target = event.target;
            event.stopPropagation();
            this.currentEditingElement = $(target);
            this.saveAndDisableEditing(this.currentEditingElement);
        });
    }

    saveAndDisableEditing(element) {
        var data = this.serializeData(element);
        this.endpoint = this.getEndpoint(element);
        this.sendPatchRequest(data, element);
    }

    getEndpoint(element) {
        const jsonContext = this.parseJsonContext();
        const projectId = jsonContext.project.id;
        let endpoint;
        const entity = $(element).attr('data-entity');
        if (entity === 'project') {
            endpoint = `api/v1/projects/${projectId}/`;
        } else if (entity === 'task') {
            const taskId = $(element).attr('data-entity-id');
            endpoint = `api/v1/projects/${projectId}/tasks/${taskId}/`;
        } else {
            throw new Error('Unexpected entity name');
        }
        return endpoint;
    }

    sendPatchRequest(data, element) {
        if (this.endpoint === undefined) {
            throw new Error('Endpoint must be defined');
        }
        const csrftoken = this.getCSRFToken();
        $.ajax({
            type: 'PATCH',
            url: this.endpoint,
            method: 'PATCH',
            contentType: 'application/json',
            beforeSend: xhr => {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            },
            data: JSON.stringify(Object.fromEntries(data)),
            success: data => this.success(data, element),
            error: data => console.error(data)
        });
    }

    success(data, element) {
        if ($(element).attr('data-entity') === 'project') {
            var projectStatusLoader = new AbbreviatedProjectStatusLoader();
            projectStatusLoader.eventHandler(data);
        }
        else if($(element).attr('data-entity') === 'task') {
            var jsonContext = this.parseJsonContext();
            var task_statuses = jsonContext.content.task_statuses;
            var targetTask = $(`.js-task-badge[data-task-id=${data.id}]`);
            if (!targetTask) {
                throw new Error('No task with specified id found');
            }
            targetTask.text(data.status).removeClass(Object.values(task_statuses).map(s => s.class).join(' '));
            targetTask.addClass(task_statuses[data.status]['class']);
        }
        this.hideDropdown();
    }

    getCSRFToken() {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, 10) === 'csrftoken=') {
                    cookieValue = decodeURIComponent(cookie.substring(10));
                    break;
                }
            }
        }
        return cookieValue;
    }
}

export class MembersLoader extends BaseAbbreviatedGETEventHandler {
    constructor() {
        super();
        this.membersContainer = $('.js-members-list');
    }

    getEndpoint() {
        let jsonContext = this.parseJsonContext();
        var projectId = jsonContext.project.id;
        return `/api/v1/projects/${projectId}/members/`
    }
    success(data) {
        $(this.membersContainer).empty();
        data.forEach(member => {
            var addNewMemberEventHandler = new AbbreviatedNewMemberLoader(member);
            addNewMemberEventHandler.eventHandler(member);
        });
    }
}


export class AbbreviatedProjectLoader extends BaseAbbreviatedEventHandler {
    constructor(projectId) {
        super();
        this.projectId = projectId;
        this.projectNameLoader = new AbbreviatedProjectNameLoader();
        this.projectStatusLoader = new AbbreviatedProjectStatusLoader();
        this.projectRoleLoader = new AbbreviatedProjectRoleLoader();
        this.gridLayoutLoader = new GridLayoutTaskLoader();
        //members tab
        this.membersLoader = new MembersLoader();
        this.editableEventHandler = new EditableEventHandler();
        this.dropdownEditableEventHandler = new DropdownEditableEventHandler();
        this.assigneesEventHandler = new TaskAssigneesEventHandler();
        this.datetimeEventHandler = new TaskDatetimeEventHandler();
        this.removeTaskEventHandler = new RemoveTaskEventHandler();
    }

    async saveProjectState(projectId) {
        const updates = {
            'project': {
                'id': projectId
            }
        }
        const abbreviatedContextDataUpdater = new AbbreviatedContextDataUpdater();
        await abbreviatedContextDataUpdater.eventHandler(updates);
    }

    // Event handler method
    eventHandler(data) {
        this.saveProjectState(data.id).then(() => {
            this.projectNameLoader.eventHandler(data);
            this.projectStatusLoader.eventHandler(data);
            this.projectRoleLoader.eventHandler(data);
            this.membersLoader.eventHandler();
            this.gridLayoutLoader.eventHandler().then(() => {
                this.syncScrollableEventHandler = new SyncScrollableEventHandler();
                this.syncScrollableEventHandler.setupEventHandler();
                this.removeTaskEventHandler.setupEventHandler();
                this.editableEventHandler.setupEventHandler();
                this.dropdownEditableEventHandler.setupEventHandler();
                this.assigneesEventHandler.setupEventHandler();
                this.datetimeEventHandler.setupEventHandler();
                const draggableGridEventHandler = new DraggableGridEventHandler('.js-snap-draggable', $('.task-row__item').outerWidth());
            });
        });
    }
}

export class ProjectListElementHandler extends BaseGETEventHandler {
    constructor(element) {
        super('.js-project-list-item', 'click');
        this.element = element;
    }

    _getElement() {
        return;
    }
    assignEvent(event) {
        return event;
    }
    getEndpoint(event) {
        var target = event.target.closest(this.selector);
        const projectId = $(target).attr('data-project-id');
        return `/api/v1/projects/${projectId}/`;
    }

    eventHandler(res, event) {
        const abbreviatedProjectLoader = new AbbreviatedProjectLoader(res.id);
        abbreviatedProjectLoader.eventHandler(res);
        $('#modal-project-list').modal('hide');
    }
}

//! AJAX Request spotted
export class ProjectListLoader extends BaseGETEventHandler {
    constructor() {
        let e = 'shown.bs.modal';
        const selector = '#modal-project-list';
        const endpoint = '/api/v1/projects/';
        super(selector, e, endpoint);
        this.projectListElement = $('.js-project-list');
        this.isEmpty = false;

        if (!this.projectListElement.length) {
            throw new Error('Project list element is unavailable.');
        }
    }

    eventHandler(res, event) {
        $(this.projectListElement).empty();
        res.results.forEach(project => {
            const listItem = $('<li>').addClass('list-group-item project-list__item js-project-list-item').attr('data-project-id', project.id);
            const projectNameSpan = $('<span>').text(project.name);
            const projectStartDateSpan = $('<span>').addClass('badge badge-primary').text(project.start_date);
            $(listItem).append([projectNameSpan, projectStartDateSpan]);
            const handler = new ProjectListElementHandler(listItem);
            handler.setupEventHandler();
            $(this.projectListElement).append(listItem);
        });
    }
}


export class DraggableGridEventHandler extends BaseHandler {
    constructor(selector, gridX = 30) {
        super(selector, 'dragmove');
        this.gridX = gridX;
        this.initDraggable();
    }

    initDraggable() {
        this.elements = document.querySelectorAll(this.selector);
        this.elements.forEach(element => {
            let x = 0;

            // Align initial position to the grid
            const initialTransform = element.style.transform;
            const initialMatch = initialTransform.match(/translate\(([^px]*)px, ([^px]*)px\)/);
            if (initialMatch) {
                x = parseFloat(initialMatch[1]);
                x = Math.round(x / this.gridX) * this.gridX; // Align to grid
                element.style.transform += `translate(${x}px, 0px)`;
            } else {
                element.style.transform = `translate(0px, 0px)`;
            }

            interact(element)
                .draggable({
                    modifiers: [
                        interact.modifiers.snap({
                            targets: [
                                interact.createSnapGrid({ x: this.gridX, y: 1 }) // Привязка только по горизонтали
                            ],
                            range: Infinity,
                            relativePoints: [{ x: 0, y: 0 }]
                        }),
                        interact.modifiers.restrict({
                            restriction: element.parentNode,
                            elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
                            endOnly: true
                        })
                    ],
                    inertia: true
                })
                .on('dragstart', (event) => {
                    const transform = event.target.style.transform;
                    const match = transform.match(/translate\(([^px]*)px, ([^px]*)px\)/);
                    if (match) {
                        x = parseFloat(match[1]);
                    } else {
                        x = 0;
                    }
                })
                .on('dragmove', (event) => {
                    x += event.dx;

                    const snappedXRel = Math.round(x / this.gridX);
                    const snappedXAbs = snappedXRel * this.gridX;


                    event.target.style.transform = `translate(${snappedXAbs}px, 0px)`;
                })
                .on('dragend', (event) => {
                    const transform = event.target.style.transform;
                    const match = transform.match(/translate\(([^px]*)px, ([^px]*)px\)/);
                    let finalX = 0;
                    if (match) {
                        finalX = parseFloat(match[1]);
                    }
                    const snappedXRel = Math.round(finalX / this.gridX);
                    var targetStartDatetime = new Date($(event.target).attr('data-field-start-datetime'));
                    var targetEndDatetime = new Date($(event.target).attr('data-field-end-datetime'));
                    var taskId = $(event.target).attr('data-task-id');
                    var projectId = this.parseJsonContext().project.id;
                    
                    var data = {'start_datetime': new Date(targetStartDatetime.getFullYear(),
                                                            targetStartDatetime.getMonth(),
                                                            targetStartDatetime.getDate()+snappedXRel,
                                                            targetStartDatetime.getHours(),
                                                            targetStartDatetime.getMinutes()),
                                'end_datetime': new Date(targetEndDatetime.getFullYear(),
                                                            targetEndDatetime.getMonth(),
                                                            targetEndDatetime.getDate()+snappedXRel,
                                                            targetEndDatetime.getHours(),
                                                            targetEndDatetime.getMinutes())}
                    var csrftoken = this.getCSRFToken();
                    $.ajax({
                        url: `api/v1/projects/${projectId}/tasks/${taskId}/`,
                        type: 'PATCH',
                        contentType: 'application/json',
                        data: JSON.stringify(data),
                        beforeSend: (xhr) => {
                            xhr.setRequestHeader("X-CSRFToken", csrftoken);
                        },
                        success: (res) => {
                            var gridLayoutTaskLoader = new GridLayoutTaskLoader();
                            var editableEventHandler = new EditableEventHandler();
                            var dropdownEditableEventHandler = new DropdownEditableEventHandler();
                            var assigneesEventHandler = new TaskAssigneesEventHandler();
                            var datetimeEventHandler = new TaskDatetimeEventHandler();
                            var removeTaskEventHandler = new RemoveTaskEventHandler();
                            gridLayoutTaskLoader.eventHandler().then(() => {
                                removeTaskEventHandler.setupEventHandler();
                                editableEventHandler.setupEventHandler();
                                dropdownEditableEventHandler.setupEventHandler();
                                assigneesEventHandler.setupEventHandler();
                                datetimeEventHandler.setupEventHandler();
                                const draggableGridEventHandler = new DraggableGridEventHandler('.js-snap-draggable', $('.task-row__item').outerWidth());
                            });
                        },
                        error: (_xhr, textStatus, errorThrown) => {
                            if (textStatus === "timeout") {
                                console.error("Request timed out.");
                            } else {
                                console.error("Request failed: " + textStatus, errorThrown);
                            }
                        }
                    });
                });

        });
    }
    getCSRFToken() {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, 10) === 'csrftoken=') {
                    cookieValue = decodeURIComponent(cookie.substring(10));
                    break;
                }
            }
        }
        return cookieValue;
    }

    eventHandler(event) {
        // This method could be extended for custom handling.
    }
}