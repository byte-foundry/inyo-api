const fs = require('fs');

const isProd = process.env.NODE_ENV === 'production';
const bucket = isProd ? 'inyo' : 'inyo-dev';

const storeUpload = async ({stream, prefix, filename}) => {
	const path = `${prefix}/${filename}`;

	return new Promise((resolve, reject) => {
		const localPath = `../files/${bucket}/${path}`;

		fs.mkdir(localPath, {recursive: true}, (err) => {
			if (err) reject(err);

			fs.writeFile(localPath, stream, (err2) => {
				if (err2) reject(err2);

				resolve({
					Location: `https://somewhere.over.the.rainbow/${path}`,
					ETag: 'whatever',
					Bucket: bucket,
					Key: path,
				});
			});
		});
	});
};

const processUpload = async (upload, ctx, prefix) => {
	const {
		stream, filename, mimetype, encoding,
	} = await upload;
	const {
		Location, ETag, Bucket, Key,
	} = await storeUpload({
		stream,
		prefix,
		filename,
	});

	return ctx.db.createFile({
		filename,
		mimetype,
		encoding,
		url: Location,
	});
};

module.exports = {
	processUpload,
};
