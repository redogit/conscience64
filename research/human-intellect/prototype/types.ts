export type Id=string;
export type AuthorityStatus="authorized"|"ambiguous"|"unavailable"|"rejected";
export type Decision="allow"|"wait"|"reject";
export type EpistemicStatus="observed"|"inferred"|"uncertain"|"unknown";
export interface Obligation{id:Id;o0:string;o1:string;localObjective:string;reason:string;authority:string;authorityStatus:AuthorityStatus;budget:number;spent:number;unresolvedCost:number;limits:string[];expectedBenefit:string;stopCondition:string;createdAt:string;}
export interface LineageRecord{id:Id;at:string;kind:"observation"|"interpretation"|"authorization"|"failure"|"repair"|"anchor"|"unknown";subject:string;evidence:string[];reason:string;authority?:string;cost:number;unresolved:string[];status?:string;}
export interface KnowledgeItem{id:Id;text:string;tags:string[];links:Id[];at:string;active:boolean;consequential:boolean;epistemicStatus:EpistemicStatus;}
export interface ControllerDecision{decision:Decision;reason:string;remainingBudget:number;}
