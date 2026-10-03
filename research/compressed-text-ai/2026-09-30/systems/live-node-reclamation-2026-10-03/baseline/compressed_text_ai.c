#define _POSIX_C_SOURCE 200809L
#include <ctype.h>
#include <errno.h>
#include <inttypes.h>
#include <math.h>
#include <stdint.h>
#include <sys/types.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define TERMINALS 256u
#define EMPTY_NODE UINT32_MAX
#define MAX_HUFF_BITS 15
#define FOREST_BINS 64
#define EMBED_DIM 128u
#define EMBED_CONTEXT 2u
#define NN_HIDDEN 32u
#define NN_VERSION 1u
#define BGZF_MAX_BLOCK_SIZE 65536u
#define LOCAL_STATE_DIM 32u
#define LOCAL_INPUT_DIM (EMBED_DIM + 2u * LOCAL_STATE_DIM)
#define FINAL_INPUT_DIM (EMBED_DIM + LOCAL_STATE_DIM)
#define LOCAL_LEVELS 32u
#define LOCAL_MODEL_VERSION 1u

typedef struct { uint32_t left, right; uint64_t len; } Rule;
typedef struct {
    Rule *rules;
    uint32_t rule_count;
    uint32_t rule_cap;
    uint32_t bins[FOREST_BINS];
    uint8_t used[FOREST_BINS];
    uint64_t total_len;
    uint64_t pieces;
    uint64_t literal_symbols;
    uint64_t match_symbols;
} Grammar;

typedef struct {
    const uint8_t *data;
    size_t size;
    size_t byte_pos;
    unsigned bit_pos;
} BitReader;

typedef struct {
    int16_t *table[MAX_HUFF_BITS + 1];
    uint8_t max_bits;
    uint8_t empty;
} Huffman;

typedef struct {
    char *name;
    uint16_t name_len;
    uint16_t flags;
    uint16_t method;
    uint32_t crc32;
    uint32_t compressed_size;
    uint32_t uncompressed_size;
    uint32_t local_offset;
} ZipEntry;

typedef struct {
    char **features;
    double *weights;
    size_t count;
    double bias;
} Model;

typedef struct {
    uint64_t len;
    uint8_t prefix[EMBED_CONTEXT];
    uint8_t suffix[EMBED_CONTEXT];
    uint8_t prefix_len;
    uint8_t suffix_len;
    float value[EMBED_DIM];
} NGramSummary;

typedef struct {
    char magic[4];
    uint32_t version;
    uint32_t input_dim;
    uint32_t hidden_dim;
    uint32_t max_ngram;
    uint32_t boundary_context;
} NNHeader;

typedef struct {
    float mean[EMBED_DIM];
    float inv_std[EMBED_DIM];
    float w1[NN_HIDDEN][EMBED_DIM];
    float b1[NN_HIDDEN];
    float w2[NN_HIDDEN];
    float b2;
} NNModel;

typedef struct {
    uint64_t summaries_evaluated;
    uint64_t cross_boundary_ngrams;
    uint64_t embedding_bytes;
} EmbedStats;

typedef struct { uint32_t end_state; uint64_t hits; } Transition;

typedef struct {
    uint64_t compressed_bytes;
    uint64_t logical_bytes;
    uint64_t grammar_nodes;
    uint64_t node_state_evaluations;
    uint64_t literals;
    uint64_t matches;
} Stats;

typedef struct {
    uint64_t compressed_offset;
    uint32_t compressed_size;
    uint32_t uncompressed_size;
    uint32_t crc32;
    size_t payload_offset;
    size_t payload_size;
} BgzfBlock;

typedef struct {
    uint64_t blocks;
    uint64_t empty_blocks;
    uint64_t compressed_bytes;
    uint64_t logical_bytes;
    uint64_t grammar_nodes;
    uint64_t max_block_grammar_nodes;
    uint64_t literals;
    uint64_t matches;
    uint64_t summaries_evaluated;
    uint64_t cross_boundary_ngrams;
} BgzfStats;

/*
 * Layer-local hierarchy.  Rank 0 encodes one BGZF block.  Rank r+1 receives
 * the exact summary of two adjacent rank-r spans plus their stop-gradient
 * hidden states.  Each rank has its own auxiliary classifier and is updated
 * only from its local loss; the final head consumes the exact file summary
 * and a length-weighted pool of surviving root states.
 */
typedef struct {
    float w_state[LOCAL_STATE_DIM][LOCAL_INPUT_DIM];
    float b_state[LOCAL_STATE_DIM];
    float w_head[LOCAL_STATE_DIM];
    float b_head;
} LocalLayer;

typedef struct {
    float w1[NN_HIDDEN][FINAL_INPUT_DIM];
    float b1[NN_HIDDEN];
    float w2[NN_HIDDEN];
    float b2;
} FinalHead;

typedef struct {
    char magic[4];
    uint32_t version;
    uint32_t embedding_dim;
    uint32_t state_dim;
    uint32_t levels;
    uint32_t max_ngram;
    uint32_t boundary_context;
} LocalModelHeader;

typedef struct {
    LocalLayer layer[LOCAL_LEVELS];
    FinalHead final_head;
} LocalModel;

typedef struct {
    NGramSummary summary;
    float state[LOCAL_STATE_DIM];
    uint64_t block_count;
    uint32_t rank;
} LocalNode;

typedef struct {
    LocalNode bins[LOCAL_LEVELS];
    uint8_t used[LOCAL_LEVELS];
    uint64_t nodes_emitted[LOCAL_LEVELS];
    double score_sum[LOCAL_LEVELS];
    uint64_t score_count[LOCAL_LEVELS];
} LocalForest;

typedef struct {
    NGramSummary bins[FOREST_BINS];
    uint8_t used[FOREST_BINS];
    uint64_t blocks;
} SummaryForest;

typedef struct {
    float probability;
    float final_probability;
    float local_probability;
    float score;
    float final_score;
    float local_score;
    uint64_t local_nodes;
    NGramSummary summary;
} LocalResult;

typedef struct {
    LocalModel *model;
    LocalForest forest;
    uint8_t training;
    uint8_t label;
    float learning_rate;
    float l2;
    double loss_sum;
    double loss_weight;
} LocalRun;

static _Noreturn void die(const char *msg) {
    fprintf(stderr, "error: %s\n", msg);
    exit(1);
}

static _Noreturn void die_errno(const char *what) {
    fprintf(stderr, "error: %s: %s\n", what, strerror(errno));
    exit(1);
}

static int size_add_ok(size_t a, size_t b, size_t *out) {
    if (a > SIZE_MAX - b) return 0;
    *out = a + b;
    return 1;
}

static int size_mul_ok(size_t a, size_t b, size_t *out) {
    if (a && b > SIZE_MAX / a) return 0;
    *out = a * b;
    return 1;
}

static void *xmalloc(size_t n) {
    void *p = malloc(n ? n : 1);
    if (!p) die("out of memory");
    return p;
}

static void *xmalloc_array(size_t n, size_t elem_size) {
    size_t bytes;
    if (!size_mul_ok(n, elem_size, &bytes)) die("allocation size overflow");
    return xmalloc(bytes);
}

static void *xcalloc(size_t n, size_t s) {
    size_t bytes;
    if (!size_mul_ok(n, s, &bytes)) die("allocation size overflow");
    void *p = calloc(bytes ? bytes : 1, 1);
    if (!p) die("out of memory");
    return p;
}

static void *xrealloc(void *p, size_t n) {
    void *q = realloc(p, n ? n : 1);
    if (!q) die("out of memory");
    return q;
}

static void *xrealloc_array(void *p, size_t n, size_t elem_size) {
    size_t bytes;
    if (!size_mul_ok(n, elem_size, &bytes)) die("allocation size overflow");
    return xrealloc(p, bytes);
}

static char *xstrndup(const char *s, size_t n) {
    char *p = xmalloc(n + 1);
    memcpy(p, s, n);
    p[n] = '\0';
    return p;
}

static uint8_t *read_file(const char *path, size_t *size_out) {
    FILE *f = fopen(path, "rb");
    if (!f) die_errno(path);
    if (fseeko(f, 0, SEEK_END) != 0) die_errno("fseeko");
    off_t end = ftello(f);
    if (end < 0) die_errno("ftello");
    if ((uintmax_t)end > (uintmax_t)(SIZE_MAX - 1)) die("file is too large to map into memory");
    if (fseeko(f, 0, SEEK_SET) != 0) die_errno("fseeko");

    size_t n = (size_t)end;
    uint8_t *data = xmalloc(n + 1);
    if (n && fread(data, 1, n, f) != n) {
        if (ferror(f)) die_errno("fread");
        die("unexpected end of file");
    }
    if (fclose(f) != 0) die_errno("fclose");
    data[n] = 0;
    *size_out = n;
    return data;
}

static uint16_t rd16(const uint8_t *p) {
    return (uint16_t)p[0] | (uint16_t)((uint16_t)p[1] << 8);
}

static uint32_t rd32(const uint8_t *p) {
    return (uint32_t)p[0] | ((uint32_t)p[1] << 8) | ((uint32_t)p[2] << 16) | ((uint32_t)p[3] << 24);
}

static void grammar_init(Grammar *g) {
    memset(g, 0, sizeof(*g));
    g->rule_cap = 1024;
    g->rules = xmalloc_array(g->rule_cap, sizeof(*g->rules));
}

static void grammar_free(Grammar *g) {
    free(g->rules);
    memset(g, 0, sizeof(*g));
}

static uint64_t node_len(const Grammar *g, uint32_t id) {
    if (id < TERMINALS) return 1;
    uint32_t r = id - TERMINALS;
    if (r >= g->rule_count) die("invalid grammar node");
    return g->rules[r].len;
}

static uint32_t concat_node(Grammar *g, uint32_t left, uint32_t right) {
    if (left == EMPTY_NODE) return right;
    if (right == EMPTY_NODE) return left;
    uint64_t a = node_len(g, left), b = node_len(g, right);
    if (UINT64_MAX - a < b) die("expanded length overflow");
    const uint32_t max_rules = EMPTY_NODE - TERMINALS;
    if (g->rule_count >= max_rules) die("too many grammar rules");
    if (g->rule_count == g->rule_cap) {
        uint32_t new_cap = g->rule_cap > max_rules / 2 ? max_rules : g->rule_cap * 2;
        if (new_cap <= g->rule_cap) die("too many grammar rules");
        g->rule_cap = new_cap;
        g->rules = xrealloc_array(g->rules, g->rule_cap, sizeof(*g->rules));
    }
    uint32_t id = TERMINALS + g->rule_count;
    g->rules[g->rule_count++] = (Rule){left, right, a + b};
    return id;
}

static uint32_t slice_node(Grammar *g, uint32_t id, uint64_t start, uint64_t len) {
    uint64_t n = node_len(g, id);
    if (len == 0) return EMPTY_NODE;
    if (start > n || len > n - start) die("grammar slice out of range");
    if (start == 0 && len == n) return id;
    if (id < TERMINALS) die("invalid terminal slice");
    Rule r = g->rules[id - TERMINALS];
    uint64_t left_n = node_len(g, r.left);
    if (start >= left_n) return slice_node(g, r.right, start - left_n, len);
    if (len <= left_n - start) return slice_node(g, r.left, start, len);
    uint64_t a_n = left_n - start;
    uint32_t a = slice_node(g, r.left, start, a_n);
    uint32_t b = slice_node(g, r.right, 0, len - a_n);
    return concat_node(g, a, b);
}

static void forest_append(Grammar *g, uint32_t node) {
    uint32_t carry = node;
    unsigned rank = 0;
    while (rank < FOREST_BINS && g->used[rank]) {
        carry = concat_node(g, g->bins[rank], carry);
        g->used[rank] = 0;
        rank++;
    }
    if (rank == FOREST_BINS) die("too many output pieces");
    g->bins[rank] = carry;
    g->used[rank] = 1;
    uint64_t n = node_len(g, node);
    if (UINT64_MAX - g->total_len < n) die("expanded length overflow");
    g->total_len += n;
    g->pieces++;
}

static uint32_t forest_slice(Grammar *g, uint64_t start, uint64_t len) {
    if (len == 0) return EMPTY_NODE;
    if (start > g->total_len || len > g->total_len - start) die("output slice out of range");
    uint64_t pos = 0;
    uint64_t end = start + len;
    uint32_t out = EMPTY_NODE;
    for (int rank = FOREST_BINS - 1; rank >= 0; rank--) {
        if (!g->used[rank]) continue;
        uint32_t id = g->bins[rank];
        uint64_t n = node_len(g, id);
        uint64_t next = pos + n;
        if (next > start && pos < end) {
            uint64_t local_start = start > pos ? start - pos : 0;
            uint64_t local_end = end < next ? end - pos : n;
            uint32_t part = slice_node(g, id, local_start, local_end - local_start);
            out = concat_node(g, out, part);
        }
        pos = next;
        if (pos >= end) break;
    }
    if (out == EMPTY_NODE || node_len(g, out) != len) die("failed to construct output slice");
    return out;
}

static uint32_t repeat_node(Grammar *g, uint32_t base, uint64_t times) {
    uint32_t out = EMPTY_NODE;
    uint32_t power = base;
    while (times) {
        if (times & 1) out = concat_node(g, out, power);
        times >>= 1;
        if (times) power = concat_node(g, power, power);
    }
    return out;
}

static void append_literal(Grammar *g, uint8_t byte) {
    forest_append(g, (uint32_t)byte);
    g->literal_symbols++;
}

static void append_match(Grammar *g, uint64_t distance, uint64_t length) {
    if (distance == 0 || distance > g->total_len) die("invalid DEFLATE distance");
    uint32_t base = forest_slice(g, g->total_len - distance, distance);
    uint64_t q = length / distance;
    uint64_t r = length % distance;
    uint32_t out = repeat_node(g, base, q);
    if (r) {
        uint32_t tail = slice_node(g, base, 0, r);
        out = concat_node(g, out, tail);
    }
    if (out == EMPTY_NODE || node_len(g, out) != length) die("invalid DEFLATE match construction");
    forest_append(g, out);
    g->match_symbols++;
}

static unsigned forest_roots(const Grammar *g, uint32_t out[FOREST_BINS]) {
    unsigned n = 0;
    for (int rank = FOREST_BINS - 1; rank >= 0; rank--) if (g->used[rank]) out[n++] = g->bins[rank];
    return n;
}

static int br_read(BitReader *br, unsigned bits, uint32_t *out) {
    if (bits > 24) return 0;
    uint32_t v = 0;
    for (unsigned i = 0; i < bits; i++) {
        if (br->byte_pos >= br->size) return 0;
        uint32_t bit = (br->data[br->byte_pos] >> br->bit_pos) & 1u;
        v |= bit << i;
        br->bit_pos++;
        if (br->bit_pos == 8) { br->bit_pos = 0; br->byte_pos++; }
    }
    *out = v;
    return 1;
}

static int br_align(BitReader *br) {
    if (br->bit_pos) { br->bit_pos = 0; br->byte_pos++; }
    return br->byte_pos <= br->size;
}

static uint32_t reverse_bits(uint32_t code, unsigned bits) {
    uint32_t r = 0;
    for (unsigned i = 0; i < bits; i++) { r = (r << 1) | (code & 1u); code >>= 1; }
    return r;
}

static void huff_free(Huffman *h) {
    for (unsigned i = 0; i <= MAX_HUFF_BITS; i++) free(h->table[i]);
    memset(h, 0, sizeof(*h));
}

static int huff_build(Huffman *h, const uint8_t *lengths, unsigned count, char *err, size_t err_n) {
    memset(h, 0, sizeof(*h));
    unsigned counts[MAX_HUFF_BITS + 1] = {0};
    for (unsigned i = 0; i < count; i++) {
        if (lengths[i] > MAX_HUFF_BITS) { snprintf(err, err_n, "Huffman code too long"); return 0; }
        if (lengths[i]) { counts[lengths[i]]++; if (lengths[i] > h->max_bits) h->max_bits = lengths[i]; }
    }
    if (!h->max_bits) { h->empty = 1; return 1; }
    int left = 1;
    for (unsigned bits = 1; bits <= MAX_HUFF_BITS; bits++) {
        left <<= 1;
        left -= (int)counts[bits];
        if (left < 0) { snprintf(err, err_n, "oversubscribed Huffman tree"); return 0; }
    }
    uint32_t next[MAX_HUFF_BITS + 1] = {0};
    uint32_t code = 0;
    for (unsigned bits = 1; bits <= MAX_HUFF_BITS; bits++) {
        code = (code + counts[bits - 1]) << 1;
        next[bits] = code;
        if (counts[bits]) {
            size_t entries = (size_t)1u << bits;
            h->table[bits] = xmalloc(entries * sizeof(int16_t));
            for (size_t j = 0; j < entries; j++) h->table[bits][j] = -1;
        }
    }
    for (unsigned sym = 0; sym < count; sym++) {
        unsigned bits = lengths[sym];
        if (!bits) continue;
        uint32_t canonical = next[bits]++;
        uint32_t rev = reverse_bits(canonical, bits);
        if (h->table[bits][rev] != -1) { snprintf(err, err_n, "duplicate Huffman code"); huff_free(h); return 0; }
        h->table[bits][rev] = (int16_t)sym;
    }
    return 1;
}

static int huff_decode(BitReader *br, const Huffman *h, uint32_t *sym) {
    if (h->empty) return 0;
    uint32_t code = 0;
    for (unsigned bits = 1; bits <= h->max_bits; bits++) {
        uint32_t bit;
        if (!br_read(br, 1, &bit)) return 0;
        code |= bit << (bits - 1);
        if (h->table[bits] && h->table[bits][code] >= 0) {
            *sym = (uint32_t)h->table[bits][code];
            return 1;
        }
    }
    return 0;
}

