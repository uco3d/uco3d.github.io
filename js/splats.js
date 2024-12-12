import { OrbitControls } from "./OrbitControls.js";
import * as SPLAT from "https://cdn.jsdelivr.net/npm/gsplat@latest";

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

async function listFolders() {
    const response = await fetch('list_ply_uco3d.xml');
    const xmlString = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const contentsElements = xmlDoc.getElementsByTagName('Key');
    const keys = [].slice.call(contentsElements).map(el => el.textContent);

    const folders = keys.map(key => {
        const parts = key.split("/");
        return parts[0] + "/" + parts[1];
    });

    return [...new Set(folders)];
}

export function createSplatView(splatParent) {
    const parentDiv = document.getElementById(splatParent);
    const canvas = parentDiv.querySelector("canvas");
    const progressDialog = parentDiv.querySelector("#progress-dialog");
    const progressIndicator = progressDialog.querySelector("#progress-indicator");
    const captionDiv = document.getElementById("scene-caption");
    const view = new Object();
    view.captionDiv = captionDiv;
    view.canvas = canvas;
    view.progressDialog = progressDialog;
    view.progressIndicator = progressIndicator;
    view.runningAnimation = null;
    view.loading = false;
    view.lastClick = new Date()
    return view;
}

export async function setSplatScene(name, caption, view) {
    view.loading = true;
    view.lastClick = new Date();

    const startRadius = 17.0;

    const cameraData = new SPLAT.CameraData();
    const camera = new SPLAT.Camera(cameraData);

    const renderer = new SPLAT.WebGLRenderer(view.canvas);
    const scene = new SPLAT.Scene();

    view.progressDialog.show();
    view.progressIndicator.value = 0.0;

    // set the caption
    const response = await fetch(caption);
    const caption_string = await response.text();
    view.captionDiv.textContent = '\"' + caption_string + '\"';

    await SPLAT.Loader.LoadAsync(name, scene, (progress) => (view.progressIndicator.value = progress * 100));

    if (scene.transform) {
        scene.transform.scale = new Float32Array([1, -1, 1]);
    }

    view.progressDialog.close();
    var controls = new OrbitControls(
        camera,
        view.canvas,
        Math.PI / 4,  // azimuth
        Math.PI / 4,  // elevation
        startRadius,
        false
    );

    controls.minAngle = 20
    controls.maxAngle = 90
    controls.minZoom = startRadius-3;
    controls.maxZoom = startRadius+3;

    controls.zoomSpeed = 0.5;
    controls.panSpeed = 0.4;
    controls.orbitSpeed = 1.75;
    controls.maxPanDistance = 0.05;

    const newAnimation = view.runningAnimation == null;

    if (newAnimation) {
        view.canvas.addEventListener("mousedown", function () {
            view.lastClick = new Date();
            view.interacting = true;
        });
        view.canvas.addEventListener("mouseup", function () {
            view.lastClick = new Date();
            view.interacting = false;
        });
    }

    // Render loop
    let previousTimestamp = undefined;
    let previousDeltaTime = undefined;
    view.runningAnimation = (timestamp) => {
        var deltaTime = 0.0;
        if (previousTimestamp !== undefined) {
            deltaTime = (timestamp - previousTimestamp) / 1000;
        }
        if (deltaTime > 0.1 && previousDeltaTime !== undefined) {
            deltaTime = previousDeltaTime;
        }
        previousTimestamp = timestamp;
        previousDeltaTime = deltaTime;

        if (!view.interacting) {
            const timeToSpin = 0.5;
            const accelTime = 4.0;
            const maxSpinSpeed = 0.2;

            const timeSinceClick = view.lastClick == undefined ? undefined : (new Date() - view.lastClick) / 1000.0;
            if (timeSinceClick > timeToSpin || timeSinceClick === undefined) {
                const speed = timeSinceClick === undefined ? maxSpinSpeed : Math.min(Math.max(timeSinceClick / accelTime - timeToSpin, 0.0), 1.0) * maxSpinSpeed;
                controls.rotateCameraAngle(speed * deltaTime, 0.0);
            }
        }

        controls.update();

        renderer.render(scene, camera);
        requestAnimationFrame(view.runningAnimation);
    };

    if (newAnimation) {
        requestAnimationFrame(view.runningAnimation);
    }

    view.loading = false;
}

