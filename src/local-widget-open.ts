import {refreshLocalWidgets,useLocalWidgets} from './local-widget-storage';
export const openLocalWidgets=()=>{useLocalWidgets.setState({open:true});void refreshLocalWidgets();};
