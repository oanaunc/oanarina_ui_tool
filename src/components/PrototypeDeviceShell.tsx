import type {PrototypeSettings} from '../prototype';
import './prototype-device.css';
/** Decoration only: the frame still sets the viewport size. */
export default function PrototypeDeviceShell({device,orientation}:Pick<PrototypeSettings,'device'|'orientation'>){if(device==='none'||device==='desktop'||device==='watch')return null;return <div className={`device-shell device-shell-${device}${orientation==='landscape'?' device-landscape':''}`} data-device-shell={device} aria-hidden="true">{device==='foldable'?<i className="device-hinge"/>:<i className="device-sensor"/>}{device==='phone'&&<i className="device-indicator"/>}</div>;}
