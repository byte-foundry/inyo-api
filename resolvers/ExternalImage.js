const ExternalImage = {
	__resolveType(obj, context, info) {
		if (obj.urls) {
			return 'UnsplashPhoto';
		}
		return 'File';
	},
};

module.exports = {
	ExternalImage,
};
