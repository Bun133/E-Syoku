import {useEffect} from "react";
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
    useEffect(() => {
        // when component mounts
        const toLog = config.toLog === true;
        const conf = createConfig({
            fps: config.fps,
            qrbox: config.qrBox,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
        })
        const option = toHtml5QrcodeFullConfig(conf, toLog)
        const html5Qr = new Html5Qrcode(qrcodeRegionId, option);

        const a = async () => {
            const cameras = await Html5Qrcode.getCameras()
            if (cameras.length === 0) {
                throw new Error("No camera found")
            }

            const cameraScanConfig = toHtml5QrcodeCameraScanConfig(conf)
            return {
                cameraId: cameras[0].id,
                cameraScanConfig: cameraScanConfig
            }
        }


        a().then((d) => {
            html5Qr.start(d.cameraId, d.cameraScanConfig, config.onScan, config.onError).then(r => {

            })
        })

        return () => {
            html5Qr.stop().then(() => {
                html5Qr.clear();
            })
        }
    }, []);

    return (
        <div id={qrcodeRegionId}/>
    );
}