static int build_fixed(Huffman *ll, Huffman *dd, char *err, size_t err_n) {
    uint8_t a[288], b[32];
    for (unsigned i = 0; i <= 143; i++) a[i] = 8;
    for (unsigned i = 144; i <= 255; i++) a[i] = 9;
    for (unsigned i = 256; i <= 279; i++) a[i] = 7;
    for (unsigned i = 280; i <= 287; i++) a[i] = 8;
    memset(b, 5, sizeof(b));
    if (!huff_build(ll, a, 288, err, err_n)) return 0;
    if (!huff_build(dd, b, 32, err, err_n)) { huff_free(ll); return 0; }
    return 1;
}

static int build_dynamic(BitReader *br, Huffman *ll, Huffman *dd, char *err, size_t err_n) {
    uint32_t x;
    if (!br_read(br, 5, &x)) goto trunc;
    unsigned hlit = x + 257;
    if (!br_read(br, 5, &x)) goto trunc;
    unsigned hdist = x + 1;
    if (!br_read(br, 4, &x)) goto trunc;
    unsigned hclen = x + 4;
    if (hlit > 286 || hdist > 32) { snprintf(err, err_n, "invalid dynamic Huffman counts"); return 0; }
    static const uint8_t order[19] = {16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15};
    uint8_t clen[19] = {0};
    for (unsigned i = 0; i < hclen; i++) {
        if (!br_read(br, 3, &x)) goto trunc;
        clen[order[i]] = (uint8_t)x;
    }
    Huffman ch;
    if (!huff_build(&ch, clen, 19, err, err_n)) return 0;
    unsigned total = hlit + hdist;
    uint8_t lens[318];
    unsigned n = 0;
    while (n < total) {
        uint32_t sym;
        if (!huff_decode(br, &ch, &sym)) { huff_free(&ch); goto trunc; }
        if (sym <= 15) {
            lens[n++] = (uint8_t)sym;
        } else if (sym == 16) {
            if (!n || !br_read(br, 2, &x)) { huff_free(&ch); goto trunc; }
            unsigned rep = x + 3;
            if (rep > total - n) { huff_free(&ch); snprintf(err, err_n, "code-length repeat overflow"); return 0; }
            uint8_t v = lens[n - 1];
            while (rep--) lens[n++] = v;
        } else if (sym == 17) {
            if (!br_read(br, 3, &x)) { huff_free(&ch); goto trunc; }
            unsigned rep = x + 3;
            if (rep > total - n) { huff_free(&ch); snprintf(err, err_n, "zero repeat overflow"); return 0; }
            while (rep--) lens[n++] = 0;
        } else if (sym == 18) {
            if (!br_read(br, 7, &x)) { huff_free(&ch); goto trunc; }
            unsigned rep = x + 11;
            if (rep > total - n) { huff_free(&ch); snprintf(err, err_n, "long zero repeat overflow"); return 0; }
            while (rep--) lens[n++] = 0;
        } else {
            huff_free(&ch); snprintf(err, err_n, "invalid code-length symbol"); return 0;
        }
    }
    huff_free(&ch);
    uint8_t llens[288] = {0}, dlens[32] = {0};
    memcpy(llens, lens, hlit);
    memcpy(dlens, lens + hlit, hdist);
    if (!llens[256]) { snprintf(err, err_n, "missing end-of-block code"); return 0; }
    if (!huff_build(ll, llens, 288, err, err_n)) return 0;
    if (!huff_build(dd, dlens, 32, err, err_n)) { huff_free(ll); return 0; }
    return 1;
trunc:
    snprintf(err, err_n, "truncated dynamic Huffman header");
    return 0;
}

static int decode_compressed_block(BitReader *br, Grammar *g, const Huffman *ll,
                                   const Huffman *dd, uint64_t output_limit,
                                   char *err, size_t err_n) {
    static const uint16_t len_base[29] = {3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258};
    static const uint8_t len_extra[29] = {0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0};
    static const uint16_t dist_base[30] = {1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577};
    static const uint8_t dist_extra[30] = {0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13};
    for (;;) {
        uint32_t sym;
        if (!huff_decode(br, ll, &sym)) { snprintf(err, err_n, "invalid literal/length code"); return 0; }
        if (sym < 256) {
            if (g->total_len >= output_limit) {
                snprintf(err, err_n, "DEFLATE output exceeds declared size");
                return 0;
            }
            append_literal(g, (uint8_t)sym);
        } else if (sym == 256) {
            return 1;
        } else if (sym <= 285) {
            unsigned li = sym - 257;
            uint32_t extra = 0;
            if (len_extra[li] && !br_read(br, len_extra[li], &extra)) { snprintf(err, err_n, "truncated length"); return 0; }
            uint64_t length = len_base[li] + extra;
            if (length > output_limit - g->total_len) {
                snprintf(err, err_n, "DEFLATE output exceeds declared size");
                return 0;
            }
            uint32_t dsym;
            if (!huff_decode(br, dd, &dsym) || dsym >= 30) { snprintf(err, err_n, "invalid distance code"); return 0; }
            extra = 0;
            if (dist_extra[dsym] && !br_read(br, dist_extra[dsym], &extra)) { snprintf(err, err_n, "truncated distance"); return 0; }
            uint64_t distance = dist_base[dsym] + extra;
            if (!distance || distance > g->total_len) { snprintf(err, err_n, "distance exceeds output prefix"); return 0; }
            append_match(g, distance, length);
        } else {
            snprintf(err, err_n, "reserved literal/length code");
            return 0;
        }
    }
}

static int deflate_to_grammar(const uint8_t *data, size_t n, uint64_t output_limit,
                              Grammar *g, char *err, size_t err_n) {
    BitReader br = {data, n, 0, 0};
    uint32_t final = 0;
    do {
        uint32_t type;
        if (!br_read(&br, 1, &final) || !br_read(&br, 2, &type)) { snprintf(err, err_n, "truncated DEFLATE block header"); return 0; }
        if (type == 0) {
            if (!br_align(&br) || br.byte_pos + 4 > br.size) { snprintf(err, err_n, "truncated stored block"); return 0; }
            uint16_t len = rd16(br.data + br.byte_pos), nlen = rd16(br.data + br.byte_pos + 2);
            br.byte_pos += 4;
            if ((uint16_t)(len ^ 0xffffu) != nlen) { snprintf(err, err_n, "stored-block length check failed"); return 0; }
            if (br.byte_pos + len > br.size) { snprintf(err, err_n, "truncated stored-block payload"); return 0; }
            if ((uint64_t)len > output_limit - g->total_len) {
                snprintf(err, err_n, "DEFLATE output exceeds declared size");
                return 0;
            }
            for (uint16_t i = 0; i < len; i++) append_literal(g, br.data[br.byte_pos + i]);
            br.byte_pos += len;
        } else if (type == 1 || type == 2) {
            Huffman ll, dd;
            int ok = type == 1 ? build_fixed(&ll, &dd, err, err_n) : build_dynamic(&br, &ll, &dd, err, err_n);
            if (!ok) return 0;
            ok = decode_compressed_block(&br, g, &ll, &dd, output_limit, err, err_n);
            huff_free(&ll); huff_free(&dd);
            if (!ok) return 0;
        } else {
            snprintf(err, err_n, "reserved DEFLATE block type");
            return 0;
        }
    } while (!final);
    size_t consumed = br.byte_pos + (br.bit_pos != 0u ? 1u : 0u);
    if (consumed != n) {
        snprintf(err, err_n, "trailing bytes after final DEFLATE block");
        return 0;
    }
    return 1;
}

static int zip_find_eocd(const uint8_t *data, size_t n, size_t *off) {
    if (n < 22) return 0;
    size_t start = n > 65557 ? n - 65557 : 0;
    for (size_t p = n - 22;; p--) {
        if (rd32(data + p) == UINT32_C(0x06054b50)) {
            uint16_t comment_len = rd16(data + p + 20);
            if ((size_t)comment_len == n - (p + 22u)) {
                *off = p;
                return 1;
            }
        }
        if (p == start) break;
    }
    return 0;
}

static void free_entries(ZipEntry *entries, uint16_t count) {
    if (!entries) return;
    for (uint16_t i = 0; i < count; i++) free(entries[i].name);
    free(entries);
}

static int zip_entries(const uint8_t *data, size_t n, ZipEntry **out,
                       uint16_t *count_out, size_t *cd_off_out,
                       char *err, size_t err_n) {
    size_t eocd;
    if (!zip_find_eocd(data, n, &eocd)) {
        snprintf(err, err_n, "ZIP end-of-central-directory not found");
        return 0;
    }

    uint16_t disk = rd16(data + eocd + 4);
    uint16_t cd_disk = rd16(data + eocd + 6);
    uint16_t disk_count = rd16(data + eocd + 8);
    uint16_t total = rd16(data + eocd + 10);
    uint32_t cd_size32 = rd32(data + eocd + 12);
    uint32_t cd_off32 = rd32(data + eocd + 16);
    if (disk || cd_disk || disk_count != total) {
        snprintf(err, err_n, "multi-disk ZIP is unsupported");
        return 0;
    }
    if (total == UINT16_MAX || cd_off32 == UINT32_MAX || cd_size32 == UINT32_MAX) {
        snprintf(err, err_n, "ZIP64 is unsupported");
        return 0;
    }

    size_t cd_off = (size_t)cd_off32;
    size_t cd_size = (size_t)cd_size32;
    size_t cd_end;
    if (!size_add_ok(cd_off, cd_size, &cd_end) || cd_end > eocd) {
        snprintf(err, err_n, "central directory out of range");
        return 0;
    }

    ZipEntry *entries = xcalloc(total ? total : 1, sizeof(*entries));
    size_t p = cd_off;
    for (uint16_t i = 0; i < total; i++) {
        if (p > cd_end || cd_end - p < 46u ||
            rd32(data + p) != UINT32_C(0x02014b50)) {
            free_entries(entries, i);
            snprintf(err, err_n, "invalid central directory entry");
            return 0;
        }

        uint16_t name_n = rd16(data + p + 28);
        uint16_t extra_n = rd16(data + p + 30);
        uint16_t comment_n = rd16(data + p + 32);
        size_t variable_n;
        size_t next;
        if (!size_add_ok((size_t)name_n, (size_t)extra_n, &variable_n) ||
            !size_add_ok(variable_n, (size_t)comment_n, &variable_n) ||
            !size_add_ok(p + 46u, variable_n, &next) || next > cd_end) {
            free_entries(entries, i);
            snprintf(err, err_n, "truncated central directory entry");
            return 0;
        }
        if (memchr(data + p + 46u, '\0', name_n) != NULL) {
            free_entries(entries, i);
            snprintf(err, err_n, "ZIP entry name contains a NUL byte");
            return 0;
        }
        if (rd16(data + p + 34) != 0) {
            free_entries(entries, i);
            snprintf(err, err_n, "multi-disk ZIP entry is unsupported");
            return 0;
        }

        entries[i].name_len = name_n;
        entries[i].flags = rd16(data + p + 8);
        entries[i].method = rd16(data + p + 10);
        entries[i].crc32 = rd32(data + p + 16);
        entries[i].compressed_size = rd32(data + p + 20);
        entries[i].uncompressed_size = rd32(data + p + 24);
        entries[i].local_offset = rd32(data + p + 42);
        if ((size_t)entries[i].local_offset >= cd_off) {
            free_entries(entries, i);
            snprintf(err, err_n, "local file header overlaps central directory");
            return 0;
        }
        entries[i].name = xstrndup((const char *)data + p + 46u, name_n);
        p = next;
    }

    if (p > cd_end) {
        free_entries(entries, total);
        snprintf(err, err_n, "central directory size mismatch");
        return 0;
    }
    *out = entries;
    *count_out = total;
    if (cd_off_out) *cd_off_out = cd_off;
    return 1;
}

static int zip_entry_data(const uint8_t *zip, size_t zip_n, size_t data_limit,
                          const ZipEntry *e, const uint8_t **payload,
                          size_t *payload_n, char *err, size_t err_n) {
    const uint16_t encryption_mask = (uint16_t)((1u << 0) | (1u << 6) | (1u << 13));
    size_t p = (size_t)e->local_offset;
    if (data_limit > zip_n) data_limit = zip_n;
    if (p > data_limit || data_limit - p < 30u ||
        rd32(zip + p) != UINT32_C(0x04034b50)) {
        snprintf(err, err_n, "invalid local file header");
        return 0;
    }

    uint16_t local_flags = rd16(zip + p + 6);
    uint16_t local_method = rd16(zip + p + 8);
    uint16_t name_n = rd16(zip + p + 26);
    uint16_t extra_n = rd16(zip + p + 28);
    if (local_flags != e->flags || local_method != e->method) {
        snprintf(err, err_n, "local and central ZIP metadata disagree");
        return 0;
    }
    if (e->flags & encryption_mask) {
        snprintf(err, err_n, "encrypted ZIP entries are unsupported");
        return 0;
    }
    if (e->flags & (1u << 5)) {
        snprintf(err, err_n, "patched ZIP entries are unsupported");
        return 0;
    }
    if (e->method != 0 && e->method != 8) {
        snprintf(err, err_n, "only stored and DEFLATE ZIP entries are supported");
        return 0;
    }

    size_t name_off = p + 30u;
    size_t data_off;
    size_t variable_n;
    if (!size_add_ok((size_t)name_n, (size_t)extra_n, &variable_n) ||
        !size_add_ok(name_off, variable_n, &data_off) || data_off > data_limit) {
        snprintf(err, err_n, "truncated local file header");
        return 0;
    }
    if (name_n != e->name_len || memcmp(zip + name_off, e->name, name_n) != 0) {
        snprintf(err, err_n, "local and central ZIP entry names disagree");
        return 0;
    }
    if ((size_t)e->compressed_size > data_limit - data_off) {
        snprintf(err, err_n, "compressed payload out of range");
        return 0;
    }

    if (!(e->flags & (1u << 3))) {
        uint32_t local_crc = rd32(zip + p + 14);
        uint32_t local_compressed = rd32(zip + p + 18);
        uint32_t local_uncompressed = rd32(zip + p + 22);
        if (local_crc != e->crc32 || local_compressed != e->compressed_size ||
            local_uncompressed != e->uncompressed_size) {
            snprintf(err, err_n, "local and central ZIP sizes or CRC disagree");
            return 0;
        }
    }

    *payload = zip + data_off;
    *payload_n = (size_t)e->compressed_size;
    return 1;
}

static int is_directory_name(const char *s) {
    size_t n = strlen(s);
    return n && (s[n - 1] == '/' || s[n - 1] == '\\');
}

static const ZipEntry *select_entry(const ZipEntry *entries, uint16_t count, const char *name) {
    if (name) {
        for (uint16_t i = 0; i < count; i++) if (strcmp(entries[i].name, name) == 0) return &entries[i];
        return NULL;
    }
    for (uint16_t i = 0; i < count; i++) if (!is_directory_name(entries[i].name)) return &entries[i];
    return NULL;
}

static int zip_to_grammar(const uint8_t *zip, size_t zip_n, const char *entry_name, Grammar *g, ZipEntry *selected, char *err, size_t err_n) {
    ZipEntry *entries = NULL;
    uint16_t count = 0;
    size_t cd_off = 0;
    if (!zip_entries(zip, zip_n, &entries, &count, &cd_off, err, err_n)) return 0;
    const ZipEntry *e = select_entry(entries, count, entry_name);
    if (!e) { free_entries(entries, count); snprintf(err, err_n, entry_name ? "ZIP entry not found" : "ZIP has no regular file entry"); return 0; }
    *selected = *e;
    selected->name = xstrndup(e->name, strlen(e->name));
    const uint8_t *payload;
    size_t payload_n;
    if (!zip_entry_data(zip, zip_n, cd_off, e, &payload, &payload_n, err, err_n)) { free(selected->name); selected->name = NULL; free_entries(entries, count); return 0; }
    grammar_init(g);
    int ok = 1;
    if (e->method == 0) {
        if (payload_n != (size_t)e->uncompressed_size) {
            snprintf(err, err_n, "stored ZIP entry has inconsistent sizes");
            ok = 0;
        } else {
            for (size_t i = 0; i < payload_n; i++) append_literal(g, payload[i]);
        }
    } else {
        ok = deflate_to_grammar(payload, payload_n, e->uncompressed_size, g, err, err_n);
    }
    if (ok && g->total_len != e->uncompressed_size) { snprintf(err, err_n, "expanded length does not match ZIP metadata"); ok = 0; }
    if (!ok) grammar_free(g);
    free_entries(entries, count);
    return ok;
}

static uint64_t byte_phrase_count(const Grammar *g, const uint8_t *pattern, uint32_t m, Stats *stats) {
    stats->logical_bytes = g->total_len;
    stats->grammar_nodes = TERMINALS + g->rule_count;
    stats->literals = g->literal_symbols;
    stats->matches = g->match_symbols;
    stats->node_state_evaluations = 0;
    if (!m) return 0;
    uint32_t *prefix = xcalloc(m, sizeof(*prefix));
    uint32_t j = 0;
    for (uint32_t i = 1; i < m; i++) {
        while (j && pattern[i] != pattern[j]) j = prefix[j - 1];
        if (pattern[i] == pattern[j]) j++;
        prefix[i] = j;
    }
    uint64_t nodes = (uint64_t)TERMINALS + g->rule_count;
    if (nodes > SIZE_MAX / m || (size_t)nodes * m > SIZE_MAX / sizeof(Transition)) die("transition table too large");
    Transition *tr = xmalloc_array((size_t)nodes * m, sizeof(*tr));
    for (uint32_t byte = 0; byte < TERMINALS; byte++) {
        for (uint32_t state0 = 0; state0 < m; state0++) {
            uint32_t state = state0;
            while (state && byte != pattern[state]) state = prefix[state - 1];
            if (byte == pattern[state]) state++;
            uint64_t hit = 0;
            if (state == m) { hit = 1; state = prefix[m - 1]; }
            tr[(size_t)byte * m + state0] = (Transition){state, hit};
        }
    }
    for (uint32_t r = 0; r < g->rule_count; r++) {
        uint32_t id = TERMINALS + r;
        Rule rule = g->rules[r];
        for (uint32_t state = 0; state < m; state++) {
            Transition a = tr[(size_t)rule.left * m + state];
            Transition b = tr[(size_t)rule.right * m + a.end_state];
            tr[(size_t)id * m + state] = (Transition){b.end_state, a.hits + b.hits};
        }
    }
    uint32_t roots[FOREST_BINS];
    unsigned root_n = forest_roots(g, roots);
    uint32_t state = 0;
    uint64_t hits = 0;
    for (unsigned i = 0; i < root_n; i++) {
        Transition t = tr[(size_t)roots[i] * m + state];
        state = t.end_state;
        hits += t.hits;
    }
    stats->node_state_evaluations = (nodes + root_n) * m;
    free(tr); free(prefix);
    return hits;
}

