#define main archive_cli_main
#ifndef SOURCE
#define SOURCE "reclamation.c"
#endif
#include SOURCE
#undef main
#include <assert.h>
int main(void) {
    StreamGrammar g; stream_init(&g);
    uint8_t *text = malloc(300000); size_t n=0;
    uint32_t rng=7;
    for(unsigned i=0;i<120000;i++) {
        rng=rng*1664525u+1013904223u;
        uint8_t b=(uint8_t)(rng>>24); text[n++]=b; stream_append_literal(&g,b);
    }
    /* Maximum-distance and overlapping matches after multiple collections. */
    const unsigned dist[]={32768,1,17,4096,32768};
    for(unsigned i=0;i<500;i++) {
        unsigned d=dist[i%5], len=258;
        for(unsigned j=0;j<len;j++) { text[n]=text[n-d]; n++; }
        stream_append_match(&g,d,len);
    }
    NGramSummary expected; bytes_ngram_summary(text,n,&expected);
    assert(g.global.len==expected.len);
    assert(memcmp(g.global.value,expected.value,sizeof(expected.value))==0);
    assert(g.global.prefix_len==expected.prefix_len && g.global.suffix_len==expected.suffix_len);
    assert(memcmp(g.global.prefix,expected.prefix,sizeof(expected.prefix))==0);
    assert(memcmp(g.global.suffix,expected.suffix,sizeof(expected.suffix))==0);
    /* Reconstruct the retained suffix and compare its exact carrier too. */
    uint32_t suffix=stream_forest_slice(&g,0,g.window_len);
    NGramSummary actual, tail; stream_node_summary(&g,suffix,&actual);
    bytes_ngram_summary(text+n-g.window_len,g.window_len,&tail);
    assert(actual.len==tail.len && memcmp(actual.value,tail.value,sizeof(tail.value))==0);
    /* A suffix copy creates millions of redundant rules; reuse must not. */
    assert(g.rules_created < 2*n);
    printf("exact summary + boundary matches + bounded construction passed; rules=%" PRIu64 "\n",g.rules_created);
    stream_free(&g); free(text); return 0;
}
