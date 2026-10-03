from pathlib import Path
s=Path('baseline/compressed_text_ai.c').read_text().replace('#include <ctype.h>','#include <ctype.h>\n#include <time.h>')
s=s.replace('uint64_t compactions;', 'uint64_t compactions;\n    uint64_t copied_nodes, suffix_nodes, slots_scanned;\n    double reclamation_s, reconstruction_s;')
a=s.index('static void stream_compact(')
s=s[:a]+'''static double probe_seconds(void) {
    struct timespec t; clock_gettime(CLOCK_MONOTONIC,&t);
    return (double)t.tv_sec+(double)t.tv_nsec*1e-9;
}
'''+s[a:]
s=s.replace('    uint32_t suffix=stream_forest_slice(g,g->window_len-STREAM_WINDOW,STREAM_WINDOW);','    double begin=probe_seconds(); uint64_t before=g->rules_created;\n    uint32_t suffix=stream_forest_slice(g,g->window_len-STREAM_WINDOW,STREAM_WINDOW);\n    double suffix_s=probe_seconds()-begin; uint64_t suffix_n=g->rules_created-before;\n    begin=probe_seconds();')
s=s.replace('    nw.bins[0]=root;', '    nw.copied_nodes=g->copied_nodes+nw.rules_created;\n    nw.suffix_nodes=g->suffix_nodes+suffix_n;\n    nw.slots_scanned=g->slots_scanned+g->rule_count;\n    nw.reconstruction_s=g->reconstruction_s+suffix_s+probe_seconds()-begin;\n    nw.reclamation_s=g->reclamation_s;\n    nw.bins[0]=root;')
s=s.replace('    free(g->rules); *g=nw;', '    begin=probe_seconds(); free(g->rules); nw.reclamation_s+=probe_seconds()-begin; *g=nw;')
s=s.replace('    if(ok){res->summary=g.global;', '''    if(ok) fprintf(stderr,"{\\"copied_nodes\\":%" PRIu64 ",\\"suffix_reconstruction_nodes\\":%" PRIu64 ",\\"slots_scanned\\":%" PRIu64 ",\\"reconstruction_s\\":%.9f,\\"reclamation_s\\":%.9f}\\n",g.copied_nodes,g.suffix_nodes,g.slots_scanned,g.reconstruction_s,g.reclamation_s);
    if(ok){res->summary=g.global;''')
Path('baseline_instrumented.c').write_text(s)