static int byte_is_word(uint8_t c) {
    return isalnum((unsigned char)c) || c == '_' || c >= 0x80;
}

static uint8_t ascii_lower(uint8_t c) {
    return c < 128 ? (uint8_t)tolower((unsigned char)c) : c;
}

static uint64_t exact_word_count_feature(const Grammar *g, const char *feature) {
    size_t m0 = strlen(feature);
    if (!m0 || m0 > UINT32_MAX - 2) return 0;
    uint32_t m = (uint32_t)m0;
    uint32_t states = m + 2;
    uint32_t mismatch = m + 1;
    uint64_t nodes = (uint64_t)TERMINALS + g->rule_count;
    if (nodes > SIZE_MAX / states || (size_t)nodes * states > SIZE_MAX / sizeof(Transition)) die("feature transition table too large");
    Transition *tr = xmalloc_array((size_t)nodes * states, sizeof(*tr));
    for (uint32_t byte = 0; byte < TERMINALS; byte++) {
        int word = byte_is_word((uint8_t)byte);
        uint8_t lower = ascii_lower((uint8_t)byte);
        for (uint32_t state = 0; state < states; state++) {
            uint32_t next;
            uint64_t hit = 0;
            if (!word) {
                hit = state == m;
                next = 0;
            } else if (state == 0) {
                next = lower == ascii_lower((uint8_t)feature[0]) ? 1 : mismatch;
            } else if (state < m) {
                next = lower == ascii_lower((uint8_t)feature[state]) ? state + 1 : mismatch;
            } else {
                next = mismatch;
            }
            tr[(size_t)byte * states + state] = (Transition){next, hit};
        }
    }
    for (uint32_t r = 0; r < g->rule_count; r++) {
        uint32_t id = TERMINALS + r;
        Rule rule = g->rules[r];
        for (uint32_t state = 0; state < states; state++) {
            Transition a = tr[(size_t)rule.left * states + state];
            Transition b = tr[(size_t)rule.right * states + a.end_state];
            tr[(size_t)id * states + state] = (Transition){b.end_state, a.hits + b.hits};
        }
    }
    uint32_t roots[FOREST_BINS];
    unsigned root_n = forest_roots(g, roots);
    uint32_t state = 0;
    uint64_t hits = 0;
    for (unsigned i = 0; i < root_n; i++) {
        Transition t = tr[(size_t)roots[i] * states + state];
        state = t.end_state;
        hits += t.hits;
    }
    if (state == m) hits++;
    free(tr);
    return hits;
}

static uint64_t grammar_word_count(const Grammar *g) {
    const uint32_t states = 2;
    uint64_t nodes = (uint64_t)TERMINALS + g->rule_count;
    Transition *tr = xmalloc_array((size_t)nodes * states, sizeof(*tr));
    for (uint32_t byte = 0; byte < TERMINALS; byte++) {
        int word = byte_is_word((uint8_t)byte);
        tr[(size_t)byte * states + 0] = (Transition){word ? 1u : 0u, word ? 1u : 0u};
        tr[(size_t)byte * states + 1] = (Transition){word ? 1u : 0u, 0};
    }
    for (uint32_t r = 0; r < g->rule_count; r++) {
        uint32_t id = TERMINALS + r;
        Rule rule = g->rules[r];
        for (uint32_t state = 0; state < states; state++) {
            Transition a = tr[(size_t)rule.left * states + state];
            Transition b = tr[(size_t)rule.right * states + a.end_state];
            tr[(size_t)id * states + state] = (Transition){b.end_state, a.hits + b.hits};
        }
    }
    uint32_t roots[FOREST_BINS];
    unsigned root_n = forest_roots(g, roots);
    uint32_t state = 0;
    uint64_t words = 0;
    for (unsigned i = 0; i < root_n; i++) {
        Transition t = tr[(size_t)roots[i] * states + state];
        state = t.end_state;
        words += t.hits;
    }
    free(tr);
    return words;
}

/*
 * Fixed-width byte 1/2/3-gram feature hashing over the grammar DAG.
 *
 * Every node stores only:
 *   - a 128-dimensional signed count vector,
 *   - its first two bytes,
 *   - its last two bytes,
 *   - its logical length.
 *
 * For A || B, all internal n-grams are already present in A and B.  The
 * parent adds only the bigram and two possible trigrams crossing the join.
 * Thus each grammar rule is evaluated once and plaintext is never expanded.
 */

static uint32_t ngram_hash(const uint8_t *bytes, unsigned n) {
    uint32_t h = UINT32_C(2166136261) ^ (UINT32_C(0x9e3779b9) * n);
    for (unsigned i = 0; i < n; i++) {
        h ^= bytes[i];
        h *= UINT32_C(16777619);
    }
    h ^= h >> 16;
    h *= UINT32_C(0x7feb352d);
    h ^= h >> 15;
    h *= UINT32_C(0x846ca68b);
    h ^= h >> 16;
    return h;
}

static void summary_add_ngram(NGramSummary *s, const uint8_t *bytes, unsigned n) {
    uint32_t h = ngram_hash(bytes, n);
    uint32_t slot = h & (EMBED_DIM - 1u);
    float sign = (h & UINT32_C(0x100)) ? -1.0f : 1.0f;
    s->value[slot] += sign;
}

static void summary_terminal(NGramSummary *s, uint8_t byte) {
    memset(s, 0, sizeof(*s));
    s->len = 1;
    s->prefix[0] = byte;
    s->suffix[0] = byte;
    s->prefix_len = 1;
    s->suffix_len = 1;
    summary_add_ngram(s, &byte, 1);
}

static void bytes_ngram_summary(const uint8_t *data, size_t n, NGramSummary *out) {
    memset(out, 0, sizeof(*out));
    out->len = n;
    size_t edge = n < EMBED_CONTEXT ? n : EMBED_CONTEXT;
    if (edge) {
        memcpy(out->prefix, data, edge);
        memcpy(out->suffix, data + n - edge, edge);
    }
    out->prefix_len = (uint8_t)edge;
    out->suffix_len = (uint8_t)edge;
    for (unsigned gram = 1; gram <= 3; gram++) {
        for (size_t i = 0; i + gram <= n; i++) summary_add_ngram(out, data + i, gram);
    }
}

static void summary_concat(NGramSummary *out, const NGramSummary *a,
                           const NGramSummary *b, EmbedStats *stats) {
    if (!a->len) { memcpy(out, b, sizeof(*out)); return; }
    if (!b->len) { memcpy(out, a, sizeof(*out)); return; }
    if (UINT64_MAX - a->len < b->len) die("embedding length overflow");

    /*
     * Attached exact composition kernel.
     *
     * The parent receives the two child sketches, then adds every 2-gram and
     * 3-gram that crosses A|B.  The generic boundary-window loop is exact for
     * one-byte children as well as longer children, avoiding assumptions such
     * as suffix_len >= 2 or prefix_len >= 2.
     */
    NGramSummary result;
    memset(&result, 0, sizeof(result));
    result.len = a->len + b->len;

    for (unsigned i = 0; i < EMBED_DIM; i++) {
        result.value[i] = a->value[i] + b->value[i];
    }

    uint8_t window[2u * EMBED_CONTEXT];
    const unsigned left_count = a->suffix_len;
    const unsigned right_count = b->prefix_len;
    const unsigned total = left_count + right_count;
    memcpy(window, a->suffix, left_count);
    memcpy(window + left_count, b->prefix, right_count);

    for (unsigned n = 2; n <= 3; n++) {
        for (unsigned begin = 0; begin + n <= total; begin++) {
            const unsigned finish = begin + n;
            if (begin < left_count && finish > left_count) {
                summary_add_ngram(&result, window + begin, n);
                if (stats) stats->cross_boundary_ngrams++;
            }
        }
    }

    /* Prefix of A||B. */
    unsigned copied = 0;
    unsigned take = a->prefix_len;
    if (take > EMBED_CONTEXT) take = EMBED_CONTEXT;
    if (take) memcpy(result.prefix, a->prefix, take);
    copied += take;
    if (copied < EMBED_CONTEXT) {
        take = b->prefix_len;
        if (take > EMBED_CONTEXT - copied) take = EMBED_CONTEXT - copied;
        if (take) memcpy(result.prefix + copied, b->prefix, take);
        copied += take;
    }
    result.prefix_len = (uint8_t)copied;

    /* Suffix of A||B, retained in natural byte order. */
    unsigned take_right = b->suffix_len;
    if (take_right > EMBED_CONTEXT) take_right = EMBED_CONTEXT;
    unsigned take_left = a->suffix_len;
    if (take_left > EMBED_CONTEXT - take_right) {
        take_left = EMBED_CONTEXT - take_right;
    }
    if (take_left) {
        memcpy(result.suffix,
               a->suffix + a->suffix_len - take_left,
               take_left);
    }
    if (take_right) {
        memcpy(result.suffix + take_left,
               b->suffix + b->suffix_len - take_right,
               take_right);
    }
    result.suffix_len = (uint8_t)(take_left + take_right);

    *out = result;
}

static void normalize_embedding(const NGramSummary *s, float out[EMBED_DIM]) {
    double grams = (double)s->len;
    if (s->len >= 2) grams += (double)(s->len - 1);
    if (s->len >= 3) grams += (double)(s->len - 2);
    float denom = log1pf((float)(grams > 0.0 ? grams : 1.0));
    if (denom < 1e-12f) denom = 1.0f;
    for (unsigned i = 0; i < EMBED_DIM; i++) {
        float v = s->value[i];
        float mag = log1pf(fabsf(v)) / denom;
        out[i] = v < 0.0f ? -mag : mag;
    }
}

static void grammar_ngram_summary(const Grammar *g, NGramSummary *out,
                                  EmbedStats *stats) {
    uint64_t node_count64 = (uint64_t)TERMINALS + g->rule_count;
    if (node_count64 > SIZE_MAX / sizeof(NGramSummary)) die("embedding table too large");
    size_t node_count = (size_t)node_count64;
    NGramSummary *memo = xmalloc_array(node_count, sizeof(*memo));
    if (stats) {
        memset(stats, 0, sizeof(*stats));
        stats->embedding_bytes = node_count64 * sizeof(*memo);
    }

    for (uint32_t byte = 0; byte < TERMINALS; byte++) {
        summary_terminal(&memo[byte], (uint8_t)byte);
    }
    for (uint32_t r = 0; r < g->rule_count; r++) {
        Rule rule = g->rules[r];
        summary_concat(&memo[TERMINALS + r], &memo[rule.left], &memo[rule.right], stats);
    }

    uint32_t roots[FOREST_BINS];
    unsigned root_n = forest_roots(g, roots);
    NGramSummary acc, tmp;
    memset(&acc, 0, sizeof(acc));
    for (unsigned i = 0; i < root_n; i++) {
        summary_concat(&tmp, &acc, &memo[roots[i]], stats);
        memcpy(&acc, &tmp, sizeof(acc));
    }
    if (acc.len != g->total_len) die("embedding root length mismatch");
    *out = acc;
    if (stats) stats->summaries_evaluated = node_count64 + root_n;
    free(memo);
}

static void grammar_ngram_embedding(const Grammar *g, float out[EMBED_DIM],
                                    EmbedStats *stats) {
    NGramSummary summary;
    grammar_ngram_summary(g, &summary, stats);
    normalize_embedding(&summary, out);
}


/* -------------------------------------------------------------------------
 * Experiment 2: bounded symbolic DEFLATE frontier.
 *
 * DEFLATE distances are bounded by 32768 bytes.  We therefore retain only a
 * symbolic grammar for the reachable suffix and fold older output into an
 * exact associative NGramSummary.  No complete plaintext buffer is created.
 * ------------------------------------------------------------------------- */
#define STREAM_WINDOW 32768u
#define STREAM_COMPACT_SLACK 4096u
#define AAA_DIM 8u

typedef struct {
    float a[256][AAA_DIM][AAA_DIM];
    float b[256][AAA_DIM];
    float h0[AAA_DIM];
    float w[AAA_DIM];
    float bias;
} FullAAAModel;

typedef struct {
    double a[AAA_DIM][AAA_DIM];
    double b[AAA_DIM];
} AAASummary;

typedef struct {
    uint32_t left, right;
    uint64_t len;
    NGramSummary summary;
    AAASummary aaa;
} StreamRule;

typedef struct {
    StreamRule *rules;
    uint32_t rule_count, rule_cap;
    uint32_t bins[FOREST_BINS];
    uint8_t used[FOREST_BINS];
    uint64_t window_len;
    uint64_t logical_len;
    uint64_t literal_symbols, match_symbols;
    uint64_t compactions;
    uint64_t peak_rules;
    uint64_t rules_created;
    NGramSummary global;
    const FullAAAModel *aaa_model;
    AAASummary global_aaa;
} StreamGrammar;

