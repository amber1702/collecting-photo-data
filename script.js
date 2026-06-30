// ======================================================
// Collecting Photo Data
// script.js
// Part 1
// Variables + Camera + GPS + Compass
// ======================================================


// ======================================================
// Google Apps Script
// ======================================================

const SCRIPT_URL =
"https://script.google.com/macros/s/AKfycbwJPbxETXFlI5_phZ5NFcdc7qak6KGpjpyznElrEAHmyyikpNqegzVLZTUOnKo9WK0T/exec";


// ======================================================
// HTML Elements
// ======================================================

const video =
document.getElementById("video");

const canvas =
document.getElementById("canvas");

const captureButton =
document.getElementById("capture");

const milestoneButton =
document.getElementById("newMilestone");

const statusText =
document.getElementById("status");

const milestoneText =
document.getElementById("milestoneName");

const latitudeText =
document.getElementById("lat");

const longitudeText =
document.getElementById("lon");

const headingText =
document.getElementById("heading");

const directionText =
document.getElementById("direction");

const headingValue =
document.getElementById("headingValue");

const compassArrow =
document.getElementById("compassArrow");

const enableCompassButton =
document.getElementById("enableCompass");


// ======================================================
// Global Variables
// ======================================================

let currentMilestone = "";

let imageCounter = 0;

let latitude = "--";

let longitude = "--";

let heading = 0;

let direction = "N";


// ======================================================
// Status
// ======================================================

function setStatus(text,color="#16A34A"){

    statusText.innerText = text;

    statusText.style.color = color;

}

setStatus("Ready");


// ======================================================
// Camera
// ======================================================

async function startCamera(){

    if(!window.isSecureContext){

        alert("Please open using HTTPS.");

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

        setStatus("Camera Error","#DC2626");

    }

}

startCamera();


// ======================================================
// GPS
// ======================================================

function updateLocation(position){

    latitude =
    position.coords.latitude.toFixed(6);

    longitude =
    position.coords.longitude.toFixed(6);

    latitudeText.innerText =
    latitude;

    longitudeText.innerText =
    longitude;

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


// ======================================================
// Direction
// ======================================================

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


// ======================================================
// Update Compass
// ======================================================

function updateCompass(value){
    // ======================================================
    // Android Compass
    // ======================================================

    function handleAndroidCompass(event){

        if(event.alpha == null)
            return;

        const value = 360 - event.alpha;

        updateCompass(value);

    }

    if ("ondeviceorientationabsolute" in window){

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


    // ======================================================
    // iPhone Compass
    // ======================================================

    async function enableCompassIOS(){

        if(

            typeof DeviceOrientationEvent !== "undefined"

            &&

            typeof DeviceOrientationEvent.requestPermission === "function"

        ){

            try{

                const permission =

                await DeviceOrientationEvent.requestPermission();

                if(permission === "granted"){

                    window.addEventListener(

                        "deviceorientation",

                        handleIOSCompass,

                        true

                    );

                    enableCompassButton.style.display = "none";

                    setStatus("Compass Ready");

                }
                else{

                    setStatus(

                        "Compass Permission Denied",

                        "#DC2626"

                    );

                }

            }

            catch(err){

                console.error(err);

            }

        }

    }


    function handleIOSCompass(event){

        if(event.webkitCompassHeading == null)
            return;

        updateCompass(

            event.webkitCompassHeading

        );

    }


    // ======================================================
    // Enable Compass Button
    // ======================================================

    enableCompassButton.addEventListener(

        "click",

        enableCompassIOS

    );
    heading = value;

    direction = getDirection(value);

    headingText.innerText =
    value.toFixed(1) + "°";

    directionText.innerText =
    direction;

    if(headingValue){

        headingValue.innerText =
        Math.round(value) + "°";

    }

    if(compassArrow){

        compassArrow.style.transform =
        `translateX(-50%) rotate(${value}deg)`;

    }

}

// ======================================================
// Part 2
// Milestone + Capture
// ======================================================


// ======================================================
// New Milestone
// ======================================================

milestoneButton.addEventListener(

    "click",

    async function(){

        setStatus("Creating Milestone...","#D97706");

        try{

            const response = await fetch(

                SCRIPT_URL,

                {

                    method:"POST",

                    headers:{
                        "Content-Type":"text/plain;charset=utf-8"
                    },

                    body:JSON.stringify({

                        action:"new_milestone"

                    })

                }

            );

            const result =
            await response.json();

            if(!result.success){

                throw new Error(result.error);

            }

            currentMilestone =
            result.milestone;

            imageCounter = 0;

            milestoneText.innerText =
            currentMilestone;

            setStatus(

                "Milestone Ready",

                "#16A34A"

            );

        }

        catch(err){

            console.error(err);

            setStatus(

                "Milestone Error",

                "#DC2626"

            );

            alert(err.message);

        }

    }

);


// ======================================================
// Capture
// ======================================================

captureButton.addEventListener(

    "click",

    async function(){

        if(currentMilestone==""){

            alert(

                "Please create a milestone first."

            );

            return;

        }

        captureButton.disabled=true;

        captureButton.style.opacity="0.6";

        setStatus(

            "Capturing...",

            "#2563EB"

        );

        try{

            canvas.width=512;

            canvas.height=512;

            const ctx=
            canvas.getContext("2d");

            ctx.drawImage(

                video,

                0,

                0,

                512,

                512

            );

            const imageBase64=

                canvas

                .toDataURL(

                    "image/jpeg",

                    0.9

                )

                .split(",")[1];

            imageCounter++;

            await uploadImage(

                imageBase64

            );

        }

        catch(err){

            console.error(err);

            setStatus(

                "Capture Error",

                "#DC2626"

            );

        }

        captureButton.disabled=false;

        captureButton.style.opacity="1";

    }

);

// ======================================================
// Part 3
// Upload Image
// ======================================================

async function uploadImage(imageBase64){

    setStatus("Uploading...","#2563EB");

    try{

        const payload={

            action:"upload",

            milestone:currentMilestone,

            imageCounter:imageCounter,

            latitude:latitude,

            longitude:longitude,

            heading:heading,

            direction:direction,

            timestamp:new Date().toISOString(),

            image:imageBase64

        };

        const response = await fetch(

            SCRIPT_URL,

            {

                method:"POST",

                headers:{

                    "Content-Type":"text/plain;charset=utf-8"

                },

                body:JSON.stringify(payload)

            }

        );

        if(!response.ok){

            throw new Error(

                "HTTP " + response.status

            );

        }

        const result =
        await response.json();

        if(!result.success){

            throw new Error(

                result.error

            );

        }

        setStatus(

            "Uploaded ✓",

            "#16A34A"

        );

        console.log(

            "Saved:",

            result.filename

        );

    }

    catch(err){

        console.error(err);

        setStatus(

            "Upload Failed",

            "#DC2626"

        );

        alert(err.message);

    }

}



// ======================================================
// Auto Restore Status
// ======================================================

function resetStatus(){

    setTimeout(function(){

        setStatus("Ready");

    },1500);

}



// ======================================================
// Optional
// Restore Ready after Upload
// ======================================================

const originalUploadImage = uploadImage;

uploadImage = async function(imageBase64){

    await originalUploadImage(imageBase64);

    resetStatus();

}