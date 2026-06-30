// =============================================
// Collecting Photo Data
// script.js
// Part 1
// Camera + GPS + Compass
// =============================================

// =============================================
// Google Apps Script URL
// =============================================

const SCRIPT_URL =
"https://script.google.com/macros/s/AKfycbysG_7ZN01u9zqKhC8EvvrFEyKX14ROTV49pzKdyfLceAaKZpPRpu26PHKsS5XdsVfi/exec";


// =============================================
// HTML Elements
// =============================================

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");

const latitude = document.getElementById("lat");
const longitude = document.getElementById("lon");

const headingText = document.getElementById("heading");
const directionText = document.getElementById("direction");

const headingValue =
document.getElementById("headingValue");

const arrow =
document.getElementById("compassArrow");

const captureButton =
document.getElementById("capture");

const enableCompassButton =
document.getElementById("enableCompass");


// =============================================
// Camera
// =============================================

async function startCamera() {

    if (!window.isSecureContext) {

        alert("Please open using HTTPS.");

        return;

    }

    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia) {

        alert("Camera API is unavailable.");

        return;

    }

    try {

        const stream =
        await navigator.mediaDevices.getUserMedia({

            video: {

                facingMode: {

                    ideal: "environment"

                },

                width: {

                    ideal: 512

                },

                height: {

                    ideal: 512

                }

            },

            audio: false

        });

        video.srcObject = stream;

        await video.play();

        console.log("Camera Started");

    }

    catch (err) {

        console.error(err);

        alert("Cannot access camera.");

    }

}

startCamera();


// =============================================
// GPS
// =============================================

function updateLocation(position) {

    latitude.textContent =
    position.coords.latitude.toFixed(6);

    longitude.textContent =
    position.coords.longitude.toFixed(6);

}

function locationError(error) {

    console.error(error);

}

if (navigator.geolocation) {

    navigator.geolocation.watchPosition(

        updateLocation,

        locationError,

        {

            enableHighAccuracy: true,

            timeout: 5000,

            maximumAge: 1000

        }

    );

}


// =============================================
// Convert Heading -> Direction
// =============================================

function getDirection(angle) {

    if (angle >= 337.5 || angle < 22.5)
        return "N";

    if (angle < 67.5)
        return "NE";

    if (angle < 112.5)
        return "E";

    if (angle < 157.5)
        return "SE";

    if (angle < 202.5)
        return "S";

    if (angle < 247.5)
        return "SW";

    if (angle < 292.5)
        return "W";

    return "NW";

}


// =============================================
// Update Compass UI
// =============================================

function updateCompass(heading) {

    headingText.textContent =
    heading.toFixed(1) + "°";

    directionText.textContent =
    getDirection(heading);

    if (headingValue) {

        headingValue.textContent =
        heading.toFixed(0) + "°";

    }

    if (arrow) {

        arrow.style.transform =
        `translateX(-50%) rotate(${heading}deg)`;

    }

}


// =============================================
// Android Compass
// =============================================

function handleAndroidCompass(event) {

    if (event.alpha == null)
        return;

    const heading =
    (360 - event.alpha + 360) % 360;

    updateCompass(heading);

}

if ("ondeviceorientationabsolute" in window) {

    window.addEventListener(

        "deviceorientationabsolute",

        handleAndroidCompass,

        true

    );

}
else {

    window.addEventListener(

        "deviceorientation",

        handleAndroidCompass,

        true

    );

}


// =============================================
// iPhone Compass
// =============================================

async function enableCompassIOS() {

    if (

        typeof DeviceOrientationEvent !== "undefined"

        &&

        typeof DeviceOrientationEvent
            .requestPermission === "function"

    ) {

        try {

            const permission =
            await DeviceOrientationEvent
                .requestPermission();

            if (permission === "granted") {

                window.addEventListener(

                    "deviceorientation",

                    handleIOSCompass,

                    true

                );

            }

            else {

                alert("Compass permission denied.");

            }

        }

        catch (err) {

            console.error(err);

        }

    }

}