static void aaa_identity(AAASummary *x) {
    memset(x,0,sizeof(*x));
    for(unsigned i=0;i<AAA_DIM;i++) x->a[i][i]=1.0;
}
static void aaa_terminal(const FullAAAModel *m,uint8_t c,AAASummary *x) {
    for(unsigned i=0;i<AAA_DIM;i++) {
        x->b[i]=(double)m->b[c][i];
        for(unsigned j=0;j<AAA_DIM;j++) x->a[i][j]=(double)m->a[c][i][j];
    }
}
/* left then right: F_right(F_left(h)) */
static void aaa_concat(AAASummary *out,const AAASummary *left,const AAASummary *right) {
    AAASummary z; memset(&z,0,sizeof(z));
    for(unsigned i=0;i<AAA_DIM;i++) {
        double bv=right->b[i];
        for(unsigned k=0;k<AAA_DIM;k++) bv += right->a[i][k]*left->b[k];
        z.b[i]=bv;
        for(unsigned j=0;j<AAA_DIM;j++) {
            double v=0.0;
            for(unsigned k=0;k<AAA_DIM;k++) v += right->a[i][k]*left->a[k][j];
            z.a[i][j]=v;
        }
    }
    *out=z;
}
static void stream_init(StreamGrammar *g) {
    memset(g, 0, sizeof(*g));
    g->rule_cap = 1024;
    g->rules = xmalloc_array(g->rule_cap, sizeof(*g->rules));
    aaa_identity(&g->global_aaa);
}
static void stream_init_aaa(StreamGrammar *g,const FullAAAModel *m) { stream_init(g); g->aaa_model=m; }
static void stream_free(StreamGrammar *g) { free(g->rules); memset(g,0,sizeof(*g)); }
static uint64_t stream_node_len(const StreamGrammar *g, uint32_t id) {
    if (id < TERMINALS) return 1;
    uint32_t r=id-TERMINALS;
    if (r>=g->rule_count) die("invalid stream grammar node");
    return g->rules[r].len;
}
static void stream_node_summary(const StreamGrammar *g, uint32_t id, NGramSummary *out) {
    if (id < TERMINALS) { summary_terminal(out,(uint8_t)id); return; }
    uint32_t r=id-TERMINALS;
    if (r>=g->rule_count) die("invalid stream grammar summary node");
    *out=g->rules[r].summary;
}
static void stream_node_aaa(const StreamGrammar *g,uint32_t id,AAASummary *out) {
    if(!g->aaa_model){aaa_identity(out);return;}
    if(id<TERMINALS){aaa_terminal(g->aaa_model,(uint8_t)id,out);return;}
    uint32_t r=id-TERMINALS;if(r>=g->rule_count)die("invalid stream aaa node");*out=g->rules[r].aaa;
}
static uint32_t stream_concat_node(StreamGrammar *g, uint32_t left, uint32_t right) {
    if (left==EMPTY_NODE) return right;
    if (right==EMPTY_NODE) return left;
    uint64_t a=stream_node_len(g,left), b=stream_node_len(g,right);
    if (UINT64_MAX-a<b) die("stream expanded length overflow");
    if (g->rule_count==g->rule_cap) {
        if (g->rule_cap > (EMPTY_NODE-TERMINALS)/2u) die("too many stream rules");
        g->rule_cap*=2u;
        g->rules=xrealloc_array(g->rules,g->rule_cap,sizeof(*g->rules));
    }
    uint32_t id=TERMINALS+g->rule_count;
    StreamRule *r=&g->rules[g->rule_count++];
    r->left=left; r->right=right; r->len=a+b;
    NGramSummary sa,sb;
    stream_node_summary(g,left,&sa); stream_node_summary(g,right,&sb);
    summary_concat(&r->summary,&sa,&sb,NULL);
    if(g->aaa_model){AAASummary al,ar;stream_node_aaa(g,left,&al);stream_node_aaa(g,right,&ar);aaa_concat(&r->aaa,&al,&ar);}
    g->rules_created++;
    if (g->rule_count>g->peak_rules) g->peak_rules=g->rule_count;
    return id;
}
static uint32_t stream_slice_node(StreamGrammar *g,uint32_t id,uint64_t start,uint64_t len) {
    uint64_t n=stream_node_len(g,id);
    if (!len) return EMPTY_NODE;
    if (start>n || len>n-start) die("stream grammar slice out of range");
    if (!start && len==n) return id;
    if (id<TERMINALS) die("invalid stream terminal slice");
    StreamRule r=g->rules[id-TERMINALS];
    uint64_t ln=stream_node_len(g,r.left);
    if (start>=ln) return stream_slice_node(g,r.right,start-ln,len);
    if (len<=ln-start) return stream_slice_node(g,r.left,start,len);
    uint64_t an=ln-start;
    uint32_t x=stream_slice_node(g,r.left,start,an);
    uint32_t y=stream_slice_node(g,r.right,0,len-an);
    return stream_concat_node(g,x,y);
}
static void stream_forest_append_raw(StreamGrammar *g,uint32_t node) {
    uint32_t carry=node; unsigned rank=0;
    while(rank<FOREST_BINS && g->used[rank]) {
        carry=stream_concat_node(g,g->bins[rank],carry);
        g->used[rank]=0; rank++;
    }
    if(rank==FOREST_BINS) die("too many stream pieces");
    g->bins[rank]=carry; g->used[rank]=1;
    if(UINT64_MAX-g->window_len<stream_node_len(g,node)) die("stream window length overflow");
    g->window_len+=stream_node_len(g,node);
}
static uint32_t stream_forest_slice(StreamGrammar *g,uint64_t start,uint64_t len) {
    if(!len) return EMPTY_NODE;
    if(start>g->window_len || len>g->window_len-start) die("stream output slice out of range");
    uint64_t pos=0,end=start+len; uint32_t out=EMPTY_NODE;
    for(int rank=FOREST_BINS-1;rank>=0;rank--) {
        if(!g->used[rank]) continue;
        uint32_t id=g->bins[rank]; uint64_t n=stream_node_len(g,id),next=pos+n;
        if(next>start && pos<end) {
            uint64_t ls=start>pos?start-pos:0, le=end<next?end-pos:n;
            uint32_t part=stream_slice_node(g,id,ls,le-ls);
            out=stream_concat_node(g,out,part);
        }
        pos=next; if(pos>=end) break;
    }
    if(out==EMPTY_NODE || stream_node_len(g,out)!=len) die("failed stream slice");
    return out;
}
static uint32_t stream_repeat_node(StreamGrammar *g,uint32_t base,uint64_t times) {
    uint32_t out=EMPTY_NODE,power=base;
    while(times) {
        if(times&1u) out=stream_concat_node(g,out,power);
        times>>=1u;
        if(times) power=stream_concat_node(g,power,power);
    }
    return out;
}
static void stream_mark_reachable(const StreamGrammar *g,uint32_t root,uint8_t *mark) {
    if(root<TERMINALS) return;
    uint32_t cap=1024,n=0; uint32_t *stack=xmalloc_array(cap,sizeof(*stack));
    stack[n++]=root;
    while(n) {
        uint32_t id=stack[--n]; if(id<TERMINALS) continue;
        uint32_t r=id-TERMINALS; if(mark[r]) continue; mark[r]=1;
        StreamRule rr=g->rules[r];
        if(n+2>cap){cap*=2; stack=xrealloc_array(stack,cap,sizeof(*stack));}
        stack[n++]=rr.left; stack[n++]=rr.right;
    }
    free(stack);
}
static uint32_t stream_copy_reachable(const StreamGrammar *old,StreamGrammar *nw,uint32_t root) {
    if(root<TERMINALS) return root;
    uint8_t *mark=xcalloc(old->rule_count,sizeof(*mark));
    uint32_t *map=xmalloc_array(old->rule_count,sizeof(*map));
    for(uint32_t i=0;i<old->rule_count;i++) map[i]=EMPTY_NODE;
    stream_mark_reachable(old,root,mark);
    for(uint32_t r=0;r<old->rule_count;r++) if(mark[r]) {
        StreamRule rr=old->rules[r];
        uint32_t l=rr.left<TERMINALS?rr.left:map[rr.left-TERMINALS];
        uint32_t q=rr.right<TERMINALS?rr.right:map[rr.right-TERMINALS];
        if(l==EMPTY_NODE||q==EMPTY_NODE) die("stream copy order failure");
        map[r]=stream_concat_node(nw,l,q);
    }
    uint32_t out=map[root-TERMINALS];
    free(mark); free(map); return out;
}
static void stream_compact(StreamGrammar *g) {
    if(g->window_len<=STREAM_WINDOW+STREAM_COMPACT_SLACK) return;
    uint32_t suffix=stream_forest_slice(g,g->window_len-STREAM_WINDOW,STREAM_WINDOW);
    StreamGrammar nw; if(g->aaa_model) stream_init_aaa(&nw,g->aaa_model); else stream_init(&nw);
    uint32_t root=stream_copy_reachable(g,&nw,suffix);
    nw.bins[0]=root; nw.used[0]=1; nw.window_len=STREAM_WINDOW;
    nw.logical_len=g->logical_len; nw.literal_symbols=g->literal_symbols; nw.match_symbols=g->match_symbols;
    nw.compactions=g->compactions+1; nw.rules_created+=g->rules_created;
    if(g->peak_rules>nw.peak_rules) nw.peak_rules=g->peak_rules;
    nw.global=g->global; nw.global_aaa=g->global_aaa;
    free(g->rules); *g=nw;
}
static void stream_commit_piece(StreamGrammar *g,uint32_t node) {
    NGramSummary s,tmp; stream_node_summary(g,node,&s);
    summary_concat(&tmp,&g->global,&s,NULL); g->global=tmp;
    if(g->aaa_model){AAASummary piece,z;stream_node_aaa(g,node,&piece);aaa_concat(&z,&g->global_aaa,&piece);g->global_aaa=z;}
    stream_forest_append_raw(g,node);
    g->logical_len+=s.len;
    stream_compact(g);
}
static void stream_append_literal(StreamGrammar *g,uint8_t b) {
    stream_commit_piece(g,(uint32_t)b); g->literal_symbols++;
}
static void stream_append_match(StreamGrammar *g,uint64_t distance,uint64_t length) {
    if(!distance || distance>g->window_len || distance>STREAM_WINDOW) die("invalid bounded DEFLATE distance");
    uint32_t base=stream_forest_slice(g,g->window_len-distance,distance);
    uint64_t q=length/distance,r=length%distance;
    uint32_t out=stream_repeat_node(g,base,q);
    if(r){uint32_t tail=stream_slice_node(g,base,0,r); out=stream_concat_node(g,out,tail);}
    if(out==EMPTY_NODE || stream_node_len(g,out)!=length) die("invalid bounded match construction");
    stream_commit_piece(g,out); g->match_symbols++;
}
static int stream_decode_compressed_block(BitReader *br,StreamGrammar *g,const Huffman *ll,const Huffman *dd,uint64_t output_limit,char *err,size_t err_n) {
    static const uint16_t len_base[29]={3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258};
    static const uint8_t len_extra[29]={0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0};
    static const uint16_t dist_base[30]={1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577};
    static const uint8_t dist_extra[30]={0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13};
    for(;;){uint32_t sym;if(!huff_decode(br,ll,&sym)){snprintf(err,err_n,"invalid literal/length code");return 0;}
        if(sym<256){if(g->logical_len>=output_limit){snprintf(err,err_n,"DEFLATE output exceeds declared size");return 0;}stream_append_literal(g,(uint8_t)sym);}
        else if(sym==256)return 1;
        else if(sym<=285){unsigned li=sym-257;uint32_t extra=0;if(len_extra[li]&&!br_read(br,len_extra[li],&extra)){snprintf(err,err_n,"truncated length");return 0;}uint64_t length=len_base[li]+extra;if(length>output_limit-g->logical_len){snprintf(err,err_n,"DEFLATE output exceeds declared size");return 0;}uint32_t dsym;if(!huff_decode(br,dd,&dsym)||dsym>=30){snprintf(err,err_n,"invalid distance code");return 0;}extra=0;if(dist_extra[dsym]&&!br_read(br,dist_extra[dsym],&extra)){snprintf(err,err_n,"truncated distance");return 0;}uint64_t distance=dist_base[dsym]+extra;if(!distance||distance>g->logical_len||distance>STREAM_WINDOW){snprintf(err,err_n,"distance exceeds symbolic frontier");return 0;}stream_append_match(g,distance,length);}
        else {snprintf(err,err_n,"reserved literal/length code");return 0;}}
}
static int deflate_to_stream(const uint8_t *data,size_t n,uint64_t output_limit,StreamGrammar *g,char *err,size_t err_n) {
    BitReader br={data,n,0,0};uint32_t final=0;
    do {uint32_t type;if(!br_read(&br,1,&final)||!br_read(&br,2,&type)){snprintf(err,err_n,"truncated DEFLATE block header");return 0;}
        if(type==0){if(!br_align(&br)||br.byte_pos+4>br.size){snprintf(err,err_n,"truncated stored block");return 0;}uint16_t len=rd16(br.data+br.byte_pos),nlen=rd16(br.data+br.byte_pos+2);br.byte_pos+=4;if((uint16_t)(len^0xffffu)!=nlen){snprintf(err,err_n,"stored-block length check failed");return 0;}if(br.byte_pos+len>br.size){snprintf(err,err_n,"truncated stored-block payload");return 0;}if((uint64_t)len>output_limit-g->logical_len){snprintf(err,err_n,"DEFLATE output exceeds declared size");return 0;}for(uint16_t i=0;i<len;i++)stream_append_literal(g,br.data[br.byte_pos+i]);br.byte_pos+=len;}
        else if(type==1||type==2){Huffman ll,dd;int ok=type==1?build_fixed(&ll,&dd,err,err_n):build_dynamic(&br,&ll,&dd,err,err_n);if(!ok)return 0;ok=stream_decode_compressed_block(&br,g,&ll,&dd,output_limit,err,err_n);huff_free(&ll);huff_free(&dd);if(!ok)return 0;}
        else {snprintf(err,err_n,"reserved DEFLATE block type");return 0;}
    } while(!final);
    size_t consumed=br.byte_pos+(br.bit_pos!=0u?1u:0u);if(consumed!=n){snprintf(err,err_n,"trailing bytes after final DEFLATE block");return 0;}return 1;
}

typedef struct {
    NGramSummary summary;
    AAASummary aaa;
    uint64_t logical_bytes, literals, matches, compactions, peak_rules, rules_created, final_rules;
} StreamResult;

static int zip_stream_summary(const uint8_t *zip,size_t zip_n,const char *entry_name,const FullAAAModel *aaa_model,StreamResult *res,ZipEntry *selected,char *err,size_t err_n) {
    ZipEntry *entries=NULL;uint16_t count=0;size_t cd_off=0;
    if(!zip_entries(zip,zip_n,&entries,&count,&cd_off,err,err_n))return 0;
    const ZipEntry *e=select_entry(entries,count,entry_name);
    if(!e){free_entries(entries,count);snprintf(err,err_n,entry_name?"ZIP entry not found":"ZIP has no regular file entry");return 0;}
    *selected=*e;selected->name=xstrndup(e->name,strlen(e->name));
    const uint8_t *payload;size_t payload_n;
    if(!zip_entry_data(zip,zip_n,cd_off,e,&payload,&payload_n,err,err_n)){free(selected->name);selected->name=NULL;free_entries(entries,count);return 0;}
    StreamGrammar g;if(aaa_model)stream_init_aaa(&g,aaa_model);else stream_init(&g);int ok=1;
    if(e->method==0){if(payload_n!=(size_t)e->uncompressed_size){snprintf(err,err_n,"stored ZIP entry has inconsistent sizes");ok=0;}else for(size_t i=0;i<payload_n;i++)stream_append_literal(&g,payload[i]);}
    else ok=deflate_to_stream(payload,payload_n,e->uncompressed_size,&g,err,err_n);
    if(ok && g.logical_len!=e->uncompressed_size){snprintf(err,err_n,"expanded length does not match ZIP metadata");ok=0;}
    if(ok){res->summary=g.global;res->aaa=g.global_aaa;res->logical_bytes=g.logical_len;res->literals=g.literal_symbols;res->matches=g.match_symbols;res->compactions=g.compactions;res->peak_rules=g.peak_rules;res->rules_created=g.rules_created;res->final_rules=g.rule_count;}
    stream_free(&g);free_entries(entries,count);if(!ok){free(selected->name);selected->name=NULL;}return ok;
}


/* BGZF blocks are independently checked and discarded after summarization. */
static uint32_t crc32_table[256];
static int crc32_table_ready;

static void crc32_init_table(void) {
    if (crc32_table_ready) return;
    for (uint32_t i = 0; i < 256; i++) {
        uint32_t c = i;
        for (unsigned k = 0; k < 8; k++) {
            c = (c & 1u) ? (UINT32_C(0xedb88320) ^ (c >> 1)) : (c >> 1);
        }
        crc32_table[i] = c;
    }
    crc32_table_ready = 1;
}

static uint32_t crc32_update_state(uint32_t state, const uint8_t *data, size_t n) {
    crc32_init_table();
    for (size_t i = 0; i < n; i++) {
        state = crc32_table[(state ^ data[i]) & 0xffu] ^ (state >> 8);
    }
    return state;
}

static uint32_t crc32_bytes(const uint8_t *data, size_t n) {
    return crc32_update_state(UINT32_MAX, data, n) ^ UINT32_MAX;
}

static void grammar_crc32_node(const Grammar *g, uint32_t id, uint32_t *state) {
    if (id < TERMINALS) {
        uint8_t byte = (uint8_t)id;
        *state = crc32_update_state(*state, &byte, 1);
        return;
    }
    Rule r = g->rules[id - TERMINALS];
    grammar_crc32_node(g, r.left, state);
    grammar_crc32_node(g, r.right, state);
}

static uint32_t grammar_crc32(const Grammar *g) {
    uint32_t state = UINT32_MAX;
    uint32_t roots[FOREST_BINS];
    unsigned root_n = forest_roots(g, roots);
    for (unsigned i = 0; i < root_n; i++) grammar_crc32_node(g, roots[i], &state);
    return state ^ UINT32_MAX;
}

static int read_exact(FILE *f, uint8_t *dst, size_t n) {
    while (n) {
        size_t got = fread(dst, 1, n, f);
        if (!got) return 0;
        dst += got;
        n -= got;
    }
    return 1;
}

static int bgzf_parse_block(const uint8_t *data, size_t n, uint64_t compressed_offset,
                            BgzfBlock *block, char *err, size_t err_n) {
    if (n < 26u) { snprintf(err, err_n, "BGZF block is too short"); return 0; }
    if (data[0] != 31u || data[1] != 139u || data[2] != 8u) {
        snprintf(err, err_n, "invalid BGZF gzip header");
        return 0;
    }
    uint8_t flags = data[3];
    if (flags & 0xe0u) { snprintf(err, err_n, "reserved gzip flags are set"); return 0; }
    if (!(flags & 0x04u)) { snprintf(err, err_n, "BGZF FEXTRA flag is missing"); return 0; }

    size_t pos = 10u;
    if (pos + 2u > n) { snprintf(err, err_n, "truncated BGZF XLEN"); return 0; }
    uint16_t xlen = rd16(data + pos);
    pos += 2u;
    size_t extra_end;
    if (!size_add_ok(pos, xlen, &extra_end) || extra_end > n - 8u) {
        snprintf(err, err_n, "BGZF extra field is out of range");
        return 0;
    }

    int found_bc = 0;
    uint32_t declared_size = 0;
    size_t ep = pos;
    while (ep < extra_end) {
        if (extra_end - ep < 4u) { snprintf(err, err_n, "truncated BGZF extra subfield"); return 0; }
        uint8_t si1 = data[ep], si2 = data[ep + 1u];
        uint16_t slen = rd16(data + ep + 2u);
        ep += 4u;
        if ((size_t)slen > extra_end - ep) { snprintf(err, err_n, "BGZF extra subfield is out of range"); return 0; }
        if (si1 == 'B' && si2 == 'C') {
            if (found_bc || slen != 2u) { snprintf(err, err_n, "invalid BGZF BC subfield"); return 0; }
            declared_size = (uint32_t)rd16(data + ep) + 1u;
            found_bc = 1;
        }
        ep += slen;
    }
    if (!found_bc) { snprintf(err, err_n, "BGZF BC subfield is missing"); return 0; }
    if (declared_size != n || declared_size > BGZF_MAX_BLOCK_SIZE) {
        snprintf(err, err_n, "BGZF BSIZE does not match the block length");
        return 0;
    }
    pos = extra_end;

    if (flags & 0x08u) {
        while (pos < n - 8u && data[pos]) pos++;
        if (pos >= n - 8u) { snprintf(err, err_n, "unterminated BGZF file name"); return 0; }
        pos++;
    }
    if (flags & 0x10u) {
        while (pos < n - 8u && data[pos]) pos++;
        if (pos >= n - 8u) { snprintf(err, err_n, "unterminated BGZF comment"); return 0; }
        pos++;
    }
    if (flags & 0x02u) {
        if (pos + 2u > n - 8u) { snprintf(err, err_n, "truncated BGZF header CRC"); return 0; }
        uint16_t expected = rd16(data + pos);
        uint16_t actual = (uint16_t)crc32_bytes(data, pos);
        if (actual != expected) { snprintf(err, err_n, "BGZF header CRC mismatch"); return 0; }
        pos += 2u;
    }
    if (pos > n - 8u) { snprintf(err, err_n, "BGZF payload is out of range"); return 0; }

    uint32_t isize = rd32(data + n - 4u);
    if (isize > BGZF_MAX_BLOCK_SIZE) {
        snprintf(err, err_n, "BGZF uncompressed block is larger than 64 KiB");
        return 0;
    }
    block->compressed_offset = compressed_offset;
    block->compressed_size = (uint32_t)n;
    block->uncompressed_size = isize;
    block->crc32 = rd32(data + n - 8u);
    block->payload_offset = pos;
    block->payload_size = n - pos - 8u;
    return 1;
}

