/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Meta module.
vweb.meta = {};
	
// Set title.
vweb.meta.set = function({
	author = null,
	title = null,
	description = null,
	image = null,
	favicon = null,
}) {
	const set_content_query = (query, content) => {
		const e = document.querySelector(query);
		if (e) {
			e.content = content;
			return true;
		}
		return false;
	}
	const set_content_og = (property, content) => {
		// search for both "name=" and "property=".
		let exists = set_content_query(`meta[property='${property}']`, content);
		if (!exists) {
			exists = set_content_query(`meta[name='${property}']`, content);
			if (!exists) {
				// @todo when neither exists than create a property.
			}
		}
	}
	if (author != null) {
		set_content_og("author", author);
	}
	if (title != null) {
		document.title = title;
		set_content_og("og:title", title);
		set_content_og("twitter:title", title);
	}
	if (description != null) {
		set_content_og("description", description);
		set_content_og("og:description", description);
		set_content_og("twitter:description", description);
	}
	if (image != null) {
		set_content_og("og:image", image);
		set_content_og("twitter:image", description);
	}
}