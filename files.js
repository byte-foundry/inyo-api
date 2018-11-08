const AWS = require('aws-sdk');

const isProd = process.env.NODE_ENV === 'production';
const bucket = isProd ? 'inyo-prod' : 'inyo-dev';
const s3 = new AWS.S3({params: {Bucket: bucket}});

const storeUpload = async ({stream, prefix, filename}) => {
	const path = `${prefix}/${filename}`;

	return s3.upload({Key: path, Body: stream}).promise();
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