/* Returns 1 for a block, 0 for clean EOF, and -1 for an error. */
static int bgzf_read_block(FILE *f, uint64_t compressed_offset, uint8_t *buffer,
                           size_t *block_n, BgzfBlock *block, char *err, size_t err_n) {
    int first = fgetc(f);
    if (first == EOF) {
        if (ferror(f)) snprintf(err, err_n, "failed to read BGZF input");
        return ferror(f) ? -1 : 0;
    }
    buffer[0] = (uint8_t)first;
    if (!read_exact(f, buffer + 1u, 11u)) {
        snprintf(err, err_n, "truncated BGZF header");
        return -1;
    }
    if (buffer[0] != 31u || buffer[1] != 139u || buffer[2] != 8u) {
        snprintf(err, err_n, "invalid BGZF gzip header at offset %" PRIu64, compressed_offset);
        return -1;
    }
    if (!(buffer[3] & 0x04u)) {
        snprintf(err, err_n, "BGZF FEXTRA flag is missing at offset %" PRIu64, compressed_offset);
        return -1;
    }
    uint16_t xlen = rd16(buffer + 10u);
    size_t prefix_n = 12u + (size_t)xlen;
    if (prefix_n > BGZF_MAX_BLOCK_SIZE - 8u) {
        snprintf(err, err_n, "BGZF extra field is too large");
        return -1;
    }
    if (xlen && !read_exact(f, buffer + 12u, xlen)) {
        snprintf(err, err_n, "truncated BGZF extra field");
        return -1;
    }

    int found_bc = 0;
    uint32_t total_n = 0;
    size_t ep = 12u, extra_end = prefix_n;
    while (ep < extra_end) {
        if (extra_end - ep < 4u) { snprintf(err, err_n, "truncated BGZF extra subfield"); return -1; }
        uint16_t slen = rd16(buffer + ep + 2u);
        uint8_t si1 = buffer[ep], si2 = buffer[ep + 1u];
        ep += 4u;
        if ((size_t)slen > extra_end - ep) { snprintf(err, err_n, "BGZF extra subfield is out of range"); return -1; }
        if (si1 == 'B' && si2 == 'C') {
            if (found_bc || slen != 2u) { snprintf(err, err_n, "invalid BGZF BC subfield"); return -1; }
            total_n = (uint32_t)rd16(buffer + ep) + 1u;
            found_bc = 1;
        }
        ep += slen;
    }
    if (!found_bc) { snprintf(err, err_n, "BGZF BC subfield is missing"); return -1; }
    if (total_n < prefix_n + 8u || total_n > BGZF_MAX_BLOCK_SIZE) {
        snprintf(err, err_n, "invalid BGZF BSIZE");
        return -1;
    }
    size_t remaining = (size_t)total_n - prefix_n;
    if (!read_exact(f, buffer + prefix_n, remaining)) {
        snprintf(err, err_n, "truncated BGZF block");
        return -1;
    }
    if (!bgzf_parse_block(buffer, total_n, compressed_offset, block, err, err_n)) return -1;
    *block_n = total_n;
    return 1;
}

static int bgzf_decode_grammar(const uint8_t *block_data, const BgzfBlock *block,
                               Grammar *g, char *err, size_t err_n) {
    grammar_init(g);
    const uint8_t *payload = block_data + block->payload_offset;
    if (!deflate_to_grammar(payload, block->payload_size, block->uncompressed_size,
                            g, err, err_n)) {
        grammar_free(g);
        return 0;
    }
    if (g->total_len != block->uncompressed_size) {
        snprintf(err, err_n, "BGZF ISIZE does not match decoded length");
        grammar_free(g);
        return 0;
    }
    if (grammar_crc32(g) != block->crc32) {
        snprintf(err, err_n, "BGZF CRC32 mismatch");
        grammar_free(g);
        return 0;
    }
    return 1;
}

typedef int (*BgzfVisitor)(const BgzfBlock *block, const Grammar *grammar,
                           const NGramSummary *summary, const EmbedStats *embed_stats,
                           void *ctx, char *err, size_t err_n);

static int bgzf_walk_file(const char *path, BgzfVisitor visitor, void *ctx,
                          BgzfStats *stats, char *err, size_t err_n) {
    FILE *f = fopen(path, "rb");
    if (!f) { snprintf(err, err_n, "%s: %s", path, strerror(errno)); return 0; }
    uint8_t *buffer = xmalloc(BGZF_MAX_BLOCK_SIZE);
    uint64_t offset = 0;
    int saw_member = 0;
    if (stats) memset(stats, 0, sizeof(*stats));

    for (;;) {
        size_t block_n = 0;
        BgzfBlock block;
        int r = bgzf_read_block(f, offset, buffer, &block_n, &block, err, err_n);
        if (r == 0) break;
        if (r < 0) { free(buffer); fclose(f); return 0; }
        saw_member = 1;

        Grammar g;
        if (!bgzf_decode_grammar(buffer, &block, &g, err, err_n)) {
            char detail[192];
            snprintf(detail, sizeof(detail), "%s at compressed offset %" PRIu64, err, offset);
            snprintf(err, err_n, "%s", detail);
            free(buffer); fclose(f); return 0;
        }
        NGramSummary summary;
        EmbedStats es;
        grammar_ngram_summary(&g, &summary, &es);

        if (stats) {
            stats->compressed_bytes += block_n;
            if (block.uncompressed_size == 0u) stats->empty_blocks++;
            else stats->blocks++;
            stats->logical_bytes += block.uncompressed_size;
            uint64_t nodes = (uint64_t)TERMINALS + g.rule_count;
            stats->grammar_nodes += nodes;
            if (nodes > stats->max_block_grammar_nodes) stats->max_block_grammar_nodes = nodes;
            stats->literals += g.literal_symbols;
            stats->matches += g.match_symbols;
            stats->summaries_evaluated += es.summaries_evaluated;
            stats->cross_boundary_ngrams += es.cross_boundary_ngrams;
        }
        if (block.uncompressed_size != 0u && visitor &&
            !visitor(&block, &g, &summary, &es, ctx, err, err_n)) {
            grammar_free(&g); free(buffer); fclose(f); return 0;
        }
        grammar_free(&g);
        offset += block_n;
    }
    if (!saw_member) {
        snprintf(err, err_n, "BGZF input contains no members");
        fclose(f);
        free(buffer);
        return 0;
    }
    if (fclose(f) != 0) { snprintf(err, err_n, "failed to close BGZF input"); free(buffer); return 0; }
    free(buffer);
    return 1;
}

static void summary_forest_append(SummaryForest *forest, const NGramSummary *summary,
                                  EmbedStats *stats) {
    NGramSummary carry = *summary;
    unsigned rank = 0;
    while (rank < FOREST_BINS && forest->used[rank]) {
        NGramSummary merged;
        summary_concat(&merged, &forest->bins[rank], &carry, stats);
        carry = merged;
        forest->used[rank] = 0;
        rank++;
    }
    if (rank == FOREST_BINS) die("too many BGZF blocks");
    forest->bins[rank] = carry;
    forest->used[rank] = 1;
    forest->blocks++;
}

static void summary_forest_finish(const SummaryForest *forest, NGramSummary *out,
                                  EmbedStats *stats) {
    NGramSummary acc;
    memset(&acc, 0, sizeof(acc));
    for (int rank = FOREST_BINS - 1; rank >= 0; rank--) {
        if (!forest->used[rank]) continue;
        NGramSummary merged;
        summary_concat(&merged, &acc, &forest->bins[rank], stats);
        acc = merged;
    }
    *out = acc;
}

static float sigmoidf_stable(float z) {
    if (z >= 0.0f) return 1.0f / (1.0f + expf(-z));
    float e = expf(z);
    return e / (1.0f + e);
}

static float nn_forward(const NNModel *m, const float input[EMBED_DIM],
                        float hidden[NN_HIDDEN], float *score_out) {
    for (unsigned h = 0; h < NN_HIDDEN; h++) {
        float z = m->b1[h];
        for (unsigned i = 0; i < EMBED_DIM; i++) {
            float x = (input[i] - m->mean[i]) * m->inv_std[i];
            z += m->w1[h][i] * x;
        }
        hidden[h] = tanhf(z);
    }
    float z = m->b2;
    for (unsigned h = 0; h < NN_HIDDEN; h++) z += m->w2[h] * hidden[h];
    if (score_out) *score_out = z;
    return sigmoidf_stable(z);
}

static size_t nn_model_serialized_size(void) {
    return sizeof(NNHeader) + sizeof(NNModel);
}

static void save_nn_model(const char *path, const NNModel *m) {
    FILE *f = fopen(path, "wb");
    if (!f) die_errno(path);
    NNHeader h = {{'Z','N','N','1'}, NN_VERSION, EMBED_DIM, NN_HIDDEN, 3u, EMBED_CONTEXT};
    if (fwrite(&h, 1, sizeof(h), f) != sizeof(h) ||
        fwrite(m, 1, sizeof(*m), f) != sizeof(*m)) {
        fclose(f);
        die_errno("write neural model");
    }
    if (fclose(f) != 0) die_errno("close neural model");
}

static int nn_model_is_valid(const NNModel *m) {
    for (unsigned i = 0; i < EMBED_DIM; i++) {
        if (!isfinite(m->mean[i]) || !isfinite(m->inv_std[i]) || m->inv_std[i] <= 0.0f)
            return 0;
    }
    for (unsigned h = 0; h < NN_HIDDEN; h++) {
        if (!isfinite(m->b1[h]) || !isfinite(m->w2[h])) return 0;
        for (unsigned i = 0; i < EMBED_DIM; i++) {
            if (!isfinite(m->w1[h][i])) return 0;
        }
    }
    return isfinite(m->b2);
}

static NNModel load_nn_model(const char *path, size_t *size_out) {
    FILE *f = fopen(path, "rb");
    if (!f) die_errno(path);
    NNHeader h = {{0}, 0, 0, 0, 0, 0};
    NNModel m = {0};
    if (fread(&h, 1, sizeof(h), f) != sizeof(h) ||
        fread(&m, 1, sizeof(m), f) != sizeof(m)) {
        fclose(f);
        die("truncated neural model");
    }
    int extra = fgetc(f);
    fclose(f);
    if (memcmp(h.magic, "ZNN1", 4) != 0 || h.version != NN_VERSION ||
        h.input_dim != EMBED_DIM || h.hidden_dim != NN_HIDDEN ||
        h.max_ngram != 3u || h.boundary_context != EMBED_CONTEXT || extra != EOF) {
        die("incompatible neural model");
    }
    if (!nn_model_is_valid(&m)) die("neural model contains invalid numeric values");
    if (size_out) *size_out = nn_model_serialized_size();
    return m;
}

static uint32_t rng_next(uint32_t *state) {
    uint32_t x = *state;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    *state = x;
    return x;
}

static float rng_uniform(uint32_t *state) {
    return (float)(rng_next(state) >> 8) * (1.0f / 16777216.0f);
}


static void local_layer_init(LocalLayer *layer, uint32_t *seed) {
    memset(layer, 0, sizeof(*layer));
    float limit = sqrtf(6.0f / (LOCAL_INPUT_DIM + LOCAL_STATE_DIM));
    for (unsigned h = 0; h < LOCAL_STATE_DIM; h++) {
        for (unsigned i = 0; i < LOCAL_INPUT_DIM; i++) {
            layer->w_state[h][i] = (2.0f * rng_uniform(seed) - 1.0f) * limit;
        }
        layer->w_head[h] = (2.0f * rng_uniform(seed) - 1.0f) *
                           sqrtf(6.0f / (LOCAL_STATE_DIM + 1.0f));
    }
}

static float local_layer_forward(const LocalLayer *layer,
                                 const float input[LOCAL_INPUT_DIM],
                                 float state[LOCAL_STATE_DIM], float *score_out) {
    for (unsigned h = 0; h < LOCAL_STATE_DIM; h++) {
        float z = layer->b_state[h];
        for (unsigned i = 0; i < LOCAL_INPUT_DIM; i++) z += layer->w_state[h][i] * input[i];
        state[h] = tanhf(z);
    }
    float score = layer->b_head;
    for (unsigned h = 0; h < LOCAL_STATE_DIM; h++) score += layer->w_head[h] * state[h];
    if (score_out) *score_out = score;
    return sigmoidf_stable(score);
}

static float local_layer_train_one(LocalLayer *layer,
                                   const float input[LOCAL_INPUT_DIM], float target,
                                   float learning_rate, float l2, float sample_weight,
                                   float state_out[LOCAL_STATE_DIM], float *score_out) {
    float state[LOCAL_STATE_DIM];
    float score;
    float p = local_layer_forward(layer, input, state, &score);
    memcpy(state_out, state, sizeof(state));
    if (score_out) *score_out = score;
    float clipped = p < 1e-7f ? 1e-7f : (p > 1.0f - 1e-7f ? 1.0f - 1e-7f : p);
    float loss = -sample_weight * (target * logf(clipped) + (1.0f - target) * logf(1.0f - clipped));
    float dz = sample_weight * (p - target);

    float old_head[LOCAL_STATE_DIM];
    memcpy(old_head, layer->w_head, sizeof(old_head));
    for (unsigned h = 0; h < LOCAL_STATE_DIM; h++) {
        layer->w_head[h] -= learning_rate * (dz * state[h] + l2 * layer->w_head[h]);
    }
    layer->b_head -= learning_rate * dz;

    for (unsigned h = 0; h < LOCAL_STATE_DIM; h++) {
        float local_dz = dz * old_head[h] * (1.0f - state[h] * state[h]);
        for (unsigned i = 0; i < LOCAL_INPUT_DIM; i++) {
            layer->w_state[h][i] -= learning_rate *
                (local_dz * input[i] + l2 * layer->w_state[h][i]);
        }
        layer->b_state[h] -= learning_rate * local_dz;
    }
    return loss;
}

static void final_head_init(FinalHead *head, uint32_t *seed) {
    memset(head, 0, sizeof(*head));
    float limit = sqrtf(6.0f / (FINAL_INPUT_DIM + NN_HIDDEN));
    for (unsigned h = 0; h < NN_HIDDEN; h++) {
        for (unsigned i = 0; i < FINAL_INPUT_DIM; i++) {
            head->w1[h][i] = (2.0f * rng_uniform(seed) - 1.0f) * limit;
        }
        head->w2[h] = (2.0f * rng_uniform(seed) - 1.0f) *
                      sqrtf(6.0f / (NN_HIDDEN + 1.0f));
    }
}

static float final_head_forward(const FinalHead *head,
                                const float input[FINAL_INPUT_DIM],
                                float hidden[NN_HIDDEN], float *score_out) {
    for (unsigned h = 0; h < NN_HIDDEN; h++) {
        float z = head->b1[h];
        for (unsigned i = 0; i < FINAL_INPUT_DIM; i++) z += head->w1[h][i] * input[i];
        hidden[h] = tanhf(z);
    }
    float score = head->b2;
    for (unsigned h = 0; h < NN_HIDDEN; h++) score += head->w2[h] * hidden[h];
    if (score_out) *score_out = score;
    return sigmoidf_stable(score);
}

static float final_head_train_one(FinalHead *head,
                                  const float input[FINAL_INPUT_DIM], float target,
                                  float learning_rate, float l2,
                                  float *score_out) {
    float hidden[NN_HIDDEN];
    float score;
    float p = final_head_forward(head, input, hidden, &score);
    if (score_out) *score_out = score;
    float clipped = p < 1e-7f ? 1e-7f : (p > 1.0f - 1e-7f ? 1.0f - 1e-7f : p);
    float loss = -(target * logf(clipped) + (1.0f - target) * logf(1.0f - clipped));
    float dz2 = p - target;
    float old_w2[NN_HIDDEN];
    memcpy(old_w2, head->w2, sizeof(old_w2));
    for (unsigned h = 0; h < NN_HIDDEN; h++) {
        head->w2[h] -= learning_rate * (dz2 * hidden[h] + l2 * head->w2[h]);
    }
    head->b2 -= learning_rate * dz2;
    for (unsigned h = 0; h < NN_HIDDEN; h++) {
        float dz1 = dz2 * old_w2[h] * (1.0f - hidden[h] * hidden[h]);
        for (unsigned i = 0; i < FINAL_INPUT_DIM; i++) {
            head->w1[h][i] -= learning_rate * (dz1 * input[i] + l2 * head->w1[h][i]);
        }
        head->b1[h] -= learning_rate * dz1;
    }
    return loss;
}

static void local_model_init(LocalModel *model, uint32_t seed) {
    memset(model, 0, sizeof(*model));
    for (unsigned level = 0; level < LOCAL_LEVELS; level++) {
        local_layer_init(&model->layer[level], &seed);
    }
    final_head_init(&model->final_head, &seed);
}

static int local_model_is_valid(const LocalModel *model) {
    for (unsigned level = 0; level < LOCAL_LEVELS; level++) {
        const LocalLayer *layer = &model->layer[level];
        if (!isfinite(layer->b_head)) return 0;
        for (unsigned h = 0; h < LOCAL_STATE_DIM; h++) {
            if (!isfinite(layer->b_state[h]) || !isfinite(layer->w_head[h])) return 0;
            for (unsigned i = 0; i < LOCAL_INPUT_DIM; i++) {
                if (!isfinite(layer->w_state[h][i])) return 0;
            }
        }
    }
    const FinalHead *head = &model->final_head;
    if (!isfinite(head->b2)) return 0;
    for (unsigned h = 0; h < NN_HIDDEN; h++) {
        if (!isfinite(head->b1[h]) || !isfinite(head->w2[h])) return 0;
        for (unsigned i = 0; i < FINAL_INPUT_DIM; i++) {
            if (!isfinite(head->w1[h][i])) return 0;
        }
    }
    return 1;
}

static size_t local_model_serialized_size(void) {
    return sizeof(LocalModelHeader) + sizeof(LocalModel);
}

