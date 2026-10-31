import {Component} from 'react';
import type {ReactNode} from 'react';
/** A font refresh may invalidate previously valid, transient presenter geometry. */
export default class PrototypeRenderBoundary extends Component<{children:ReactNode;onClose:()=>void},{error:string|null}>{
 state:{error:string|null}={error:null};
 static getDerivedStateFromError(error:unknown){return {error:error instanceof Error?error.message:String(error)};}
 render(){if(this.state.error===null)return this.props.children;return <div className="prototype-viewer" role="dialog" aria-modal="true" aria-label="Prototype presentation" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();this.props.onClose();}}}><header><button onClick={this.props.onClose}>← Back to editor</button><span>Presentation paused</span></header><div className="prototype-stage"><div><p role="alert">The presentation could not render its current derived geometry: {this.state.error}</p><button onClick={()=>this.setState({error:null})}>Retry presentation</button></div></div></div>;}
}