export async function setupCarousel(view, carousel) {
    let files = await listFolders();

    shuffleArray(files);

    const prototype = carousel.querySelector("#splat-carousel-prototype");
    const elements = Object.fromEntries(
        files.map(f => [f, prototype.firstElementChild.cloneNode(true)])
    );

    async function onClickSplatThumb(splatName) {
        if (view.loading) {
            return;
        }
        const elem = elements[splatName];
        if (elem.classList.contains("active")) {
            return;
        }

        const itemsParent = carousel.getElementsByClassName("splat-carousel-items")[0];
        const items = [...itemsParent.getElementsByClassName('splat-carousel-item')];
        currentIndex = items.indexOf(elem);

        elem.classList.add("loading");

        await setSplatScene(splatName + "/splat.splat", splatName + "/caption.caption", view)

        Object.values(elements).forEach(e => {
            e.classList.remove("active");
        });
        elem.classList.remove("loading");
        elem.classList.add("active");
    }

    for (var i = 0; i < files.length; ++i) {
        const file = files[i];

        function setup(file) {
            const card = elements[file];
            var startScroll = undefined;

            card.addEventListener("mousedown", function() { startScroll = itemsParent.scrollLeft; });
            card.addEventListener("mouseup", function() {
                console.log(Math.abs(itemsParent.scrollLeft - startScroll));
                if (Math.abs(itemsParent.scrollLeft - startScroll) < 10) {
                    onClickSplatThumb(file);
                }
            });

            const img = card.querySelector("img");
            img.src = file + "/input.png";

            let isAnimating = false;
            let latestEvent = null;

            card.addEventListener('pointermove', (e) => {
                latestEvent = e;
                if (!isAnimating) {
                    isAnimating = true;
                    requestAnimationFrame(updateCardTransform);
                }
            });

            function updateCardTransform() {
                const e = latestEvent;
                if (e === null || e === undefined) {
                    isAnimating = false;
                    return;
                }
                const cardRect = card.getBoundingClientRect();
                const centerX = cardRect.left + cardRect.width / 2;
                const centerY = cardRect.top + cardRect.height / 2;

                const mouseX = e.clientX - centerX;
                const mouseY = e.clientY - centerY;

                const rotateY = (mouseX / cardRect.width) * 35;
                const rotateX = -(mouseY / cardRect.height) * 35;

                card.style.transform = `translateZ(15px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;

                isAnimating = false;
                if (latestEvent !== e) { // Check for new event
                    requestAnimationFrame(updateCardTransform);
                }
            }

            card.addEventListener('mouseleave', () => {
                latestEvent = null; // Clear event to stop animation
                card.style.transform = ''; // Reset on leave
            });
            prototype.parentNode.appendChild(card);
        }

        setup(file);
    }

    prototype.remove();

    const itemsParent = carousel.getElementsByClassName("splat-carousel-items")[0];
    const items = [...itemsParent.getElementsByClassName('splat-carousel-item')];
    let currentIndex = 0;

    function scrollToTarget() {
        items[currentIndex].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }

    carousel.querySelector('.splat-carousel-button.left').addEventListener('mousedown', () => {
        currentIndex = (currentIndex + items.length - 2) % items.length;
        scrollToTarget();
    });

    carousel.querySelector('.splat-carousel-button.right').addEventListener('mousedown', () => {
        currentIndex = (currentIndex + 2) % items.length;
        scrollToTarget();
    });

    let mouseDown = false;
    let startX, scrollLeft;

    const startDragging = (e) => {
        mouseDown = true;
        startX = e.pageX - itemsParent.offsetLeft;
        scrollLeft = itemsParent.scrollLeft;
    }

    const stopDragging = (e) => {
        e.preventDefault();
        mouseDown = false;
    }

    const move = (e) => {
        e.preventDefault();
        if (!mouseDown) { return; }
        const x = e.pageX - itemsParent.offsetLeft;
        const scroll = x - startX;
        itemsParent.scrollLeft = scrollLeft - scroll;
    }

    // Add the event listeners
    itemsParent.addEventListener('mousemove', move, false);
    itemsParent.addEventListener('mousedown', startDragging, false);
    itemsParent.addEventListener('mouseup', stopDragging, false);
    itemsParent.addEventListener('mouseleave', stopDragging, false);

    // Activate the first thumbnail.
    onClickSplatThumb(files[0]);
}
