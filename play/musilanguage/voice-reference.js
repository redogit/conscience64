/* Private per-tab reference policy. No audio access, persistence or renderer. */
'use strict';
(function(root){
function create(){
 let profile=null,enabled=false,selected=false;
 function register(value){
  // Copy only the private descriptor contract. Never attach it to a recipe/score.
  const p=structuredClone(value),c=p?.consent,r=p?.reference;
  if(p?.format!=='musilanguage-private-voice/v1'||typeof p.label!=='string'||!p.label.trim()||p.label.length>80||
   c?.subject!=='self'||c?.scope!=='private-generated-vocals'||c?.externalUpload!==false||
   typeof c.provenance!=='string'||!c.provenance.trim()||!Number.isFinite(Date.parse(c.recordedAt))||
   r?.kind!=='private-library'||typeof r.libraryFileId!=='string'||!/^libfile_[a-zA-Z0-9]+$/.test(r.libraryFileId)||
   typeof r.backingFileId!=='string'||!/^file_[a-zA-Z0-9]+$/.test(r.backingFileId))throw Error('Invalid private reference or consent provenance.');
  profile={label:p.label,consent:{subject:c.subject,scope:c.scope,externalUpload:false,provenance:c.provenance,recordedAt:c.recordedAt},reference:{kind:r.kind,libraryFileId:r.libraryFileId,backingFileId:r.backingFileId},preferences:{similarity:'somewhat-similar',pitch:'restrained',rhythm:'complex',basis:'user-preference-not-acoustic-analysis'}};
  selected=true;return state();
 }
 function state(){return {enabled,hasProfile:!!profile,selected:!!profile&&selected,label:profile?.label||'',status:!enabled?'instrumental':!profile||!selected?'reference-required':'pending-renderer',rendererAvailable:false,audioAvailable:false};}
 return Object.freeze({register,state,setEnabled(value){if(typeof value!=='boolean')throw Error('Boolean vocal setting required.');enabled=value;return state();},select(value){if(!['default','none'].includes(value))throw Error('Unknown voice selection.');selected=value==='default'&&!!profile;return state();},clear(){profile=null;selected=false;enabled=false;return state();}});
}
root.MusilanguageVoice=Object.freeze({create});
})(typeof window==='undefined'?globalThis:window);
