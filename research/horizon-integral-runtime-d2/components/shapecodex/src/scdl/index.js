/* SCDL general kernel — public surface (src/scdl/index.js).
   K1: parse/print/Check/Value. K2: Registry/makeRegistry/checkObject/
   compareTypes/compose. K3: decompose/reconstruct + sequence/graph adapters.
   K4: linear adapter + exact rationals. K5: compile + check (exit-code
   analogue of bin/scdl.mjs: 0 valid, 2 invalid, 3 deferred). K6: hodge +
   color adapters (exact diamonds with proven/open class rule; color-ledger
   assignments with honest conflict reporting).
*/
"use strict";
import { VERSION, LIMITS, reduceRational, ratAdd, ratMul, ratNeg, ratIsZero, ratToString } from "./values.js";
import { parse } from "./language/parser.js";
import { print, printValue, astsEqual } from "./language/printer.js";
import { makeRegistry, getObject, getMorphism, getAdapter } from "./kernel/registry.js";
import { checkObject, compareTypes } from "./kernel/types.js";
import { compose } from "./kernel/compose.js";
import { decompose, reconstruct } from "./kernel/decompose.js";
import { admitEvidence, summarizeEvidence } from "./kernel/evidence.js";
import { compile } from "./language/compile.js";
import { sequenceAdapter } from "./adapters/sequence.js";
import { graphAdapter } from "./adapters/graph.js";
import { linearAdapter, isZeroMatrix } from "./adapters/linear.js";
import { hodgeAdapter, hodgeDiamond } from "./adapters/hodge.js";
import { colorAdapter, colorConflicts } from "./adapters/color.js";
import { compileHorizon, HORIZON_IR_SCHEMA } from "./horizon/compile-ir.js";

export const ADAPTERS = [sequenceAdapter, graphAdapter, linearAdapter, hodgeAdapter, colorAdapter];

export function makeDefaultRegistry(records, morphisms) {
  return makeRegistry(records || [], morphisms || [], ADAPTERS);
}

export function check(source, opts) {
  const reg = (opts && opts.registry) || makeDefaultRegistry();
  if (reg.kind === "invalid") return { code: 2, status: "invalid", diagnostics: reg.diagnostics };
  const parsed = parse(source, opts && opts.limits);
  if (parsed.kind === "invalid") return { code: 2, status: "invalid", diagnostics: parsed.diagnostics };
  const out = compile(parsed.value, reg.value, opts);
  if (out.kind === "invalid") return { code: 2, status: "invalid", diagnostics: out.diagnostics, declarations: parsed.value.declarations.length };
  return {code:out.kind === "valid" ? 0 : 3,status:out.kind,document:out.value,obligations:out.obligations,declarations:parsed.value.declarations.length};
}

export {VERSION,LIMITS,reduceRational,ratAdd,ratMul,ratNeg,ratIsZero,ratToString,parse,print,printValue,astsEqual,makeRegistry,getObject,getMorphism,getAdapter,checkObject,compareTypes,compose,decompose,reconstruct,admitEvidence,summarizeEvidence,compile,sequenceAdapter,graphAdapter,linearAdapter,isZeroMatrix,hodgeAdapter,hodgeDiamond,colorAdapter,colorConflicts,compileHorizon,HORIZON_IR_SCHEMA};
