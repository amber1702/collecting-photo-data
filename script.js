// ======================================
// Collecting Photo Data
// Part 1
// Camera + GPS + Compass
// ======================================

// ===============================
// Google Apps Script URL
// ===============================

const SCRIPT_URL =
"https://script.google.com/macros/s/AKfycbzB63wfVhXxiI7clm9vpTrglFhKdYIduNOLeC4B27sMHoJ8sg4f8j5VspdIgzhEhRr1/exec";


// ===============================
// HTML Elements
// ===============================

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


// ===============================
// Camera
// ===============================

async function startCamera(){

    if (!window.isSecureContext) {

        alert("Please open the app using HTTPS.");

        return;

    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {

        alert("Camera API is unavailable.");

        return;

    }

    try{

        const stream =
        await navigator.mediaDevices.getUserMedia({

            video:{
                facingMode:{
                    ideal:"environment"
                }
            },

            audio:false

        });

        video.srcObject = stream;

        await video.play();

        console.log("Camera Started");

    }

    catch(err){

        console.error(err);

        alert("Cannot access camera.");

    }

}

startCamera();


// ===============================
// GPS
// ===============================

function updateLocation(position){

    latitude.textContent =
    position.coords.latitude.toFixed(6);

    longitude.textContent =
    position.coords.longitude.toFixed(6);

}

function locationError(error){

    console.log(error);

}

if(navigator.geolocation){

    navigator.geolocation.watchPosition(

        updateLocation,

        locationError,

        {

            enableHighAccuracy:true,

            timeout:5000,

            maximumAge:1000

        }

    );

}


// ===============================
// Direction
// ===============================

function getDirection(angle){

    if(angle>=337.5 || angle<22.5)
        return "N";

    if(angle<67.5)
        return "NE";

    if(angle<112.5)
        return "E";

    if(angle<157.5)
        return "SE";

    if(angle<202.5)
        return "S";

    if(angle<247.5)
        return "SW";

    if(angle<292.5)
        return "W";

    return "NW";

}


// ===============================
// Update Compass UI
// ===============================

function updateCompass(heading){

    headingText.textContent =
    heading.toFixed(1) + "°";

    directionText.textContent =
    getDirection(heading);

    if(headingValue){

        headingValue.textContent =
        heading.toFixed(0) + "°";

    }

    if(arrow){

        arrow.style.transform =
        `translateX(-50%) rotate(${heading}deg)`;

    }

}


// ===============================
// Android Compass
// ===============================

function handleAndroidCompass(event){

    if(event.alpha==null)
        return;

    let heading = 360 - event.alpha;

    updateCompass(heading);

}

if("ondeviceorientationabsolute" in window){

    window.addEventListener(

        "deviceorientationabsolute",

        handleAndroidCompass,

        true

    );

}
else{

    window.addEventListener(

        "deviceorientation",

        handleAndroidCompass,

        true

    );

}


// ===============================
// iPhone Compass
// ===============================

async function enableCompassIOS(){

    if(

        typeof DeviceOrientationEvent !== "undefined"

        &&

        typeof DeviceOrientationEvent.requestPermission==="function"

    ){

        try{

            const permission =
            await DeviceOrientationEvent.requestPermission();

            if(permission==="granted"){

                window.addEventListener(

                    "deviceorientation",

                    handleIOSCompass,

                    true

                );

            }

        }

        catch(err){

            console.log(err);

        }

    }

}

function handleIOSCompass(event){

    if(event.webkitCompassHeading==null)
        return;

    const heading =
    event.webkitCompassHeading;

    updateCompass(heading);

}


// ===============================
// Enable Compass Button
// ===============================

if(enableCompassButton){

    enableCompassButton.addEventListener(

        "click",

        enableCompassIOS

    );

}

// ======================================
// Part 2
// Capture + Upload
// ======================================

async function uploadToDrive(imageBase64){

    if(!navigator.onLine){
        throw new Error("No Internet Connection");
    }

    const payload = {

        image: imageBase64,

        latitude: latitude.textContent,

        longitude: longitude.textContent,

        heading: headingText.textContent,

        direction: directionText.textContent,

        timestamp: new Date().toISOString()

    };

    try{

        const response = await fetch(SCRIPT_URL,{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify(payload)

        });

        console.log("HTTP Status:",response.status);

        const text = await response.text();

        console.log("Server Response:");

        console.log(text);

        if(!response.ok){

            throw new Error("HTTP "+response.status);

        }

        const result = JSON.parse(text);

        if(result.success){

            alert("✅ Uploaded Successfully");

        }

        else{

            alert(result.error);

        }

    }

    catch(err){

        console.error(err);

        alert(err);

    }

}

// ======================================
// Part 3
// Upload Status
// ======================================

async function uploadToDrive(imageBase64){

    if(!navigator.onLine){

        throw new Error("No Internet Connection");

    }

    const payload={

        image:imageBase64,

        latitude:latitude.textContent,

        longitude:longitude.textContent,

        heading:headingText.textContent,

        direction:directionText.textContent,

        timestamp:new Date().toISOString()

    };

    captureButton.disabled=true;

    captureButton.style.opacity="0.7";

    captureButton.innerHTML=`
    <span class="material-symbols-outlined">
    cloud_upload
    </span>
    Uploading...
    `;

    try{

        const response=await fetch(

            SCRIPT_URL,

            {

                method:"POST",

                headers:{

                    "Content-Type":"application/json"

                },

                body:JSON.stringify(payload)

            }

        );

        const result=await response.json();

        console.log(result);

        if(result.success){

            captureButton.innerHTML=`
            <span class="material-symbols-outlined">
            check_circle
            </span>
            Uploaded
            `;

        }

        else{

            throw new Error(result.error);

        }

    }

    catch(err){

        console.error(err);

        captureButton.innerHTML=`
        <span class="material-symbols-outlined">
        error
        </span>
        Upload Failed
        `;

    }

    setTimeout(()=>{

        captureButton.disabled=false;

        captureButton.style.opacity="1";

        captureButton.innerHTML=`
        <span class="material-symbols-outlined">
        photo_camera
        </span>
        Capture Photo
        `;

    },2000);

}


