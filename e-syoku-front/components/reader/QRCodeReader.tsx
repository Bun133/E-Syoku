import {useEffect, useRef} from "react";
import {Html5QrcodeScanType} from "html5-qrcode";
import {
    Html5QrcodeConstants,
    Html5QrcodeError,
    Html5QrcodeResult,
    QrDimensionFunction,
    QrDimensions
} from "html5-qrcode/es2015/core";
import {Html5Qrcode, Html5QrcodeConfigs, Html5QrcodeFullConfig} from "html5-qrcode/es2015/html5-qrcode";
import {Html5QrcodeScannerConfig} from "html5-qrcode/es2015/html5-qrcode-scanner";
import {Html5QrcodeCameraScanConfig} from "html5-qrcode/src/html5-qrcode";
import {RotateCcw} from "react-feather";

const qrcodeRegionId = "qr-code-scanner";

function createConfig(config: Html5QrcodeScannerConfig | undefined)
    : Html5QrcodeScannerConfig {
    if (config) {
        if (!config.fps) {
            config.fps = Html5QrcodeConstants.SCAN_DEFAULT_FPS;
        }

        if (config.rememberLastUsedCamera !== (
            !Html5QrcodeConstants.DEFAULT_REMEMBER_LAST_CAMERA_USED)) {
            config.rememberLastUsedCamera
                = Html5QrcodeConstants.DEFAULT_REMEMBER_LAST_CAMERA_USED;
        }

        if (!config.supportedScanTypes) {
            config.supportedScanTypes
                = Html5QrcodeConstants.DEFAULT_SUPPORTED_SCAN_TYPE;
        }

        return config;
    }

    return {
        fps: Html5QrcodeConstants.SCAN_DEFAULT_FPS,
        rememberLastUsedCamera:
        Html5QrcodeConstants.DEFAULT_REMEMBER_LAST_CAMERA_USED,
        supportedScanTypes:
        Html5QrcodeConstants.DEFAULT_SUPPORTED_SCAN_TYPE
    };
}

function toHtml5QrcodeFullConfig(
    config: Html5QrcodeConfigs, verbose: boolean | undefined)
    : Html5QrcodeFullConfig {
    return {
        formatsToSupport: config.formatsToSupport,
        useBarCodeDetectorIfSupported: config.useBarCodeDetectorIfSupported,
        experimentalFeatures: config.experimentalFeatures,
        verbose: verbose
    };
}

function toHtml5QrcodeCameraScanConfig(config: Html5QrcodeScannerConfig)
    : Html5QrcodeCameraScanConfig {
    return {
        fps: config.fps,
        qrbox: config.qrbox,
        aspectRatio: config.aspectRatio,
        disableFlip: config.disableFlip,
        videoConstraints: config.videoConstraints
    };
}

// TODO インカメラ・アウトカメラの切り替えが出来るように
export function QRCodeReader(config: {
    fps: number,
    onScan: (decodedText: string, result: Html5QrcodeResult) => void,
    onError?: (errorMessage: string, error: Html5QrcodeError) => void,
    qrBox?: number | QrDimensions | QrDimensionFunction,
    toLog?: boolean
}) {
    const conf = useRef<Html5QrcodeScannerConfig>(createConfig({
        fps: config.fps,
        qrbox: config.qrBox,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
    }))

    function setUpHtml5Qr(): Html5Qrcode {
        const toLog = config.toLog === true;
        const option = toHtml5QrcodeFullConfig(conf.current, toLog)
        return new Html5Qrcode(qrcodeRegionId, option);
    }

    const html5QrInstance = useRef<Html5Qrcode>();

    async function listCameras() {
        return await Html5Qrcode.getCameras()
    }

    async function startScan(instance: Html5Qrcode, cameraIndex: number) {
        const cameraId = (await listCameras())[cameraIndex]
        return await instance.start(cameraId.id, toHtml5QrcodeCameraScanConfig(conf.current), config.onScan, config.onError)
    }

    async function cleanUp() {
        await html5QrInstance.current?.stop()
        html5QrInstance.current?.clear()
    }

    const cameraIndex = useRef(0)

    async function initStart() {
        html5QrInstance.current = setUpHtml5Qr()
        await startScan(html5QrInstance.current!!, cameraIndex.current)
    }

    async function switchCamera() {
        await cleanUp()
        await incrementCameraIndex()
        await initStart()
    }

    async function incrementCameraIndex() {
        const list = await listCameras()
        cameraIndex.current = (cameraIndex.current + 1) % list.length
    }

    useEffect(() => {
        initStart().then(r => {
        })

        return () => {
            cleanUp()
        }
    }, []);

    return (
        <div style={{position: "relative"}}>
            <div id={qrcodeRegionId}/>
            <div className={"camera-switch"}
                 style={{position: "absolute", right: "1rem", top: "1rem", zIndex: 1, cursor: "pointer"}}
                 onClick={switchCamera}
            >
                <RotateCcw color={"white"}/>
            </div>
        </div>
    );
}