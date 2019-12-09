const PhotoResolvers = {
	Query: {
		async unsplashPhotos(_parent, {keyword, page = 1}, {dataSources}) {
			const response = await dataSources.photo.searchPhotos({
				query: keyword || 'freelance',
				page,
			});

			return {
				results: response.results,
				nextPage: page >= response.total_pages ? null : page + 1,
			};
		},
	},
};

module.exports = {PhotoResolvers};