static void save_local_model(const char *path, const LocalModel *model) {
    FILE *f = fopen(path, "wb");
    if (!f) die_errno(path);
    LocalModelHeader header = {{'B','L','L','1'}, LOCAL_MODEL_VERSION,
        EMBED_DIM, LOCAL_STATE_DIM, LOCAL_LEVELS, 3u, EMBED_CONTEXT};
    if (fwrite(&header, 1, sizeof(header), f) != sizeof(header) ||
        fwrite(model, 1, sizeof(*model), f) != sizeof(*model)) {
        fclose(f);
        die_errno("write local model");
    }
    if (fclose(f) != 0) die_errno("close local model");
}

static LocalModel load_local_model(const char *path, size_t *size_out) {
    FILE *f = fopen(path, "rb");
    if (!f) die_errno(path);
    LocalModelHeader header = {{0}, 0, 0, 0, 0, 0, 0};
    LocalModel model = {0};
    if (fread(&header, 1, sizeof(header), f) != sizeof(header) ||
        fread(&model, 1, sizeof(model), f) != sizeof(model)) {
        fclose(f);
        die("truncated local model");
    }
    int extra = fgetc(f);
    fclose(f);
    if (memcmp(header.magic, "BLL1", 4) != 0 ||
        header.version != LOCAL_MODEL_VERSION ||
        header.embedding_dim != EMBED_DIM || header.state_dim != LOCAL_STATE_DIM ||
        header.levels != LOCAL_LEVELS || header.max_ngram != 3u ||
        header.boundary_context != EMBED_CONTEXT || extra != EOF) {
        die("incompatible local model");
    }
    if (!local_model_is_valid(&model)) die("local model contains invalid numeric values");
    if (size_out) *size_out = local_model_serialized_size();
    return model;
}

static void make_local_input(const NGramSummary *summary,
                             const float left[LOCAL_STATE_DIM],
                             const float right[LOCAL_STATE_DIM],
                             float input[LOCAL_INPUT_DIM]) {
    normalize_embedding(summary, input);
    for (unsigned h = 0; h < LOCAL_STATE_DIM; h++) {
        input[EMBED_DIM + h] = left ? left[h] : 0.0f;
        input[EMBED_DIM + LOCAL_STATE_DIM + h] = right ? right[h] : 0.0f;
    }
}

static float positive_local_weight(uint64_t blocks) {
    float x = blocks > 1000000u ? 1000000.0f : (float)blocks;
    float w = 1.0f - expf(-x / 8.0f);
    return w < 0.1f ? 0.1f : w;
}

static void local_emit_node(LocalRun *run, uint32_t rank,
                            const NGramSummary *summary,
                            const float left[LOCAL_STATE_DIM],
                            const float right[LOCAL_STATE_DIM],
                            uint64_t block_count, LocalNode *out) {
    if (rank >= LOCAL_LEVELS) die("BGZF hierarchy exceeds local model depth");
    float input[LOCAL_INPUT_DIM];
    make_local_input(summary, left, right, input);
    float score;
    if (run->training) {
        float weight = run->label ? positive_local_weight(block_count) : 1.0f;
        float loss = local_layer_train_one(&run->model->layer[rank], input,
            run->label ? 1.0f : 0.0f, run->learning_rate, run->l2, weight,
            out->state, &score);
        run->loss_sum += loss;
        run->loss_weight += weight;
    } else {
        (void)local_layer_forward(&run->model->layer[rank], input, out->state, &score);
    }
    out->summary = *summary;
    out->block_count = block_count;
    out->rank = rank;
    run->forest.nodes_emitted[rank]++;
    run->forest.score_sum[rank] += score;
    run->forest.score_count[rank]++;
}

static void local_forest_append(LocalRun *run, const NGramSummary *block_summary) {
    LocalNode carry;
    local_emit_node(run, 0, block_summary, NULL, NULL, 1u, &carry);
    unsigned rank = 0;
    while (rank < LOCAL_LEVELS && run->forest.used[rank]) {
        if (rank + 1u >= LOCAL_LEVELS) die("too many BGZF blocks for local hierarchy");
        LocalNode left = run->forest.bins[rank];
        NGramSummary merged;
        summary_concat(&merged, &left.summary, &carry.summary, NULL);
        run->forest.used[rank] = 0;
        local_emit_node(run, rank + 1u, &merged, left.state, carry.state,
                        left.block_count + carry.block_count, &carry);
        rank++;
    }
    run->forest.bins[rank] = carry;
    run->forest.used[rank] = 1;
}

static void local_run_finish(LocalRun *run, LocalResult *result) {
    NGramSummary full;
    memset(&full, 0, sizeof(full));
    double total_len = 0.0;
    double pooled[LOCAL_STATE_DIM] = {0};
    for (int rank = (int)LOCAL_LEVELS - 1; rank >= 0; rank--) {
        if (!run->forest.used[rank]) continue;
        LocalNode *node = &run->forest.bins[rank];
        NGramSummary merged;
        summary_concat(&merged, &full, &node->summary, NULL);
        full = merged;
        double weight = node->summary.len ? (double)node->summary.len : 1.0;
        total_len += weight;
        for (unsigned h = 0; h < LOCAL_STATE_DIM; h++) pooled[h] += weight * node->state[h];
    }
    float final_input[FINAL_INPUT_DIM];
    normalize_embedding(&full, final_input);
    for (unsigned h = 0; h < LOCAL_STATE_DIM; h++) {
        final_input[EMBED_DIM + h] = total_len > 0.0 ? (float)(pooled[h] / total_len) : 0.0f;
    }

    float final_score;
    float final_p;
    if (run->training) {
        float loss = final_head_train_one(&run->model->final_head, final_input,
            run->label ? 1.0f : 0.0f, run->learning_rate, run->l2, &final_score);
        run->loss_sum += loss;
        run->loss_weight += 1.0;
        float hidden[NN_HIDDEN];
        final_p = final_head_forward(&run->model->final_head, final_input, hidden, &final_score);
    } else {
        float hidden[NN_HIDDEN];
        final_p = final_head_forward(&run->model->final_head, final_input, hidden, &final_score);
    }

    double weighted_scores = 0.0, weights = 0.0;
    uint64_t local_nodes = 0;
    for (unsigned rank = 0; rank < LOCAL_LEVELS; rank++) {
        if (!run->forest.score_count[rank]) continue;
        double average = run->forest.score_sum[rank] / (double)run->forest.score_count[rank];
        double weight = 1.0 + (double)rank;
        weighted_scores += weight * average;
        weights += weight;
        local_nodes += run->forest.score_count[rank];
    }
    float local_score = weights > 0.0 ? (float)(weighted_scores / weights) : 0.0f;
    float score = 0.65f * final_score + 0.35f * local_score;
    result->summary = full;
    result->final_score = final_score;
    result->local_score = local_score;
    result->score = score;
    result->final_probability = final_p;
    result->local_probability = sigmoidf_stable(local_score);
    result->probability = sigmoidf_stable(score);
    result->local_nodes = local_nodes;
}

static int local_bgzf_visitor(const BgzfBlock *block, const Grammar *grammar,
                              const NGramSummary *summary, const EmbedStats *embed_stats,
                              void *ctx, char *err, size_t err_n) {
    (void)block; (void)grammar; (void)embed_stats; (void)err; (void)err_n;
    local_forest_append((LocalRun *)ctx, summary);
    return 1;
}

static int run_local_file(const char *path, LocalModel *model, int training,
                          uint8_t label, float learning_rate, float l2,
                          LocalResult *result, BgzfStats *stats,
                          double *loss_out, char *err, size_t err_n) {
    LocalRun run;
    memset(&run, 0, sizeof(run));
    run.model = model;
    run.training = (uint8_t)(training != 0);
    run.label = label;
    run.learning_rate = learning_rate;
    run.l2 = l2;
    if (!bgzf_walk_file(path, local_bgzf_visitor, &run, stats, err, err_n)) return 0;
    local_run_finish(&run, result);
    if (loss_out) *loss_out = run.loss_weight > 0.0 ? run.loss_sum / run.loss_weight : 0.0;
    return 1;
}

static void nn_init(NNModel *m, uint32_t seed) {
    memset(m, 0, sizeof(*m));
    for (unsigned i = 0; i < EMBED_DIM; i++) m->inv_std[i] = 1.0f;
    float limit = sqrtf(6.0f / (EMBED_DIM + NN_HIDDEN));
    for (unsigned h = 0; h < NN_HIDDEN; h++) {
        for (unsigned i = 0; i < EMBED_DIM; i++) {
            m->w1[h][i] = (2.0f * rng_uniform(&seed) - 1.0f) * limit;
        }
        m->w2[h] = (2.0f * rng_uniform(&seed) - 1.0f) * sqrtf(6.0f / (NN_HIDDEN + 1.0f));
    }
}

static void nn_fit_standardization(NNModel *m, const float *x, size_t samples) {
    for (unsigned i = 0; i < EMBED_DIM; i++) {
        double sum = 0.0;
        for (size_t s = 0; s < samples; s++) sum += x[s * EMBED_DIM + i];
        double mean = sum / (double)samples;
        double var = 0.0;
        for (size_t s = 0; s < samples; s++) {
            double d = x[s * EMBED_DIM + i] - mean;
            var += d * d;
        }
        var /= (double)samples;
        m->mean[i] = (float)mean;
        m->inv_std[i] = var > 1e-8 ? (float)(1.0 / sqrt(var + 1e-6)) : 1.0f;
    }
}

static float nn_train_epoch(NNModel *m, const float *x, const uint8_t *y,
                            size_t samples, size_t *order, float learning_rate,
                            float l2, uint32_t *rng) {
    for (size_t i = samples; i > 1; i--) {
        size_t j = rng_next(rng) % i;
        size_t t = order[i - 1]; order[i - 1] = order[j]; order[j] = t;
    }
    double loss = 0.0;
    for (size_t oi = 0; oi < samples; oi++) {
        size_t s = order[oi];
        const float *raw = x + s * EMBED_DIM;
        float xs[EMBED_DIM];
        for (unsigned i = 0; i < EMBED_DIM; i++) xs[i] = (raw[i] - m->mean[i]) * m->inv_std[i];

        float hidden[NN_HIDDEN];
        float score;
        float p = nn_forward(m, raw, hidden, &score);
        float target = y[s] ? 1.0f : 0.0f;
        float clipped = p < 1e-7f ? 1e-7f : (p > 1.0f - 1e-7f ? 1.0f - 1e-7f : p);
        loss += -(target * logf(clipped) + (1.0f - target) * logf(1.0f - clipped));
        float dz2 = p - target;

        float old_w2[NN_HIDDEN];
        memcpy(old_w2, m->w2, sizeof(old_w2));
        for (unsigned h = 0; h < NN_HIDDEN; h++) {
            m->w2[h] -= learning_rate * (dz2 * hidden[h] + l2 * m->w2[h]);
        }
        m->b2 -= learning_rate * dz2;

        for (unsigned h = 0; h < NN_HIDDEN; h++) {
            float dz1 = dz2 * old_w2[h] * (1.0f - hidden[h] * hidden[h]);
            for (unsigned i = 0; i < EMBED_DIM; i++) {
                m->w1[h][i] -= learning_rate * (dz1 * xs[i] + l2 * m->w1[h][i]);
            }
            m->b1[h] -= learning_rate * dz1;
        }
    }
    return (float)(loss / (double)samples);
}

static const char *skip_ws(const char *p) { while (*p && isspace((unsigned char)*p)) p++; return p; }

static const char *find_json_key(const char *json, const char *key) {
    char needle[128];
    snprintf(needle, sizeof(needle), "\"%s\"", key);
    const char *p = strstr(json, needle);
    if (!p) return NULL;
    p += strlen(needle);
    p = skip_ws(p);
    if (*p != ':') return NULL;
    return skip_ws(p + 1);
}

static char *parse_json_string(const char **pp) {
    const char *p = skip_ws(*pp);
    if (*p != '"') return NULL;
    p++;
    size_t cap = 32, n = 0;
    char *out = xmalloc(cap);
    while (*p && *p != '"') {
        unsigned char c = (unsigned char)*p++;
        if (c == '\\') {
            if (!*p) { free(out); return NULL; }
            c = (unsigned char)*p++;
            switch (c) {
                case 'n': c = '\n'; break; case 'r': c = '\r'; break; case 't': c = '\t'; break;
                case 'b': c = '\b'; break; case 'f': c = '\f'; break;
                case '"': case '\\': case '/': break;
                default: free(out); return NULL;
            }
        } else if (c < 0x20u) {
            free(out);
            return NULL;
        }
        if (n + 1 >= cap) {
            if (cap > SIZE_MAX / 2) { free(out); return NULL; }
            cap *= 2;
            out = xrealloc(out, cap);
        }
        out[n++] = (char)c;
    }
    if (*p != '"') { free(out); return NULL; }
    out[n] = '\0';
    *pp = p + 1;
    return out;
}

static int parse_model_json(const char *json, Model *m) {
    memset(m, 0, sizeof(*m));
    const char *p = find_json_key(json, "features");
    if (!p || *p != '[') goto fail;
    p++;

    size_t cap = 32;
    m->features = xmalloc_array(cap, sizeof(*m->features));
    for (;;) {
        p = skip_ws(p);
        if (*p == ']') { p++; break; }
        if (m->count == cap) {
            if (cap > SIZE_MAX / 2) goto fail;
            cap *= 2;
            m->features = xrealloc_array(m->features, cap, sizeof(*m->features));
        }
        char *feature = parse_json_string(&p);
        if (!feature || !*feature) {
            free(feature);
            goto fail;
        }
        m->features[m->count++] = feature;
        p = skip_ws(p);
        if (*p == ',') { p++; continue; }
        if (*p == ']') { p++; break; }
        goto fail;
    }

    p = find_json_key(json, "weights");
    if (!p || *p != '[') goto fail;
    p++;
    m->weights = xmalloc_array(m->count ? m->count : 1, sizeof(*m->weights));
    size_t wi = 0;
    for (;;) {
        p = skip_ws(p);
        if (*p == ']') { p++; break; }
        if (wi >= m->count) goto fail;
        char *end;
        errno = 0;
        double v = strtod(p, &end);
        if (end == p || errno == ERANGE || !isfinite(v)) goto fail;
        m->weights[wi++] = v;
        p = skip_ws(end);
        if (*p == ',') { p++; continue; }
        if (*p == ']') { p++; break; }
        goto fail;
    }
    if (wi != m->count) goto fail;

    p = find_json_key(json, "bias");
    if (!p) goto fail;
    char *end;
    errno = 0;
    m->bias = strtod(p, &end);
    if (end == p || errno == ERANGE || !isfinite(m->bias)) goto fail;
    return 1;

fail:
    for (size_t i = 0; i < m->count; i++) free(m->features ? m->features[i] : NULL);
    free(m->features);
    free(m->weights);
    memset(m, 0, sizeof(*m));
    return 0;
}

static void free_model(Model *m) {
    if (!m) return;
    for (size_t i = 0; i < m->count; i++) free(m->features[i]);
    free(m->features); free(m->weights); memset(m, 0, sizeof(*m));
}

static Model load_model(const char *path, size_t *size_out) {
    size_t n;
    uint8_t *data = read_file(path, &n);
    Model m;
    if (!parse_model_json((const char *)data, &m)) { free(data); die("invalid model JSON"); }
    free(data);
    if (size_out) *size_out = n;
    return m;
}

static double classify(const Grammar *g, const Model *m, double *score_out) {
    uint64_t words = grammar_word_count(g);
    double denom = log1p((double)(words ? words : 1));
    double z = m->bias;
    for (size_t i = 0; i < m->count; i++) {
        uint64_t count = exact_word_count_feature(g, m->features[i]);
        z += m->weights[i] * (log1p((double)count) / denom);
    }
    double p;
    if (z >= 0) p = 1.0 / (1.0 + exp(-z));
    else { double e = exp(z); p = e / (1.0 + e); }
    if (score_out) *score_out = z;
    return p;
}

static void json_string(const char *s) {
    putchar('"');
    for (; *s; s++) {
        unsigned char c = (unsigned char)*s;
        if (c == '"' || c == '\\') { putchar('\\'); putchar(c); }
        else if (c == '\n') fputs("\\n", stdout);
        else if (c == '\r') fputs("\\r", stdout);
        else if (c == '\t') fputs("\\t", stdout);
        else if (c < 32) printf("\\u%04x", c);
        else putchar(c);
    }
    putchar('"');
}

static int load_zip_grammar(const char *zip_path, const char *entry_name, uint8_t **zip_out, size_t *zip_n_out, Grammar *g, ZipEntry *e) {
    size_t zip_n;
    uint8_t *zip = read_file(zip_path, &zip_n);
    char err[160];
    if (!zip_to_grammar(zip, zip_n, entry_name, g, e, err, sizeof(err))) {
        free(zip);
        fprintf(stderr, "error: %s\n", err);
        return 0;
    }
    *zip_out = zip;
    *zip_n_out = zip_n;
    return 1;
}

typedef struct {
    uint8_t label;
    char *zip_path;
    char *entry;
} TrainSample;

static void free_train_samples(TrainSample *samples, size_t count) {
    for (size_t i = 0; i < count; i++) {
        free(samples[i].zip_path);
        free(samples[i].entry);
    }
    free(samples);
}

static char *manifest_dir(const char *path) {
    const char *slash = strrchr(path, '/');
    if (!slash) return xstrndup(".", 1);
    if (slash == path) return xstrndup("/", 1);
    return xstrndup(path, (size_t)(slash - path));
}

static int path_is_absolute(const char *path) {
    return path[0] == '/';
}

static char *join_manifest_path(const char *dir, const char *path) {
    if (path_is_absolute(path)) return xstrndup(path, strlen(path));
    size_t a = strlen(dir), b = strlen(path), bytes;
    if (!size_add_ok(a, b, &bytes) || !size_add_ok(bytes, 2, &bytes))
        die("manifest path is too long");
    char *out = xmalloc(bytes);
    memcpy(out, dir, a);
    out[a] = '/';
    memcpy(out + a + 1, path, b + 1);
    return out;
}

