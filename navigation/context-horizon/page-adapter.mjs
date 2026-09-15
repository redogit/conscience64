import {detectRouteId,installContextHorizon} from './presenter.mjs';

function install(){if(!document.getElementById('context-horizon-panel'))installContextHorizon({routeId:detectRouteId()});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
