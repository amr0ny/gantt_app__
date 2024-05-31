
export function mixin(BaseClass, ...Mixins) {
    class Mixed extends BaseClass {
        constructor(...args) {
            super(...args);
            Mixins.forEach(Mixin => {
                Object.assign(this, new Mixin(...args));
            });
        }
    }

    Mixins.forEach(Mixin => {
        Object.assign(Mixed.prototype, Mixin.prototype);
    });

    return Mixed;
}

export class BaseHandler {
    constructor(selector, e) {
        this.jsonContextElement = $('#context-data');
        this.selector = selector;
        this.e = e;
    }

    assignEvent(event) {
        event.target = event.target.closest(this.selector);
        return event;
    }

    parseJsonContext() {
        try {
            var jsonContext = JSON.parse(this.jsonContextElement.text());
            if (jsonContext.length === 0)
                throw new Error('Context is empty.');
            return jsonContext;
        } catch (err) {
            console.error(`App context is unavailable: ${err}`);
        }
    }

    setJsonContext(updates) {
        var scriptElement = $('#context-data');
        console.log(`UPDATES: ${updates}`)
        if (scriptElement.length === 0) {
            console.error('Element with id "context-data" not found.');
            return;
        }
        var contextData;
        try {
            contextData = JSON.parse(scriptElement.text());
        } catch (e) {
            console.error('Error parsing JSON content:', e);
            return;
        }
        $.extend(true, contextData, updates);
        var updatedJson = JSON.stringify(contextData);
        scriptElement.text(updatedJson);
    }

    _getElement() {
        this.element = $(this.selector);
    }

    setupEventHandler() {
        this._getElement();
        this._setupEventHandler();
    }

    // Abstract methods
    eventHandler(event) {
        throw new Error('Abstract method must be implemented.');
    }

    _setupEventHandler() {
        throw new Error('Abstract method must be implemented.');
    }
}


export class BaseDefaultEventHandler extends BaseHandler {
    constructor(selector, e) {
        super(selector, e);
    }

    _setupEventHandler() {
        var self = this;
        $(this.element).on(this.e, (event) => {
            event = self.assignEvent(event);
            self.eventHandler(event);
        });
    }

    // Abstract methods
    eventHandler(event) {
        throw new Error('Abstract method must be implemented.');
    }
}

export class BaseRequestEventHandler extends BaseHandler {
    constructor(selector, e, type, endpoint=undefined) {
        super(selector, e);
        this.type = type;
        this.endpoint = endpoint;
        
    }

    _setupEventHandler() {
        $(this.element).on(this.e, event => {
            event.preventDefault();
            event = this.assignEvent(event);
            const context = this.getContextData(event);
            const data = this.serializeData(context);
            const args = this.getArgs();
            this.endpoint = this.getEndpoint();
            this.request(data, args).then((res) => {
                this.eventHandler(res, event);
            }).catch((error) => {
                console.error("Request failed:", error);
            });
        });
    }

    async request(data, args={}) {
        const csrftoken = this.getCSRFToken();
        return new Promise((resolve, reject) => {
            $.ajax({
                type: this.type,
                url: this.endpoint,
                data: data,
                beforeSend: (xhr) => {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                },
                success: (res) => {
                    resolve(res);
                },
                error: (xhr, textStatus, errorThrown) => {
                    this.error(xhr, textStatus, errorThrown);
                    reject(new Error(textStatus));
                },
                ...args
            });
        });
    }

    getEndpoint() {
        if (this.endpoint === undefined)
            throw new Error('Endpoint must be defined');
        return this.endpoint;
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

    error(_xhr, textStatus, errorThrown) {
        if (textStatus === "timeout") {
            console.error("Request timed out.");
        } else {
            console.error("Request failed: " + textStatus, errorThrown);
        }
    }

    getArgs() {
        throw new Error('Abstract method must be implemented');
    }

    eventHandler(event) {
        throw new Error('Abstract method must be implemented');
    }

    getContextData(event) {
        throw new Error('Abstract method must be implemented');
    }

    serializeData(context) {
        throw new Error('Abstract method must be implemented');
    }
}

export class BaseGETEventHandler extends BaseHandler {
    
