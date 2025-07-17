import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { showModel } from "./modelManager.js";
import { getCharacterTextures } from "./modelManager.js";
import { createPbrMaterial } from "./materialManager.js";

let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let recordingModel = null;
let recordingMixer = null;
let characterTextures = null;

export function setupRecording(renderer, scene, textures) {
	characterTextures = textures; // Store the textures
	const startRecordBtn = document.getElementById("startRecordBtn");

	startRecordBtn.addEventListener("click", () => {
		if (isRecording) {
			stopRecording(scene);
		} else {
			startRecording(renderer, scene);
		}
	});
}

function startRecording(renderer, scene) {
	isRecording = true;
	document.getElementById("recordBtn").classList.add("recording");
	document.getElementById("recordBtn").title = "Stop Recording";
	showModel(false); // Hide the static painting model

	// Hide UI for better UX
	document.getElementById("toolbar").style.display = "none";
	document.getElementById("recording-indicator").style.display = "block";

	const videoStream = renderer.domElement.captureStream(60);
	const audio = document.getElementById("recording-audio");
	const audioStream = audio.captureStream
		? audio.captureStream()
		: audio.mozCaptureStream();
	const combinedStream = new MediaStream([
		...videoStream.getTracks(),
		...audioStream.getTracks(),
	]);

	// --- Choose supported video format ---
	const options = { mimeType: "video/webm; codecs=vp9,opus" };
	let fileExtension = "webm";

	if (MediaRecorder.isTypeSupported("video/mp4; codecs=h264,aac")) {
		options.mimeType = "video/mp4; codecs=h264,aac";
		fileExtension = "mp4";
		console.log("Recording in MP4 format.");
	} else {
		console.log("MP4 not supported, falling back to WebM.");
	}
	// ---

	mediaRecorder = new MediaRecorder(combinedStream, options);

	mediaRecorder.ondataavailable = (event) => {
		if (event.data.size > 0) recordedChunks.push(event.data);
	};
	mediaRecorder.onstop = () => {
		const blob = new Blob(recordedChunks, { type: options.mimeType });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.style.display = "none";
		a.href = url;
		a.download = `character-animation.${fileExtension}`;
		document.body.appendChild(a);
		a.click();
		window.URL.revokeObjectURL(url);
		document.body.removeChild(a);
		recordedChunks = [];
	};

	const loader = new FBXLoader();
	loader.load("assets/Record_Animation1.fbx", (fbx) => {
		recordingModel = fbx;
		recordingModel.scale.setScalar(0.01);
		recordingModel.position.set(0, 0, 0);

		// Apply the user's custom texture
		recordingModel.traverse((node) => {
			if (node.isMesh) {
				node.castShadow = true;
				node.receiveShadow = true;
				const oldMaterial = node.material;
				// Use the centralized material creator for 100% consistency
				node.material = createPbrMaterial(characterTextures, oldMaterial);
			}
		});

		scene.add(recordingModel);

		// Set up and play animation
		recordingMixer = new THREE.AnimationMixer(recordingModel);
		const action = recordingMixer.clipAction(fbx.animations[0]);
		// Loop the animation 3 times
		action.setLoop(THREE.LoopRepeat, 3).play();
		action.clampWhenFinished = true;
		recordingMixer.addEventListener("finished", () => stopRecording(scene));

		// Start recording
		audio.currentTime = 0;
		audio.play();
		mediaRecorder.start();
		console.log("Recording started.");
	});
}

function stopRecording(scene) {
	if (mediaRecorder && mediaRecorder.state === "recording") {
		mediaRecorder.stop();
	}
	document.getElementById("recording-audio").pause();

	if (recordingModel) {
		scene.remove(recordingModel);
		recordingModel = null;
		recordingMixer = null;
	}

	showModel(true); // Show the static model again
	isRecording = false;
	document.getElementById("recordBtn").classList.remove("recording");
	document.getElementById("recordBtn").title = "Record";
	console.log("Recording stopped.");

	// Show UI again
	document.getElementById("toolbar").style.display = "";
	document.getElementById("recording-indicator").style.display = "none";
}

// We need to export this to be called from the animation loop in main.js
export function getRecordingMixer() {
	return recordingMixer;
}
