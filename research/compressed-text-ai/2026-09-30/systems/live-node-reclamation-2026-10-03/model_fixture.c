#define main archive_cli_main
#include "baseline/compressed_text_ai.c"
#undef main
int main(void) {NNModel m;nn_init(&m,UINT32_C(0x5eed1234)); save_nn_model("fixture.znn",&m);return 0;}
