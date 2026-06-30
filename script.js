// ======================================================
// Mapping Dataset Collecting
// script.js
// Part 1
// Camera + GPS + Compass
// ======================================================


// ======================================================
// Google Apps Script URL
// ======================================================

const SCRIPT_URL =
"https://script.google.com/macros/s/AKfycbx3RGgEHIvieNEsuzTsyEeUYS6TVeFQUTWPu6ytbHSnExJOvWRKJACr4knFxiiu7p1j/exec";


// ======================================================
// HTML Elements
// ======================================================

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");

const captureButton =
document.getElementById("capture");

const milestoneButton =
document.getElementById("newMilestone");

const enableCompassButton =
document.getElementById("enableCompass");

const milestoneText =
document.getElementById("milestoneName");

const statusText =
document.getElementById("status");

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

    statusText.textContent = text;

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

if(navigator.geolocation){

    navigator.geolocation.watchPosition(

        function(position){

            latitude =
            position.coords.latitude.toFixed(6);

            longitude =
            position.coords.longitude.toFixed(6);

            latitudeText.textContent =
            latitude;

            longitudeText.textContent =
            longitude;

        },

        function(error){

            console.log(error);

        },

        {

            enableHighAccuracy:true,

            timeout:5000,

            maximumAge:1000

        }

    );

}


// ======================================================
// Compass
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


function updateCompass(value){

    heading = value;

    direction = getDirection(value);

    headingText.textContent =
    value.toFixed(1) + "°";

    directionText.textContent =
    direction;

    headingValue.textContent =
    Math.round(value) + "°";

    compassArrow.style.transform =
    `translateX(-50%) rotate(${value}deg)`;

}


// ======================================================
// Android Compass
// ======================================================

function handleAndroidCompass(event){

    if(event.alpha==null)
        return;

    const value =
    360 - event.alpha;

    updateCompass(value);

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

            if(permission==="granted"){

                window.addEventListener(

                    "deviceorientation",

                    handleIOSCompass,

                    true

                );

                enableCompassButton.style.display="none";

                setStatus("Compass Ready");

            }

        }

        catch(err){

            console.error(err);

        }

    }

}


function handleIOSCompass(event){

    if(event.webkitCompassHeading==null)
        return;

    updateCompass(

        event.webkitCompassHeading

    );

}


enableCompassButton.addEventListener(

    "click",

    enableCompassIOS

);

// ======================================================
// Part 2
// New Milestone + Capture
// ======================================================


// ======================================================
// Create New Milestone
// ======================================================

milestoneButton.addEventListener(

    "click",

    async function(){

        milestoneButton.disabled = true;

        setStatus("Creating Milestone...","#F59E0B");

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

            currentMilestone =
            result.milestone;

            imageCounter = 0;

            milestoneText.textContent =
            currentMilestone;

            setStatus(

                "Milestone Ready"

            );

        }

        catch(err){

            console.error(err);

            alert(err.message);

            setStatus(

                "Milestone Error",

                "#DC2626"

            );

        }

        finally{

            milestoneButton.disabled = false;

        }

    }

);


// ======================================================
// Capture Button
// ======================================================

captureButton.addEventListener(

    "click",

    async function(){

        if(currentMilestone===""){

            alert(

                "Please create a milestone first."

            );

            return;

        }

        captureButton.disabled = true;

        captureButton.style.opacity = "0.6";

        setStatus(

            "Capturing...",

            "#2563EB"

        );

        try{

            // ==========================
            // Resize to 512 x 512
            // ==========================

            canvas.width = 512;

            canvas.height = 512;

            const ctx =
            canvas.getContext("2d");

            ctx.drawImage(

                video,

                0,

                0,

                512,

                512

            );

            // ==========================
            // Convert to Base64
            // ==========================

            const imageBase64 =

                canvas

                .toDataURL(

                    "image/jpeg",

                    0.9

                )

                .split(",")[1];

            // ==========================
            // Upload
            // ==========================

            const success =

            await uploadImage(

                imageBase64

            );

            if(success){

                imageCounter++;

            }

        }

        catch(err){

            console.error(err);

            setStatus(

                "Capture Error",

                "#DC2626"

            );

        }

        finally{

            captureButton.disabled = false;

            captureButton.style.opacity = "1";

        }

    }

);