function handleIOSCompass(event) {

    if (event.webkitCompassHeading == null)
        return;

    updateCompass(

        event.webkitCompassHeading

    );

}


// =============================================
// Enable Compass Button
// =============================================

if (enableCompassButton) {

    enableCompassButton.addEventListener(

        "click",

        enableCompassIOS

    );

}

// =============================================
// Part 2
// Capture Photo
// =============================================

// =============================================
// Part 2
// Capture Photo
// =============================================

captureButton.addEventListener(

    "click",

    async function () {

        captureButton.disabled = true;

        captureButton.style.opacity = "0.7";

        captureButton.innerHTML = `

            <span class="material-symbols-outlined">

                photo_camera

            </span>

            Capturing...

        `;

        try {

            // =============================================
            // Resize Image
            // =============================================

            canvas.width = 512;
            canvas.height = 512;

            const ctx = canvas.getContext("2d");

            ctx.drawImage(

                video,

                0,

                0,

                512,

                512

            );

            // =============================================
            // Convert to Base64 JPEG
            // =============================================

            const imageBase64 = canvas
                .toDataURL("image/jpeg", 0.9)
                .split(",")[1];

            // =============================================
            // Upload
            // =============================================

            await uploadToDrive(imageBase64);

        }

        catch (err) {

            console.error(err);

            captureButton.innerHTML = `

                <span class="material-symbols-outlined">

                    error

                </span>

                Capture Failed

            `;

        }

        finally {

            setTimeout(() => {

                captureButton.disabled = false;

                captureButton.style.opacity = "1";

                captureButton.innerHTML = `

                    <span class="material-symbols-outlined">

                        photo_camera

                    </span>

                    Capture Photo

                `;

            }, 2000);

        }

    }

);


// =============================================
// Part 3
// Upload to Google Drive
// =============================================

async function uploadToDrive(imageBase64){

    // =============================
    // Check Internet
    // =============================

    if(!navigator.onLine){

        throw new Error("No Internet Connection");

    }

    // =============================
    // Prepare Payload
    // =============================

    const payload = {

        image: imageBase64,

        latitude: latitude.textContent,

        longitude: longitude.textContent,

        heading: headingText.textContent,

        direction: directionText.textContent,

        timestamp: new Date().toISOString()

    };

    // =============================
    // Uploading UI
    // =============================

    captureButton.innerHTML = `

        <span class="material-symbols-outlined">

            cloud_upload

        </span>

        Uploading...

    `;

    try{

        // =============================
        // Send POST Request
        // =============================

        const response = await fetch(

            SCRIPT_URL,

            {

                method: "POST",

                headers:{

                    "Content-Type":"application/json"

                },

                body: JSON.stringify(payload)

            }

        );

        // =============================
        // Read Response
        // =============================

        const text = await response.text();

        console.log("Server Response:");
        
        console.log(text);
        
        if(!response.ok){
        
            throw new Error(
                "HTTP " + response.status
            );
        
        }
        
        let result;
        
        try{
        
            result = JSON.parse(text);
        
        }
        catch{
        
            throw new Error(text);
        
        }

        // =============================
        // Upload Success
        // =============================

        if(result.success){

            captureButton.innerHTML = `

                <span class="material-symbols-outlined">

                    check_circle

                </span>

                Uploaded

            `;

            console.log("Saved:",result.filename);

        }

        else{

            throw new Error(result.error);

        }

    }

    catch(err){

        console.error(err);

        alert(err.message);

        captureButton.innerHTML = `

            <span class="material-symbols-outlined">

                error

            </span>

            Upload Failed

        `;

    }

    // =============================
    // Restore Button
    // =============================

    setTimeout(()=>{

        captureButton.disabled = false;

        captureButton.style.opacity = "1";

        captureButton.innerHTML = `

            <span class="material-symbols-outlined">

                photo_camera

            </span>

            Capture Photo

        `;

    },2000);

}
