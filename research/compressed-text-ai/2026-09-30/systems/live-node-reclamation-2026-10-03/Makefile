CC ?= cc
CFLAGS ?= -O2 -std=c11 -Wall -Wextra -Werror
.PHONY: all check benchmark clean
all: baseline_cli baseline_instrumented reclamation test_reclamation measure fixture.znn
baseline_cli: baseline/compressed_text_ai.c
	$(CC) $(CFLAGS) $< -lm -o $@
baseline_instrumented.c: baseline/compressed_text_ai.c instrument_baseline.py
	python3 instrument_baseline.py
baseline_instrumented: baseline_instrumented.c
	$(CC) $(CFLAGS) $< -lm -o $@
reclamation: reclamation.c
	$(CC) $(CFLAGS) $< -lm -o $@
test_reclamation: test_reclamation.c reclamation.c
	$(CC) $(CFLAGS) $< -lm -o $@
measure: measure.c
	$(CC) $(CFLAGS) -D_DEFAULT_SOURCE $< -o $@
model_fixture: model_fixture.c baseline/compressed_text_ai.c
	$(CC) $(CFLAGS) $< -lm -o $@
fixture.znn: model_fixture
	./model_fixture
check: all
	./baseline_cli selftest
	./reclamation selftest
	./test_reclamation
	python3 run_probe.py --counterprobes-only
benchmark: all
	python3 run_probe.py
clean:
	rm -f baseline_cli baseline_instrumented baseline_instrumented.c reclamation test_reclamation measure model_fixture fixture.znn test_sanitized *.tmp
