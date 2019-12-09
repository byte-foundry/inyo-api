const {RESTDataSource} = require('apollo-datasource-rest');

class PhotoAPI extends RESTDataSource {
	constructor(...rest) {
		super(...rest);
		this.baseURL = 'https://api.unsplash.com';
	}

	willSendRequest(request) {
		request.headers.set(
			'Authorization',
			`Client-ID ${process.env.UNSPLASH_KEY}`,
		);
		request.headers.set('Accept-Version', 'v1');
	}

	searchPhotos({query, page}) {
		return this.get('/search/photos', {
			query,
			page,
			per_page: 30,
		});
	}

	getPhotoById({id}) {
		return this.get(`/photos/${id}`);
	}

	async downloadPhoto({id}) {
		const photo = await this.getPhotoById({id});

		return this.get(photo.links.download_location);
	}
}

module.exports = {PhotoAPI};
