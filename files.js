const AWS = require('aws-sdk');

const {FileTooBigError} = './errors';

const isProd = process.env.NODE_ENV === 'production';
const bucket = isProd ? 'inyo-prod' : 'inyo-dev';
const s3 = new AWS.S3({params: {Bucket: bucket}});

const storeUpload = async ({
	stream, prefix, filename, maxFileSize,
}) => {
	const path = `${prefix}/${filename}`;

	const upload = s3.upload({
		ACL: 'public-read',
		Key: path,
		Body: stream,
	});

	let dataLength = 0;

	stream.on('data', (chunk) => {
		dataLength += chunk.length;

		if (dataLength > maxFileSize) {
			upload.abort();
		}
	});

	return upload.promise();
};

const processUpload = async (upload, ctx, prefix, maxFileSize = Infinity) => {
	const {
		createReadStream, filename, mimetype, encoding,
	} = await upload;

	const stream = createReadStream();

	if (!stream) {
		throw new Error(
			'File is not defined, did you forget to use Content-Type: multipart/form-data?',
		);
	}

	try {
		const {
			Location, ETag, Bucket, Key,
		} = await storeUpload({
			stream,
			prefix,
			filename,
			maxFileSize,
		});

		return ctx.db.createFile({
			filename,
			mimetype,
			encoding,
			url: Location,
		});
	}
	catch (err) {
		if (err.code === 'RequestAbortedError') {
			throw new FileTooBigError();
		}
		throw new Error('Something wrong occurred when uploading');
	}
};

module.exports = {
	storeUpload,
	processUpload,
};