    constructor(selector, e) {
        super(selector, e);
    }

    _setupEventHandler() {
        var self = this;
        $(this.element).on(this.e, (event) => {
            event.preventDefault();
            event = self.assignEvent(event);
            self.eventHandler(event);
        });
    }

    // Abstract methods
    eventHandler(event) {
        throw new Error('Abstract method must be implemented.');
    }
}

export class BasePOSTEventHandler extends BaseRequestEventHandler {
    constructor(selector, e, endpoint = undefined) {
        super(selector, e, 'POST', endpoint);  // Вызываем конструктор базового класса с типом запроса 'POST'
    }

    serializeData(context) {
        const formData = new FormData();
        for (let key in context) {
            if (context.hasOwnProperty(key)) {
                formData.append(key, context[key]);
            }
        }
        let isEmpty = true;
        for (let _pair of formData.entries()) {
            isEmpty = false;
            break;
        }
        if (isEmpty) {
            throw new Error('FormData is empty.');
        }
        return formData;
    }

    getArgs() {
        return {
            contentType: false,  // Не указываем тип контента, чтобы позволить jQuery корректно обработать FormData
            processData: false,
            timeout: 5000,
        };
    }

    // Переопределяем абстрактные методы из BaseRequestEventHandler
    getContextData(event) {
        throw new Error('Abstract method must be implemented.');
    }

    eventHandler(res, event) {
        throw new Error('Abstract method must be implemented.');
    }
}


export class BaseDocumentEventHandler extends BaseHandler {
    constructor(e) {
        var selector = document;
        super(selector, e);
    }

    _setupEventHandler() {
        $(selector).on(this.e, event => {
            this.eventHandler(event);
        });
    }
}


export class BaseFormEventHandler extends BasePOSTEventHandler {
    constructor(selector, endpoint) {
        super(selector, 'submit', endpoint);
    }

    getContextData(event) {
        const target = event.target;
        const formData = new FormData(target);
        for (let pair of formData.entries()) {
            console.log(pair);
        }
        return formData;
    }

    serializeData(context) {
        var formData = context;
        let isEmpty = true;
        for (let pair of formData.entries()) {
            isEmpty = false;
            break;
        }
        if (isEmpty) {
            throw new Error('FormData is empty.');
        }
        return formData;
    }

    assignEvent(event) {
        return event;
    }

    eventHandler(res, event) {
        throw new Error('Abstract method must be implemented');
    }
}


export class BaseDocumentReadyHandler extends BaseDocumentEventHandler {
    constructor() {
        super('ready');
    }

    _setupEventHandler() {
        var self = this;
        $(this.element).ready((event) => {
            self.eventHandler();
        });
    }

    // Abstract method
    eventHandler() {
        throw new Error('Abstract method must be implemented.');
    }
}

export class BaseAbbreviatedEventHandler extends BaseHandler {
    constructor() {
        super('', '');
        this.selector = undefined;
        this.e = undefined;
    }

    setupEventHandler() {
        return undefined;
    }

    _setupEventHandler(event) {
        return undefined;
    }

    _getElement() {
        this.element = undefined;
    }
}

export class BaseAbbreviatedPOSTEventHandler extends mixin(BasePOSTEventHandler, BaseAbbreviatedEventHandler) {
    constructor(endpoint = undefined) {
        super('', '', endpoint);
    }

    serializeData(context) {
        if (context === undefined || context === '') {
            throw new Error('Context data is undefined');
        }
        return JSON.stringify(context);
    }

    eventHandler(context) {
        const data = this.serializeData(context);
        this.endpoint = this.getEndpoint();
        this.request(data, 'application/json; charset=UTF-8', false).then(res => this.success(res));
    }

    success(res) {
        throw new Error('Abstract method must be implemented.');
    }
}


