# Stabilizer Aggregate Identity

Let \(P:D\to\{0,1\}\) be an explicit partial Boolean table on
\(\mathbb F_2^n\). For each label \(b\), define

\[
f_b(x)=1[x\in D\ \text{and}\ P(x)=b].
\]

Define the ordered same-label XOR autocorrelation

\[
A(t)=\sum_{b\in\{0,1\}}\sum_x f_b(x)f_b(x\oplus t).
\]

For nonzero \(t\),

\[
t\text{ stabilizes }P \iff A(t)=|D|.
\]

This is the ordered form of the pair-difference lemma: every stabilizing
translation pairs every point with exactly one same-label partner.

With the unnormalized Walsh transform

\[
\widehat f_b(a)=\sum_x(-1)^{a\cdot x}f_b(x),
\]

the XOR Wiener-Khinchin identity gives

\[
A(t)=2^{-n}\sum_a(-1)^{a\cdot t}
\sum_b \widehat f_b(a)^2.
\]

So the same object has three exact carriers:

`same-label pairs <-> XOR autocorrelation <-> squared Walsh spectrum`.

## Consequence for the active frontier

This connects the Aggregate Satisfying-Pairs and symmetry/quotient fronts
without transferring proof authority between them.

For an explicitly listed partial table of size \(m\), direct pair-difference
counting discovers all translation stabilizers in polynomial time in \(m\).

For a dense table over all \(2^n\) points, a Walsh-Hadamard transform computes
all correlations in \(O(n2^n)\), which is efficient in the full table size but
still exponential in the input dimension \(n\).

Therefore the identity improves **where the cost is located**. It does not
construct a hard partial truth table and does not resolve P versus NP.

## Selected target

For the ten-point SQL-v2 target, the exact autocorrelation has
\(A(7)=10=|D|\), and no other nonzero translation reaches 10. The Walsh
reconstruction agrees exactly.
