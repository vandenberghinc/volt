/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Auth module.
vweb.events = {
	events: new Map(),
};

// Emit an event.
/*	@docs:
	@nav: Frontend
	@chapter: Events
	@title: Emit
	@desc: Emit a registered event.
	@param: 
		@name: id
		@description The id of the registered event to emit.
	@param: 
		@name: args
		@description The arguments that will be passed to the registered callbacks.
 */
vweb.events.emit = function(id, args = {}) {
	const callbacks = this.events.get(id);
	if (callbacks == null) {
		return ;
	}
	callbacks.iterate((i) => {
		i[1](i[0], args);
	})
}

// On event.
/*	@docs:
	@nav: Frontend
	@chapter: Events
	@title: On event
	@desc: Set a callback for an event.
	@param: 
		@name: id
		@description The id of the registered event to emit.
	@param: 
		@name: element
		@description The element.
	@param: 
		@name: callback
		@description The callback function, accepts parameters `(element, args)`.
 */
vweb.events.on = function(id, element, callback) {
	let callbacks = this.events.get(id);
	if (callbacks == null) {
		callbacks = [];
		this.events.set(id, callbacks)
	}
	callbacks.append([element, callback]);
}

// On event.
/*	@docs:
	@nav: Frontend
	@chapter: Events
	@title: Remove callback
	@desc: Remove a callback for an event.
	@param: 
		@name: id
		@description The id of the registered event to emit.
	@param: 
		@name: element
		@description The element.
	@param: 
		@name: callback
		@description The callback function to remove. When left undefined, all callbacks matching to that element will be removed.
 */
vweb.events.remove = function(id, element, callback) {
	const callbacks = this.events.get(id);
	if (callbacks == null) { return ; }
	const filtered = [];
	callbacks.iterate((i) => {
		if (i[0] === element && (callback == null || i[1] === callback)) {
			return null;
		}
		filtered.append(i);
	})
	this.events.set(id, filtered);
}