static TrainSample *load_manifest(const char *path, size_t *count_out) {
    FILE *f = fopen(path, "r");
    if (!f) die_errno(path);
    char *dir = manifest_dir(path);
    TrainSample *samples = NULL;
    size_t count = 0, cap = 0;
    char *line = NULL;
    size_t line_cap = 0;
    ssize_t n;
    unsigned line_no = 0;
    while ((n = getline(&line, &line_cap, f)) >= 0) {
        line_no++;
        while (n && (line[n - 1] == '\n' || line[n - 1] == '\r')) line[--n] = '\0';
        char *p = line;
        while (*p && isspace((unsigned char)*p) && *p != '\t') p++;
        if (!*p || *p == '#') continue;
        char *tab1 = strchr(p, '\t');
        if (!tab1) {
            fprintf(stderr, "error: %s:%u: expected LABEL<TAB>INPUT_PATH[<TAB>ENTRY]\n", path, line_no);
            exit(1);
        }
        *tab1 = '\0';
        char *zip_field = tab1 + 1;
        char *tab2 = strchr(zip_field, '\t');
        char *entry_field = NULL;
        if (tab2) {
            *tab2 = '\0';
            entry_field = tab2 + 1;
        }
        if ((strcmp(p, "0") != 0 && strcmp(p, "1") != 0) || !*zip_field) {
            fprintf(stderr, "error: %s:%u: invalid label or input path\n", path, line_no);
            exit(1);
        }
        if (count == cap) {
            cap = cap ? cap * 2 : 16;
            samples = xrealloc_array(samples, cap, sizeof(*samples));
        }
        samples[count].label = (uint8_t)(p[0] - '0');
        samples[count].zip_path = join_manifest_path(dir, zip_field);
        samples[count].entry = entry_field && *entry_field && strcmp(entry_field, "-") != 0
            ? xstrndup(entry_field, strlen(entry_field)) : NULL;
        count++;
    }
    if (ferror(f)) die_errno("read training manifest");
    free(line);
    free(dir);
    fclose(f);
    if (!count) die("training manifest is empty");
    *count_out = count;
    return samples;
}


typedef struct {
    SummaryForest forest;
    EmbedStats reduction_stats;
} BgzfSummaryRun;

static int bgzf_summary_visitor(const BgzfBlock *block, const Grammar *grammar,
                                const NGramSummary *summary, const EmbedStats *embed_stats,
                                void *ctx, char *err, size_t err_n) {
    (void)block; (void)grammar; (void)embed_stats; (void)err; (void)err_n;
    BgzfSummaryRun *run = (BgzfSummaryRun *)ctx;
    summary_forest_append(&run->forest, summary, &run->reduction_stats);
    return 1;
}

static int cmd_bgzf_inspect(const char *path) {
    BgzfStats stats;
    char err[192];
    if (!bgzf_walk_file(path, NULL, NULL, &stats, err, sizeof(err))) {
        fprintf(stderr, "error: %s\n", err);
        return 1;
    }
    printf("{\"format\":\"BGZF\",\"compressed_bytes\":%" PRIu64
           ",\"blocks\":%" PRIu64 ",\"empty_blocks\":%" PRIu64
           ",\"logical_bytes\":%" PRIu64 ",\"grammar_nodes_total\":%" PRIu64
           ",\"max_block_grammar_nodes\":%" PRIu64
           ",\"literal_symbols\":%" PRIu64 ",\"match_symbols\":%" PRIu64
           ",\"summaries_evaluated\":%" PRIu64
           ",\"cross_boundary_ngrams_within_blocks\":%" PRIu64 "}\n",
           stats.compressed_bytes, stats.blocks, stats.empty_blocks,
           stats.logical_bytes, stats.grammar_nodes, stats.max_block_grammar_nodes,
           stats.literals, stats.matches, stats.summaries_evaluated,
           stats.cross_boundary_ngrams);
    return 0;
}

static int cmd_bgzf_embed(const char *path) {
    BgzfSummaryRun run;
    memset(&run, 0, sizeof(run));
    BgzfStats stats;
    char err[192];
    if (!bgzf_walk_file(path, bgzf_summary_visitor, &run, &stats, err, sizeof(err))) {
        fprintf(stderr, "error: %s\n", err);
        return 1;
    }
    NGramSummary full;
    summary_forest_finish(&run.forest, &full, &run.reduction_stats);
    if (full.len != stats.logical_bytes) die("BGZF summary length mismatch");
    float embedding[EMBED_DIM];
    normalize_embedding(&full, embedding);
    unsigned nonzero = 0;
    double l2 = 0.0;
    for (unsigned i = 0; i < EMBED_DIM; i++) {
        if (embedding[i] != 0.0f) nonzero++;
        l2 += (double)embedding[i] * embedding[i];
    }
    printf("{\"format\":\"BGZF\",\"compressed_bytes\":%" PRIu64
           ",\"blocks\":%" PRIu64 ",\"empty_blocks\":%" PRIu64
           ",\"logical_bytes\":%" PRIu64 ",\"embedding_dim\":%u"
           ",\"nonzero\":%u,\"l2_norm\":%.9f"
           ",\"block_reduction_cross_boundary_ngrams\":%" PRIu64
           ",\"embedding\":[",
           stats.compressed_bytes, stats.blocks, stats.empty_blocks,
           stats.logical_bytes, EMBED_DIM, nonzero, sqrt(l2),
           run.reduction_stats.cross_boundary_ngrams);
    for (unsigned i = 0; i < EMBED_DIM; i++) {
        if (i) putchar(',');
        printf("%.9g", embedding[i]);
    }
    puts("]}");
    return 0;
}

static int cmd_bgzf_local_classify(const char *path, const char *model_path) {
    size_t model_n;
    LocalModel model = load_local_model(model_path, &model_n);
    LocalResult result;
    BgzfStats stats;
    char err[192];
    if (!run_local_file(path, &model, 0, 0, 0.0f, 0.0f,
                        &result, &stats, NULL, err, sizeof(err))) {
        fprintf(stderr, "error: %s\n", err);
        return 1;
    }
    printf("{\"format\":\"BGZF\",\"prediction\":%d"
           ",\"probability\":%.12f,\"score\":%.12f"
           ",\"final_probability\":%.12f,\"final_score\":%.12f"
           ",\"local_probability\":%.12f,\"local_score\":%.12f"
           ",\"blocks\":%" PRIu64 ",\"empty_blocks\":%" PRIu64
           ",\"logical_bytes\":%" PRIu64 ",\"compressed_bytes\":%" PRIu64
           ",\"local_nodes\":%" PRIu64 ",\"model_bytes\":%zu}\n",
           result.probability >= 0.5f, result.probability, result.score,
           result.final_probability, result.final_score,
           result.local_probability, result.local_score,
           stats.blocks, stats.empty_blocks, stats.logical_bytes,
           stats.compressed_bytes, result.local_nodes, model_n);
    return 0;
}

static int cmd_bgzf_local_train(const char *manifest_path, const char *model_path,
                                unsigned epochs) {
    size_t count;
    TrainSample *samples = load_manifest(manifest_path, &count);
    size_t positives = 0;
    for (size_t i = 0; i < count; i++) {
        if (samples[i].entry) die("BGZF training rows must not include a ZIP entry field");
        positives += samples[i].label != 0;
    }
    if (!positives || positives == count) die("training set must contain both labels");

    LocalModel model;
    local_model_init(&model, UINT32_C(0x7b6a5d4c));
    size_t *order = xmalloc_array(count, sizeof(*order));
    for (size_t i = 0; i < count; i++) order[i] = i;
    uint32_t rng = UINT32_C(0x51a7e9d3);
    double last_epoch_loss = 0.0;

    for (unsigned epoch = 0; epoch < epochs; epoch++) {
        for (size_t i = count; i > 1; i--) {
            size_t j = (size_t)rng_next(&rng) % i;
            size_t t = order[i - 1u]; order[i - 1u] = order[j]; order[j] = t;
        }
        float lr = 0.01f / sqrtf(1.0f + (float)epoch / 25.0f);
        double epoch_loss = 0.0;
        for (size_t oi = 0; oi < count; oi++) {
            size_t s = order[oi];
            LocalResult result;
            BgzfStats stats;
            double sample_loss;
            char err[192];
            if (!run_local_file(samples[s].zip_path, &model, 1, samples[s].label,
                                lr, 1e-5f, &result, &stats, &sample_loss,
                                err, sizeof(err))) {
                fprintf(stderr, "error: training sample %zu: %s\n", s + 1u, err);
                free(order); free_train_samples(samples, count);
                return 1;
            }
            epoch_loss += sample_loss;
        }
        last_epoch_loss = epoch_loss / (double)count;
    }

    size_t correct = 0, final_correct = 0;
    double final_loss = 0.0;
    uint64_t logical_bytes = 0, compressed_bytes = 0, blocks = 0, local_nodes = 0;
    for (size_t s = 0; s < count; s++) {
        LocalResult result;
        BgzfStats stats;
        char err[192];
        if (!run_local_file(samples[s].zip_path, &model, 0, samples[s].label,
                            0.0f, 0.0f, &result, &stats, NULL,
                            err, sizeof(err))) {
            fprintf(stderr, "error: evaluation sample %zu: %s\n", s + 1u, err);
            free(order); free_train_samples(samples, count);
            return 1;
        }
        correct += (result.probability >= 0.5f) == (samples[s].label != 0);
        final_correct += (result.final_probability >= 0.5f) == (samples[s].label != 0);
        float p = result.probability;
        float clipped = p < 1e-7f ? 1e-7f : (p > 1.0f - 1e-7f ? 1.0f - 1e-7f : p);
        final_loss += samples[s].label ? -log(clipped) : -log(1.0f - clipped);
        logical_bytes += stats.logical_bytes;
        compressed_bytes += stats.compressed_bytes;
        blocks += stats.blocks;
        local_nodes += result.local_nodes;
    }
    save_local_model(model_path, &model);
    printf("{\"samples\":%zu,\"positive_samples\":%zu,\"epochs\":%u"
           ",\"last_epoch_local_loss\":%.9f,\"final_loss\":%.9f"
           ",\"training_accuracy\":%.9f,\"final_head_accuracy\":%.9f"
           ",\"blocks_seen\":%" PRIu64 ",\"local_nodes_seen\":%" PRIu64
           ",\"logical_bytes_seen\":%" PRIu64
           ",\"compressed_bytes_seen\":%" PRIu64
           ",\"embedding_dim\":%u,\"state_dim\":%u,\"levels\":%u"
           ",\"model_bytes\":%zu}\n",
           count, positives, epochs, last_epoch_loss, final_loss / (double)count,
           (double)correct / (double)count, (double)final_correct / (double)count,
           blocks, local_nodes, logical_bytes, compressed_bytes,
           EMBED_DIM, LOCAL_STATE_DIM, LOCAL_LEVELS, local_model_serialized_size());

    free(order);
    free_train_samples(samples, count);
    return 0;
}

static int cmd_embed(const char *zip_path, const char *entry) {
    uint8_t *zip; size_t zip_n; Grammar g; ZipEntry e = {0};
    if (!load_zip_grammar(zip_path, entry, &zip, &zip_n, &g, &e)) return 1;
    float embedding[EMBED_DIM];
    EmbedStats es;
    grammar_ngram_embedding(&g, embedding, &es);
    unsigned nonzero = 0;
    double l2 = 0.0;
    for (unsigned i = 0; i < EMBED_DIM; i++) {
        if (embedding[i] != 0.0f) nonzero++;
        l2 += (double)embedding[i] * embedding[i];
    }
    fputs("{\"entry\":", stdout); json_string(e.name);
    printf(",\"zip_bytes\":%zu,\"deflate_bytes\":%u,\"logical_bytes\":%" PRIu64
           ",\"grammar_nodes\":%u,\"embedding_dim\":%u,\"nonzero\":%u"
           ",\"l2_norm\":%.9f,\"summaries_evaluated\":%" PRIu64
           ",\"cross_boundary_ngrams\":%" PRIu64 ",\"embedding_table_bytes\":%" PRIu64
           ",\"embedding\":[",
           zip_n, e.compressed_size, g.total_len, TERMINALS + g.rule_count,
           EMBED_DIM, nonzero, sqrt(l2), es.summaries_evaluated,
           es.cross_boundary_ngrams, es.embedding_bytes);
    for (unsigned i = 0; i < EMBED_DIM; i++) {
        if (i) putchar(',');
        printf("%.9g", embedding[i]);
    }
    puts("]}");
    free(e.name); grammar_free(&g); free(zip); return 0;
}



static FullAAAModel load_fullaaa(const char *path,size_t *n_out) {
    FILE *f=fopen(path,"rb"); if(!f) die_errno(path);
    char magic[4];uint32_t version,dim;FullAAAModel m;
    if(fread(magic,1,4,f)!=4||fread(&version,4,1,f)!=1||fread(&dim,4,1,f)!=1||memcmp(magic,"AAF1",4)||version!=1u||dim!=AAA_DIM)die("incompatible FullAAA model");
    if(fread(m.a,sizeof(m.a),1,f)!=1||fread(m.b,sizeof(m.b),1,f)!=1||fread(m.h0,sizeof(m.h0),1,f)!=1||fread(m.w,sizeof(m.w),1,f)!=1||fread(&m.bias,sizeof(m.bias),1,f)!=1)die("truncated FullAAA model");
    if (fgetc(f) != EOF) die("trailing FullAAA model bytes");
    fclose(f);
    if (n_out) *n_out = 12u + sizeof(m.a) + sizeof(m.b) + sizeof(m.h0) + sizeof(m.w) + sizeof(m.bias);
    return m;
}
static int cmd_aaa_classify(const char *zip_path,const char *entry,const char *model_path) {
    size_t mn;FullAAAModel model=load_fullaaa(model_path,&mn);size_t zip_n;uint8_t *zip=read_file(zip_path,&zip_n);StreamResult sr;ZipEntry e={0};char err[192];
    if(!zip_stream_summary(zip,zip_n,entry,&model,&sr,&e,err,sizeof(err))){free(zip);fprintf(stderr,"error: %s\n",err);return 1;}
    double h[AAA_DIM];for(unsigned i=0;i<AAA_DIM;i++){double v=sr.aaa.b[i];for(unsigned j=0;j<AAA_DIM;j++)v+=sr.aaa.a[i][j]*(double)model.h0[j];h[i]=v;}
    double score=(double)model.bias;for(unsigned i=0;i<AAA_DIM;i++)score+=(double)model.w[i]*h[i];double p=score>=0?1.0/(1.0+exp(-score)):exp(score)/(1.0+exp(score));
    printf("{\"prediction\":%d,\"probability\":%.15g,\"score\":%.15g,\"logical_bytes\":%" PRIu64 ",\"zip_bytes\":%zu,\"deflate_bytes\":%u,\"compactions\":%" PRIu64 ",\"peak_rules\":%" PRIu64 ",\"final_rules\":%" PRIu64 ",\"rules_created\":%" PRIu64 ",\"model_bytes\":%zu}\n",p>=0.5,p,score,sr.logical_bytes,zip_n,e.compressed_size,sr.compactions,sr.peak_rules,sr.final_rules,sr.rules_created,mn);
    free(e.name);free(zip);return 0;
}

static int cmd_stream_embed(const char *zip_path,const char *entry) {
    size_t zip_n;uint8_t *zip=read_file(zip_path,&zip_n);StreamResult sr;ZipEntry e={0};char err[192];
    if(!zip_stream_summary(zip,zip_n,entry,NULL,&sr,&e,err,sizeof(err))){free(zip);fprintf(stderr,"error: %s\n",err);return 1;}
    float embedding[EMBED_DIM];normalize_embedding(&sr.summary,embedding);
    printf("{\"logical_bytes\":%" PRIu64 ",\"zip_bytes\":%zu,\"deflate_bytes\":%u,\"compactions\":%" PRIu64 ",\"peak_rules\":%" PRIu64 ",\"final_rules\":%" PRIu64 ",\"rules_created\":%" PRIu64 ",\"embedding\":[",sr.logical_bytes,zip_n,e.compressed_size,sr.compactions,sr.peak_rules,sr.final_rules,sr.rules_created);
    for(unsigned i=0;i<EMBED_DIM;i++){if(i)putchar(',');printf("%.9g",embedding[i]);}puts("]}");
    free(e.name);free(zip);return 0;
}
static int cmd_stream_nn_classify(const char *zip_path,const char *entry,const char *model_path) {
    size_t zip_n;uint8_t *zip=read_file(zip_path,&zip_n);StreamResult sr;ZipEntry e={0};char err[192];
    if(!zip_stream_summary(zip,zip_n,entry,NULL,&sr,&e,err,sizeof(err))){free(zip);fprintf(stderr,"error: %s\n",err);return 1;}
    float embedding[EMBED_DIM];normalize_embedding(&sr.summary,embedding);size_t model_n;NNModel model=load_nn_model(model_path,&model_n);float hidden[NN_HIDDEN],score;float p=nn_forward(&model,embedding,hidden,&score);
    printf("{\"prediction\":%d,\"probability\":%.12f,\"score\":%.12f,\"logical_bytes\":%" PRIu64 ",\"zip_bytes\":%zu,\"deflate_bytes\":%u,\"compactions\":%" PRIu64 ",\"peak_rules\":%" PRIu64 ",\"final_rules\":%" PRIu64 ",\"rules_created\":%" PRIu64 ",\"model_bytes\":%zu}\n",p>=0.5f,p,score,sr.logical_bytes,zip_n,e.compressed_size,sr.compactions,sr.peak_rules,sr.final_rules,sr.rules_created,model_n);
    free(e.name);free(zip);return 0;
}

