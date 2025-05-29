module.exports = {
	name: "VWeb",
	version: "1.1",
	icon: {
		dark: "https://raw.githubusercontent.com/vandenberghinc/vweb/master/dev/media/icon/icon.light.0.25.webp",
		light: "https://raw.githubusercontent.com/vandenberghinc/vweb/master/dev/media/icon/icon.dark.0.25.webp",
		height: 20,
	},
	meta: {
		author: "VWeb",
		title: "VWeb - Documenation",
		description: "The VWeb documentation page - Easily build websites and REST API's with vweb.",
		image: "https://raw.githubusercontent.com/vandenberghinc/public-storage/master/vandenberghinc/icon/triangle.small.png",
		// favicon: "https://doxia.io/favicon.ico",
	},
	dark_theme: {
		// extends: "green",

		tint_fg: "#58B684",
		anchor_fg: "#53AC7D",
		token_type: "#58B684",
		method_get: "#58B684",
		note_bg: "#58B684",
	},
	light_theme: {
		tint_fg: "#58B684",
		anchor_fg: "#53AC7D",
		token_type: "#58B684",
		method_get: "#58B684",
		note_bg: "#58B684",
	},
	default_theme: "dark",
	chapter_order: {
		Backend: ["Server", "Database", "Endpoints", "Rate Limits", "Stream"],
	},
	title_order: {
		NO_CHAPTER: ["Server", "Endpoint", "View", "Users", "Database", "Request", "Response", "Exceptions"],
	},
	include: [
		`${__dirname}/../js/backend/`,
		`${__dirname}/../js/frontend/`,
		// `${__dirname}/../js/frontend/ui/code.js`,
	],
	exclude: [
		`${__dirname}/../js/backend/plugins/fonts`,	
		`${__dirname}/../js/frontend/modules/adyen.js`,
	],
	documents: [
		`${__dirname}/files/getting_started.md`,
		// {language: "JS", chapter: "Getting Started", title: "Installation", include: `${__dirname}/files/installation.md`}
	],
	output: `${__dirname}/index.html`,
}