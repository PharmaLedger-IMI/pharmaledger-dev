import{g as t}from"./p-9835b40a.js";import{h as e,i as n,c as i,j as s,k as o}from"./p-869e3fb2.js";function r(r){return function(c,l){const{connectedCallback:a,componentWillLoad:f,componentDidLoad:d,render:u}=c;let b="psk-send-events",h=s,p=e,m="definedEvents";c.componentWillLoad=function(){let i=t(this);if(!i.hasAttribute(e)&&!i.hasAttribute(n))return f&&f.call(this)},c.componentDidLoad=function(){let i=t(this);if(!i.hasAttribute(e)&&!i.hasAttribute(n))return d&&d.call(this)},c.connectedCallback=function(){let e=this,i=t(e);if(r.controllerInteraction&&(p=n,m="definedControllers",h=o,b="psk-send-controllers"),i.hasAttribute(p)){if(!e.componentDefinitions)return e.componentDefinitions={},e.componentDefinitions[m]=[Object.assign(Object.assign({},r),{eventName:String(l)})],a&&a.call(e);let t=e.componentDefinitions;const n=Object.assign(Object.assign({},r),{eventName:String(l)});if(t&&t.hasOwnProperty(h)){let e=[...t[h]];e.push(n),t[h]=[...e]}else t[h]=[n];e.componentDefinitions=Object.assign({},t)}return a&&a.call(e)},c.render=function(){if(!this.componentDefinitions||!this.componentDefinitions||!this.componentDefinitions[h])return u&&u.call(this);let t=this.componentDefinitions[h];t&&(t=t.reverse()),i(b,{composed:!0,bubbles:!0,cancelable:!0,detail:t},!0)}}}export{r as T};