static int cmd_nn_classify(const char *zip_path, const char *entry, const char *model_path) {
    uint8_t *zip; size_t zip_n; Grammar g; ZipEntry e = {0};
    if (!load_zip_grammar(zip_path, entry, &zip, &zip_n, &g, &e)) return 1;
    float embedding[EMBED_DIM];
    EmbedStats es;
    grammar_ngram_embedding(&g, embedding, &es);
    size_t model_n;
    NNModel model = load_nn_model(model_path, &model_n);
    float hidden[NN_HIDDEN], score;
    float p = nn_forward(&model, embedding, hidden, &score);
    fputs("{\"entry\":", stdout); json_string(e.name);
    printf(",\"prediction\":%d,\"probability\":%.12f,\"score\":%.12f"
           ",\"embedding_dim\":%u,\"hidden_units\":%u,\"zip_bytes\":%zu"
           ",\"deflate_bytes\":%u,\"logical_bytes\":%" PRIu64
           ",\"grammar_nodes\":%u,\"summaries_evaluated\":%" PRIu64
           ",\"embedding_table_bytes\":%" PRIu64 ",\"model_bytes\":%zu}\n",
           p >= 0.5f, p, score, EMBED_DIM, NN_HIDDEN, zip_n, e.compressed_size,
           g.total_len, TERMINALS + g.rule_count, es.summaries_evaluated,
           es.embedding_bytes, model_n);
    free(e.name); grammar_free(&g); free(zip); return 0;
}

static int cmd_nn_train(const char *manifest_path, const char *model_path, unsigned epochs) {
    size_t count;
    TrainSample *samples = load_manifest(manifest_path, &count);
    if (count > SIZE_MAX / EMBED_DIM || count * EMBED_DIM > SIZE_MAX / sizeof(float))
        die("training set too large");
    float *x = xmalloc_array(count * EMBED_DIM, sizeof(*x));
    uint8_t *y = xmalloc(count);
    size_t *order = xmalloc_array(count, sizeof(*order));
    uint64_t total_logical = 0, total_nodes = 0;
    size_t positives = 0;

    for (size_t s = 0; s < count; s++) {
        uint8_t *zip; size_t zip_n; Grammar g; ZipEntry e = {0};
        if (!load_zip_grammar(samples[s].zip_path, samples[s].entry, &zip, &zip_n, &g, &e)) {
            fprintf(stderr, "error: failed to load training sample %zu\n", s + 1);
            exit(1);
        }
        EmbedStats es;
        grammar_ngram_embedding(&g, x + s * EMBED_DIM, &es);
        y[s] = samples[s].label;
        positives += y[s] != 0;
        order[s] = s;
        total_logical += g.total_len;
        total_nodes += (uint64_t)TERMINALS + g.rule_count;
        free(e.name); grammar_free(&g); free(zip);
    }
    if (!positives || positives == count) die("training set must contain both labels");

    NNModel model;
    nn_init(&model, UINT32_C(0x5eed1234));
    nn_fit_standardization(&model, x, count);
    uint32_t rng = UINT32_C(0xc001d00d);
    float loss = 0.0f;
    for (unsigned epoch = 0; epoch < epochs; epoch++) {
        float lr = 0.025f / sqrtf(1.0f + (float)epoch / 40.0f);
        loss = nn_train_epoch(&model, x, y, count, order, lr, 1e-5f, &rng);
    }

    size_t correct = 0;
    double final_loss = 0.0;
    for (size_t s = 0; s < count; s++) {
        float hidden[NN_HIDDEN];
        float p = nn_forward(&model, x + s * EMBED_DIM, hidden, NULL);
        correct += (p >= 0.5f) == (y[s] != 0);
        float clipped = p < 1e-7f ? 1e-7f : (p > 1.0f - 1e-7f ? 1.0f - 1e-7f : p);
        final_loss += -(y[s] ? log(clipped) : log(1.0 - clipped));
    }
    save_nn_model(model_path, &model);
    printf("{\"samples\":%zu,\"positive_samples\":%zu,\"epochs\":%u"
           ",\"last_epoch_loss\":%.9f,\"final_loss\":%.9f,\"training_accuracy\":%.9f"
           ",\"logical_bytes_seen\":%" PRIu64 ",\"grammar_nodes_seen\":%" PRIu64
           ",\"embedding_dim\":%u,\"hidden_units\":%u,\"model_bytes\":%zu}\n",
           count, positives, epochs, loss, final_loss / (double)count, (double)correct / (double)count,
           total_logical, total_nodes, EMBED_DIM, NN_HIDDEN, nn_model_serialized_size());

    free(order); free(y); free(x); free_train_samples(samples, count);
    return 0;
}

static int cmd_list(const char *path) {
    size_t n;
    uint8_t *data = read_file(path, &n);
    ZipEntry *entries = NULL;
    uint16_t count = 0;
    char err[160];
    if (!zip_entries(data, n, &entries, &count, NULL, err, sizeof(err))) { free(data); fprintf(stderr, "error: %s\n", err); return 1; }
    printf("{\"zip_bytes\":%zu,\"entries\":[", n);
    for (uint16_t i = 0; i < count; i++) {
        if (i) putchar(',');
        fputs("{\"name\":", stdout); json_string(entries[i].name);
        printf(",\"flags\":%u,\"method\":%u,\"crc32\":\"%08" PRIx32 "\""
               ",\"compressed_bytes\":%u,\"uncompressed_bytes\":%u}",
               entries[i].flags, entries[i].method, entries[i].crc32,
               entries[i].compressed_size, entries[i].uncompressed_size);
    }
    puts("]}");
    free_entries(entries, count); free(data); return 0;
}

static int cmd_search(const char *zip_path, const char *entry, const char *phrase) {
    uint8_t *zip; size_t zip_n; Grammar g; ZipEntry e = {0};
    if (!load_zip_grammar(zip_path, entry, &zip, &zip_n, &g, &e)) return 1;
    size_t phrase_n = strlen(phrase);
    if (phrase_n > UINT32_MAX) {
        fprintf(stderr, "error: search phrase is too long\n");
        free(e.name); grammar_free(&g); free(zip);
        return 1;
    }
    Stats s = {0}; s.compressed_bytes = e.compressed_size;
    uint64_t hits = byte_phrase_count(&g, (const uint8_t *)phrase, (uint32_t)phrase_n, &s);
    fputs("{\"entry\":", stdout); json_string(e.name);
    fputs(",\"phrase\":", stdout); json_string(phrase);
    printf(",\"matches\":%" PRIu64 ",\"zip_bytes\":%zu,\"deflate_bytes\":%u,\"logical_bytes\":%" PRIu64 ",\"grammar_nodes\":%" PRIu64 ",\"rules\":%u,\"literal_symbols\":%" PRIu64 ",\"match_symbols\":%" PRIu64 ",\"node_state_evaluations\":%" PRIu64 "}\n",
           hits, zip_n, e.compressed_size, s.logical_bytes, s.grammar_nodes, g.rule_count, s.literals, s.matches, s.node_state_evaluations);
    free(e.name); grammar_free(&g); free(zip); return 0;
}

static int cmd_classify(const char *zip_path, const char *entry, const char *model_path) {
    uint8_t *zip; size_t zip_n; Grammar g; ZipEntry e = {0};
    if (!load_zip_grammar(zip_path, entry, &zip, &zip_n, &g, &e)) return 1;
    size_t model_n; Model m = load_model(model_path, &model_n);
    double score, p = classify(&g, &m, &score);
    fputs("{\"entry\":", stdout); json_string(e.name);
    printf(",\"prediction\":%d,\"probability\":%.12f,\"score\":%.12f,\"features\":%zu,\"zip_bytes\":%zu,\"deflate_bytes\":%u,\"logical_bytes\":%" PRIu64 ",\"grammar_nodes\":%u,\"model_bytes\":%zu}\n",
           p >= 0.5, p, score, m.count, zip_n, e.compressed_size, g.total_len, TERMINALS + g.rule_count, model_n);
    free_model(&m); free(e.name); grammar_free(&g); free(zip); return 0;
}

static int cmd_inspect(const char *zip_path, const char *entry) {
    uint8_t *zip; size_t zip_n; Grammar g; ZipEntry e = {0};
    if (!load_zip_grammar(zip_path, entry, &zip, &zip_n, &g, &e)) return 1;
    uint32_t roots[FOREST_BINS];
    unsigned root_n = forest_roots(&g, roots);
    fputs("{\"entry\":", stdout); json_string(e.name);
    printf(",\"method\":%u,\"zip_bytes\":%zu,\"deflate_bytes\":%u,\"logical_bytes\":%" PRIu64 ",\"grammar_nodes\":%u,\"rules\":%u,\"roots\":%u,\"literal_symbols\":%" PRIu64 ",\"match_symbols\":%" PRIu64 ",\"words\":%" PRIu64 "}\n",
           e.method, zip_n, e.compressed_size, g.total_len, TERMINALS + g.rule_count, g.rule_count, root_n, g.literal_symbols, g.match_symbols, grammar_word_count(&g));
    free(e.name); grammar_free(&g); free(zip); return 0;
}

static int selftest(void) {
    Grammar g; grammar_init(&g);
    const char *text = "abcabcabcabc invalid user root invalid user root\n";
    size_t text_n = strlen(text);
    for (size_t i = 0; i < text_n; i++) append_literal(&g, (uint8_t)text[i]);
    Stats st = {0};
    uint64_t hits = byte_phrase_count(&g, (const uint8_t *)"invalid user root", 17, &st);

    float dag_embedding[EMBED_DIM], direct_embedding[EMBED_DIM];
    grammar_ngram_embedding(&g, dag_embedding, NULL);
    NGramSummary direct;
    bytes_ngram_summary((const uint8_t *)text, text_n, &direct);
    normalize_embedding(&direct, direct_embedding);
    float max_error = 0.0f;
    for (unsigned i = 0; i < EMBED_DIM; i++) {
        float e = fabsf(dag_embedding[i] - direct_embedding[i]);
        if (e > max_error) max_error = e;
    }

    size_t cut1 = 7u, cut2 = 29u;
    NGramSummary a, b, c, ab, split;
    bytes_ngram_summary((const uint8_t *)text, cut1, &a);
    bytes_ngram_summary((const uint8_t *)text + cut1, cut2 - cut1, &b);
    bytes_ngram_summary((const uint8_t *)text + cut2, text_n - cut2, &c);
    summary_concat(&ab, &a, &b, NULL);
    summary_concat(&split, &ab, &c, NULL);
    float split_embedding[EMBED_DIM];
    normalize_embedding(&split, split_embedding);
    float split_error = 0.0f;
    for (unsigned i = 0; i < EMBED_DIM; i++) {
        float e = fabsf(split_embedding[i] - direct_embedding[i]);
        if (e > split_error) split_error = e;
    }

    uint32_t known_crc = crc32_bytes((const uint8_t *)"123456789", 9u);
    uint32_t text_crc = crc32_bytes((const uint8_t *)text, text_n);
    uint32_t dag_crc = grammar_crc32(&g);

    LocalModel local_model;
    local_model_init(&local_model, UINT32_C(0x12345678));
    float local_input[LOCAL_INPUT_DIM], state[LOCAL_STATE_DIM], local_score;
    make_local_input(&direct, NULL, NULL, local_input);
    float local_p = local_layer_forward(&local_model.layer[0], local_input, state, &local_score);

    unsigned passed = 0;
    passed += hits == 2;
    passed += grammar_word_count(&g) == 7;
    passed += exact_word_count_feature(&g, "root") == 2;
    passed += max_error < 1e-6f;
    passed += split_error < 1e-6f;
    passed += known_crc == UINT32_C(0xcbf43926);
    passed += text_crc == dag_crc;
    passed += local_model_is_valid(&local_model) && isfinite(local_p) && isfinite(local_score);
    int ok = passed == 8u;
    printf("{\"tests_passed\":%u,\"tests_total\":8,\"matches\":%" PRIu64
           ",\"logical_bytes\":%" PRIu64 ",\"grammar_nodes\":%u"
           ",\"embedding_max_error\":%.9g,\"split_embedding_max_error\":%.9g"
           ",\"crc32\":\"%08" PRIx32 "\"}\n",
           passed, hits, g.total_len, TERMINALS + g.rule_count, max_error, split_error, dag_crc);
    grammar_free(&g);
    return ok ? 0 : 1;
}

static void usage(FILE *f) {
    fprintf(f,
        "archive_ai - bounded analysis and local learning over BGZF or ZIP/DEFLATE\n\n"
        "Usage:\n"
        "  archive_ai bgzf-inspect FILE.bgz\n"
        "  archive_ai bgzf-embed FILE.bgz\n"
        "  archive_ai bgzf-local-classify FILE.bgz MODEL.bll\n"
        "  archive_ai bgzf-local-train DATASET.tsv MODEL.bll [EPOCHS]\n"
        "  archive_ai list ARCHIVE.zip\n"
        "  archive_ai inspect ARCHIVE.zip [ENTRY]\n"
        "  archive_ai search ARCHIVE.zip [ENTRY] PHRASE\n"
        "  archive_ai classify ARCHIVE.zip [ENTRY] MODEL.json\n"
        "  archive_ai embed ARCHIVE.zip [ENTRY]\n"
        "  archive_ai stream-embed ARCHIVE.zip [ENTRY]\n"
        "  archive_ai stream-nn-classify ARCHIVE.zip [ENTRY] MODEL.znn\n"
        "  archive_ai aaa-classify ARCHIVE.zip [ENTRY] MODEL.aaf\n"
        "  archive_ai nn-classify ARCHIVE.zip [ENTRY] MODEL.znn\n"
        "  archive_ai nn-train DATASET.tsv MODEL.znn [EPOCHS]\n"
        "  archive_ai selftest\n\n"
        "When ENTRY is omitted, the first non-directory ZIP entry is used.\n"
        "ZIP DATASET.tsv rows are LABEL<TAB>ZIP_PATH[<TAB>ENTRY].\n"
        "BGZF DATASET.tsv rows are LABEL<TAB>BGZF_PATH.\n");
}

int main(int argc, char **argv) {
    if (argc < 2) { usage(stderr); return 2; }
    if (strcmp(argv[1], "bgzf-inspect") == 0) {
        if (argc != 3) { usage(stderr); return 2; }
        return cmd_bgzf_inspect(argv[2]);
    }
    if (strcmp(argv[1], "bgzf-embed") == 0) {
        if (argc != 3) { usage(stderr); return 2; }
        return cmd_bgzf_embed(argv[2]);
    }
    if (strcmp(argv[1], "bgzf-local-classify") == 0) {
        if (argc != 4) { usage(stderr); return 2; }
        return cmd_bgzf_local_classify(argv[2], argv[3]);
    }
    if (strcmp(argv[1], "bgzf-local-train") == 0) {
        if (argc != 4 && argc != 5) { usage(stderr); return 2; }
        unsigned epochs = 25;
        if (argc == 5) {
            char *end = NULL;
            errno = 0;
            unsigned long v = strtoul(argv[4], &end, 10);
            if (errno || !end || *end || v == 0 || v > 100000) die("invalid epoch count");
            epochs = (unsigned)v;
        }
        return cmd_bgzf_local_train(argv[2], argv[3], epochs);
    }
    if (strcmp(argv[1], "list") == 0) {
        if (argc != 3) { usage(stderr); return 2; }
        return cmd_list(argv[2]);
    }
    if (strcmp(argv[1], "inspect") == 0) {
        if (argc != 3 && argc != 4) { usage(stderr); return 2; }
        return cmd_inspect(argv[2], argc == 4 ? argv[3] : NULL);
    }
    if (strcmp(argv[1], "search") == 0) {
        if (argc == 4) return cmd_search(argv[2], NULL, argv[3]);
        if (argc == 5) return cmd_search(argv[2], argv[3], argv[4]);
        usage(stderr); return 2;
    }
    if (strcmp(argv[1], "classify") == 0) {
        if (argc == 4) return cmd_classify(argv[2], NULL, argv[3]);
        if (argc == 5) return cmd_classify(argv[2], argv[3], argv[4]);
        usage(stderr); return 2;
    }
    if (strcmp(argv[1], "embed") == 0) {
        if (argc == 3) return cmd_embed(argv[2], NULL);
        if (argc == 4) return cmd_embed(argv[2], argv[3]);
        usage(stderr); return 2;
    }
    if (strcmp(argv[1], "aaa-classify") == 0) {
        if (argc == 4) return cmd_aaa_classify(argv[2], NULL, argv[3]);
        if (argc == 5) return cmd_aaa_classify(argv[2], argv[3], argv[4]);
        usage(stderr); return 2;
    }
    if (strcmp(argv[1], "stream-embed") == 0) {
        if (argc == 3) return cmd_stream_embed(argv[2], NULL);
        if (argc == 4) return cmd_stream_embed(argv[2], argv[3]);
        usage(stderr); return 2;
    }
    if (strcmp(argv[1], "stream-nn-classify") == 0) {
        if (argc == 4) return cmd_stream_nn_classify(argv[2], NULL, argv[3]);
        if (argc == 5) return cmd_stream_nn_classify(argv[2], argv[3], argv[4]);
        usage(stderr); return 2;
    }
    if (strcmp(argv[1], "nn-classify") == 0) {
        if (argc == 4) return cmd_nn_classify(argv[2], NULL, argv[3]);
        if (argc == 5) return cmd_nn_classify(argv[2], argv[3], argv[4]);
        usage(stderr); return 2;
    }
    if (strcmp(argv[1], "nn-train") == 0) {
        if (argc != 4 && argc != 5) { usage(stderr); return 2; }
        unsigned epochs = 200;
        if (argc == 5) {
            char *end = NULL;
            errno = 0;
            unsigned long v = strtoul(argv[4], &end, 10);
            if (errno || !end || *end || v == 0 || v > 100000) die("invalid epoch count");
            epochs = (unsigned)v;
        }
        return cmd_nn_train(argv[2], argv[3], epochs);
    }
    if (strcmp(argv[1], "selftest") == 0) {
        if (argc != 2) { usage(stderr); return 2; }
        return selftest();
    }
    usage(stderr); return 2;
}
