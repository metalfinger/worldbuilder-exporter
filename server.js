const http = require("http");
const fs = require("fs");
const path = require("path");

const port = 5500;
const mimeTypes = {
	".html": "text/html",
	".js": "text/javascript",
	".css": "text/css",
	".png": "image/png",
	".jpg": "image/jpeg",
	".webp": "image/webp",
	".tga": "image/x-tga",
	".fbx": "application/octet-stream",
	".mp3": "audio/mpeg",
	// Add more as needed
};

http
	.createServer((req, res) => {
		const filePath = path.join(
			__dirname,
			req.url === "/" ? "index.html" : req.url
		);
		const extname = String(path.extname(filePath)).toLowerCase();
		const contentType = mimeTypes[extname] || "application/octet-stream";

		fs.readFile(filePath, (error, content) => {
			if (error) {
				if (error.code == "ENOENT") {
					res.writeHead(404);
					res.end("File not found");
				} else {
					res.writeHead(500);
					res.end("Internal server error");
				}
			} else {
				res.writeHead(200, {
					"Content-Type": contentType,
					"Cross-Origin-Opener-Policy": "same-origin",
					"Cross-Origin-Embedder-Policy": "require-corp",
				});
				res.end(content);
			}
		});
	})
	.listen(port, () => {
		console.log(`Server running at http://localhost:${port}`);
	});
